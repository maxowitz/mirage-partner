import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// ── CSS float keyframe — injected once into <head> ────────────────────────────

const FLOAT_CSS = `
@keyframes dfwFloat {
  0%,  100% { transform: translateY(0px) rotate(0deg); }
  33%        { transform: translateY(-6px) rotate(0.04deg); }
  66%        { transform: translateY(-3px) rotate(-0.03deg); }
}
`

function injectStyle(id, css) {
  if (document.getElementById(id)) return
  const el = document.createElement('style')
  el.id = id
  el.textContent = css
  document.head.appendChild(el)
}

// ── Traffic-light dot ─────────────────────────────────────────────────────────

function Dot({ color, symbol, onClick, show }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseDown={e => e.stopPropagation()}
      style={{
        width: 12, height: 12, borderRadius: '50%',
        background: color,
        filter: hov ? 'brightness(0.82)' : 'none',
        cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 7, color: 'rgba(0,0,0,0.55)', fontWeight: 900, lineHeight: 1,
        fontFamily: 'system-ui, sans-serif',
        transition: 'filter 0.1s',
        userSelect: 'none',
      }}
    >
      {(show || hov) ? symbol : null}
    </div>
  )
}

// ── Window variants — custom='minimize'|'close' picked up at exit time ────────
// Framer-motion reads `custom` from the latest render, which is batched with
// the parent's state change (activeDemo → null) in the same React tick.

const windowVariants = {
  initial: { scale: 0.90, opacity: 0, y: 22 },
  animate: { scale: 1, opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit: (mode) => mode === 'minimize'
    ? { scale: 0.10, opacity: 0, y: 520, transition: { duration: 0.45, ease: [0.4, 0, 0.8, 0.2] } }
    : { scale: 0.96, opacity: 0, y: -8,  transition: { duration: 0.22, ease: 'easeIn' } },
}

// ── Main component ────────────────────────────────────────────────────────────
// NOTE: AnimatePresence lives in Experience.jsx (the parent). DemoWindow does
// NOT manage its own visibility — it always renders as long as it's in the tree.
// triggerClose/Minimize sets exitMode state, then calls onClose() synchronously.
// React batches both state changes so framer-motion sees `custom` at exit time.

export default function DemoWindow({ url, onClose, children }) {
  const [exitMode,    setExitMode]    = useState('close')
  const [fullscreen,  setFullscreen]  = useState(false)
  const [chromeFocus, setChromeFocus] = useState(false)
  const tiltRef = useRef()

  useEffect(() => { injectStyle('dfw-float', FLOAT_CSS) }, [])

  // ESC → close
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') triggerClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  // Subtle global mouse tilt — feels like a physical object in space
  useEffect(() => {
    if (fullscreen) {
      if (tiltRef.current) tiltRef.current.style.transform = 'none'
      return
    }
    const onMove = (e) => {
      if (!tiltRef.current) return
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      tiltRef.current.style.transform =
        `perspective(1400px) rotateY(${nx * 2.8}deg) rotateX(${-ny * 2.0}deg)`
    }
    const onLeave = () => {
      if (tiltRef.current)
        tiltRef.current.style.transform =
          'perspective(1400px) rotateY(0deg) rotateX(0deg)'
    }
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [fullscreen])

  // Batched with parent's setActiveDemo(null) → framer-motion reads custom at exit
  const triggerClose    = () => { setExitMode('close');    onClose() }
  const triggerMinimize = () => { setExitMode('minimize'); onClose() }
  const toggleFullscreen = () => setFullscreen(f => !f)

  const windowW = fullscreen ? '100vw' : 'min(1280px, 91vw)'
  const windowH = fullscreen ? '100vh' : '84vh'
  const radius  = fullscreen ? 0 : 11

  return (
    <motion.div
      key="dfw-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={triggerClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(3,2,1,0.76)',
        backdropFilter: 'blur(9px)',
        WebkitBackdropFilter: 'blur(9px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* ── Float layer */}
      <div style={{
        animation: fullscreen ? 'none' : 'dfwFloat 6.5s ease-in-out infinite',
        willChange: 'transform',
      }}>
        {/* ── Tilt layer — DOM-mutated, zero React re-renders */}
        <div ref={tiltRef} style={{ transition: 'transform 0.4s ease', willChange: 'transform' }}>

          {/* ── Entrance / exit animation with custom minimize variant */}
          <motion.div
            variants={windowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={exitMode}
            onClick={e => e.stopPropagation()}
            style={{
              width: windowW, height: windowH,
              borderRadius: radius,
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              background: '#121212',
              boxShadow: fullscreen
                ? 'none'
                : '0 52px 150px rgba(0,0,0,0.90), 0 0 0 1px rgba(255,255,255,0.09), 0 8px 40px rgba(0,0,0,0.5)',
              transition: 'width 0.4s ease, height 0.4s ease, border-radius 0.4s ease, box-shadow 0.4s',
            }}
          >
            {/* ── Browser chrome bar */}
            <div
              onMouseEnter={() => setChromeFocus(true)}
              onMouseLeave={() => setChromeFocus(false)}
              style={{
                height: 38, flexShrink: 0,
                background: 'linear-gradient(180deg, #252525 0%, #1e1e1e 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center',
                padding: '0 14px',
                userSelect: 'none',
                position: 'relative',
              }}
            >
              {/* Traffic lights */}
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', zIndex: 1 }}>
                <Dot color="#FF5F57" symbol="✕" onClick={triggerClose}     show={chromeFocus} />
                <Dot color="#FFBD2E" symbol="−" onClick={triggerMinimize}  show={chromeFocus} />
                <Dot color="#28CA41" symbol={fullscreen ? '⤡' : '⤢'} onClick={toggleFullscreen} show={chromeFocus} />
              </div>

              {/* URL bar — absolutely centered */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(440px, 44%)',
                background: 'rgba(255,255,255,0.055)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '4px 11px',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <span style={{ fontSize: 9, opacity: 0.28, lineHeight: 1, flexShrink: 0 }}>🔒</span>
                <span style={{
                  fontFamily: '"JetBrains Mono", "SF Mono", monospace',
                  fontSize: 10.5, color: 'rgba(255,255,255,0.30)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, letterSpacing: '0.01em',
                }}>
                  {url}
                </span>
              </div>
            </div>

            {/* ── App content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>
              {children}
            </div>

          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
