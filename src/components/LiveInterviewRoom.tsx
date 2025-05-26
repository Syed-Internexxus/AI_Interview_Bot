// components/LiveInterviewRoom.tsx
import { useEffect, useRef, useState } from 'react'
import type { SessionPayload } from '@/pages/interviews/[id]'
import {
  FaCog,
  FaPhoneSlash,
  FaExclamationTriangle,
} from 'react-icons/fa'
import { Gpt4oRealtimeClient } from '@/utils/Gpt4oRealtimeClient'

interface Props {
  session: SessionPayload
  onEnd: () => void
}

/* ───────────────────────── Brand palette ───────────────────────── */
const COLORS = {
  primary:   '#87B2FF',
  secondary: '#CAE9F5',
  accent:    '#16D5A8',
  white:     '#FFFFFF',
  light:     '#BAD8FB',
  danger:    '#FF4D4F',
}

export default function LiveInterviewRoom({ session, onEnd }: Props) {
  /* refs */
  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const userVideoRef    = useRef<HTMLVideoElement  | null>(null)
  const audioContextRef = useRef<AudioContext       | null>(null)
  const pcRef           = useRef<RTCPeerConnection | null>(null)
  const dcRef           = useRef<RTCDataChannel     | null>(null)
  const realtimeRef     = useRef<Gpt4oRealtimeClient| null>(null)

  /* state */
  const [error,  setError]  = useState<string | null>(null)
  const [status, setStatus] = useState<'initializing'|'connecting'|'connected'|'error'|'closed'>('initializing')
  const [audioStatus,      setAudioStatus]      = useState('waiting')
  const [userInteracted,   setUserInteracted]   = useState(false)
  const [isCallActive,     setIsCallActive]     = useState(true)
  const [showControls,     setShowControls]     = useState(false)
  const [timer,            setTimer]            = useState(0)
  const [isAISpeaking,     setIsAISpeaking]     = useState(false)

  /* grading / captions */
  const [partial, setPartial]           = useState('')
  const [finalT, setFinalT]             = useState<string | null>(null)
  const [lastScore, setLastScore]       = useState<number | null>(null)
  const [lastFeedback, setLastFeedback] = useState<string | null>(null)

  const [hasSentClosing, setHasSentClosing] = useState(false)

  /* ─────────────────── Webcam preview ─────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (userVideoRef.current) userVideoRef.current.srcObject = stream
      } catch (e) { console.warn('User video setup failed:', e) }
    })()
  }, [])

  /* ─────────────────── Audio helpers ─────────────────── */
  const ensureAudioCtx = () => {
    if (!audioContextRef.current)
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return audioContextRef.current
  }

  const tryPlayAudio = () => {
    if (!audioRef.current?.srcObject) { setAudioStatus('no source'); return }
    audioRef.current.muted = false
    audioRef.current.volume = 1
    audioRef.current.play()
      .then(() => setAudioStatus('playing'))
      .catch(() => { setAudioStatus('failed'); audioRef.current!.muted = true })
  }

  const handleUserInteraction = () => {
    if (!userInteracted) {
      setUserInteracted(true)
      tryPlayAudio()
      ensureAudioCtx()?.resume()
    }
  }

  /* ─────────────────── Call timer ─────────────────── */
  useEffect(() => {
    if (!(isCallActive && status === 'connected')) return
    const i = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(i)
  }, [isCallActive, status])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`

  /* ─────────── Closing-soon heads-up ─────────── */
  useEffect(() => {
    const threshold = 30
    if (status === 'connected' && !hasSentClosing && timer >= session.durationSec - threshold) {
      dcRef.current?.send(JSON.stringify({
        type:'session.update',
        session:{ instructions:'The interview is nearing its end. Please begin your closing remarks.' }
      }))
      setHasSentClosing(true)
    }
  }, [timer, status, hasSentClosing, session.durationSec])

  /* ────────────────── WebRTC setup  (unchanged) ────────────────── */
  useEffect(() => {
    let pc: RTCPeerConnection
    let autoStarted = false
    ;(async () => {
      try {
        setStatus('connecting')

        const res = await fetch('/api/realtime/session', { method:'POST' })
        if (!res.ok) throw new Error('Session key error')
        const { client_secret } = await res.json()
        const key = client_secret.value

        pc = new RTCPeerConnection({ iceServers:[
          { urls:'stun:stun.l.google.com:19302' },
          { urls:'stun:stun1.l.google.com:19302' },
          { urls:'stun:stun2.l.google.com:19302' },
          { urls:'stun:stun3.l.google.com:19302' },
          { urls:'stun:stun4.l.google.com:19302' },
        ]})
        pcRef.current = pc

        pc.addTransceiver('audio', { direction:'recvonly' })

        /* mic stream for AI */
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true }
        })
        micStream.getTracks().forEach(t => pc.addTrack(t, micStream))

        pc.ontrack = ev => {
          if (ev.track.kind === 'audio' && audioRef.current) {
            audioRef.current.srcObject = ev.streams[0]
            setStatus('connected')

            /* AI speaking detection */
            const ctx = ensureAudioCtx()
            const src = ctx.createMediaStreamSource(ev.streams[0])
            const a   = ctx.createAnalyser(); a.fftSize = 256
            src.connect(a)
            const data = new Uint8Array(a.frequencyBinCount)
            const monitor = () => {
              if (!isCallActive) return
              a.getByteFrequencyData(data)
              setIsAISpeaking(data.reduce((s,n)=>s+n,0)/data.length > 20)
              requestAnimationFrame(monitor)
            }; monitor()

            if (userInteracted) tryPlayAudio()
            else if (!autoStarted) { autoStarted = true; setTimeout(handleUserInteraction,500) }
          }
        }

        const dc = pc.createDataChannel('realtime')
        dcRef.current = dc
        dc.onopen = () => {
          dc.send(JSON.stringify({ type:'session.update', session:{ instructions:session.introduction }}))
          dc.send(JSON.stringify({ type:'ai.start', start_first:true }))
        }
        dc.onmessage = e => {
          try { const d = JSON.parse(e.data); if (d.type==='ai.speaking') setIsAISpeaking(d.value) } catch {}

        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        const ans = await fetch(
          `${process.env.NEXT_PUBLIC_OPENAI_WEBRTC_URL}?model=${process.env.NEXT_PUBLIC_AOAI_DEPLOYMENT_NAME}`,
          { method:'POST', body:offer.sdp, headers:{ Authorization:`Bearer ${key}`, 'Content-Type':'application/sdp' } }
        )
        if (!ans.ok) throw new Error(`SDP exchange failed: ${ans.status}`)
        await pc.setRemoteDescription({ type:'answer', sdp:await ans.text() })

        pc.oniceconnectionstatechange = () => {
          if (['closed', 'failed', 'disconnected'].includes(pc.iceConnectionState)) {
            setIsCallActive(false)
            onEnd()
          }
        }

      } catch (e:any) {
        console.error('WebRTC', e)
        setError(e.message); setStatus('error')
      }
    })()
    return () => { pc?.close(); dcRef.current?.close(); audioContextRef.current?.close() }
  }, [session, onEnd, userInteracted])

  /* ───────── Real-time transcription client (NEW simple init) ───────── */
  useEffect(() => {
    if (status !== 'connected') return

    const rt = new Gpt4oRealtimeClient({
      onPartial: setPartial,                            // live words
      onFinal: async (txt) => {                         // utterance end
        setPartial('')
        setFinalT(txt)
        await handleGrading(txt)
      },
      onError:  (e) => console.error('[Realtime]', e),
    })

    realtimeRef.current = rt
    rt.start()
    return () => rt.stop()
  }, [status])

  /* ────────────── grade via O4-mini ────────────── */
  async function handleGrading(answer: string) {
    try {
      const res = await fetch('/api/grade', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ answer }),
      })
      const { score, feedback } = await res.json()
      setLastScore(score); setLastFeedback(feedback)
    } catch (e) { console.error('grading error', e) }
  }

  /* misc */
  const endCall        = () => { realtimeRef.current?.stop(); dcRef.current?.close(); pcRef.current?.close(); setIsCallActive(false); onEnd() }
  const toggleControls = () => setShowControls(s => !s)

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: COLORS.primary }} onClick={handleUserInteraction}>

      {/* live captions */}
      {(partial || finalT) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur p-2 rounded shadow text-sm max-w-lg z-30">
          {partial && <p>{partial}</p>}
          {finalT && <p className="font-medium">{finalT}</p>}
        </div>
      )}

      {/* feedback box */}
      {lastScore !== null && (
        <div className="absolute top-4 left-4 bg-white/80 p-3 rounded shadow text-sm z-20">
          <p><strong>Score:</strong> {lastScore}/100</p>
          {lastFeedback && <p className="italic">{lastFeedback}</p>}
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* avatar */}
        <div className="relative">
          <div className={`rounded-full w-32 h-32 flex items-center justify-center transition-transform duration-300 ${isAISpeaking?'scale-105':'scale-100'}`} style={{ backgroundColor: COLORS.secondary }}>
            <div className="rounded-full w-24 h-24" style={{ backgroundColor: COLORS.light }} />
          </div>
          {isAISpeaking && (
            <>
              <div className="absolute top-1/2 left-1/2 rounded-full" style={{width:'8rem',height:'8rem',backgroundColor:COLORS.secondary,animation:'ripple 1.2s ease-out infinite'}}/>
              <div className="absolute top-1/2 left-1/2 rounded-full" style={{width:'10rem',height:'10rem',backgroundColor:COLORS.secondary,animation:'ripple 1.6s ease-out infinite'}}/>
            </>
          )}
        </div>

        <video ref={userVideoRef} className="absolute bottom-24 right-6 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg" autoPlay muted playsInline />
        <audio ref={audioRef} className="hidden" autoPlay />

        {status !== 'connected' && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${status==='connecting'?'bg-yellow-500':status==='error'?'bg-red-500':'bg-green-500'}`}/>
            <span>{status==='connecting'?'Connecting…':status==='error'?'Connection error':'Initializing…'}</span>
          </div>
        )}
      </div>

      {/* bottom bar */}
      <div className="relative flex items-center p-4" style={{ backgroundColor: COLORS.accent }}>
        <div className="flex items-center space-x-2">
          <span className="font-mono font-medium text-base text-white">{formatTime(timer)}</span>
          <span className="text-white">|</span>
          <span className="font-medium text-base text-white">AI Interview</span>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex space-x-4">
          <button onClick={toggleControls} className="p-3 rounded-full" style={{ backgroundColor: COLORS.primary }}>
            <FaCog color={COLORS.white}/>
          </button>
          <button onClick={endCall} className="p-3 rounded-full" style={{ backgroundColor: COLORS.danger }}>
            <FaPhoneSlash color={COLORS.white}/>
          </button>
          <button className="p-3 rounded-full" style={{ backgroundColor: COLORS.primary }}>
            <FaExclamationTriangle color={COLORS.white}/>
          </button>
        </div>
      </div>

      {/* audio controls modal */}
      {showControls && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40" onClick={()=>setShowControls(false)}>
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md" onClick={e=>e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Audio Settings</h2>
            <p className="mb-2">Status: <strong>{status}</strong> | Audio: <strong>{audioStatus}</strong></p>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">{error}</div>}
            <button onClick={()=>setShowControls(false)} className="w-full py-2 mt-4 rounded text-white" style={{backgroundColor:COLORS.secondary}}>Close</button>
          </div>
        </div>
      )}

      {/* global ripple */}
      <style jsx global>{`
        @keyframes ripple {
          0%   { transform:translate(-50%,-50%) scale(0.8); opacity:0.5 }
          70%  { transform:translate(-50%,-50%) scale(1.2); opacity:0 }
          100% { transform:translate(-50%,-50%) scale(1.2); opacity:0 }
        }
      `}</style>
    </div>
  )
}
