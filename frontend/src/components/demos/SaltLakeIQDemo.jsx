import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bgPrimary:       '#0A0F1E',
  bgSecondary:     '#0d1526',
  surface:         'rgba(255,255,255,0.04)',
  surfaceElevated: 'rgba(255,255,255,0.07)',
  border:          'rgba(255,255,255,0.08)',
  textPrimary:     '#F1F5F9',
  textSecondary:   '#94A3B8',
  textMuted:       '#64748B',
  textFaint:       '#475569',
  red:    '#A41E22',
  teal:   '#00D4FF',
  gold:   '#FBBF24',
  green:  '#34D399',
  coral:  '#FF6B47',
  purple: '#A78BFA',
  blue:   '#60A5FA',
}

const GLASS = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
}

// ── Font loader ──────────────────────────────────────────────────────────────
function useDemoFonts() {
  useEffect(() => {
    const id = 'saltlakeiq-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@400;600&display=swap'
    document.head.appendChild(link)
  }, [])
}

// ── Fake data ────────────────────────────────────────────────────────────────
const KPI_CARDS = [
  { label: 'Coverage This Month',   value: '847',   unit: 'pieces', delta: '+23%',   positive: true,  color: C.teal   },
  { label: 'Positive Sentiment',    value: '72%',   unit: '',       delta: '+4 pts',  positive: true,  color: C.green  },
  { label: 'Outlet Reach',          value: '2.4M',  unit: 'readers',delta: '+18%',   positive: true,  color: C.purple },
  { label: '2034 Olympic Coverage', value: '34%',   unit: 'share',  delta: '+8 pts',  positive: true,  color: C.gold   },
]

const NARRATIVES = [
  { name: '2034 Winter Olympics',   pct: 34, color: C.teal   },
  { name: 'Outdoor Adventure',      pct: 28, color: C.green  },
  { name: 'Food & Culture',         pct: 18, color: C.gold   },
  { name: 'Business & Conventions', pct: 12, color: C.purple },
  { name: 'Other',                  pct: 8,  color: C.textFaint },
]

const COVERAGE_ARTICLES = [
  { outlet: 'The New York Times',    headline: "Salt Lake City Emerges as Mountain West's Cultural Vanguard",            sentiment: 'positive', date: 'Apr 16' },
  { outlet: 'Outside Magazine',      headline: 'The 10 Best Outdoor Destinations in America — SLC Ranks #3',            sentiment: 'positive', date: 'Apr 15' },
  { outlet: 'Bloomberg',             headline: "How the 2034 Winter Olympics Is Already Reshaping Salt Lake's Economy",  sentiment: 'positive', date: 'Apr 14' },
  { outlet: 'The Salt Lake Tribune', headline: 'Convention Center Expansion Could Bring 80K New Visitors by 2026',       sentiment: 'neutral',  date: 'Apr 13' },
  { outlet: 'Travel + Leisure',      headline: 'Forget Denver: Salt Lake City Is the Mountain Town You Should Visit',    sentiment: 'positive', date: 'Apr 12' },
  { outlet: 'Skift',                 headline: "DMO Strategy Review: Visit Salt Lake's Earned Media Playbook",           sentiment: 'neutral',  date: 'Apr 11' },
  { outlet: 'USA Today',             headline: "Utah's Capital Makes a Play for Year-Round Tourism",                     sentiment: 'positive', date: 'Apr 10' },
]

const BRIEF_TEXT = `Coverage is tracking at its strongest month yet — 847 pieces through April 16th, up 23% vs. March. The 2034 Olympics narrative is driving outsized amplification: three placements in national tier-1 outlets this week alone, including a Bloomberg feature that generated 42 downstream pickups.

Sentiment is holding at 72% positive, with one watch area: a Tribune editorial on convention center noise concerns is neutral but gaining local traction. No tier-1 negative coverage this cycle.

Top opportunity: Outside Magazine's #3 ranking is generating inbound pitch interest from 6 travel writers. Recommend coordinating a press trip in May.`

// ── AI responses ─────────────────────────────────────────────────────────────
const CATEGORY_META = {
  coverage_count:         { label: 'Coverage Volume',  color: C.teal   },
  sentiment_distribution: { label: 'Sentiment',        color: C.gold   },
  narrative_share:        { label: 'Narrative Share',  color: C.green  },
  outlet_top:             { label: 'Top Outlets',      color: C.purple },
  goal_attainment:        { label: 'Goal Attainment',  color: C.coral  },
}

