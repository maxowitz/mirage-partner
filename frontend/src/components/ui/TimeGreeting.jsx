import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function getGreeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Open-Meteo: free, no API key, CORS-friendly
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return {
    temp: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
  }
}

// WMO weather interpretation codes → minimal label
function weatherLabel(code) {
  if (code === 0)            return 'clear'
  if (code <= 2)             return 'partly cloudy'
  if (code === 3)            return 'overcast'
  if (code <= 48)            return 'foggy'
  if (code <= 57)            return 'drizzle'
  if (code <= 67)            return 'rain'
  if (code <= 77)            return 'snow'
  if (code <= 82)            return 'showers'
  if (code <= 86)            return 'snow showers'
  if (code <= 99)            return 'thunderstorm'
  return null
}

export default function TimeGreeting() {
  const [text, setText] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    const greeting = getGreeting(hour)

    // Start with time-only greeting immediately
    setText(greeting)
    const t = setTimeout(() => setVisible(true), 800)

    // Try to enrich with weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const wx = await fetchWeather(coords.latitude, coords.longitude)
            if (wx) {
              const label = weatherLabel(wx.code)
              const detail = label ? `${wx.temp}° · ${label}` : `${wx.temp}°`
              setText(`${greeting} · ${detail}`)
            }
          } catch {
            // silently fall back to greeting-only
          }
        },
        () => { /* location denied — greeting-only is fine */ },
        { timeout: 5000, maximumAge: 600000 }
      )
    }

    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(185,140,55,0.45)',
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </motion.div>
  )
}
