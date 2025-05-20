// components/InterviewCard.tsx
import React from 'react'
import Image from 'next/image'
import { FaClock } from 'react-icons/fa'

export interface Interview {
  id: string
  title: string
  subtitle?: string
  duration: string   // e.g. "15m"
  level: string      // e.g. "Easy" | "Medium" | "Difficult"
}

const gradients = [
  ['#B3EEE3', '#E5F9F4'],
  ['#C7E3F7', '#FFFFFF'],
  ['#87B2FF', '#6288CE'],
  ['#18326F', '#87B2FF'],
  ['#E5F9F4', '#C7E3F7'],
]

export const InterviewCard: React.FC<{
  interview: Interview
  onSelect: (id: string) => void
}> = ({ interview, onSelect }) => {
  const { id, title, subtitle, duration, level } = interview

  // pick a gradient based on id hash
  const idx = Math.abs(
    id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  ) % gradients.length
  const [start, end] = gradients[idx]

  return (
    <div
      onClick={() => onSelect(id)}
      className="
        relative
        w-72
        rounded-2xl
        bg-white
        shadow-lg
        overflow-hidden
        transform hover:scale-105
        transition-transform duration-300
        cursor-pointer
      "
    >
      {/* Header gradient + wave */}
      <div
        className="relative h-40"
        style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
      >
        <svg
          className="absolute bottom-0 left-0 w-full h-12 text-white"
          viewBox="0 0 500 50"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C150,50 350,0 500,30 L500,50 L0,50 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Floating logo bubble */}
      <div
        className="
          absolute
          -mt-10    /* lift bubble up into header */
          left-1/2
          transform -translate-x-1/2
          bg-white
          p-3
          rounded-full
          shadow-md
        "
      >
        <Image
          src="/Nexxus AI.png"
          alt="Nexxus AI"
          width={48}
          height={48}
          className="rounded-full"
        />
      </div>

      {/* Name below logo */}
      <div className="mt-8 flex justify-center">
        <span className="text-sm font-semibold text-[#18326F]">
          Nexxus AI
        </span>
      </div>

      {/* Content */}
      <div className="px-6 pt-4 pb-6 text-center">
        <h3 className="text-lg font-semibold text-[#18326F]">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-[#6288CE]">{subtitle}</p>
        )}

        {/* Footer pill: duration + level */}
        <div className="mt-4 inline-flex items-center bg-white rounded-full shadow px-4 py-2 space-x-4">
          <div className="flex items-center text-sm text-[#18326F]">
            <FaClock className="mr-2" /> {duration}
          </div>
          <span
            className="
              text-xs font-medium uppercase
              px-3 py-1 rounded-full
              bg-[#6288CE] text-white
            "
          >
            {level}
          </span>
        </div>
      </div>
    </div>
  )
}
