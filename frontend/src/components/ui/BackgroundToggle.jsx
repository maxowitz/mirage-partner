// Minimal background-mode selector — terrain (≋) or cloud (✦)
export default function BackgroundToggle({ mode, onChange }) {
  const gold  = 'rgba(185,140,55,0.92)'
  const dim   = 'rgba(240,230,210,0.14)'
  const btn   = {
    background: 'none', border: 'none', padding: 0,
    cursor: 'pointer', lineHeight: 1, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div style={{
      position: 'fixed', top: '1.75rem', right: '2rem',
      zIndex: 100, display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
      {/* Terrain icon */}
      <button
        onClick={() => onChange('terrain')}
        title="Terrain"
        style={{ ...btn, color: mode === 'terrain' ? gold : dim, transition: 'color 0.5s' }}
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
          <path d="M0 9 Q5 2 10 6 Q15 10 20 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M0 13 Q5 6 10 9 Q15 12 20 8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.45"/>
        </svg>
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 14, background: 'rgba(240,230,210,0.10)' }} />

      {/* Cloud / orb icon */}
      <button
        onClick={() => onChange('cloud')}
        title="Particle cloud"
        style={{ ...btn, color: mode === 'cloud' ? gold : dim, transition: 'color 0.5s', fontSize: '17px' }}
      >
        ✦
      </button>
    </div>
  )
}
