// pages/interviews/[id].tsx

import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { InterviewCard, Interview } from '@/components/InterviewCard'
import {
  FaClock,
  FaMicrophone,
  FaVolumeUp,
  FaVideo,
  FaSpinner,
} from 'react-icons/fa'

/* ────────────────────────────────────────────────────────── */
/* types */
export interface SessionPayload {
  id: string             // interview id used as session identifier
  introduction: string   // system instructions/introduction for GPT
  questions: string[]    // seed questions (empty for organic flow)
  durationSec: number    // interview length (sec)
}
/* ────────────────────────────────────────────────────────── */

// Dynamically load the live room (client-only)
const LiveInterviewRoom = dynamic(
  () => import('@/components/LiveInterviewRoom'),
  {
    ssr: false,
    loading: () => (
      <p className="text-center mt-20 text-lg">Loading interview room…</p>
    ),
  }
)

const InterviewDetail: NextPage = () => {
  const router = useRouter()
  const { id, category } = router.query as { id: string; category: string }

  // core state
  const [interview, setInterview] = useState<Interview | null>(null)
  const [related,   setRelated]   = useState<Interview[]>([])
  const [session,   setSession]   = useState<SessionPayload | null>(null)

  /* ───────── Web-cam preview state ───────── */
  const videoRef             = useRef<HTMLVideoElement>(null)
  const [audioDevices, setAudioDevices]   = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices]   = useState<MediaDeviceInfo[]>([])
  const [selectedAudio, setSelectedAudio] = useState<string>('')
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [permissionError, setPermissionError] = useState(false)

  /* 1. fetch interview + related list */
  useEffect(() => {
    if (!category) return
    fetch(`/api/interviews?category=${category}`)
      .then(r => r.json())
      .then((all: Interview[]) => {
        setInterview(all.find(iv => iv.id === id) || null)
        setRelated(all.filter(iv => iv.id !== id).slice(0, 5))
      })
  }, [id, category])

  /* 2. enumerate devices once */
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devs => {
        setAudioDevices(devs.filter(d => d.kind === 'audioinput'))
        setVideoDevices(devs.filter(d => d.kind === 'videoinput'))
        const mic = devs.find(d => d.kind === 'audioinput')
        const cam = devs.find(d => d.kind === 'videoinput')
        if (mic) setSelectedAudio(mic.deviceId)
        if (cam) setSelectedVideo(cam.deviceId)
      })
      .catch(() => setPermissionError(true))
  }, [])

  /* 3. preview stream when selection changes */
  useEffect(() => {
    if (!selectedAudio && !selectedVideo) return
    navigator.mediaDevices.getUserMedia({
      audio: selectedAudio ? { deviceId: selectedAudio } : false,
      video: selectedVideo ? { deviceId: selectedVideo, width:1280, height:720 } : false
    })
    .then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream
    })
    .catch(() => setPermissionError(true))
  }, [selectedAudio, selectedVideo])

  /* Handle “Start interview” – build your system instruction + topic */
  function handleStart() {
    if (!interview) return

    // Duration in seconds
    const m = interview.duration.match(/(\d+)/)
    const minutes = m ? parseInt(m[1], 10) : 5
    const durationSec = minutes * 60

    // 1) Your custom system instruction
    const systemInstruction = `
You are Nexxus AI, an empathetic and friendly AI voicebot designed to help students practice their interview skills. Please conduct mock interviews, starting each session with a warm introduction of yourself and an expression of gratitude for the student's time. Your feedback should be balanced, acknowledging their strengths while also providing constructive criticism for improvement. You always start first. Do not explain the answer to the student, follow-up with a question.
    `.trim()

    // 2) Append the specific topic as context
    const introduction = `
${systemInstruction}

Let's begin a mock interview on "${interview.title}". 
    `.trim()

    console.log('Starting session:', { id: interview.id, introduction, durationSec })

    setSession({
      id: interview.id,
      introduction,
      questions: [],        // organic flow—no seed questions
      durationSec,
    })
  }

  /* ────────── Render logic ────────── */

  // If a session is active, show the live room
  if (session) {
    return <LiveInterviewRoom session={session} onEnd={() => setSession(null)} />
  }

  // Loading state for interview details
  if (!interview) {
    return <p className="text-center mt-20 text-lg">Loading interview details…</p>
  }

  // Default: interview detail page
  return (
    <main className="font-poppins bg-[var(--background)] text-[var(--foreground)] min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* ─── Left Column ─── */}
          <div className="flex-1 space-y-8">
            <nav className="text-sm text-[#6288CE]">
              <a href="/interviews" className="hover:underline">Interviews</a> ›{' '}
              <span className="capitalize">{category}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl font-bold text-[#18326F]">
                {interview.title}
              </h1>
              <span className="text-sm font-semibold uppercase bg-[#87B2FF] text-white px-3 py-1 rounded-full">
                {interview.level}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-[#18326F]">
              <span className="inline-flex items-center">
                <FaClock className="mr-2" />{interview.duration}
              </span>
              {interview.subtitle && (
                <span className="text-[#6288CE]">{interview.subtitle}</span>
              )}
            </div>

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video rounded-xl bg-black"
            />

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              {/* Microphone */}
              <div>
                <label className="flex items-center mb-1 font-medium text-[#18326F]">
                  <FaMicrophone className="mr-2" /> Microphone
                </label>
                {permissionError ? (
                  <div className="inline-flex items-center px-3 py-2 border rounded-lg bg-[#FFF4F4] text-red-600">
                    <span className="mr-2">🔒</span> Permission required
                  </div>
                ) : (
                  <select
                    className="w-full px-3 py-2 bg-white border border-[#87B2FF] rounded-lg"
                    value={selectedAudio}
                    onChange={e => setSelectedAudio(e.target.value)}
                  >
                    {audioDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || 'Mic ' + d.deviceId.slice(-4)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Speakers */}
              <div>
                <label className="flex items-center mb-1 font-medium text-[#18326F]">
                  <FaVolumeUp className="mr-2" /> Speakers
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-[#87B2FF] rounded-lg"
                  disabled
                >
                  <option>Default Speakers</option>
                </select>
              </div>

              {/* Camera */}
              <div>
                <label className="flex items-center mb-1 font-medium text-[#18326F]">
                  <FaVideo className="mr-2" /> Camera
                </label>
                {permissionError ? (
                  <div className="inline-flex items-center px-3 py-2 border rounded-lg bg-[#FFF4F4] text-red-600">
                    <span className="mr-2">🔒</span> Permission required
                  </div>
                ) : (
                  <select
                    className="w-full px-3 py-2 bg-white border border-[#87B2FF] rounded-lg"
                    value={selectedVideo}
                    onChange={e => setSelectedVideo(e.target.value)}
                  >
                    {videoDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || 'Camera ' + d.deviceId.slice(-4)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <section className="bg-white shadow-lg rounded-lg p-6 mt-8 prose max-w-none">
              <h2 className="text-2xl font-semibold text-accent mb-4">About This Interview</h2>
              <p className="text-gray-700 leading-relaxed">
                This <strong className="font-semibold">{interview.title}</strong> mock interview is designed to simulate real-world questions and give you actionable feedback.
              </p>
            </section>
            <section className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#18326F]">More like this</h3>
                <a
                  href={`/interviews?category=${category}`}
                  className="text-[#87B2FF] hover:underline text-sm"
                >
                  Browse 100+ interviews →
                </a>
              </div>
              <div className="grid auto-rows-auto [grid-template-columns:repeat(auto-fill,minmax(14rem,1fr))] gap-x-12 gap-y-16">
                {related.map(iv => (
                  <InterviewCard
                    key={iv.id}
                    interview={iv}
                    onSelect={nid =>
                      router.push({ pathname: `/interviews/${nid}`, query: { category } })
                    }
                  />
                ))}
              </div>
            </section>
          </div>

          {/* ─── Right Sidebar ─── */}
          <aside className="lg:w-80 shrink-0 lg:mt-50">
            <div className="sticky top-16 space-y-6">
              <p className="text-lg font-semibold text-[#18326F] text-center">
                Ready to join?
              </p>
              <div className="mx-auto w-16 h-16 rounded-full bg-white shadow flex items-center justify-center">
                <Image src="/Nexxus AI.png" alt="Nexxus AI" width={40} height={40} />
              </div>
              <p className="flex items-center justify-center text-sm text-[#6288CE] gap-2">
                <FaSpinner className="animate-spin" />
                <span>Waiting for Nexxus AI</span>
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="w-full bg-[#87B2FF] text-white py-3 rounded-full font-medium"
              >
                Start Interview
              </button>
              <p className="text-xs text-[#18326F]/70 text-center">
                Nexxus AI uses generative AI to conduct this interview
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default InterviewDetail