const AI_RESPONSES = [
  {
    triggers: ['coverage', 'last 30', '30 days', 'this month', 'how much', 'how many'],
    category: 'coverage_count',
    sources: [{ table: 'pr_articles', window: 'Apr 1–16' }, { table: 'outlet_reach', window: 'rolling 30d' }],
    answer: `847 pieces of coverage in the last 30 days — your strongest month on record.\n\nBreakdown by tier:\n• Tier 1 (national): 38 pieces  (+61% MoM)\n• Tier 2 (regional / trade): 214 pieces\n• Tier 3 (local / blog): 595 pieces\n\nThe Bloomberg 2034 Olympics feature (Apr 14) drove 42 downstream syndications — that single article accounts for ~5% of total piece count.`,
  },
  {
    triggers: ['sentiment', 'tone', 'negative', 'positive', 'breakdown'],
    category: 'sentiment_distribution',
    sources: [{ table: 'article_sentiment', window: 'Apr 1–16' }, { table: 'outlet_sentiment' }],
    answer: `Sentiment sits at 72% positive, 21% neutral, 7% negative.\n\nPositive drivers: Olympics coverage, outdoor rankings, food & culture features.\n\nWatch area: The Salt Lake Tribune ran a neutral-to-slightly-critical editorial on April 13th about convention center expansion noise. It's circulating locally but hasn't broken to regional tier yet.\n\nYear-over-year, positive sentiment is up 9 percentage points — driven primarily by the Olympics announcement.`,
  },
  {
    triggers: ['narrative', 'share of voice', 'share-of-voice', 'olympics', '2034'],
    category: 'narrative_share',
    sources: [{ table: 'narrative_tags', window: 'Q2 2025' }, { table: 'article_topics' }],
    answer: `Narrative share this quarter:\n• 2034 Winter Olympics: 34%  (up from 18% in Q1)\n• Outdoor Adventure: 28%\n• Food & Culture: 18%\n• Business & Conventions: 12%\n• Other: 8%\n\nThe Olympics narrative has nearly doubled its share since the IOC confirmation in February. This is creating a halo effect — outdoor and culinary coverage is being framed through the Olympics lens, compounding reach.`,
  },
  {
    triggers: ['outlet', 'outlets', 'top', 'best', 'publication', 'who'],
    category: 'outlet_top',
    sources: [{ table: 'outlet_coverage', window: 'rolling 90d' }, { table: 'outlet_reach' }],
    answer: `Top 5 outlets by combined reach (rolling 90 days):\n\n1. The New York Times  — 3 placements, ~8.2M reach\n2. Bloomberg  — 2 placements, ~6.1M reach\n3. Outside Magazine  — 1 placement, ~4.8M reach\n4. Travel + Leisure  — 2 placements, ~3.9M reach\n5. USA Today  — 4 placements, ~3.2M reach\n\nNote: Outside's reach figure is organic — their newsletter amplified the ranking to 1.2M subscribers separately.`,
  },
  {
    triggers: ['goal', 'goals', '2026', 'tracking', 'target', 'on track', 'attainment'],
    category: 'goal_attainment',
    sources: [{ table: 'pr_goals_2026', window: 'YTD' }, { table: 'pr_articles', window: 'Jan–Apr 2025' }],
    answer: `2026 PR goal attainment (YTD through April):\n\n✓  Tier-1 placements: 38 of 120 target (32% — on pace)\n✓  Positive sentiment floor: 72% vs 70% target (ahead)\n⚠  Outlet diversity: 14 unique outlets vs 40 target (35% — needs attention)\n✓  Coverage volume: 847/mo vs 750/mo target (ahead)\n\nThe outlet diversity flag is the main risk. Coverage is concentrated in a few publications. Recommend expanding the outreach list for Q3.`,
  },
  {
    triggers: ['hello', 'hi', 'hey', 'what can you', 'help'],
    category: 'coverage_count',
    sources: [],
    answer: `I'm the SaltLakeIQ PR intelligence engine. I have live access to your full earned media dataset — every article, outlet, sentiment score, narrative tag, and goal milestone.\n\nAsk me about:\n• Coverage volume and trends\n• Sentiment distribution and shifts\n• Narrative share-of-voice\n• Top outlets and reach\n• Goal attainment vs targets`,
  },
]

