import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── DATA ───────────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    id: 'prospecting',
    label: 'Prospecting',
    accent: '#94A3B8',
    deals: [
      { id: 1, company: 'Delta Air Lines', value: '$180,000', contact: 'Sarah Chen', stage: 'Prospecting', stageColor: '#94A3B8' },
      { id: 2, company: 'Red Bull', value: '$95,000', contact: 'Alex Torres', stage: 'Prospecting', stageColor: '#94A3B8' },
      { id: 3, company: 'Airbnb', value: '$120,000', contact: 'Mia Johnson', stage: 'Prospecting', stageColor: '#94A3B8' },
      { id: 4, company: 'Visit USA', value: '$250,000', contact: 'Ryan Park', stage: 'Prospecting', stageColor: '#94A3B8' },
    ],
  },
  {
    id: 'proposal',
    label: 'Proposal',
    accent: '#60A5FA',
    deals: [
      { id: 5, company: 'Marriott International', value: '$320,000', contact: 'Dana White', stage: 'Proposal', stageColor: '#60A5FA' },
      { id: 6, company: 'REI Co-op', value: '$145,000', contact: 'Jordan Lee', stage: 'Proposal', stageColor: '#60A5FA' },
      { id: 7, company: 'ESPN', value: '$210,000', contact: 'Chris Evans', stage: 'Proposal', stageColor: '#60A5FA' },
    ],
  },
  {
    id: 'negotiating',
    label: 'Negotiating',
    accent: '#F59E0B',
    deals: [
      { id: 8, company: 'State Farm', value: '$480,000', contact: 'Taylor Ross', stage: 'Negotiating', stageColor: '#F59E0B' },
      { id: 9, company: 'Comcast', value: '$375,000', contact: 'Morgan Kim', stage: 'Negotiating', stageColor: '#F59E0B' },
    ],
  },
  {
    id: 'won',
    label: 'Won',
    accent: '#3D9970',
    deals: [
      { id: 10, company: 'Delta Hotels', value: '$290,000', contact: 'Sam Rivera', stage: 'Won', stageColor: '#3D9970', closedDate: 'Closed Apr 3' },
      { id: 11, company: 'Southwest Airlines', value: '$195,000', contact: 'Pat Quinn', stage: 'Won', stageColor: '#3D9970', closedDate: 'Closed Mar 28' },
    ],
  },
];

const PARTNERS_TABLE = [
  { name: 'Delta Air Lines', type: 'Airline', value: '$475,000', status: 'Active', lastContact: 'Apr 12' },
  { name: 'Marriott International', type: 'Hospitality', value: '$320,000', status: 'Proposal', lastContact: 'Apr 9' },
  { name: 'State Farm', type: 'Insurance', value: '$480,000', status: 'Negotiating', lastContact: 'Apr 11' },
  { name: 'REI Co-op', type: 'Outdoor Retail', value: '$145,000', status: 'Proposal', lastContact: 'Apr 7' },
  { name: 'ESPN', type: 'Media', value: '$210,000', status: 'Proposal', lastContact: 'Apr 5' },
  { name: 'Southwest Airlines', type: 'Airline', value: '$195,000', status: 'Won', lastContact: 'Mar 28' },
];

