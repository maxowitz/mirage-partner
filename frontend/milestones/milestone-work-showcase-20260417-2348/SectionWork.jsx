import { motion } from 'framer-motion'

export default function SectionWork({ data, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 6vw', height: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 24 }}
        transition={{ duration: 1.0, ease: [0.16,1,0.3,1] }}
        style={{ maxWidth: '680px' }}
      >
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(185,140,55,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {data.label} — Work
        </div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.5rem, 6vw, 6rem)', fontWeight: 300, lineHeight: 1.0, color: 'rgba(240,230,210,0.92)', letterSpacing: '-0.02em', marginBottom: '1.5rem', whiteSpace: 'pre-line', textShadow: '0 2px 60px rgba(3,2,1,0.9)' }}>
          {data.headline}
        </h2>
        <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '1rem', color: 'rgba(240,234,214,0.45)', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: '44ch' }}>
          {data.body}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 3rem' }}>
          {data.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: active ? 1 : 0, y: active ? 0 : 8 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
            >
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', fontWeight: 300, color: 'rgba(240,234,214,0.75)', marginBottom: '0.2rem' }}>{item.name}</div>
              <div style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.8rem', color: 'rgba(240,234,214,0.3)' }}>{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