const FALLBACK = {
  category: 'coverage_count',
  sources: [],
  answer: "I can answer questions about your earned media — coverage volume, sentiment, outlets, narrative share, and goal attainment. I won't forecast future coverage or compare to peer DMOs (those answers would be made up). Could you reframe around one of those areas?",
}

function getAIResponse(input) {
  const lower = input.toLowerCase()
  for (const r of AI_RESPONSES) {
    if (r.triggers.some(t => lower.includes(t))) return r
  }
  return FALLBACK
}

// ── Shared micro-components ──────────────────────────────────────────────────
function SentimentBadge({ sentiment }) {
  const map = { positive: C.green, neutral: C.gold, negative: C.coral }
  const color = map[sentiment] || C.textMuted
  return (
    <span style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: `${color}18`, color }}>
      {sentiment}
    </span>
  )
}

function SourcePill({ source }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: C.surfaceElevated, border: `1px solid ${C.border}`, fontSize: 10, color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ fontSize: 8 }}>◈</span>
      {[source.table, source.window].filter(Boolean).join(' · ')}
    </span>
  )
}

function CategoryPill({ category }) {
  const meta = CATEGORY_META[category]
  if (!meta) return null
  return (
    <span style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${meta.color}18`, color: meta.color }}>
      {meta.label}
    </span>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function DemoSidebar({ view, setView }) {
  const btn = (id, label, icon, activeColor = C.red) => {
    const active = view === id
    return (
      <button key={id} onClick={() => setView(id)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
        background: active ? `${activeColor}12` : 'transparent',
        color: active ? C.textPrimary : C.textMuted,
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, textAlign: 'left',
        transition: 'all 0.15s',
      }}>
        <span style={{ fontSize: 15, color: active ? activeColor : C.textMuted, lineHeight: 1 }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {id === 'ask' && active && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${C.teal}20`, color: C.teal }}>AI</span>
        )}
      </button>
    )
  }

  const group = (label, color, items) => (
    <div key={label} style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 3px' }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 7, color, fontWeight: 700 }}>■</span>
        </div>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted }}>
          {label}
        </span>
      </div>
      <div style={{ marginLeft: 10, borderLeft: `1px solid ${C.border}`, paddingLeft: 10 }}>
        {items.map(lbl => (
          <button key={lbl} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: 'transparent', color: C.textMuted, fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, textAlign: 'left',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = C.textSecondary }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted }}
          >
            <span style={{ fontSize: 10 }}>–</span>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ width: 220, flexShrink: 0, background: C.bgSecondary, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ padding: '13px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>V</span>
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, color: C.textPrimary, lineHeight: 1.2 }}>Visit Salt Lake</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: C.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>SaltLakeIQ</div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>VS</span>
        </div>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted }}>Visit Salt Lake Admin</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {btn('dashboard', 'Dashboard', '⊞', C.red)}
        {btn('ask', 'Ask SaltLakeIQ', '◎', C.teal)}

        <div style={{ height: 4 }} />

        {group('Destination Data',     C.blue,   ['Visitor Intelligence', 'Meetings & Conventions'])}
        {group('Goals & Performance',  C.gold,   ['Goals & Performance', 'Budget & ROI'])}
        {group('Content Intelligence', C.teal,   ['Content Intelligence', 'Trending', 'Hooks Analyzer'])}
        {group('PR & Sentiment',       C.green,  ['PR Intelligence', 'Sentiment Tracker', 'Press Outreach', 'Briefs'])}
        {group('Reports',              C.purple, ['Reports & Exports'])}
      </nav>

      {/* Footer */}
      <div style={{ padding: '8px 8px', borderTop: `1px solid ${C.border}` }}>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: C.textMuted, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
          ⚙ Settings
        </button>
      </div>
    </div>
  )
}

