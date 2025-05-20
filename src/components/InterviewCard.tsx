// components/InterviewCard.tsx
import React from 'react'
import Image from 'next/image'
import { FaClock } from 'react-icons/fa'

export interface Interview {
  id: string
  title: string
  subtitle?: string
  duration: string   // e.g. "15m"
  level: string      // e.g. "Medium"
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

  // pick a gradient based on ID
  const idx = Math.abs(
    id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  ) % gradients.length
  const [start, end] = gradients[idx]

  return (
    <div
      onClick={() => onSelect(id)}
      className="
        relative z-0
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
      {/* Gradient header + wave */}
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

      {/* Floating icon bubble */}
      <div
        className="
          absolute
          top-28           /* adjust to taste */
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
          width={69}
          height={69}
        />
      </div>

      {/* Name just below the icon */}
      <div className="mt-20 flex justify-center">
        <span className="text-sm font-semibold text-[#18326F]">
          Nexxus AI
        </span>
      </div>

      {/* Main content */}
      <div className="px-6 pt-4 pb-6 text-center space-y-4">
        <h3 className="text-lg font-semibold text-[#18326F]">{title}</h3>
        {subtitle && (
          <p className="text-sm text-[#6288CE]">{subtitle}</p>
        )}
        <div className="flex justify-center items-center space-x-3">
          {/* duration pill */}
          <span className="
            flex items-center
            bg-white px-3 py-1 rounded-full shadow
            text-sm text-[#18326F]
          ">
            <FaClock className="mr-1" />
            {duration}
          </span>

          {/* level pill */}
          <span className="
            text-xs font-medium uppercase
            bg-white px-3 py-1 rounded-full shadow
            text-[#6288CE]
          ">
            {level}
          </span>
        </div>
      </div>
    </div>
  )
}
