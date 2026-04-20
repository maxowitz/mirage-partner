import { useState, useRef, useEffect } from 'react'
import SynthCanvas from '../components/canvas/SynthCanvas'
import TerrainBackground from '../components/canvas/TerrainBackground'
import BackgroundToggle from '../components/ui/BackgroundToggle'
import SectionLanding from '../components/sections/SectionLanding'
import SectionWork from '../components/sections/SectionWork'
import SectionPractice from '../components/sections/SectionPractice'
import SectionBrief from '../components/sections/SectionBrief'
import SectionContact from '../components/sections/SectionContact'
import ProjectModal from '../components/ui/ProjectModal'
import ParticleWord from '../components/canvas/ParticleWord'
import SaltLakeIQDemo     from '../components/demos/SaltLakeIQDemo'
import SponsorshipsCRMDemo from '../components/demos/SponsorshipsCRMDemo'
import WebNotesDemo        from '../components/demos/WebNotesDemo'
import TheDamDemo          from '../components/demos/TheDamDemo'
import DemoWindow          from '../components/ui/DemoWindow'
import TimeGreeting from '../components/ui/TimeGreeting'
import { AnimatePresence } from 'framer-motion'

const DEMO_META = {
  saltlakeiq:   { Component: SaltLakeIQDemo,     url: 'saltlakeiq.com' },
  sponsorships: { Component: SponsorshipsCRMDemo, url: 'sponsorships.saltlakeiq.com' },
  webnotes:     { Component: WebNotesDemo,        url: 'getwebnotes.net' },
  dam:          { Component: TheDamDemo,          url: 'vslbrandstudio.com' },
}
import { SECTIONS } from '../data/content'

