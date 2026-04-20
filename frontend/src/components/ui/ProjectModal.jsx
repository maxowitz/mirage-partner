import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppMockup from './AppMockup'

// ── Coalesce screen — 4px canvas particles assemble the frame atom by atom ────
// Canvas-driven so we can run 2700+ micro-particles with zero React overhead.
// Each particle flashes accent, lingers briefly, then fades to reveal content.
// After the full build the outer frame tilts into its final 3D angle.

function CoalesceScreen({ type, accent, finalRotateY = 0, finalRotateX = 0, scale = 1, translateX = 0, translateY = 0, zIndex = 0, startDelay = 0 }) {
  const canvasRef = useRef()
  const W = 260, H = 170
  const TILE = 4          // px — tiny enough to feel atomic
  const BUILD = 0.82      // seconds to sweep all tiles
  const LINGER = 110      // ms each particle glows before fading
  const tiltAt = startDelay + BUILD + 0.1

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = W
    canvas.height = H

    const COLS = Math.ceil(W / TILE)
    const ROWS = Math.ceil(H / TILE)
    const TOTAL = COLS * ROWS

    // Build edge-first order with organic randomness
    const tiles = Array.from({ length: TOTAL }, (_, id) => {
      const col = id % COLS
      const row = Math.floor(id / COLS)
      return { col, row, edgeDist: Math.min(col, COLS-1-col, row, ROWS-1-row), bright: 0.45 + Math.random() * 0.55 }
    })
    tiles.sort((a, b) => (-a.edgeDist + Math.random() * 1.6) - (-b.edgeDist + Math.random() * 1.6))

    const origin = performance.now()
    const startMs = startDelay * 1000
    tiles.forEach((t, i) => { t.fireAt = origin + startMs + (i / TOTAL) * BUILD * 1000 })

    const rC = parseInt(accent.slice(1, 3), 16)
    const gC = parseInt(accent.slice(3, 5), 16)
    const bC = parseInt(accent.slice(5, 7), 16)

    let raf
    const FADE_MS = 90
    const endMs = origin + startMs + BUILD * 1000 + LINGER + FADE_MS + 60

    const draw = () => {
      const now = performance.now()
      ctx.clearRect(0, 0, W, H)

      for (const t of tiles) {
        const elapsed = now - t.fireAt
        if (elapsed < 0) continue
        const appear = Math.min(elapsed / 50, 1)
        const fade   = elapsed > LINGER ? Math.min((elapsed - LINGER) / FADE_MS, 1) : 0
        const alpha  = appear * (1 - fade) * t.bright
        if (alpha < 0.01) continue
        ctx.globalAlpha = alpha
        ctx.fillStyle = `rgb(${rC},${gC},${bC})`
        ctx.fillRect(t.col * TILE, t.row * TILE, TILE - 0.5, TILE - 0.5)
      }

      if (now < endMs) raf = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, W, H)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [accent, startDelay])

  return (
    <motion.div
      initial={{ x: translateX, y: translateY, scale, rotateY: 0, rotateX: 0, opacity: 0 }}
      animate={{ x: translateX, y: translateY, scale, rotateY: finalRotateY, rotateX: finalRotateX, opacity: 1 }}
      transition={{
        opacity:  { delay: startDelay, duration: 0.15 },
        rotateY:  { delay: tiltAt, duration: 0.85, ease: [0.16, 1, 0.3, 1] },
        rotateX:  { delay: tiltAt, duration: 0.85, ease: [0.16, 1, 0.3, 1] },
        x: { duration: 0 }, y: { duration: 0 }, scale: { duration: 0 },
      }}
      style={{
        position: 'absolute', width: W, height: H,
        borderRadius: 8, overflow: 'hidden', zIndex,
        boxShadow: `0 30px 80px rgba(0,0,0,0.82), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px ${accent}14`,
      }}
    >
      <AppMockup type={type} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', background: 'linear-gradient(140deg, rgba(255,255,255,0.07) 0%, transparent 32%)' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', width: W, height: H }} />
    </motion.div>
  )
}

// ── Coalesce sparks ────────────────────────────────────────────────────────────