// ── Dashboard view ────────────────────────────────────────────────────────────
function DashboardView() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.bgPrimary, padding: '22px 26px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 22, color: C.textPrimary, margin: 0, lineHeight: 1.2 }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textMuted, margin: '4px 0 0' }}>
            Updated today at 8:02 AM MT · Apr 16, 2025 · Refreshes daily
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['↓ Export PDF', '↻ Refresh'].map(lbl => (
            <button key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: 'pointer' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {KPI_CARDS.map((kpi, i) => (
          <motion.div key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16,1,0.3,1] }}
            style={{ ...GLASS, padding: '16px 18px' }}
          >
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted, marginBottom: 8, fontWeight: 500 }}>{kpi.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: C.textPrimary, lineHeight: 1, marginBottom: 6 }}>
              {kpi.value}
              {kpi.unit && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textMuted, marginLeft: 5, fontWeight: 400 }}>{kpi.unit}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: kpi.positive ? C.green : C.coral }}>{kpi.delta}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.textFaint }}>vs last month</span>
            </div>
            <div style={{ marginTop: 10, height: 2, background: C.border, borderRadius: 2 }}>
              <div style={{ height: '100%', width: '70%', background: kpi.color, borderRadius: 2, opacity: 0.45 }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Brief + Narrative */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, marginBottom: 14 }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
          transition={{ delay: 0.32, duration: 0.45 }}
          style={{ ...GLASS, overflow: 'hidden' }}
        >
          <div style={{ padding: '11px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, background: C.surfaceElevated }}>
            <span style={{ color: C.teal, fontSize: 13 }}>◈</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: C.textPrimary }}>Today's Brief</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: `${C.teal}20`, color: C.teal, marginLeft: 4 }}>AI</span>
          </div>
          <div style={{ padding: '15px 18px' }}>
            {BRIEF_TEXT.split('\n\n').map((p, i) => (
              <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.textSecondary, lineHeight: 1.65, margin: i > 0 ? '10px 0 0' : 0 }}>
                {p}
              </p>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
          transition={{ delay: 0.40, duration: 0.45 }}
          style={{ ...GLASS, overflow: 'hidden' }}
        >
          <div style={{ padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceElevated }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: C.textPrimary }}>Narrative Share of Voice</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.textMuted, marginTop: 2 }}>Q2 2025 · 847 articles tagged</div>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            {NARRATIVES.map((n, i) => (
              <motion.div key={n.name}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -6 }}
                transition={{ delay: 0.46 + i * 0.06 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textSecondary }}>{n.name}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: n.color }}>{n.pct}%</span>
                </div>
                <div style={{ height: 4, background: C.border, borderRadius: 3 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${n.pct}%` }}
                    transition={{ delay: 0.50 + i * 0.06, duration: 0.5, ease: [0.16,1,0.3,1] }}
                    style={{ height: '100%', background: n.color, borderRadius: 3 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent coverage */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
        transition={{ delay: 0.48, duration: 0.45 }}
        style={{ ...GLASS, overflow: 'hidden' }}
      >
        <div style={{ padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: C.textPrimary }}>Recent Coverage</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted }}>847 pieces this month</span>
        </div>
        {COVERAGE_ARTICLES.map((a, i) => (
          <motion.div key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ delay: 0.52 + i * 0.04 }}
            style={{
              display: 'grid', gridTemplateColumns: '168px 1fr 90px 64px',
              alignItems: 'center', gap: 12, padding: '10px 16px',
              borderBottom: i < COVERAGE_ARTICLES.length - 1 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.outlet}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.headline}</span>
            <div><SentimentBadge sentiment={a.sentiment} /></div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textFaint, textAlign: 'right' }}>{a.date}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ── Ask view ──────────────────────────────────────────────────────────────────
const EXAMPLES = [
  { q: 'How much coverage did we get in the last 30 days?', category: 'Volume'     },
  { q: "What's our sentiment breakdown this month?",         category: 'Sentiment'  },
  { q: 'Who are our top outlets right now?',                 category: 'Outlets'    },
  { q: 'Show me the 2034 Olympics coverage trend',           category: 'Narratives' },
  { q: 'How are we tracking against our 2026 PR goals?',     category: 'Goals'      },
  { q: "What's our narrative share-of-voice this quarter?",  category: 'Narratives' },
]

function AskView() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading]   = useState(false)
  const [activeQ, setActiveQ]   = useState('')
  const [result, setResult]     = useState(null)
  const [history, setHistory]   = useState([])
  const inputRef  = useRef()
  const answerRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    if (result && answerRef.current) answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result])

  const submit = (q = question) => {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setQuestion('')
    setLoading(true)
    setResult(null)
    setActiveQ(trimmed)
    setTimeout(() => {
      setResult(getAIResponse(trimmed))
      setHistory(prev => [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, 6))
      setLoading(false)
    }, 500 + Math.random() * 700)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.bgPrimary, padding: '24px 28px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
            <span style={{ fontSize: 18, color: C.textMuted }}>◎</span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 22, color: C.textPrimary, margin: 0 }}>Ask SaltLakeIQ</h1>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
            Ask anything about your earned media — coverage volume, sentiment, top outlets, narrative share, goals. Every answer cites its source.
          </p>
        </div>

        {/* Input */}
        <div style={{ ...GLASS, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '4px 6px', marginBottom: 16, borderColor: 'rgba(255,255,255,0.12)' }}>
          <textarea
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="e.g. How much coverage did we get last month? What's our sentiment breakdown?"
            rows={2}
            disabled={loading}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.textPrimary, resize: 'none', lineHeight: 1.5, padding: '10px 12px', caretColor: C.red }}
          />
          <button onClick={() => submit()} disabled={!question.trim() || loading}
            style={{ flexShrink: 0, marginBottom: 6, marginRight: 2, width: 32, height: 32, borderRadius: 8, background: question.trim() && !loading ? C.red : 'rgba(164,30,34,0.25)', border: 'none', cursor: question.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, transition: 'all 0.2s' }}>
            {loading ? '…' : '→'}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && !loading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: C.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Recent</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {history.map((h, i) => (
                <button key={i} onClick={() => submit(h)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted, padding: '4px 10px', borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ↺ {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ ...GLASS, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y: [0,-4,0] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: C.red }} />
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.textPrimary }}>Thinking…</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted, marginTop: 2 }}>Classifying intent → querying data → narrating.</div>
            </div>
          </div>
        )}

        {/* Answer */}
        {!loading && result && (
          <motion.div ref={answerRef}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            style={{ ...GLASS, overflow: 'hidden', marginBottom: 16 }}
          >
            <div style={{ padding: '10px 16px', background: C.surfaceElevated, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.textFaint }}>◎</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeQ}</span>
              <CategoryPill category={result.category} />
            </div>
            <div style={{ padding: '16px 18px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.textPrimary, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{result.answer}</p>
            </div>
            {result.sources.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.textFaint }}>Sources:</span>
                {result.sources.map((s, i) => <SourcePill key={i} source={s} />)}
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.textFaint, marginLeft: 'auto' }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Idle state */}
        {!result && !loading && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: C.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Try asking</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {EXAMPLES.map(({ q, category }) => (
                  <button key={q} onClick={() => submit(q)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.red}44` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
                  >
                    <span style={{ fontSize: 13, color: C.textFaint, marginTop: 1 }}>›</span>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textSecondary, margin: '0 0 4px', lineHeight: 1.4 }}>{q}</p>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.textFaint }}>{category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...GLASS, padding: '14px 16px', marginTop: 8 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>What I can answer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 14px' }}>
                {[['A','Coverage volume & trends'],['B','Sentiment distribution'],['C','Narrative share-of-voice'],['D','Top outlets & articles'],['E','Goal attainment (2026)'],['F','Window-over-window comparisons']].map(([code, desc]) => (
                  <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: C.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: C.textFaint, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{code}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted }}>{desc}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.textFaint, margin: '10px 0 0', paddingTop: 10, borderTop: `1px solid ${C.border}`, lineHeight: 1.5 }}>
                I won't compare to peer DMOs, forecast future coverage, estimate AVE value, or attribute causation to outcomes — those answers would be made up.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SaltLakeIQDemo() {
  const [view, setView] = useState('dashboard')
  useDemoFonts()

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.bgPrimary }}>
      <DemoSidebar view={view} setView={setView} />
      <AnimatePresence mode="wait">
        <motion.div key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ flex: 1, overflow: 'hidden', display: 'flex' }}
        >
          {view === 'dashboard' && <DashboardView />}
          {view === 'ask'       && <AskView />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
