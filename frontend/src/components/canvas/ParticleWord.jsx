import { useEffect, useRef } from 'react'

// Word → emoji / special shape dictionary
const SHAPES = {
  bunny: '🐰', rabbit: '🐰', cat: '🐱', kitty: '🐱',
  dog: '🐶', puppy: '🐶', fox: '🦊', wolf: '🐺',
  fire: '🔥', flame: '🔥', wave: '🌊', ocean: '🌊',
  mountain: '⛰️', star: '⭐', heart: '❤️', love: '❤️',
  rocket: '🚀', moon: '🌙', sun: '☀️', ghost: '👻',
  skull: '💀', lightning: '⚡', bolt: '⚡', dragon: '🐉',
  eagle: '🦅', shark: '🦈', whale: '🐋', tree: '🌲',
  flower: '🌸', rose: '🌹', planet: '🪐', saturn: '🪐',
  diamond: '💎', crown: '👑', king: '👑', sword: '⚔️',
  desert: '🏜️', cactus: '🌵', snake: '🐍', owl: '🦉',
  butterfly: '🦋', mushroom: '🍄', crystal: '💎',
}

const COUNT = 2500

// Rasterize an emoji or text to a lit-pixel list (nx, ny 0→1)
function rasterize(word) {
  const lower = word.toLowerCase().trim()
  const isMirage = lower === 'mirage'
  const emoji = SHAPES[lower]
  const DIM = 400

  const ofc = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(DIM, DIM)
    : (() => { const c = document.createElement('canvas'); c.width = DIM; c.height = DIM; return c })()

  const ctx = ofc.getContext('2d')
  ctx.clearRect(0, 0, DIM, DIM)

  if (isMirage) {
    // Gold "MIRAGE" text — special case
    ctx.fillStyle = '#fff'
    ctx.font = `300 ${DIM * 0.18}px "Cormorant Garamond", Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('MIRAGE', DIM / 2, DIM / 2)
  } else if (emoji) {
    ctx.font = `${DIM * 0.72}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, DIM / 2, DIM / 2)
  } else {
    // Render the raw word
    const words = word.toUpperCase().split(' ')
    ctx.fillStyle = '#fff'
    const lineH = DIM * 0.22
    const startY = DIM / 2 - ((words.length - 1) * lineH) / 2
    words.forEach((w, i) => {
      const fs = Math.min(DIM * 0.2, DIM * 0.9 / Math.max(w.length, 1))
      ctx.font = `300 ${fs}px "Cormorant Garamond", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(w, DIM / 2, startY + i * lineH)
    })
  }

  const data = ctx.getImageData(0, 0, DIM, DIM)
  const lit = []
  const STEP = 3
  for (let y = 0; y < DIM; y += STEP) {
    for (let x = 0; x < DIM; x += STEP) {
      const i = (y * DIM + x) * 4
      if (data.data[i + 3] > 20) {
        lit.push({ nx: x / DIM, ny: y / DIM, bright: data.data[i + 3] / 255 })
      }
    }
  }

  // Shuffle so targets are distributed across all particles evenly
  for (let i = lit.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lit[i], lit[j]] = [lit[j], lit[i]]
  }

  return { lit, isMirage }
}

export default function ParticleWord({ active, onClose }) {
  const canvasRef   = useRef()
  const inputRef    = useRef()
  const particleRef = useRef([])
  const modeRef     = useRef('idle')   // 'idle' | 'forming' | 'formed'
  const rafRef      = useRef()
  const tRef        = useRef(0)

  // Init particles once on mount
  useEffect(() => {
    const W = window.innerWidth, H = window.innerHeight
    particleRef.current = Array.from({ length: COUNT }, () => {
      const cx = W * (0.15 + Math.random() * 0.7)
      const cy = H * (0.15 + Math.random() * 0.7)
      return {
        x: cx, y: cy, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.55,
        r: 0.6 + Math.random() * 1.2,
        alpha: 0.08 + Math.random() * 0.3,
        // target
        tx: cx, ty: cy, hasTarget: false,
        // depth illusion (−1 to +1)
        depth: (Math.random() - 0.5) * 2,
        // color channels (gold default)
        hue: 34 + Math.random() * 14,
        sat: 55 + Math.random() * 35,
        lit: 48 + Math.random() * 22,
      }
    })
  }, [])

  // Focus input when activated
  useEffect(() => {
    if (active) {
      modeRef.current = 'idle'
      particleRef.current.forEach(p => { p.hasTarget = false })
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [active])

  // rAF loop
  useEffect(() => {
    if (!active) { cancelAnimationFrame(rafRef.current); return }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const tick = () => {
      tRef.current++
      const t   = tRef.current
      const W   = canvas.width, H = canvas.height
      const pts = particleRef.current
      const mode = modeRef.current

      // Dim trail — semi-transparent clear creates motion blur
      ctx.fillStyle = 'rgba(3,2,1,0.28)'
      ctx.fillRect(0, 0, W, H)

      for (const p of pts) {
        if (mode === 'idle' || !p.hasTarget) {
          // Organic Lissajous drift across the full canvas
          p.x += Math.sin(t * 0.007 * p.speed + p.phase) * 0.35
          p.y += Math.cos(t * 0.0055 * p.speed + p.phase * 0.8) * 0.28
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
          if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        } else {
          // Spring physics toward target
          const dx = p.tx - p.x, dy = p.ty - p.y
          p.vx += dx * 0.09; p.vy += dy * 0.09
          p.vx *= 0.70;       p.vy *= 0.70
          p.x += p.vx;        p.y += p.vy
        }

        // Depth-based size + brightness modulation (3D illusion)
        const depthScale  = 1 + p.depth * 0.32
        const renderR     = Math.max(0.5, p.r * depthScale)
        const glowR       = renderR * (mode === 'idle' ? 3.5 : 5.5)
        const depthAlpha  = p.alpha * (0.65 + p.depth * 0.35)
        const baseAlpha   = mode === 'idle' ? depthAlpha * 0.55 : depthAlpha

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR)
        g.addColorStop(0,   `hsla(${p.hue},${p.sat}%,${p.lit}%,${baseAlpha})`)
        g.addColorStop(0.4, `hsla(${p.hue},${p.sat}%,${p.lit * 0.8}%,${baseAlpha * 0.5})`)
        g.addColorStop(1,   `hsla(${p.hue},${p.sat}%,${p.lit}%,0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [active])

  const buildShape = (word) => {
    if (!word.trim()) return
    const W = window.innerWidth, H = window.innerHeight
    const { lit, isMirage } = rasterize(word)
    if (lit.length === 0) return

    const shapeSize = Math.min(W, H) * 0.58
    const ox = (W - shapeSize) / 2
    const oy = (H - shapeSize) / 2

    particleRef.current.forEach((p, i) => {
      if (i < lit.length) {
        const lp = lit[i % lit.length]
        // Slight depth noise per particle — creates the 3D surface illusion
        const dz = (lp.nx - 0.5) * (lp.ny - 0.5) * 4   // curved surface
        p.depth  = dz + (Math.random() - 0.5) * 0.4
        p.tx = ox + lp.nx * shapeSize + p.depth * 6      // parallax offset
        p.ty = oy + lp.ny * shapeSize + p.depth * 3
        p.hasTarget = true
        p.alpha  = 0.45 + lp.bright * 0.55
        p.r      = 0.8 + lp.bright * 1.8 + p.depth * 0.4

        if (isMirage) {
          p.hue = 36 + Math.random() * 8;  p.sat = 85;  p.lit = 58 + Math.random() * 18
        } else {
          // Keep gold tones, vary lightness by pixel brightness
          p.hue = 32 + Math.random() * 18;  p.sat = 60 + Math.random() * 30
          p.lit = 40 + lp.bright * 38
        }
      } else {
        // Excess particles scatter to periphery
        const angle = Math.random() * Math.PI * 2
        const dist  = W * 0.5 + Math.random() * W * 0.2
        p.tx = W / 2 + Math.cos(angle) * dist
        p.ty = H / 2 + Math.sin(angle) * dist
        p.hasTarget = true;  p.alpha = 0.04
      }
    })

    modeRef.current = 'forming'
  }

  const resetParticles = () => {
    const W = window.innerWidth, H = window.innerHeight
    particleRef.current.forEach(p => {
      p.hasTarget = false
      p.hue = 34 + Math.random() * 14;  p.sat = 55 + Math.random() * 35
      p.lit = 48 + Math.random() * 22;  p.alpha = 0.08 + Math.random() * 0.3
      p.depth = (Math.random() - 0.5) * 2
    })
    modeRef.current = 'idle'
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'Enter') { buildShape(e.target.value); return }
    // Reset if they clear the input
    if (modeRef.current !== 'idle' && e.target.value.length <= 1) resetParticles()
  }

  if (!active) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10001, background: '#030201', cursor: 'crosshair' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />

      {/* Input — floats at top center */}
      <div style={{
        position: 'absolute', top: '3.5rem', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
        zIndex: 2,
      }}>
        <input
          ref={inputRef}
          placeholder="type anything"
          autoComplete="off"
          spellCheck="false"
          onKeyDown={handleKey}
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '1.5rem', fontWeight: 300,
            background: 'transparent',
            border: 'none', borderBottom: '1px solid rgba(185,140,55,0.35)',
            color: 'rgba(240,234,214,0.8)',
            outline: 'none', padding: '0.4rem 0.5rem',
            width: '20ch', textAlign: 'center',
            letterSpacing: '0.08em',
            caretColor: 'rgba(185,140,55,0.7)',
          }}
        />
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 8,
          color: 'rgba(240,234,214,0.14)', letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          enter to form · esc to close · try "mirage"
        </div>
      </div>

      {/* Reset hint — appears after a shape is built */}
      <div
        onClick={resetParticles}
        style={{
          position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 8,
          color: 'rgba(240,234,214,0.1)', letterSpacing: '0.2em', textTransform: 'uppercase',
          cursor: 'pointer', zIndex: 2, transition: 'color 0.3s',
        }}
        onMouseEnter={e => { e.target.style.color = 'rgba(240,234,214,0.35)' }}
        onMouseLeave={e => { e.target.style.color = 'rgba(240,234,214,0.1)' }}
      >
        reset
      </div>
    </div>
  )
}