// ─── Custom cursor (two-layer: snappy dot + lagged ring) ──────────────────
function CustomCursor() {
  const dotRef  = useRef()
  const ringRef = useRef()

  useEffect(() => {
    let raf
    const pos    = { x: -200, y: -200 }
    const smooth = { x: -200, y: -200 }

    const onMove = (e) => { pos.x = e.clientX; pos.y = e.clientY }

    const tick = () => {
      smooth.x += (pos.x - smooth.x) * 0.13
      smooth.y += (pos.y - smooth.y) * 0.13
      if (dotRef.current)  dotRef.current.style.transform  = `translate(${pos.x - 4}px, ${pos.y - 4}px)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${smooth.x - 18}px, ${smooth.y - 18}px)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      {/* Inner gold dot */}
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0,
        width: 8, height: 8, borderRadius: '50%',
        background: 'rgba(185,140,55,0.95)',
        boxShadow: '0 0 10px rgba(185,140,55,0.5)',
        pointerEvents: 'none', zIndex: 10000,
        willChange: 'transform',
      }} />
      {/* Outer lagged ring */}
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0,
        width: 36, height: 36, borderRadius: '50%',
        border: '1px solid rgba(185,140,55,0.32)',
        pointerEvents: 'none', zIndex: 10000,
        willChange: 'transform',
      }} />
    </>
  )
}

// ─── Mobile fallback ─────────────────────────────────────────────────────────
function MobileFallback() {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#030201', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '3rem 2rem', gap: '1.5rem' }}>
      <img src="/logo-gold.png" alt="Mirage Studios" style={{ width: 110, opacity: 0.82, marginBottom: '0.5rem' }} />
      <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.8rem, 11vw, 4.5rem)', fontWeight: 300, lineHeight: 1.0, color: 'rgba(240,230,210,0.9)', margin: 0 }}>
        If you think<br />it&rsquo;s a mirage,<br />
        <em style={{ color: 'rgba(185,140,55,0.88)' }}>it isn&rsquo;t.</em>
      </h1>
      <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.9rem', color: 'rgba(220,208,185,0.4)', maxWidth: '30ch', lineHeight: 1.7 }}>
        We build exactly what you imagine. For anyone, at any scale.
      </p>
      <a href="mailto:hello@miragestudios.io" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(185,140,55,0.7)', letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none' }}>
        hello@miragestudios.io
      </a>
    </div>
  )
}

const SectionComponents = {
  landing:  SectionLanding,
  work:     SectionWork,
  practice: SectionPractice,
  brief:    SectionBrief,
  contact:  SectionContact,
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Experience() {
  const MODES = ['terrain', 'cloud']
  // Random initial background
  const [bgMode, setBgMode] = useState(() => MODES[Math.floor(Math.random() * 2)])
  const [activeSection, setActiveSection] = useState(0)
  const [selectedProject, setSelectedProject] = useState(null)
  const [easterEggActive, setEasterEggActive] = useState(false)
  const [activeDemo, setActiveDemo] = useState(null)  // null | 'saltlakeiq' | 'sponsorships' | 'webnotes' | 'dam'

  const progressRef   = useRef(0)   // 0-1 scroll progress
  const scrollVelRef  = useRef(0)   // scroll velocity (for cloud kinetics)
  const mouseRef      = useRef({ x: 0, y: 0, down: false })
  const clickRef      = useRef({ x: 0, y: 0, pending: false })
  const sectionRefs   = useRef([])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Scroll → progress + velocity
  useEffect(() => {
    if (isMobile) return
    let lastY    = window.scrollY
    let lastTime = performance.now()

    const onScroll = () => {
      const now = performance.now()
      const dy  = window.scrollY - lastY
      const dt  = Math.max(now - lastTime, 1)

      scrollVelRef.current = Math.min(1.0, Math.abs(dy / dt) * 1.2)
      lastY    = window.scrollY
      lastTime = now

      const max = document.documentElement.scrollHeight - window.innerHeight
      progressRef.current = max > 0 ? window.scrollY / max : 0
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobile])

  // Mouse + click tracking
  useEffect(() => {
    if (isMobile) return
    const onMove = (e) => {
      mouseRef.current.x =  (e.clientX / window.innerWidth)  - 0.5
      mouseRef.current.y = -((e.clientY / window.innerHeight) - 0.5)
    }
    const onDown  = () => { mouseRef.current.down = true }
    const onUp    = () => { mouseRef.current.down = false }
    const onClick = (e) => {
      clickRef.current = {
        x:  (e.clientX / window.innerWidth)  - 0.5,
        y: -((e.clientY / window.innerHeight) - 0.5),
        pending: true,
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('click',     onClick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('click',     onClick)
    }
  }, [isMobile])

  // IntersectionObserver — drives section content animations
  useEffect(() => {
    if (isMobile) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = sectionRefs.current.indexOf(entry.target)
          if (idx !== -1) setActiveSection(idx)
        }
      }),
      { threshold: 0.5 }
    )
    sectionRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [isMobile])

  // Decay scroll velocity to zero
  useEffect(() => {
    if (isMobile) return
    let raf
    const tick = () => {
      scrollVelRef.current *= 0.92
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isMobile])

  if (isMobile) return <MobileFallback />

  return (
    <div style={{ background: '#030201', cursor: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* 3D canvases — both always mounted to avoid WebGL context loss */}
      <TerrainBackground
        progressRef={progressRef}
        mouseRef={mouseRef}
        clickRef={clickRef}
        active={bgMode === 'terrain'}
      />
      <SynthCanvas
        progressRef={progressRef}
        scrollRef={scrollVelRef}
        mouseRef={mouseRef}
        clickRef={clickRef}
        active={bgMode === 'cloud'}
      />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Logo — fixed top left, click triggers particle easter egg */}
      <div
        onClick={() => setEasterEggActive(true)}
        style={{
          position: 'fixed', top: '1.6rem', left: '2rem',
          zIndex: 100, cursor: 'none', userSelect: 'none',
        }}
      >
        <img src="/logo-gold.png" alt="Mirage Studios" style={{ width: 96, opacity: 0.55, transition: 'opacity 0.3s' }}
          onMouseEnter={e => { e.target.style.opacity = 0.85 }}
          onMouseLeave={e => { e.target.style.opacity = 0.55 }}
        />
      </div>

      {/* Greeting — fixed top right, sits left of background toggle */}
      <div style={{ position: 'fixed', top: '1.85rem', right: '8.5rem', zIndex: 100 }}>
        <TimeGreeting />
      </div>

      {/* Background toggle — fixed top right */}
      <BackgroundToggle mode={bgMode} onChange={setBgMode} />

      {/* Section nav dots — right edge */}
      <div style={{
        position: 'fixed', right: '1.8rem', top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: '0.65rem',
        zIndex: 100, pointerEvents: 'none',
      }}>
        {SECTIONS.map((_, i) => (
          <div key={i} style={{
            width: 3, height: 3, borderRadius: '50%',
            background: i === activeSection
              ? 'rgba(185,140,55,0.85)'
              : 'rgba(240,230,210,0.12)',
            transition: 'background 0.4s, transform 0.4s',
            transform: i === activeSection ? 'scale(1.8)' : 'scale(1)',
          }} />
        ))}
      </div>

      {/* Scrollable content sections — 100vh each */}
      {SECTIONS.map((section, i) => {
        const SectionComp = SectionComponents[section.id]
        return (
          <div
            key={section.id}
            ref={el => { sectionRefs.current[i] = el }}
            style={{
              height: '100vh',
              position: 'relative',
              zIndex: 10,
              background: 'linear-gradient(to right, rgba(3,2,1,0.55) 0%, rgba(3,2,1,0.15) 45%, transparent 70%)',
            }}
          >
            <SectionComp
              data={section}
              active={activeSection === i}
              onSelectProject={section.id === 'work' ? setSelectedProject : undefined}
            />
          </div>
        )
      })}

      {/* Work showcase modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onDemo={(id) => { setSelectedProject(null); setActiveDemo(id) }}
      />

      {/* Particle easter egg — logo click */}
      <ParticleWord active={easterEggActive} onClose={() => setEasterEggActive(false)} />

      {/* Interactive demos — AnimatePresence here so DemoWindow exit plays before unmount */}
      <AnimatePresence>
        {activeDemo === 'saltlakeiq'   && <DemoWindow key="saltlakeiq"   url="saltlakeiq.com"               onClose={() => setActiveDemo(null)}><SaltLakeIQDemo /></DemoWindow>}
        {activeDemo === 'sponsorships' && <DemoWindow key="sponsorships" url="sponsorships.saltlakeiq.com"  onClose={() => setActiveDemo(null)}><SponsorshipsCRMDemo /></DemoWindow>}
        {activeDemo === 'webnotes'     && <DemoWindow key="webnotes"     url="getwebnotes.net"              onClose={() => setActiveDemo(null)}><WebNotesDemo /></DemoWindow>}
        {activeDemo === 'dam'          && <DemoWindow key="dam"          url="vslbrandstudio.com"           onClose={() => setActiveDemo(null)}><TheDamDemo /></DemoWindow>}
      </AnimatePresence>
    </div>
  )
}
