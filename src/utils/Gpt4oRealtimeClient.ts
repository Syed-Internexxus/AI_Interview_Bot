/* utils/Gpt4oRealtimeClient.ts ------------------------------------------------
   Real-time transcription with GPT-4o (transcribe / mini-transcribe)
   Corrected version based on Azure OpenAI WebSocket API
----------------------------------------------------------------------------*/

type PartialCb = (text: string) => void
type FinalCb   = (text: string) => void
type ErrCb     = (e: string | Event) => void

interface Opts {
  /** Azure OpenAI endpoint, e.g. https://<resource>.openai.azure.com */
  wsUrl?: string            // optional override; otherwise from NEXT_PUBLIC_AOAI_ENDPOINT
  /** Deployment name, e.g. gpt-4o-transcribe */
  deployment?: string       // falls back to NEXT_PUBLIC_AOAI_DEPLOYMENT_NAME
  /** API key with transcription permission */
  apiKey?: string           // falls back to NEXT_PUBLIC_AOAI_KEY
  /** Prompt for session */
  prompt?: string
  /** Mic sample rate */
  sampleRate?: 16000 | 24000
  onPartial?: PartialCb
  onFinal?: FinalCb
  onError?: ErrCb
}

export class Gpt4oRealtimeClient {
  private ws?: WebSocket
  private stream?: MediaStream
  private audioCtx?: AudioContext
  private workletNode?: AudioWorkletNode
  private opts: Opts

  constructor(opts: Opts = {}) {
    this.opts = opts
  }

  /** Start streaming mic audio and receiving transcripts */
  async start() {
    try {
      // resolve configuration - check both runtime and build-time env vars
      const rawEndpoint = this.opts.wsUrl || 
                         process.env.NEXT_PUBLIC_AOAI_ENDPOINT || 
                         (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_AOAI_ENDPOINT)
      
      const deployment = this.opts.deployment ?? 
                        process.env.NEXT_PUBLIC_AOAI_DEPLOYMENT_NAME ?? 
                        (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_AOAI_DEPLOYMENT_NAME)
      
      const apiKey = this.opts.apiKey ?? 
                    process.env.NEXT_PUBLIC_AOAI_KEY ?? 
                    (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_AOAI_KEY)
      
      const apiVersion = '2024-10-01-preview' // Correct API version for realtime

      // More helpful error messages
      if (!rawEndpoint) {
        throw new Error(`Azure OpenAI endpoint is missing. Please provide:
1. wsUrl in options, OR 
2. Set NEXT_PUBLIC_AOAI_ENDPOINT in your .env.local file, OR
3. Pass endpoint via props
Current env check: ${JSON.stringify({
  fromEnv: process.env.NEXT_PUBLIC_AOAI_ENDPOINT,
  fromOpts: this.opts.wsUrl
})}`)
      }
      
      if (!deployment) {
        throw new Error(`Deployment name is missing. Please provide:
1. deployment in options, OR 
2. Set NEXT_PUBLIC_AOAI_DEPLOYMENT_NAME in your .env.local file
Current: ${deployment}`)
      }
      
      if (!apiKey) {
        throw new Error(`API key is missing. Please provide:
1. apiKey in options, OR 
2. Set NEXT_PUBLIC_AOAI_KEY in your .env.local file
Current: ${apiKey ? '[PROVIDED]' : '[MISSING]'}`)
      }

      const sampleRate = this.opts.sampleRate ?? 24000
      const prompt     = this.opts.prompt ?? 'You are a transcription assistant. Transcribe all speech in English only. Do not translate or interpret, just transcribe exactly what is said in English.'

      // 1️⃣ Open mic first
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          channelCount: 1, 
          sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      })

