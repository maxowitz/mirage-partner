import { motion } from 'framer-motion'

export default function SectionLanding({ active }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'flex-end',
      padding: '0 6vw 8vh', height: '100%',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 22 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 'clamp(3.5rem, 8vw, 8rem)',
          fontWeight: 300,
          lineHeight: 1.0,
          color: 'rgba(240,230,210,0.92)',
          letterSpacing: '-0.025em',
          maxWidth: '16ch',
          margin: 0,
        }}>
          If you think<br />
          it&rsquo;s a mirage,
        </h1>
        <h1 style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 'clamp(3.5rem, 8vw, 8rem)',
          fontWeight: 300,
          lineHeight: 1.0,
          color: 'rgba(185,140,55,0.92)',
          fontStyle: 'italic',
          letterSpacing: '-0.025em',
          margin: '0.05em 0 0',
        }}>
          it isn&rsquo;t.
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ delay: 1.3, duration: 1.2 }}
        style={{
          marginTop: '2.5rem',
          maxWidth: '36ch',
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: '1rem',
          color: 'rgba(220,208,185,0.42)',
          lineHeight: 1.75,
        }}
      >
        We build exactly what you imagine.
        For anyone, at any scale. There is no ceiling.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ delay: 2.2, duration: 1 }}
        style={{
          marginTop: '3.5rem',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          color: 'rgba(220,208,185,0.2)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        scroll to enter
      </motion.div>
    </div>
  )
}
