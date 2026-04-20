import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bgMain:       '#F8F9FB',
  sidebar:      '#FFFFFF',
  card:         '#FFFFFF',
  border:       '#E8ECF0',
  textPrimary:  '#111827',
  textSecondary:'#6B7280',
  textMuted:    '#9CA3AF',
  red:          '#E31837',
  redLight:     '#FEE2E2',
  tagBg:        '#F1F5F9',
  tagText:      '#475569',
}

// ── Font loader ──────────────────────────────────────────────────────────────
function useDamFonts() {
  useEffect(() => {
    const id = 'dam-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])
}

// ── Asset data ───────────────────────────────────────────────────────────────
const ASSETS = [
  { id: 1,  name: 'Olympic_Venue_Hero_v3.jpg',    type: 'IMAGE', gradientA: '#1E3A5F', gradientB: '#2D6A9F', tags: ['Olympic','Press'],            size: '4.2 MB' },
  { id: 2,  name: 'Visit_SLC_Brand_Reel_2025.mp4',type: 'VIDEO', gradientA: '#1A1A2E', gradientB: '#4A1942', tags: ['Campaign','Brand'],           size: '128 MB' },
  { id: 3,  name: 'Press_Kit_2025.pdf',            type: 'PDF',   gradientA: '#1F2937', gradientB: '#374151', tags: ['Press'],                      size: '2.1 MB' },
  { id: 4,  name: 'Convention_Center_Aerial.jpg',  type: 'IMAGE', gradientA: '#064E3B', gradientB: '#065F46', tags: ['Events','Campaign'],          size: '6.8 MB' },
  { id: 5,  name: 'Olympic_Logo_Usage_Guide.pdf',  type: 'PDF',   gradientA: '#78350F', gradientB: '#92400E', tags: ['Olympic','Brand'],            size: '1.4 MB' },
  { id: 6,  name: 'Snowbird_Resort_Hero.jpg',      type: 'IMAGE', gradientA: '#1E1B4B', gradientB: '#312E81', tags: ['Outdoor'],                   size: '5.1 MB' },
  { id: 7,  name: 'SLC_Skyline_Drone_4K.mp4',      type: 'VIDEO', gradientA: '#164E63', gradientB: '#0E7490', tags: ['Campaign','Press'],           size: '245 MB' },
  { id: 8,  name: 'FoodScene_Photo_Series.jpg',    type: 'IMAGE', gradientA: '#3F1F00', gradientB: '#78350F', tags: ['F&B','Campaign'],             size: '3.9 MB' },
  { id: 9,  name: 'Partner_Logos_2025.zip',        type: 'OTHER', gradientA: '#374151', gradientB: '#4B5563', tags: ['Brand'],                      size: '8.2 MB' },
  { id: 10, name: 'Jazz_Game_Activation_1.jpg',    type: 'IMAGE', gradientA: '#312E81', gradientB: '#4338CA', tags: ['Events'],                    size: '4.7 MB' },
  { id: 11, name: 'Outdoor_Recreation_Kit.pdf',    type: 'PDF',   gradientA: '#1F3340', gradientB: '#1E4D62', tags: ['Outdoor'],                   size: '3.3 MB' },
  { id: 12, name: 'Brand_Colors_Pantone.pdf',      type: 'PDF',   gradientA: '#4C1D1D', gradientB: '#7F1D1D', tags: ['Brand'],                     size: '0.9 MB' },
]

const NAV_ITEMS = [
  { id: 'assets',    label: 'All Assets',  icon: '⊞' },
  { id: 'images',    label: 'Images',      icon: '🖼' },
  { id: 'videos',    label: 'Videos',      icon: '▶' },
  { id: 'documents', label: 'Documents',   icon: '📄' },
  { id: 'brand',     label: 'Brand Kit',   icon: '★' },
  { id: 'archived',  label: 'Archived',    icon: '⊘' },
]

const ALL_TAGS = ['Campaign','Olympic','Outdoor','F&B','Events','Press']

const DIMENSIONS = {
  IMAGE: '4200 × 2800 px',
  VIDEO: '3840 × 2160 · 0:32',
  PDF:   '11 × 8.5 in',
  OTHER: '—',
}
const FORMATS = {
  IMAGE: 'JPEG',
  VIDEO: 'MP4',
  PDF:   'PDF',
  OTHER: 'ZIP',
}

// ── Asset Tile ───────────────────────────────────────────────────────────────
function AssetTile({ asset, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => onClick(asset)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        borderRadius: 10,
        border: `1px solid ${hovered ? '#CBD5E1' : C.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 130,
          background: `linear-gradient(135deg, ${asset.gradientA}, ${asset.gradientB})`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Type badge */}
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'rgba(0,0,0,0.45)',
          color: '#fff',
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          {asset.type}
        </div>

        {/* Center icon */}
        {asset.type === 'VIDEO' && (
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
          }}>▶</div>
        )}
        {asset.type === 'PDF' && (
          <span style={{ fontSize: 28 }}>📄</span>
        )}
        {asset.type === 'OTHER' && (
          <span style={{ fontSize: 26, opacity: 0.7, color: '#fff' }}>⊡</span>
        )}

        {/* Hover overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }}>
          <button style={{
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            color: C.textPrimary,
          }}>View</button>
          <button style={{
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            color: C.textPrimary,
          }}>Download</button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 500,
          color: C.textPrimary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {asset.name}
        </div>
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
          {asset.size}
        </div>
      </div>
    </div>
  )
}

// ── Asset Grid View ──────────────────────────────────────────────────────────
function AssetGrid({ navSection, activeFilters, onSelectAsset, viewMode, searchQuery }) {
  const navLabels = {
    assets:    'All Assets',
    images:    'Images',
    videos:    'Videos',
    documents: 'Documents',
    brand:     'Brand Kit',
    archived:  'Archived',
  }

  const filtered = ASSETS.filter(a => {
    const matchesSearch = searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilters.length === 0 || activeFilters.some(f => a.tags.includes(f))
    return matchesSearch && matchesFilter
  })

  return (
    <motion.div
      key="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ flex: 1, overflow: 'auto', padding: 20, fontFamily: 'Inter, sans-serif' }}
    >
      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>
          {navLabels[navSection]}
        </span>
        <span style={{ fontSize: 12, color: C.textMuted }}>124 assets</span>
      </div>

      {viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {filtered.map(asset => (
            <AssetTile key={asset.id} asset={asset} onClick={onSelectAsset} />
          ))}
        </div>
      ) : (
        /* List view */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(asset => (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '10px 14px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'box-shadow 0.15s',
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: `linear-gradient(135deg, ${asset.gradientA}, ${asset.gradientB})`,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
              }}>
                {asset.type === 'VIDEO' && <span style={{ color: '#fff' }}>▶</span>}
                {asset.type === 'PDF' && '📄'}
                {asset.type === 'IMAGE' && <span style={{ color: '#fff', fontSize: 11 }}>🖼</span>}
                {asset.type === 'OTHER' && <span style={{ color: '#fff', fontSize: 11 }}>⊡</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {asset.name}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{asset.size}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {asset.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 9,
                    fontWeight: 500,
                    background: C.tagBg,
                    color: C.tagText,
                    padding: '2px 7px',
                    borderRadius: 20,
                  }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, flexShrink: 0, width: 48, textAlign: 'right' }}>
                {FORMATS[asset.type]}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── Asset Detail View ────────────────────────────────────────────────────────
function AssetDetail({ asset, onBack, allAssets }) {
  const related = allAssets.filter(a => a.id !== asset.id).slice(0, 3)

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ flex: 1, display: 'flex', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Left preview pane */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, background: C.bgMain }}>
        {/* Back */}
        <div
          onClick={onBack}
          style={{ fontSize: 12, color: C.textSecondary, cursor: 'pointer', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          ← Assets
        </div>

        {/* Preview */}
        <div style={{
          borderRadius: 12,
          overflow: 'hidden',
          height: 360,
          background: `linear-gradient(135deg, ${asset.gradientA}, ${asset.gradientB})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 10,
        }}>
          {asset.type === 'VIDEO' && (
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 24,
            }}>▶</div>
          )}
          {asset.type === 'PDF' && (
            <>
              <span style={{ fontSize: 48 }}>📄</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>PDF Document</span>
            </>
          )}
          {asset.type === 'IMAGE' && (
            <span style={{ fontSize: 42, opacity: 0.6 }}>🖼</span>
          )}
          {asset.type === 'OTHER' && (
            <span style={{ fontSize: 42, color: 'rgba(255,255,255,0.5)' }}>⊡</span>
          )}
        </div>

        {/* Tags */}
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {asset.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: 20,
              background: 'rgba(227,24,55,0.10)',
              color: C.red,
            }}>{tag}</span>
          ))}
        </div>

        {/* Related Assets */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Related Assets
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {related.map(r => (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 80 }}>
                <div style={{
                  width: 80,
                  height: 60,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${r.gradientA}, ${r.gradientB})`,
                  cursor: 'pointer',
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                  flexShrink: 0,
                }} />
                <div style={{
                  fontSize: 10,
                  color: C.textMuted,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 80,
                }}>{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right metadata panel */}
      <div style={{
        width: 300,
        flexShrink: 0,
        background: '#fff',
        borderLeft: `1px solid ${C.border}`,
        overflow: 'auto',
        padding: 20,
      }}>
        {/* Asset name */}
        <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.35, wordBreak: 'break-word' }}>
          {asset.name}
        </div>

        {/* Type badge */}
        <div style={{ marginTop: 4 }}>
          <span style={{
            background: C.redLight,
            color: C.red,
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '2px 7px',
            borderRadius: 4,
          }}>{asset.type}</span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, marginBottom: 14 }} />

        {/* Metadata rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Format',      value: FORMATS[asset.type] },
            { label: 'File Size',   value: asset.size },
            { label: 'Dimensions',  value: DIMENSIONS[asset.type] },
            { label: 'Uploaded',    value: 'Apr 11, 2025' },
          ].map(row => (
            <div key={row.label}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {row.label}
              </div>
              <div style={{ fontSize: 12, color: C.textPrimary, marginTop: 2 }}>{row.value}</div>
            </div>
          ))}
          {/* Uploaded by */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Uploaded By
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'rgba(227,24,55,0.15)',
                color: C.red,
                fontSize: 9,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>SC</div>
              <span style={{ fontSize: 12, color: C.textPrimary }}>Sarah Chen, Marketing</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, marginBottom: 14 }} />

        {/* Usage Rights */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Usage Rights
          </div>
          <div style={{ marginTop: 6 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              background: '#DCFCE7',
              color: '#16A34A',
              padding: '3px 10px',
              borderRadius: 20,
            }}>Internal + Press</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, marginBottom: 4 }} />

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          <button style={{
            background: C.red,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: 9,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'Inter, sans-serif',
          }}>↓ Download</button>
          <button style={{
            background: '#fff',
            color: C.textSecondary,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 9,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'Inter, sans-serif',
          }}>⎘ Copy Link</button>
          <button style={{
            background: '#fff',
            color: C.textSecondary,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 9,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'Inter, sans-serif',
          }}>＋ Add to Collection</button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function TheDamDemo() {
  useDamFonts()

  const [navSection, setNavSection]     = useState('assets')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [activeFilters, setActiveFilters] = useState([])
  const [viewMode, setViewMode]         = useState('grid')
  const [searchQuery, setSearchQuery]   = useState('')
  const [hoveredNav, setHoveredNav]     = useState(null)

  function toggleFilter(tag) {
    setActiveFilters(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      background: C.bgMain,
    }}>

      {/* ── Left Sidebar ── */}
      <div style={{
        width: 200,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}>

        {/* Logo area */}
        <div style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: C.red,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}>D</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>The Dam</span>
        </div>

        {/* Nav items */}
        <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = navSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setNavSection(item.id); setSelectedAsset(null) }}
                onMouseEnter={() => setHoveredNav(item.id)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 7,
                  border: 'none',
                  background: isActive
                    ? C.redLight
                    : hoveredNav === item.id
                      ? C.bgMain
                      : 'transparent',
                  color: isActive ? C.red : C.textSecondary,
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Filters section */}
        <div style={{
          marginTop: 8,
          borderTop: `1px solid ${C.border}`,
          paddingTop: 0,
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.textMuted,
            padding: '8px 10px 4px',
          }}>Filters</div>

          <div style={{
            fontSize: 10,
            color: C.textMuted,
            padding: '2px 10px',
          }}>By Tag</div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            padding: '4px 8px 8px',
          }}>
            {ALL_TAGS.map(tag => {
              const isActive = activeFilters.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleFilter(tag)}
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 20,
                    border: `1px solid ${isActive ? C.red : C.border}`,
                    background: isActive ? C.red : '#fff',
                    color: isActive ? '#fff' : C.tagText,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          height: 52,
          background: '#fff',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            style={{
              flex: 1,
              maxWidth: 320,
              background: C.tagBg,
              border: '1px solid transparent',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              color: C.textPrimary,
              outline: 'none',
            }}
          />

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { mode: 'grid', icon: '⊞' },
              { mode: 'list', icon: '≡' },
            ].map(v => (
              <button
                key={v.mode}
                onClick={() => setViewMode(v.mode)}
                style={{
                  width: 30,
                  height: 30,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  background: viewMode === v.mode ? C.tagBg : '#fff',
                  cursor: 'pointer',
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.textSecondary,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {v.icon}
              </button>
            ))}
          </div>

          {/* Upload button */}
          <button style={{
            background: C.red,
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>
            ↑ Upload
          </button>
        </div>

        {/* Content area — grid or detail */}
        <AnimatePresence mode="wait">
          {selectedAsset ? (
            <AssetDetail
              key={`detail-${selectedAsset.id}`}
              asset={selectedAsset}
              onBack={() => setSelectedAsset(null)}
              allAssets={ASSETS}
            />
          ) : (
            <AssetGrid
              key="grid-view"
              navSection={navSection}
              activeFilters={activeFilters}
              onSelectAsset={setSelectedAsset}
              viewMode={viewMode}
              searchQuery={searchQuery}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
