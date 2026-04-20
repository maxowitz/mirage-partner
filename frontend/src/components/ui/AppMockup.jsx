// CSS-based app UI mockups — each one built to feel like a distinct product

const S = {
  screen: { width: '100%', height: '100%', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: '"Inter", sans-serif' },
  bar: { height: 32, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 },
  row: { display: 'flex', gap: 8 },
  col: { display: 'flex', flexDirection: 'column', gap: 6 },
  card: { borderRadius: 4, padding: '8px 10px' },
  label: { fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.45 },
  val: { fontSize: 15, fontWeight: 600, lineHeight: 1.1 },
  sub: { fontSize: 7.5, opacity: 0.4, marginTop: 2 },
  dot: (c) => ({ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }),
}

function Bar({ bg, children }) {
  return <div style={{ ...S.bar, background: bg }}>{children}</div>
}

function MetricCard({ label, value, delta, bg, accent }) {
  return (
    <div style={{ ...S.card, background: bg, flex: 1 }}>
      <div style={S.label}>{label}</div>
      <div style={{ ...S.val, color: accent || '#fff' }}>{value}</div>
      {delta && <div style={{ ...S.sub, color: delta.startsWith('+') ? '#4caf7a' : '#e06c6c' }}>{delta}</div>}
    </div>
  )
}

// ── Analytics — SaltLakeIQ dashboard (blue, data-dense) ─────────────────────

export function AnalyticsScreen() {
  const bg = '#05101d', bg2 = '#081726', bg3 = '#0b2035', acc = '#3a8cc4'
  const bars = [55,62,48,70,65,80,75,88,78,92,85,94]
  return (
    <div style={{ ...S.screen, background: bg }}>
      {/* Accent stripe at top */}
      <div style={{ height: 2, background: `linear-gradient(to right, ${acc}00, ${acc}, ${acc}00)`, flexShrink: 0 }} />
      <Bar bg={bg2}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: acc, boxShadow: `0 0 6px ${acc}` }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: '#c8dff0', letterSpacing: '0.12em' }}>SALTLAKEIQ</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 7, background: `${acc}20`, color: `${acc}cc`, borderRadius: 3, padding: '2px 6px', border: `1px solid ${acc}30` }}>● LIVE</div>
      </Bar>
      <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={S.row}>
          <MetricCard label="Visitors YTD" value="2.4M" delta="+8.3%" bg={bg3} accent="#7ec8f0" />
          <MetricCard label="Avg Stay" value="3.2d" delta="+0.4d" bg={bg3} accent="#7ec8f0" />
          <MetricCard label="Occupancy" value="94%" delta="+2%" bg={bg3} accent="#4caf7a" />
          <MetricCard label="ADR" value="$218" delta="+$14" bg={bg3} accent="#4caf7a" />
        </div>
        <div style={{ ...S.row, flex: 1 }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ ...S.label, paddingLeft: 2 }}>Visitor Trend — 12mo</div>
            <div style={{ ...S.card, background: bg3, flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, padding: '6px 8px 4px' }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: i === bars.length - 1 ? acc : `${acc}55`, borderRadius: '2px 2px 0 0' }} />
              ))}
            </div>
          </div>
          <div style={{ flex: 1.3, background: bg3, borderRadius: 4, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={S.label}>AI Briefing</div>
            {['Q4 forward-booking up 23%', 'Peak window: March 14–21', 'Convention driving ADR spike'].map((t, i) => (
              <div key={i} style={{ fontSize: 7.5, color: 'rgba(170,210,240,0.65)', lineHeight: 1.4, borderLeft: `2px solid ${acc}40`, paddingLeft: 5 }}>{t}</div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', background: `${acc}15`, borderRadius: 3, padding: '4px 6px' }}>
              <div style={{ flex: 1, fontSize: 7, color: `${acc}70` }}>Ask anything...</div>
              <div style={{ fontSize: 9, color: acc }}>→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Chat — SaltLakeIQ AI interface (blue, conversational) ────────────────────

export function ChatScreen() {
  const bg = '#05101d', bg2 = '#081726', acc = '#3a8cc4'
  const msgs = [
    { user: true,  text: 'What drove the October spike in downtown occupancy?' },
    { user: false, text: 'Three factors: Silicon Slopes Summit (8,400 attendees), early ski-season activation, and a 14% jump in direct bookings from CA.' },
    { user: true,  text: 'Pull the YoY ADR comp for that window' },
    { user: false, text: 'Oct 15–22 ADR: $247 vs $198 prior year — +24.7%. Conference premium accounts for ~60% of the delta.' },
  ]
  return (
    <div style={{ ...S.screen, background: bg }}>
      <div style={{ height: 2, background: `linear-gradient(to right, ${acc}00, ${acc}, ${acc}00)`, flexShrink: 0 }} />
      <Bar bg={bg2}>
        <div style={{ ...S.dot(acc) }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: '#c8dff0', letterSpacing: '0.08em' }}>AI BRIEFING</div>
        <div style={{ fontSize: 7.5, color: `${acc}70`, marginLeft: 4 }}>24 sources</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 6.5, color: 'rgba(100,180,230,0.35)', letterSpacing: '0.08em' }}>SaltLakeIQ v2</div>
      </Bar>
      <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'hidden' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.user ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '82%', background: m.user ? `${acc}22` : bg2, borderRadius: 5, padding: '5px 8px', fontSize: 7.5, color: m.user ? '#c8dff0' : 'rgba(170,210,240,0.68)', lineHeight: 1.5, border: m.user ? `1px solid ${acc}28` : `1px solid rgba(255,255,255,0.04)` }}>
              {m.text}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 3, paddingLeft: 4, marginTop: 2 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: `${acc}50` }} />)}
        </div>
      </div>
    </div>
  )
}