const DEAL_DETAIL_MAP = {
  1:  { industry: 'Aviation', hq: 'Atlanta, GA', website: 'delta.com', closeDate: 'May 30, 2025', owner: 'J. Martinez' },
  2:  { industry: 'Beverages', hq: 'Santa Monica, CA', website: 'redbull.com', closeDate: 'Jun 15, 2025', owner: 'S. Rivera' },
  3:  { industry: 'Travel Tech', hq: 'San Francisco, CA', website: 'airbnb.com', closeDate: 'Jun 30, 2025', owner: 'J. Martinez' },
  4:  { industry: 'Tourism', hq: 'Washington, DC', website: 'visitusa.org', closeDate: 'Jul 10, 2025', owner: 'R. Park' },
  5:  { industry: 'Hospitality', hq: 'Bethesda, MD', website: 'marriott.com', closeDate: 'May 15, 2025', owner: 'D. White' },
  6:  { industry: 'Outdoor Retail', hq: 'Kent, WA', website: 'rei.com', closeDate: 'May 22, 2025', owner: 'J. Lee' },
  7:  { industry: 'Media', hq: 'Bristol, CT', website: 'espn.com', closeDate: 'May 28, 2025', owner: 'C. Evans' },
  8:  { industry: 'Insurance', hq: 'Bloomington, IL', website: 'statefarm.com', closeDate: 'Apr 30, 2025', owner: 'T. Ross' },
  9:  { industry: 'Telecom', hq: 'Philadelphia, PA', website: 'comcast.com', closeDate: 'May 5, 2025', owner: 'M. Kim' },
  10: { industry: 'Hospitality', hq: 'Toronto, ON', website: 'deltahotels.com', closeDate: 'Apr 3, 2025', owner: 'J. Martinez' },
  11: { industry: 'Aviation', hq: 'Dallas, TX', website: 'southwest.com', closeDate: 'Mar 28, 2025', owner: 'P. Quinn' },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function statusBadgeStyle(status) {
  const map = {
    Active:      { bg: '#DCFCE7', color: '#166534' },
    Proposal:    { bg: '#DBEAFE', color: '#1D4ED8' },
    Negotiating: { bg: '#FEF3C7', color: '#92400E' },
    Won:         { bg: '#BBF7D0', color: '#14532D' },
  };
  return map[status] || { bg: '#F1F5F9', color: '#475569' };
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function DealCard({ deal, columnAccent, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onSelect(deal)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: 9,
        border: `1px solid ${hovered ? '#C8BFB4' : '#E8E1D8'}`,
        padding: '12px 14px',
        cursor: 'pointer',
        boxShadow: hovered ? '0 3px 14px rgba(0,0,0,0.09)' : 'none',
        transition: 'box-shadow 0.18s, border-color 0.18s',
      }}
    >
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>
        {deal.company}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#3D9970', marginTop: 3 }}>
        {deal.value}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#64748B', marginTop: 4 }}>
        {deal.contact}
      </div>
      {deal.closedDate && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#3D9970', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: columnAccent, flexShrink: 0 }} />
          ✓ {deal.closedDate}
        </div>
      )}
      {!deal.closedDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: columnAccent, flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#64748B' }}>{deal.stage}</span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ col, onSelect }) {
  return (
    <div style={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, paddingLeft: 2 }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#64748B',
        }}>
          {col.label}
        </span>
        <span style={{
          background: col.accent + '28',
          color: col.accent,
          borderRadius: '50%',
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          fontWeight: 600,
        }}>
          {col.deals.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingTop: 8, flex: 1 }}>
        {col.deals.map(deal => (
          <DealCard key={deal.id} deal={deal} columnAccent={col.accent} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function PipelineView({ onSelectDeal }) {
  return (
    <motion.div
      key="pipeline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#1A1A2E', margin: 0, lineHeight: 1.2 }}>
            Pipeline
          </h1>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#64748B', marginTop: 3 }}>
            Q2 2025 · 11 active deals · $2.4M pipeline
          </div>
        </div>
        <button style={{
          background: '#3D9970',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 7,
          padding: '7px 14px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}>
          + New Deal
        </button>
      </div>

      {/* Kanban board */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 14,
        padding: '0 20px 20px',
        overflowX: 'auto',
        flex: 1,
      }}>
        {COLUMNS.map(col => (
          <KanbanColumn key={col.id} col={col} onSelect={onSelectDeal} />
        ))}
      </div>
    </motion.div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E1D8',
      borderRadius: 9,
      padding: '14px 16px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#94A3B8' }}>{label}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#1A1A2E', fontWeight: 500, marginTop: 1 }}>{value}</span>
    </div>
  );
}

function PartnerDetailView({ deal, onBack }) {
  const extra = DEAL_DETAIL_MAP[deal.id] || {};
  const stageColors = {
    Prospecting: { bg: '#F1F5F9', color: '#475569' },
    Proposal:    { bg: '#DBEAFE', color: '#1D4ED8' },
    Negotiating: { bg: '#FEF3C7', color: '#92400E' },
    Won:         { bg: '#DCFCE7', color: '#166534' },
  };
  const sc = stageColors[deal.stage] || { bg: '#F1F5F9', color: '#475569' };

  const timelineItems = [
    { date: 'Apr 14', avatar: 'JM', color: '#3D9970', note: 'Sent revised proposal with updated tier structure. Awaiting legal review.' },
    { date: 'Apr 9',  avatar: 'SR', color: '#60A5FA', note: 'Call with VP Marketing — confirmed budget approved, need exec sign-off.' },
    { date: 'Apr 3',  avatar: 'JM', color: '#3D9970', note: 'Initial pitch deck delivered. Strong interest in Olympic hospitality package.' },
  ];

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px 28px' }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: '#64748B',
            padding: 0,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          ← Pipeline
        </button>

        {/* Company name */}
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: '#1A1A2E', margin: '0 0 4px 0', lineHeight: 1.2 }}>
          {deal.company}
        </h2>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 5,
            padding: '3px 9px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
          }}>
            {deal.value}
          </span>
          <span style={{
            background: sc.bg,
            color: sc.color,
            borderRadius: 5,
            padding: '3px 9px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
          }}>
            {deal.stage}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#94A3B8' }}>
            Last contact: Apr 12
          </span>
        </div>

        {/* 3-column info grid */}
        <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
          <InfoCard title="Company Info">
            <InfoRow label="Industry" value={extra.industry || '—'} />
            <InfoRow label="HQ" value={extra.hq || '—'} />
            <InfoRow label="Website" value={extra.website || '—'} />
          </InfoCard>
          <InfoCard title="Deal Details">
            <InfoRow label="Value" value={deal.value} />
            <InfoRow label="Stage" value={deal.stage} />
            <InfoRow label="Close Date" value={extra.closeDate || '—'} />
            <InfoRow label="Owner" value={extra.owner || '—'} />
          </InfoCard>
          <InfoCard title="Key Contacts">
            {[
              { name: deal.contact, role: 'Primary Contact' },
              { name: extra.owner || 'J. Martinez', role: 'Account Owner' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: i === 0 ? 8 : 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i === 0 ? '#082540' : '#3D9970',
                  color: '#F0EADC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {initials(c.name)}
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#1A1A2E' }}>{c.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#94A3B8' }}>{c.role}</div>
                </div>
              </div>
            ))}
          </InfoCard>
        </div>

        {/* Activity timeline */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timelineItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: i < timelineItems.length - 1 ? 16 : 0 }}>
                {/* Vertical line */}
                {i < timelineItems.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: 13,
                    top: 28,
                    bottom: 0,
                    width: 2,
                    background: '#E8E1D8',
                  }} />
                )}
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: item.color,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600,
                  flexShrink: 0,
                  zIndex: 1,
                }}>
                  {item.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{item.date}</div>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E8E1D8',
                    borderRadius: 7,
                    padding: '9px 12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: '#1A1A2E',
                    lineHeight: 1.5,
                  }}>
                    {item.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button style={{
            border: '1.5px solid #3D9970', color: '#3D9970', background: 'transparent',
            borderRadius: 7, padding: '7px 16px',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            Edit Deal
          </button>
          <button style={{
            background: '#3D9970', color: '#FFFFFF', border: 'none',
            borderRadius: 7, padding: '7px 16px',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            Send Proposal
          </button>
          <button style={{
            border: '1.5px solid #E8E1D8', color: '#64748B', background: 'transparent',
            borderRadius: 7, padding: '7px 16px',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            Log Activity
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PartnersView() {
  const headers = ['Partner', 'Type', 'Deal Value', 'Status', 'Last Contact'];
  return (
    <motion.div
      key="partners"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ padding: '20px 24px 14px', flexShrink: 0 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#1A1A2E', margin: 0, lineHeight: 1.2 }}>
          Partners
        </h1>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#64748B', marginTop: 3 }}>
          6 active partner accounts
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E8E1D8',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr',
            padding: '10px 16px',
            borderBottom: '1px solid #E8E1D8',
            background: '#FAF8F5',
          }}>
            {headers.map(h => (
              <div key={h} style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {PARTNERS_TABLE.map((row, i) => {
            const { bg, color } = statusBadgeStyle(row.status);
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr',
                  padding: '11px 16px',
                  borderBottom: i < PARTNERS_TABLE.length - 1 ? '1px solid #F0EBE3' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FDFCF9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{row.name}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#64748B' }}>{row.type}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#3D9970' }}>{row.value}</div>
                <div>
                  <span style={{
                    background: bg, color,
                    borderRadius: 5, padding: '2px 8px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
                  }}>
                    {row.status}
                  </span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#94A3B8' }}>{row.lastContact}</div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'pipeline', label: 'Pipeline', icon: '◈' },
  { id: 'partners', label: 'Partners', icon: '⊞' },
  { id: 'contacts', label: 'Contacts', icon: '☰' },
  { id: 'reports',  label: 'Reports',  icon: '▤' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function SponsorshipsCRMDemo() {
  const [activeNav, setActiveNav] = useState('pipeline');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [hoveredNav, setHoveredNav] = useState(null);

  useEffect(() => {
    if (document.getElementById('sponsorships-fonts')) return;
    const link = document.createElement('link');
    link.id = 'sponsorships-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  function handleNavClick(id) {
    setActiveNav(id);
    setSelectedDeal(null);
  }

  const viewKey = selectedDeal
    ? `detail-${selectedDeal.id}`
    : activeNav;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#F5F0E8' }}>
      {/* Sidebar */}
      <div style={{
        width: 220,
        flexShrink: 0,
        background: '#082540',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Logo block */}
        <div style={{ padding: '16px 16px 10px' }}>
          <div style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontSize: 18,
            color: '#F0EADC',
            lineHeight: 1.2,
          }}>
            Sponsorships
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: 'rgba(240,234,220,0.6)',
            marginTop: 2,
          }}>
            Visit Salt Lake
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 8px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.id && !selectedDeal || (selectedDeal && activeNav === item.id);
            const isHovered = hoveredNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                onMouseEnter={() => setHoveredNav(item.id)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive
                    ? 'rgba(255,255,255,0.12)'
                    : isHovered
                    ? 'rgba(255,255,255,0.06)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(240,234,220,0.55)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  textAlign: 'left',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User block */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#3D9970',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600,
            color: '#fff', flexShrink: 0,
          }}>
            JM
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#F0EADC', fontWeight: 500 }}>J. Martinez</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(240,234,220,0.5)' }}>Admin</div>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {selectedDeal ? (
            <PartnerDetailView
              key={`detail-${selectedDeal.id}`}
              deal={selectedDeal}
              onBack={() => setSelectedDeal(null)}
            />
          ) : activeNav === 'pipeline' ? (
            <PipelineView key="pipeline" onSelectDeal={setSelectedDeal} />
          ) : activeNav === 'partners' ? (
            <PartnersView key="partners" />
          ) : (
            <motion.div
              key={activeNav}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#1A1A2E' }}>
                {NAV_ITEMS.find(n => n.id === activeNav)?.label}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94A3B8' }}>
                Coming soon
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
