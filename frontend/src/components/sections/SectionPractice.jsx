import { motion } from 'framer-motion'

export default function SectionPractice({ data, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 6vw', height: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 24 }}
        transition={{ duration: 1.0, ease: [0.16,1,0.3,1] }}
        style={{ maxWidth: '600px', textAlign: 'right' }}
      >
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(185,140,55,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {data.label} — Practice
        </div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.5rem, 6vw, 6rem)', fontWeight: 300, lineHeight: 1.0, color: 'rgba(240,230,210,0.92)', letterSpacing: '-0.02em', marginBottom: '1.5rem', whiteSpace: 'pre-line', textShadow: '0 2px 60px rgba(3,2,1,0.9)' }}>
          {data.headline}
        </h2>
        <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '1rem', color: 'rgba(240,234,214,0.45)', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: '44ch', marginLeft: 'auto' }}>
          {data.body}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          {data.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: active ? 1 : 0, x: active ? 0 : 8 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
            >
              <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: 'rgba(240,234,214,0.65)' }}>{item.name}</span>
              <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.8rem', color: 'rgba(240,234,214,0.25)', marginLeft: '0.75rem' }}>{item.desc}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
