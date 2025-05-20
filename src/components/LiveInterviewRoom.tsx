import { useEffect, useRef, useState } from 'react'
import type { SessionPayload } from '@/pages/interviews/[id]'
import {
  FaCog,
  FaPhoneSlash,
  FaExclamationTriangle,
} from 'react-icons/fa'

interface Props {
  session: SessionPayload
  onEnd: () => void
}

// Brand palette
const COLORS = {
  primary: '#87B2FF',    // main background
  secondary: '#CAE9F5',  // panels & bottom bar
  accent: '#16D5A8',     // highlights & primary buttons
  white: '#FFFFFF',      // text on dark
  light: '#BAD8FB',      // inner avatar circle
  danger: '#FF4D4F',     // end call button
}

export default function LiveInterviewRoom({ session, onEnd }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext>()
  const pcRef = useRef<RTCPeerConnection>()
  const dcRef = useRef<RTCDataChannel>()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'initializing'|'connecting'|'connected'|'error'|'closed'>('initializing')
  const [audioStatus, setAudioStatus] = useState<string>('waiting')
  const [userInteracted, setUserInteracted] = useState<boolean>(false)
  const [isCallActive, setIsCallActive] = useState<boolean>(true)
  const [showControls, setShowControls] = useState<boolean>(false)
  const [timer, setTimer] = useState<number>(0)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [hasSentClosing, setHasSentClosing] = useState<boolean>(false)

  // Setup user video preview
  useEffect(() => {
    async function setupVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (userVideoRef.current) userVideoRef.current.srcObject = stream
      } catch (e) {
        console.warn('User video setup failed:', e)
      }
    }
    setupVideo()
  }, [])

  const handleUserInteraction = () => {
    if (!userInteracted) {
      setUserInteracted(true)
      tryPlayAudio()
      const ctx = ensureAudioContext()
      if (ctx?.state === 'suspended') ctx.resume()
    }
  }

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(e => console.error('AudioContext resume failed:', e))
        }
      } catch (e: any) {
        setError(`Audio system error: ${e.message}`)
      }
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(e => console.error('Resume failed:', e))
    }
    return audioContextRef.current
  }

  const tryPlayAudio = () => {
    if (!audioRef.current?.srcObject) {
      setAudioStatus('no source')
      return
    }
    audioRef.current.muted = false
    audioRef.current.volume = 1

    const audioContext = ensureAudioContext()
    if (audioContext) {
      try {
        const src = audioContext.createMediaStreamSource(audioRef.current.srcObject as MediaStream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        src.connect(analyser)
        const bufferLength = analyser.frequencyBinCount
        const data = new Uint8Array(bufferLength)
        const monitor = () => {
          if (!isCallActive) return
          analyser.getByteFrequencyData(data)
          const avg = data.reduce((a, b) => a + b, 0) / data.length
          setIsSpeaking(avg > 20)
          requestAnimationFrame(monitor)
        }
        monitor()
      } catch {
        console.warn("Couldn't set up analyser for audio")
      }
    }

    audioRef.current.play()
      .then(() => setAudioStatus('playing'))
      .catch(() => {
        setAudioStatus('failed')
        audioRef.current!.muted = true
      })
  }

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive && status === 'connected') {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isCallActive, status])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Closing-soon hook
  useEffect(() => {
    const threshold = 30
    if (status === 'connected' && !hasSentClosing && timer >= session.durationSec - threshold) {
      dcRef.current?.send(JSON.stringify({
        type: 'session.update',
        session: { instructions: 'The interview is nearing its end. Please begin your closing remarks and summary.' }
      }))
      setHasSentClosing(true)
    }
  }, [timer, status, hasSentClosing, session.durationSec])

  // WebRTC setup
  useEffect(() => {
    let pc: RTCPeerConnection
    let autoStarted = false

    async function startWebRTC() {
      try {
        setStatus('connecting')

        const res = await fetch('/api/realtime/session', { method: 'POST' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Unknown error' }))
          throw new Error(`Session key error: ${err.message}`)
        }
        const { client_secret } = await res.json()
        const key = client_secret.value

        pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ]
        })
        pcRef.current = pc

        pc.onconnectionstatechange = () => console.log(`Connection: ${pc.connectionState}`)
        pc.onicegatheringstatechange = () => console.log(`ICE Gathering: ${pc.iceGatheringState}`)
        pc.onsignalingstatechange = () => console.log(`Signaling: ${pc.signalingState}`)

        pc.addTransceiver('audio', { direction: 'recvonly' })

        const micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
        micStream.getTracks().forEach(t => pc.addTrack(t, micStream))

        pc.ontrack = ev => {
          if (ev.track.kind === 'audio' && audioRef.current) {
            audioRef.current.srcObject = ev.streams[0]
            setStatus('connected')

            // monitor AI speaking
            const ctx = ensureAudioContext()
            if (ctx) {
              const srcNode = ctx.createMediaStreamSource(ev.streams[0])
              const analyser = ctx.createAnalyser()
              analyser.fftSize = 256
              srcNode.connect(analyser)
              const data = new Uint8Array(analyser.frequencyBinCount)
              const monitorAI = () => {
                if (!isCallActive) return
                analyser.getByteFrequencyData(data)
                const avg = data.reduce((a, b) => a + b, 0) / data.length
                setIsSpeaking(avg > 20)
                requestAnimationFrame(monitorAI)
              }
              monitorAI()
            }

            if (userInteracted) tryPlayAudio()
            else if (!autoStarted) { autoStarted = true; setTimeout(handleUserInteraction, 500) }
          }
        }

        const dc = pc.createDataChannel('realtime')
        dcRef.current = dc
        dc.onopen = () => {
          dc.send(JSON.stringify({ type: 'session.update', session: { instructions: session.introduction } }))
          dc.send(JSON.stringify({ type: 'ai.start', start_first: true }))
        }
        dc.onmessage = e => {
          try { const data = JSON.parse(e.data); if (data.type==='ai.speaking') setIsSpeaking(data.value) } catch {}
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        const ans = await fetch(`${process.env.NEXT_PUBLIC_OPENAI_WEBRTC_URL}?model=${process.env.NEXT_PUBLIC_AOAI_DEPLOYMENT_NAME}`, {
          method:'POST', body: offer.sdp, headers:{ Authorization:`Bearer ${key}`, 'Content-Type':'application/sdp' }
        })
        if (!ans.ok) throw new Error(`SDP exchange failed: ${ans.status}`)
        const answerSdp = await ans.text()
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

        pc.oniceconnectionstatechange = () => {
          if (['closed','failed','disconnected'].includes(pc.iceConnectionState)) { setIsCallActive(false); onEnd() }
        }
      } catch (e: any) {
        console.error('WebRTC error', e)
        setError(e.message)
        setStatus('error')
      }
    }
    startWebRTC()
    return () => { audioContextRef.current?.close(); pcRef.current?.close(); dcRef.current?.close() }
  }, [session, onEnd, userInteracted])

  const endCall = () => { audioContextRef.current?.close(); dcRef.current?.close(); pcRef.current?.close(); setIsCallActive(false); onEnd() }
  const toggleControls = () => setShowControls(v => !v)

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: COLORS.primary }} onClick={handleUserInteraction}>
      {/* Main area */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative">
          <div className={`rounded-full w-32 h-32 flex items-center justify-center transition-transform duration-300 ${isSpeaking?'scale-105':'scale-100'}`} style={{ backgroundColor: COLORS.secondary }}>
            <div className="rounded-full w-24 h-24" style={{ backgroundColor: COLORS.light }} />
          </div>
          {isSpeaking && (
            <>
              <div className="absolute top-1/2 left-1/2 rounded-full" style={{ width:'8rem',height:'8rem',backgroundColor:COLORS.secondary, animation:'ripple 1.2s ease-out infinite' }} />
              <div className="absolute top-1/2 left-1/2 rounded-full" style={{ width:'10rem',height:'10rem',backgroundColor:COLORS.secondary, animation:'ripple 1.6s ease-out infinite' }} />
            </>
          )}
        </div>
        <video ref={userVideoRef} className="absolute bottom-24 right-6 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg" autoPlay muted playsInline />
        <audio ref={audioRef} className="hidden" autoPlay />
        {status!=='connected' && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${status==='connecting'?'bg-yellow-500':status==='error'?'bg-red-500':'bg-green-500'}`} />
            <span>{status==='connecting'?'Connecting...':status==='error'?'Connection error':'Initializing...'}</span>
          </div>
        )}
      </div>
        {/* Bottom bar */}
        <div
        className="relative flex items-center p-4"
        style={{ backgroundColor: "#16d5a8" }}
        >
        {/* Left: timer + label */}
        <div className="flex items-center space-x-2">
            <span className="font-mono font-medium text-base text-white">
            {formatTime(timer)}
            </span>
            <span className="text-white">|</span>
            <span className="font-medium text-base text-white">
            AI Interview
            </span>
        </div>

        {/* Centered buttons */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-4">
            <button
            onClick={toggleControls}
            className="p-3 rounded-full"
            style={{ backgroundColor: COLORS.primary }}
            >
            <FaCog color={COLORS.white} />
            </button>
            <button
            onClick={endCall}
            className="p-3 rounded-full"
            style={{ backgroundColor: COLORS.danger }}
            >
            <FaPhoneSlash color={COLORS.white} />
            </button>
            <button
            className="p-3 rounded-full"
            style={{ backgroundColor: COLORS.primary }}
            >
            <FaExclamationTriangle color={COLORS.white} />
            </button>
        </div>
        </div>
      {/* Controls overlay */}
      {showControls && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20" onClick={() => setShowControls(false)}>
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Audio Settings</h2>
            <p className="mb-2">Status: <strong>{status}</strong> | Audio: <strong>{audioStatus}</strong></p>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">{error}</div>}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label htmlFor="volumeSlider">Volume:</label>
                <input id="volumeSlider" type="range" min="0" max="1" step="0.1" defaultValue="1" className="flex-1" onChange={e => { if(audioRef.current) audioRef.current.volume = parseFloat(e.target.value) }} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { handleUserInteraction(); tryPlayAudio() }} className="px-4 py-2 rounded bg-accent text-white">Enable Audio</button>
                <button onClick={() => tryPlayAudio()} className="px-4 py-2 rounded bg-primary text-white">Test Audio</button>
                <button onClick={() => setupDirectAudioPath()} className="px-4 py-2 rounded bg-primary text-white">Force Direct</button>
              </div>
              <button onClick={() => setShowControls(false)} className="w-full py-2 bg-secondary text-white rounded mt-4">Close</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
          70% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