// ── CRM — Sponsorships pipeline (green, columnar) ────────────────────────────

export function CrmScreen() {
  const bg = '#040e09', bg2 = '#071510', bg3 = '#0a1e12', acc = '#4caf7a'
  const cols = [
    { label: 'Prospecting', count: 4, val: '$840K', color: '#4caf7a', deals: ['Mountain West Conf.', 'Ski Utah', 'Delta Air Lines'] },
    { label: 'Negotiating', count: 3, val: '$1.2M', color: '#f0a030', deals: ['Zions Bank', 'Adobe', 'Visit Utah'] },
    { label: 'Closed Won', count: 7, val: '$2.8M', color: '#3a8cc4', deals: ['Goldman Sachs', 'Hilton', 'ESPN'] },
  ]
  return (
    <div style={{ ...S.screen, background: bg }}>
      <div style={{ height: 2, background: `linear-gradient(to right, ${acc}00, ${acc}, ${acc}00)`, flexShrink: 0 }} />
      <Bar bg={bg2}>
        <div style={{ ...S.dot(acc) }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: '#c0dfd0', letterSpacing: '0.08em' }}>SPONSORSHIPS CRM</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 8, color: `${acc}80` }}>FY 2025 · Q2</div>
      </Bar>
      {/* Pipeline value bar */}
      <div style={{ background: bg3, padding: '5px 12px', display: 'flex', gap: '1.5rem', flexShrink: 0, borderBottom: '1px solid rgba(76,175,122,0.08)' }}>
        {[{ l: 'Pipeline', v: '$4.84M' }, { l: 'Closed', v: '$2.8M' }, { l: 'Win Rate', v: '71%' }].map(s => (
          <div key={s.l}>
            <div style={{ fontSize: 6.5, color: 'rgba(160,210,185,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.l}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: acc }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.row, flex: 1, padding: 8, gap: 5 }}>
        {cols.map((col) => (
          <div key={col.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 3, borderBottom: `1px solid ${col.color}25` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: col.color }} />
              <div style={{ fontSize: 7, fontWeight: 600, color: `${col.color}90` }}>{col.label}</div>
              <div style={{ marginLeft: 'auto', fontSize: 8, fontWeight: 700, color: col.color }}>{col.val}</div>
            </div>
            {col.deals.map((d, i) => (
              <div key={i} style={{ background: bg3, borderRadius: 3, padding: '4px 6px', borderLeft: `2px solid ${col.color}50` }}>
                <div style={{ fontSize: 7.5, color: 'rgba(200,230,215,0.75)' }}>{d}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card — Sponsorships deal detail (green, focused) ─────────────────────────

export function CardScreen() {
  const bg = '#040e09', bg2 = '#071510', bg3 = '#0a1e12', acc = '#4caf7a'
  return (
    <div style={{ ...S.screen, background: bg }}>
      <div style={{ height: 2, background: `linear-gradient(to right, ${acc}00, ${acc}, ${acc}00)`, flexShrink: 0 }} />
      <Bar bg={bg2}>
        <div style={{ fontSize: 7.5, color: 'rgba(160,210,185,0.4)', letterSpacing: '0.06em' }}>← Pipeline</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 7, background: `${acc}20`, color: acc, borderRadius: 3, padding: '2px 7px', border: `1px solid ${acc}30` }}>NEGOTIATING</div>
      </Bar>
      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 38, height: 38, borderRadius: 5, background: bg3, border: `1px solid ${acc}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: acc }}>ZB</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(200,230,215,0.9)' }}>Zions Bank</div>
            <div style={{ fontSize: 7.5, color: 'rgba(160,200,180,0.4)', marginTop: 2 }}>Presented 3 weeks ago</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: acc }}>$420K</div>
            <div style={{ fontSize: 6.5, color: 'rgba(160,200,180,0.35)' }}>Annual value</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { step: 'Initial contact', done: true },
            { step: 'Proposal sent', done: true },
            { step: 'Legal review', active: true },
            { step: 'Contract signed', done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.done ? acc : s.active ? 'transparent' : '#0a1e12', border: s.active ? `1.5px solid ${acc}` : s.done ? 'none' : `1px solid rgba(76,175,122,0.2)`, flexShrink: 0 }} />
              <div style={{ fontSize: 8, color: s.done ? 'rgba(190,230,210,0.8)' : s.active ? acc : 'rgba(160,200,180,0.25)' }}>{s.step}</div>
              {s.active && <div style={{ fontSize: 6.5, color: `${acc}70`, marginLeft: 'auto' }}>In progress</div>}
            </div>
          ))}
        </div>
        <div style={{ background: `${acc}10`, borderRadius: 4, padding: '7px 9px', borderLeft: `2px solid ${acc}35`, marginTop: 'auto' }}>
          <div style={{ fontSize: 6.5, color: `${acc}80`, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Next action</div>
          <div style={{ fontSize: 8, color: 'rgba(190,230,210,0.65)', lineHeight: 1.5 }}>Follow up with legal team · Due in 2 days</div>
        </div>
      </div>
    </div>
  )
}

// ── Browser — WebNotes annotation view (purple, split-pane) ──────────────────

export function BrowserScreen() {
  const bg = '#0b0917', bg2 = '#12102a', acc = '#9b72cf'
  return (
    <div style={{ ...S.screen, background: bg }}>
      <div style={{ height: 2, background: `linear-gradient(to right, ${acc}00, ${acc}, ${acc}00)`, flexShrink: 0 }} />
      <Bar bg={bg2}>
        <div style={{ display: 'flex', gap: 4, marginRight: 4 }}>
          {['#e06c6c','#f0c430','#4caf7a'].map(c => <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
        </div>
        <div style={{ flex: 1, height: 18, background: '#0d0c22', borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 7px', gap: 4, border: '1px solid rgba(155,114,207,0.12)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: `${acc}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, color: acc }}>TC</div>
          <div style={{ fontSize: 7, color: 'rgba(180,170,220,0.3)' }}>techcrunch.com/2025/ai-infrastructure-spending</div>
        </div>
        <div style={{ fontSize: 7, background: `${acc}20`, color: acc, borderRadius: 3, padding: '2px 5px', border: `1px solid ${acc}30`, marginLeft: 4 }}>3 notes</div>
      </Bar>
      <div style={{ flex: 1, padding: 6, display: 'flex', gap: 6 }}>
        {/* Webpage */}
        <div style={{ flex: 1.7, background: '#f4f3ef', borderRadius: 4, padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 7, width: '52%', background: '#1a1a1a', borderRadius: 2 }} />
          <div style={{ height: 3.5, width: '88%', background: '#888', borderRadius: 2, opacity: 0.35 }} />
          <div style={{ height: 3.5, width: '72%', background: '#888', borderRadius: 2, opacity: 0.35 }} />
          <div style={{ background: `${acc}28`, borderRadius: 2, padding: '3px 4px', border: `1px solid ${acc}55` }}>
            <div style={{ height: 3.5, background: '#555', borderRadius: 1, opacity: 0.45, marginBottom: 2 }} />
            <div style={{ height: 3.5, background: '#555', borderRadius: 1, width: '65%', opacity: 0.45 }} />
          </div>
          <div style={{ height: 3.5, width: '82%', background: '#888', borderRadius: 2, opacity: 0.35 }} />
          <div style={{ background: '#f0c43038', borderRadius: 2, padding: '2px 4px', border: '1px solid #f0c43055' }}>
            <div style={{ height: 3.5, background: '#555', borderRadius: 1, opacity: 0.45 }} />
          </div>
          <div style={{ height: 3.5, width: '60%', background: '#888', borderRadius: 2, opacity: 0.35 }} />
        </div>
        {/* Notes sidebar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { col: acc, text: 'Infrastructure spend up 340% — flag for Q4 strategy brief' },
            { col: '#f0c430', text: 'Compare with AWS capex from last week' },
          ].map((n, i) => (
            <div key={i} style={{ background: bg2, borderRadius: 4, padding: '6px 7px', borderLeft: `2px solid ${n.col}70` }}>
              <div style={{ fontSize: 7.5, color: 'rgba(200,190,240,0.75)', lineHeight: 1.4 }}>{n.text}</div>
              <div style={{ fontSize: 6.5, color: 'rgba(160,150,200,0.28)', marginTop: 3 }}>techcrunch.com · 2m</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Notes feed — WebNotes all-notes view (purple, timeline) ──────────────────

export function NotesScreen() {
  const bg = '#0b0917', bg2 = '#12102a', acc = '#9b72cf'
  const notes = [
    { site: 'TC', url: 'techcrunch.com', snippet: 'Infrastructure spend up 340% — flag for Q4 strategy brief', col: acc, ago: '2m' },
    { site: 'FT', url: 'ft.com', snippet: 'Compare with AWS capex from last week', col: '#f0c430', ago: '1h' },
    { site: 'A1', url: 'a16z.com', snippet: 'Agents > models. This is the thesis we need to counter.', col: '#cf7290', ago: '3h' },
  ]
  return (
    <div style={{ ...S.screen, background: bg }}>
      <div style={{ height: 2, background: `linear-gradient(to right, ${acc}00, ${acc}, ${acc}00)`, flexShrink: 0 }} />
      <Bar bg={bg2}>
        <div style={{ ...S.dot(acc) }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: '#c8c0f0', letterSpacing: '0.08em' }}>ALL NOTES</div>
        <div style={{ flex: 1, margin: '0 8px', height: 16, background: '#0d0c22', borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 6px', border: '1px solid rgba(155,114,207,0.1)' }}>
          <div style={{ fontSize: 7, color: 'rgba(180,170,220,0.22)' }}>Search 24 notes...</div>
        </div>
      </Bar>
      <div style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {notes.map((n, i) => (
          <div key={i} style={{ background: bg2, borderRadius: 5, padding: '7px 8px', borderLeft: `2px solid ${n.col}55`, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: `${n.col}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6.5, fontWeight: 700, color: n.col }}>{n.site}</div>
              <div style={{ fontSize: 7, color: 'rgba(180,170,220,0.32)' }}>{n.url}</div>
              <div style={{ marginLeft: 'auto', fontSize: 6.5, color: 'rgba(160,150,200,0.25)' }}>{n.ago} ago</div>
            </div>
            <div style={{ fontSize: 8, color: 'rgba(200,190,240,0.75)', lineHeight: 1.45 }}>{n.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Grid — The Dam asset library (amber, visual grid) ───────────────────────

export function GridScreen() {
  const bg = '#100c04', bg2 = '#1b1408', acc = '#c4933a'
  const assets = [
    { color: '#3a2c14', label: 'hero-brand-01.jpg', tag: 'Campaign', w: 2 },
    { color: '#1a2e3e', label: 'exec-portrait.jpg', tag: 'People', w: 1 },
    { color: '#2a1a3a', label: 'product-4k.png', tag: 'Product', w: 1 },
    { color: '#1a3a2a', label: 'brand-guide-v4.pdf', tag: 'Brand', w: 1 },
    { color: '#3a1a1a', label: 'q4-campaign.mp4', tag: 'Video', w: 1 },
    { color: '#2e2814', label: 'logo-lockup.zip', tag: 'Logo', w: 1 },
  ]
  return (
    <div style={{ ...S.screen, background: bg }}>
      <div style={{ height: 2, background: `linear-gradient(to right, ${acc}00, ${acc}, ${acc}00)`, flexShrink: 0 }} />
      <Bar bg={bg2}>
        <div style={{ ...S.dot(acc) }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: '#e0c888', letterSpacing: '0.1em' }}>THE DAM</div>
        <div style={{ flex: 1, margin: '0 8px', height: 18, background: bg, borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 7px', border: `1px solid ${acc}18` }}>
          <div style={{ fontSize: 7, color: 'rgba(220,190,130,0.28)' }}>Search 4,218 assets...</div>
        </div>
        <div style={{ fontSize: 8, color: acc, background: `${acc}20`, borderRadius: 3, padding: '2px 7px', border: `1px solid ${acc}30` }}>+ Upload</div>
      </Bar>
      <div style={{ flex: 1, padding: 7, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['All (4,218)', 'Campaign', 'Product', 'Brand'].map((t, i) => (
            <div key={t} style={{ fontSize: 7, padding: '2px 8px', borderRadius: 10, background: i === 0 ? `${acc}28` : bg2, color: i === 0 ? acc : 'rgba(220,190,130,0.32)', border: `1px solid ${i === 0 ? acc + '40' : 'transparent'}` }}>{t}</div>
          ))}
        </div>
        {/* Masonry-ish grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 5 }}>
          <div style={{ gridRow: '1 / 3', background: '#3a2c14', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 6 }}>
            <div style={{ fontSize: 6.5, color: 'rgba(230,200,140,0.55)', marginBottom: 1 }}>hero-brand-01.jpg</div>
            <div style={{ fontSize: 6, color: acc, opacity: 0.7 }}>Campaign</div>
          </div>
          {assets.slice(1).map((a, i) => (
            <div key={i} style={{ background: a.color, borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 5 }}>
              <div style={{ fontSize: 6, color: 'rgba(230,210,170,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</div>
              <div style={{ fontSize: 5.5, color: acc, opacity: 0.65 }}>{a.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Detail — The Dam asset view (amber, structured) ───────────────────────────

export function DetailScreen() {
  const bg = '#100c04', bg2 = '#1b1408', acc = '#c4933a'
  const tags = ['Campaign', 'Hero', 'Q4-2025', 'Approved', 'Web', 'Social']
  return (
    <div style={{ ...S.screen, background: bg }}>
      <div style={{ height: 2, background: `linear-gradient(to right, ${acc}00, ${acc}, ${acc}00)`, flexShrink: 0 }} />
      <Bar bg={bg2}>
        <div style={{ fontSize: 7.5, color: 'rgba(220,190,130,0.4)', letterSpacing: '0.06em' }}>← Library</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 7.5, color: acc, background: `${acc}15`, borderRadius: 3, padding: '2px 7px', border: `1px solid ${acc}30` }}>Download</div>
      </Bar>
      <div style={{ ...S.row, flex: 1, padding: 8, gap: 8 }}>
        {/* Preview — gradient to suggest a rich image */}
        <div style={{ flex: 1.4, borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #3a2c14 0%, #1a2030 50%, #2a1a20 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 7 }}>
            <div style={{ fontSize: 6.5, color: 'rgba(230,200,140,0.35)', lineHeight: 1.6 }}>hero-brand-01.jpg<br />4096 × 2731 · 4.2 MB</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div>
            <div style={S.label}>AI Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
              {tags.map(t => (
                <div key={t} style={{ fontSize: 6.5, padding: '2px 5px', borderRadius: 3, background: `${acc}18`, color: acc, border: `1px solid ${acc}28` }}>{t}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={S.label}>Usage</div>
            {['Email campaign — sent 3/14', 'Website hero — active', 'Social — 42 uses'].map((u, i) => (
              <div key={i} style={{ fontSize: 7, color: 'rgba(220,190,130,0.42)', marginTop: 3 }}>· {u}</div>
            ))}
          </div>
          <div style={{ background: '#4caf7a18', borderRadius: 3, padding: '4px 6px', border: '1px solid #4caf7a28', display: 'flex', gap: 5, alignItems: 'center', marginTop: 'auto' }}>
            <div style={{ ...S.dot('#4caf7a') }} />
            <div style={{ fontSize: 7, color: '#4caf7a80' }}>Approved · Creative Director</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

const SCREENS = {
  analytics: AnalyticsScreen,
  chat:      ChatScreen,
  crm:       CrmScreen,
  card:      CardScreen,
  browser:   BrowserScreen,
  notes:     NotesScreen,
  grid:      GridScreen,
  detail:    DetailScreen,
}

export default function AppMockup({ type }) {
  const C = SCREENS[type] || GridScreen
  return <C />
}