function CoalesceSparks({ accent, active }) {
  const sparks = useRef(Array.from({ length: 200 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const ring  = i < 80 ? 0 : i < 145 ? 1 : 2
    const [dlo, dhi] = ring === 0 ? [260, 520] : ring === 1 ? [120, 260] : [40, 120]
    const dist = dlo + Math.random() * (dhi - dlo)
    const [dlay_lo, dlay_hi] = ring === 0 ? [0, 0.12] : ring === 1 ? [0.06, 0.2] : [0.16, 0.36]
    const [dur_lo,  dur_hi]  = ring === 0 ? [0.3, 0.5] : ring === 1 ? [0.34, 0.52] : [0.28, 0.45]
    return {
      id: i, ring,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.55,
      tx: 110 + Math.random() * 90,
      ty: (Math.random() - 0.5) * 110,
      size: ring === 0 ? 1 + Math.random() * 1.8 : ring === 1 ? 1.5 + Math.random() * 2.2 : 2 + Math.random() * 3,
      delay: dlay_lo + Math.random() * (dlay_hi - dlay_lo),
      dur:   dur_lo  + Math.random() * (dur_hi  - dur_lo),
    }
  })).current

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          initial={{ x: s.x, y: s.y, opacity: 0, scale: 0 }}
          animate={active
            ? { x: s.tx, y: s.ty, opacity: 0, scale: 0.04 }
            : { x: s.x, y: s.y, opacity: 0.9, scale: 1 }
          }
          transition={active
            ? { delay: s.delay, duration: s.dur, ease: [0.15, 0, 0.7, 1] }
            : { delay: s.id * 0.0022, duration: 0.15, ease: 'easeOut' }
          }
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: s.size, height: s.size, borderRadius: '50%',
            background: accent,
            marginLeft: -s.size / 2, marginTop: -s.size / 2,
            boxShadow: `0 0 ${s.size * 5}px ${accent}`,
          }}
        />
      ))}
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

function CoalesceView({ project, onDemo }) {
  const [sparksActive, setSparksActive] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSparksActive(true), 440)
    return () => clearTimeout(t)
  }, [])

  const primaryStart   = 0.44
  const secondaryStart = 0.60

  return (
    <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', width: '100%', maxWidth: 900, padding: '0 2rem', position: 'relative' }}>
      <CoalesceSparks accent={project.accent} active={sparksActive} />

      {/* Info panel */}
      <div style={{ flex: '0 0 340px' }}>
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: secondaryStart + 0.68 + 0.2, duration: 0.75, ease: [0.16,1,0.3,1] }}
        >
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: `${project.accent}90`, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            {project.tags.join(' · ')}
          </div>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300, lineHeight: 1.0, color: 'rgba(240,234,214,0.95)', letterSpacing: '-0.02em', marginBottom: '1.2rem' }}>
            {project.name}
          </h2>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', fontStyle: 'italic', color: project.accent, marginBottom: '1.2rem', lineHeight: 1.3 }}>
            {project.outcome}
          </div>
          <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.82rem', color: 'rgba(240,234,214,0.45)', lineHeight: 1.75, marginBottom: '1.8rem' }}>
            {project.mandate}
          </p>
          {onDemo && (
            <button onClick={() => onDemo(project.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '0.65rem 1.4rem', background: `${project.accent}18`, color: project.accent, border: `1px solid ${project.accent}55`, borderRadius: 2, cursor: 'pointer', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${project.accent}28`; e.currentTarget.style.borderColor = `${project.accent}88` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${project.accent}18`; e.currentTarget.style.borderColor = `${project.accent}55` }}
            >
              Try Demo →
            </button>
          )}
        </motion.div>
      </div>

      {/* Screens */}
      <div style={{ flex: 1, position: 'relative', height: 260, perspective: '1400px', perspectiveOrigin: '50% 50%' }}>
        {project.screens[1] && (
          <CoalesceScreen type={project.screens[1]} accent={project.accent}
            finalRotateY={-8} finalRotateX={4} translateX={36} translateY={34}
            scale={0.85} zIndex={1} startDelay={secondaryStart} />
        )}
        <CoalesceScreen type={project.screens[0]} accent={project.accent}
          finalRotateY={-4} finalRotateX={2} translateX={0} translateY={0}
          scale={1} zIndex={2} startDelay={primaryStart} />
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ProjectModal({ project, onClose, onDemo }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(3,2,1,0.9)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

            <motion.div
              key={project.id}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16,1,0.3,1] }}
              style={{ position: 'absolute', top: -40, left: '18%', right: '18%', height: 1, background: `linear-gradient(to right, transparent, ${project.accent}55, transparent)`, transformOrigin: 'center' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', maxWidth: 900, padding: '0 2rem' }}>
              <button onClick={onClose}
                style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(240,234,214,0.2)', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', transition: 'color 0.2s' }}
                onMouseEnter={e => { e.target.style.color = 'rgba(240,234,214,0.5)' }}
                onMouseLeave={e => { e.target.style.color = 'rgba(240,234,214,0.2)' }}>
                ESC
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={project.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <CoalesceView
                  project={project}
                  onDemo={onDemo}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
