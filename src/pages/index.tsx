// pages/index.tsx
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import Image from 'next/image'

// Brand colors
const COLORS = {
  accent: '#16D5A8',     // Cornflower Blue (accent)
  primary: '#18326F',    // Java (primary text)
  secondary: '#6288CE',  // Biscay
  background: '#87B2FF'  // Danube
}

const LandingPage: NextPage = () => {
  const router = useRouter()

  const handleCTA = () => {
    router.push('/interviews')
  }

  return (
    <main className="relative flex flex-col items-center justify-between min-h-screen overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Floating gradient blobs */}
        <div
          className="absolute bg-gradient-to-br from-[#6288CE]/60 to-[#16D5A8]/60 rounded-full"
          style={{
            width: '400px',
            height: '400px',
            top: '-100px',
            left: '-100px',
            filter: 'blur(100px)',
            transform: 'rotate(30deg)',
          }}
        />
        <div
          className="absolute bg-gradient-to-tr from-[#87B2FF]/50 to-[#18326F]/50 rounded-full"
          style={{
            width: '300px',
            height: '300px',
            bottom: '-80px',
            right: '-80px',
            filter: 'blur(80px)',
            transform: 'rotate(-45deg)',
          }}
        />
      </div>

      {/* Header */}
      <header className="z-10 w-full flex items-center justify-between px-6 py-8">
        <Image
          src="/internexxus-logo.png"
          alt="Internexxus Logo"
          width={160}
          height={48}
        />
        <nav className="space-x-6">
          <button
            onClick={() => router.push('https://internexxus.com')}
            className="text-sm font-semibold uppercase text-[#18326F]/80 hover:text-[#16D5A8] transition-colors cursor-pointer hover:cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => router.push('/interviews')}
            className="text-sm font-semibold uppercase text-[#18326F]/80 hover:text-[#16D5A8] transition-colors cursor-pointer hover:cursor-pointer"
          >
            Interviews
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <section className="z-10 flex flex-col items-center text-center px-6">
        <h1
          className="font-extrabold mb-4 text-5xl sm:text-6xl lg:text-7xl leading-tight"
          style={{
            background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Elevate Your Interview Game
        </h1>
        <p
          className="mb-8 max-w-xl text-lg sm:text-xl"
          style={{ color: COLORS.primary, opacity: 0.85 }}
        >
          Dive into 100+ expert-vetted mock interviews, get AI-powered feedback, and land your dream role. 
          Level up your skills with a fresh, interactive experience designed just for you.
        </p>
        <button
          onClick={handleCTA}
          className="relative overflow-hidden px-10 py-4 rounded-full text-xl font-semibold transition-transform transform hover:scale-105 cursor-pointer hover:cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.secondary})`,
            color: '#FFFFFF',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          }}
        >
          <span className="z-10 relative">Take Me to Interviews</span>
          {/* Animated underline effect */}
          <span
            className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-500 ease-out hover:w-full"
          />
        </button>
      </section>

      {/* Footer */}
      <footer className="z-10 w-full text-center py-6">
        <p
          className="text-sm"
          style={{ color: COLORS.primary, opacity: 0.7 }}
        >
          © {new Date().getFullYear()} Internexxus. All rights reserved.
        </p>
      </footer>
    </main>
  )
}

export default LandingPage