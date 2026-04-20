import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MOCK_BRIEF } from '../../data/content'

const FALLBACKS = [
  {
    headline: "Precision at the Edge of the Known",
    mandate: "Build for the moment when the familiar gives way to something that hasn't been named yet.",
    visualDirection: ["Dark ground with surfaces that emerge", "Typography at scale", "Color as temperature — ochre against black"],
    recommendedService: "App Development"
  },
  {
    headline: "The Space Between What Exists and What's Needed",
    mandate: "Every organization has a gap. This brief lives in that gap.",
    visualDirection: ["Interface as landscape", "Data that speaks plainly", "Restraint as a design principle"],
    recommendedService: "AI Consulting"
  },
]

export default function SectionBrief({ data, active }) {
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState('idle')
  const [brief, setBrief] = useState(null)

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()
    if (!prompt.trim()) return
    setStatus('loading')
    try {
      if (import.meta.env.DEV) {
        await new Promise(r => setTimeout(r, 1500))
        setBrief(MOCK_BRIEF)
        setStatus('complete')
        return
      }
      const res = await fetch('/api/mirage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, concept: 'brief-machine' })
      })
      setBrief(await res.json())
      setStatus('complete')
    } catch {
      setBrief(FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)])
      setStatus('complete')
    }
  }, [prompt])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6vw', height: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 24 }}
        transition={{ duration: 1.0, ease: [0.16,1,0.3,1] }}
        style={{ width: '100%', maxWidth: '560px', textAlign: 'center' }}
      >
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(160,184,204,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {data.label} — Brief Machine
        </div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.5rem, 5vw, 5rem)', fontWeight: 300, lineHeight: 1.0, color: 'rgba(240,230,210,0.88)', letterSpacing: '-0.02em', marginBottom: '1.5rem', whiteSpace: 'pre-line', textShadow: '0 2px 60px rgba(3,2,1,0.9)' }}>
          {data.headline}
        </h2>
        <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', color: 'rgba(240,234,214,0.35)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
          {data.body}
        </p>

        {status === 'idle' && (
          <form onSubmit={handleSubmit}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit() }}
              placeholder="Describe what you're trying to build..."
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(240,234,214,0.03)',
                border: 'none',
                borderBottom: '1px solid rgba(240,234,214,0.12)',
                color: 'rgba(240,234,214,0.85)',
                fontFamily: '"Inter", sans-serif',
                fontSize: '1rem',
                padding: '1rem 0',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.7,
                marginBottom: '1.5rem',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderBottomColor = 'rgba(185,140,55,0.5)' }}
              onBlur={e => { e.target.style.borderBottomColor = 'rgba(240,234,214,0.12)' }}
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '10px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '0.75rem 2rem',
                background: 'transparent',
                color: 'rgba(185,140,55,0.7)',
                border: '1px solid rgba(185,140,55,0.3)',
                cursor: prompt.trim() ? 'pointer' : 'default',
                opacity: prompt.trim() ? 1 : 0.35,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (prompt.trim()) {
                  e.target.style.background = 'rgba(185,140,55,0.1)'
                  e.target.style.borderColor = 'rgba(185,140,55,0.6)'
                }
              }}
              onMouseLeave={e => {
                e.target.style.background = 'transparent'
                e.target.style.borderColor = 'rgba(185,140,55,0.3)'
              }}
            >
              Generate Brief
            </button>
          </form>
        )}

        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', fontStyle: 'italic', color: 'rgba(240,234,214,0.3)' }}
          >
            Writing your brief...
          </motion.div>
        )}

        {status === 'complete' && brief && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'left' }}
          >
            <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 400, color: 'rgba(240,234,214,0.9)', marginBottom: '1rem', lineHeight: 1.2 }}>
              {brief.headline}
            </h3>
            <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.9rem', color: 'rgba(240,234,214,0.5)', lineHeight: 1.75, marginBottom: '1.25rem' }}>
              {brief.mandate}
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              {brief.visualDirection?.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.4rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgba(185,140,55,0.45)', fontSize: '0.7rem', marginTop: '0.15rem', flexShrink: 0 }}>—</span>
                  <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.825rem', color: 'rgba(240,234,214,0.4)', lineHeight: 1.6 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setStatus('idle'); setBrief(null); setPrompt('') }}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '0.65rem 1.25rem',
                  background: 'transparent',
                  color: 'rgba(240,234,214,0.3)',
                  border: '1px solid rgba(240,234,214,0.1)',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <a
                href="mailto:hello@miragestudios.io"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '0.65rem 1.25rem',
                  background: 'rgba(185,140,55,0.12)',
                  color: 'rgba(185,140,55,0.8)',
                  border: '1px solid rgba(185,140,55,0.25)',
                  textDecoration: 'none',
                }}
              >
                Build This
              </a>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