      // 2️⃣ Build WebSocket URL - CORRECTED for Azure OpenAI Realtime API
      let wsUrl: string
      if (this.opts.wsUrl) {
        wsUrl = this.opts.wsUrl
      } else {
        // Convert https://resource.openai.azure.com to wss://resource.openai.azure.com
        const wsBase = rawEndpoint.replace(/^https?:\/\//, 'wss://')
        wsUrl = `${wsBase}/openai/realtime?api-version=${apiVersion}&deployment=${deployment}`
      }

      // Add API key as query parameter
      const url = new URL(wsUrl)
      if (!url.searchParams.has('api-key')) {
        url.searchParams.set('api-key', apiKey)
      }

      this.ws = new WebSocket(url.toString())

      this.ws.addEventListener('open', () => {
        console.log('WebSocket connected to:', url.toString().replace(/api-key=[^&]+/, 'api-key=***'))
        this.sendSessionConfig(deployment, prompt)
        this.setupAudioPipeline(sampleRate)
      })

      this.ws.addEventListener('message', ev => this.handleMessage(ev))
      this.ws.addEventListener('error', e => {
        console.error('WebSocket error:', e)
        this.opts.onError?.(e)
      })
      this.ws.addEventListener('close', e => {
        console.log('WebSocket closed:', e.code, e.reason)
        this.opts.onError?.(e)
      })

    } catch (error) {
      console.error('Failed to start realtime client:', error)
      this.opts.onError?.(error instanceof Error ? error.message : String(error))
    }
  }

  /** Stop audio and close the connection */
  stop() {
    this.ws?.close()
    this.workletNode?.disconnect()
    this.stream?.getTracks().forEach(t => t.stop())
    this.audioCtx?.close()
    this.ws = undefined
    this.workletNode = undefined
    this.stream = undefined
    this.audioCtx = undefined
  }

  /** Send session configuration */
  private sendSessionConfig(deployment: string, prompt: string) {
    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: prompt,
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: deployment, // Use the actual deployment name (gpt-4o-transcribe)
          language: 'en' // Force English language
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tool_choice: 'none',
        temperature: 0.1, // Lower temperature for more consistent transcription
        max_response_output_tokens: 'inf'
      }
    }
    
    console.log('Sending session config for deployment:', deployment)
    console.log('Session config:', JSON.stringify(sessionConfig, null, 2))
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(sessionConfig))
    } else {
      console.error('WebSocket not ready, state:', this.ws?.readyState)
    }
  }

  /** Setup audio pipeline using modern AudioWorkletNode */
  private async setupAudioPipeline(sampleRate: number) {
    try {
      this.audioCtx = new AudioContext({ sampleRate })
      
      // Register audio worklet processor
      const workletCode = `
        class AudioProcessor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0]
            if (input.length > 0) {
              const channelData = input[0]
              if (channelData.length > 0) {
                // Convert float32 to int16
                const int16Data = new Int16Array(channelData.length)
                for (let i = 0; i < channelData.length; i++) {
                  const sample = Math.max(-1, Math.min(1, channelData[i]))
                  int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
                }
                
                // Send to main thread
                this.port.postMessage({
                  type: 'audio',
                  data: int16Data
                })
              }
            }
            return true
          }
        }
        registerProcessor('audio-processor', AudioProcessor)
      `
      
      const blob = new Blob([workletCode], { type: 'application/javascript' })
      const workletUrl = URL.createObjectURL(blob)
      
      await this.audioCtx.audioWorklet.addModule(workletUrl)
      URL.revokeObjectURL(workletUrl)
      
      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.audioCtx, 'audio-processor')
      
      // Handle audio data from worklet
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio' && this.ws?.readyState === WebSocket.OPEN) {
          const audioData = event.data.data
          const base64Audio = this.arrayBufferToBase64(audioData.buffer)
          
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }))
        }
      }
      
      // Connect audio pipeline
      const source = this.audioCtx.createMediaStreamSource(this.stream!)
      source.connect(this.workletNode)
      this.workletNode.connect(this.audioCtx.destination)
      
    } catch (error) {
      console.error('Failed to setup audio pipeline:', error)
      // Fallback to ScriptProcessorNode for older browsers
      this.setupLegacyAudioPipeline(sampleRate)
    }
  }

  /** Fallback audio pipeline using deprecated ScriptProcessorNode */
  private setupLegacyAudioPipeline(sampleRate: number) {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext({ sampleRate })
    }
    
    const source = this.audioCtx.createMediaStreamSource(this.stream!)
    const processor = this.audioCtx.createScriptProcessor(4096, 1, 1)
    
    processor.onaudioprocess = (e) => {
      if (this.ws?.readyState !== WebSocket.OPEN) return
      
      const inputData = e.inputBuffer.getChannelData(0)
      const int16Data = new Int16Array(inputData.length)
      
      for (let i = 0; i < inputData.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputData[i]))
        int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      }
      
      const base64Audio = this.arrayBufferToBase64(int16Data.buffer)
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }))
    }
    
    source.connect(processor)
    processor.connect(this.audioCtx.destination)
  }

  /** Convert ArrayBuffer to base64 */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /** Handle incoming WebSocket messages */
  private handleMessage(ev: MessageEvent) {
    try {
      const msg = JSON.parse(ev.data as string)
      
      // Handle different message types
      switch (msg.type) {
        case 'session.created':
          console.log('Session created:', msg.session?.id)
          break
          
        case 'session.updated':
          console.log('Session updated')
          break
          
        case 'input_audio_buffer.speech_started':
          console.log('Speech started')
          break
          
        case 'input_audio_buffer.speech_stopped':
          console.log('Speech stopped')
          break
          
        case 'conversation.item.input_audio_transcription.delta':
          if (msg.delta) {
            this.opts.onPartial?.(msg.delta)
          }
          break
          
        case 'conversation.item.input_audio_transcription.completed':
          if (msg.transcript) {
            this.opts.onFinal?.(msg.transcript)
          }
          break

        // Handle response audio transcript messages (for real-time transcription)
        case 'response.audio_transcript.delta':
          if (msg.delta) {
            this.opts.onPartial?.(msg.delta)
          }
          break
          
        case 'response.audio_transcript.done':
          if (msg.transcript) {
            this.opts.onFinal?.(msg.transcript)
          }
          break

        // Handle audio response completion
        case 'response.audio.done':
          console.log('Audio response completed')
          break
          
        // Handle other response events
        case 'response.created':
          console.log('Response created:', msg.response?.id)
          break
          
        case 'response.done':
          console.log('Response completed:', msg.response?.id)
          break
          
        case 'conversation.item.created':
          console.log('Conversation item created:', msg.item?.id)
          break
          
        case 'rate_limits.updated':
          console.log('Rate limits updated:', msg.rate_limits)
          break
          
        case 'error':
          console.error('Server error:', msg.error)
          this.opts.onError?.(msg.error?.message || 'Unknown server error')
          break
          
        default:
          // Log unknown message types for debugging (but don't spam console)
          if (!msg.type?.startsWith('response.audio.delta')) {
            console.log('Unhandled message type:', msg.type, msg)
          }
      }
    } catch (error) {
      console.warn('Failed to parse WebSocket message:', error)
      // Don't call onError for parse failures - they're usually harmless
    }
  }
}