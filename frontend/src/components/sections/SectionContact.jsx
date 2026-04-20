import { motion } from 'framer-motion'

export default function SectionContact({ data, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6vw', height: '100%', flexDirection: 'column', gap: '1rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 24 }}
        transition={{ duration: 1.2, ease: [0.16,1,0.3,1] }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,234,214,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2rem' }}>
          {data.label} — Contact
        </div>
        <a
          href="mailto:hello@miragestudios.io"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 'clamp(2rem, 5vw, 5rem)',
            fontWeight: 300,
            color: 'rgba(240,234,214,0.88)',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            display: 'block',
            marginBottom: '2rem',
            transition: 'color 0.3s',
          }}
          onMouseEnter={e => { e.target.style.color = 'rgba(185,140,55,0.9)' }}
          onMouseLeave={e => { e.target.style.color = 'rgba(240,234,214,0.88)' }}
        >
          hello@miragestudios.io
        </a>
        <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.9rem', color: 'rgba(240,234,214,0.3)', lineHeight: 1.8, maxWidth: '36ch', margin: '0 auto 2.5rem' }}>
          {data.body}
        </p>

        {/* Desert Trip Productions — the production arm */}
        <div style={{ borderTop: '1px solid rgba(240,234,214,0.07)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '8px', color: 'rgba(240,234,214,0.18)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            When it needs to move on film —
          </span>
          <a
            href="https://deserttripproductions.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '8px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(185,140,55,0.55)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(185,140,55,0.2)',
              paddingBottom: '1px',
              transition: 'color 0.3s, border-color 0.3s',
            }}
            onMouseEnter={e => { e.target.style.color = 'rgba(185,140,55,0.9)'; e.target.style.borderBottomColor = 'rgba(185,140,55,0.5)' }}
            onMouseLeave={e => { e.target.style.color = 'rgba(185,140,55,0.55)'; e.target.style.borderBottomColor = 'rgba(185,140,55,0.2)' }}
          >
            Desert Trip Productions ↗
          </a>
        </div>
      </motion.div>
    </div>
  )
}
