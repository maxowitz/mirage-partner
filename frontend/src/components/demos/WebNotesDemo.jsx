import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = {
  bg: '#F8F9FA',
  white: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  indigo: '#6366F1',
  indigoLight: '#EEF2FF',
  green: '#10B981',
  amber: '#F59E0B',
  coral: '#EF4444',
};

const CANVASES = [
  { id: 1, title: 'Product Hunt Launch Research', domain: 'producthunt.com', color: '#6366F1', notes: 14, edited: '2h ago', tag: 'Research' },
  { id: 2, title: 'Competitor Analysis — Q2 2025', domain: 'linear.app', color: '#10B981', notes: 9, edited: 'Yesterday', tag: 'Strategy' },
  { id: 3, title: 'SaltLakeIQ Onboarding Notes', domain: 'saltlakeiq.com', color: '#F59E0B', notes: 22, edited: 'Apr 14', tag: 'Client' },
  { id: 4, title: 'Investor Pitch Prep', domain: 'notion.so', color: '#EF4444', notes: 7, edited: 'Apr 12', tag: 'Fundraising' },
  { id: 5, title: 'Design Inspiration Board', domain: 'dribbble.com', color: '#8B5CF6', notes: 31, edited: 'Apr 10', tag: 'Design' },
  { id: 6, title: 'API Documentation Review', domain: 'docs.stripe.com', color: '#06B6D4', notes: 5, edited: 'Apr 9', tag: 'Engineering' },
  { id: 7, title: 'Content Calendar Q2', domain: 'airtable.com', color: '#F97316', notes: 12, edited: 'Apr 8', tag: 'Marketing' },
  { id: 8, title: 'VC Research: a16z Portfolio', domain: 'a16z.com', color: '#64748B', notes: 18, edited: 'Apr 6', tag: 'Research' },
];

const MARKERS = [
  { id: 1, top: 52, left: 30, color: '#6366F1' },
  { id: 2, top: 90, left: 180, color: '#F59E0B' },
  { id: 3, top: 140, left: 80, color: '#10B981' },
  { id: 4, top: 220, left: 240, color: '#EF4444' },
];

const NOTES = [
  {
    id: 1,
    markerColor: '#6366F1',
    quote: 'WebNotes is now available on Product Hunt',
    body: 'This is the hook — lead with the announcement. Reuse for social copy.',
    date: 'Apr 16 · 10:32 AM',
  },
  {
    id: 2,
    markerColor: '#F59E0B',
    quote: 'Annotate any web page. No extension.',
    body: 'This is our main differentiator — no friction. Mention in every pitch deck.',
    date: 'Apr 16 · 10:35 AM',
  },
  {
    id: 3,
    markerColor: '#10B981',
    quote: '[content section]',
    body: 'Formatting looks great on mobile too. Screenshot for app store.',
    date: 'Apr 16 · 11:02 AM',
  },
  {
    id: 4,
    markerColor: '#EF4444',
    quote: '[image section]',
    body: 'Need a better hero image — current one feels too generic.',
    date: 'Apr 16 · 11:14 AM',
  },
];

function MarkerCircle({ marker, onClick, isActive }) {
  return (
    <motion.div
      onClick={() => onClick(marker.id)}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'absolute',
        top: marker.top,
        left: marker.left,
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: marker.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isActive
          ? `0 0 0 3px ${marker.color}55, 0 2px 8px rgba(0,0,0,0.25)`
          : '0 2px 8px rgba(0,0,0,0.25)',
        zIndex: 10,
        transition: 'box-shadow 0.15s',
      }}
    >
      <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        {marker.id}
      </span>
    </motion.div>
  );
}

function NoteCard({ note, isActive, onClick }) {
  return (
    <motion.div
      onClick={() => onClick(note.id)}
      layout
      style={{
        padding: '12px 14px',
        borderBottom: `1px solid ${COLORS.border}`,
        background: isActive ? COLORS.indigoLight : COLORS.white,
        borderLeft: isActive ? `2px solid ${COLORS.indigo}` : '2px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.15s, border-left 0.15s',
      }}
      whileHover={{ background: isActive ? COLORS.indigoLight : '#F9FAFB' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: note.markerColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
            {note.id}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            background: '#F3F4F6',
            borderRadius: 4,
            padding: '3px 8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontStyle: 'italic',
            color: COLORS.textMuted,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {note.quote}
        </div>
      </div>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: COLORS.textPrimary,
          lineHeight: 1.5,
          marginTop: 6,
          marginBottom: 0,
        }}
      >
        {note.body}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: COLORS.textMuted }}>
          {note.date}
        </span>
        <span style={{ fontSize: 11, color: COLORS.textMuted, cursor: 'pointer' }} title="Edit">
          ✎
        </span>
      </div>
    </motion.div>
  );
}

function CanvasCard({ canvas, onClick }) {
  const [hovered, setHovered] = useState(false);
  const initial = canvas.domain[0].toUpperCase();

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: COLORS.white,
        borderRadius: 10,
        border: `1px solid ${hovered ? COLORS.indigo : COLORS.border}`,
        padding: 16,
        cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      whileTap={{ scale: 0.985 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: canvas.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
            {initial}
          </span>
        </div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: COLORS.textMuted }}>
          {canvas.domain}
        </span>
      </div>

      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginTop: 8, lineHeight: 1.3 }}>
        {canvas.title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: COLORS.indigo, fontWeight: 500 }}>
          {canvas.notes} notes
        </span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: COLORS.textMuted }}>
          {canvas.edited}
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <span
          style={{
            display: 'inline-block',
            fontFamily: 'Inter, sans-serif',
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '2px 7px',
            borderRadius: 20,
            background: COLORS.indigoLight,
            color: COLORS.indigo,
          }}
        >
          {canvas.tag}
        </span>
      </div>
    </motion.div>
  );
}

function CanvasesView({ onOpenCanvas }) {
  const [search, setSearch] = useState('');
  const filtered = CANVASES.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      key="canvases"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ margin: '20px 24px 16px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search canvases..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#F3F4F6',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            color: COLORS.textPrimary,
            outline: 'none',
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          alignContent: 'start',
        }}
      >
        {filtered.map((canvas) => (
          <CanvasCard
            key={canvas.id}
            canvas={canvas}
            onClick={canvas.id === 1 ? onOpenCanvas : undefined}
          />
        ))}
      </div>
    </motion.div>
  );
}

function CanvasDetailView({ onBack }) {
  const [activeMarker, setActiveMarker] = useState(null);
  const [noteText, setNoteText] = useState('');
  const noteRefs = useRef({});

  const handleMarkerClick = (id) => {
    setActiveMarker((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (activeMarker && noteRefs.current[activeMarker]) {
      noteRefs.current[activeMarker].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeMarker]);

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
    >
      {/* Left panel — fake browser area */}
      <div style={{ flex: 1, overflow: 'auto', background: '#F0F0F0' }}>
        <div
          style={{
            margin: 20,
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            minHeight: 400,
            background: COLORS.white,
            position: 'relative',
          }}
        >
          {/* Fake browser tab bar */}
          <div
            style={{
              height: 32,
              background: '#E8E8E8',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              gap: 6,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#BDBDBD', flexShrink: 0 }}
              />
            ))}
            <div
              style={{
                background: COLORS.white,
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 9,
                color: '#555',
                flex: 1,
                maxWidth: 200,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              producthunt.com/posts/webnotes
            </div>
          </div>

          {/* Fake page content */}
          <div style={{ padding: 20, position: 'relative' }}>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.textPrimary,
                lineHeight: 1.3,
              }}
            >
              WebNotes is now available on Product Hunt 🎉
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: COLORS.textSecondary,
                marginTop: 6,
              }}
            >
              Annotate any web page. No extension. No account required.
            </div>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['100%'], ['85%'], ['70%']].map(([w], i) => (
                <div key={i} style={{ height: 8, borderRadius: 4, background: COLORS.border, width: w }} />
              ))}
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['100%'], ['90%'], ['80%'], ['60%']].map(([w], i) => (
                <div key={i} style={{ height: 8, borderRadius: 4, background: COLORS.border, width: w }} />
              ))}
            </div>

            <div
              style={{
                height: 120,
                marginTop: 14,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
              }}
            />

            {/* Annotation markers */}
            {MARKERS.map((marker) => (
              <MarkerCircle
                key={marker.id}
                marker={marker}
                onClick={handleMarkerClick}
                isActive={activeMarker === marker.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — notes */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          background: COLORS.white,
          borderLeft: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
            14 Notes
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: COLORS.textMuted, cursor: 'pointer' }}>
            Sort: Recent ▾
          </span>
        </div>

        {/* Notes list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {NOTES.map((note) => (
            <div key={note.id} ref={(el) => { noteRefs.current[note.id] = el; }}>
              <NoteCard
                note={note}
                isActive={activeMarker === note.id}
                onClick={handleMarkerClick}
              />
            </div>
          ))}
        </div>

        {/* Add note area */}
        <div
          style={{
            padding: '10px 12px',
            borderTop: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}
        >
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              background: '#F9FAFB',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: '6px 8px',
              resize: 'none',
              outline: 'none',
              color: COLORS.textPrimary,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <motion.button
              whileHover={{ opacity: 0.85 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setNoteText('')}
              style={{
                background: COLORS.indigo,
                color: COLORS.white,
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function WebNotesDemo() {
  const [view, setView] = useState('canvases');

  useEffect(() => {
    if (document.getElementById('webnotes-fonts')) return;
    const link = document.createElement('link');
    link.id = 'webnotes-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: COLORS.bg,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Top nav bar */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          background: COLORS.white,
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 0,
        }}
      >
        {/* Left: logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: COLORS.indigo,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
              W
            </span>
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>
            WebNotes
          </span>
        </div>

        {/* Center: breadcrumb (detail view only) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {view === 'detail' && (
              <motion.div
                key="breadcrumb"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter, sans-serif', fontSize: 13 }}
              >
                <span
                  onClick={() => setView('canvases')}
                  style={{ color: COLORS.indigo, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
                >
                  ← Canvases
                </span>
                <span style={{ color: COLORS.textMuted }}>›</span>
                <span style={{ color: COLORS.textMuted }}>producthunt.com</span>
                <span style={{ color: COLORS.textMuted }}>›</span>
                <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>Product Hunt Launch Research</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: action button */}
        <div style={{ minWidth: 140, display: 'flex', justifyContent: 'flex-end' }}>
          <AnimatePresence mode="wait">
            {view === 'canvases' ? (
              <motion.button
                key="new-canvas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                whileHover={{ opacity: 0.85 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  background: COLORS.indigo,
                  color: COLORS.white,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '7px 14px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + New Canvas
              </motion.button>
            ) : (
              <motion.button
                key="canvas-options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.textMuted,
                  fontSize: 18,
                  padding: '4px 8px',
                  borderRadius: 6,
                  lineHeight: 1,
                }}
              >
                •••
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {view === 'canvases' ? (
            <CanvasesView key="canvases" onOpenCanvas={() => setView('detail')} />
          ) : (
            <CanvasDetailView key="detail" onBack={() => setView('canvases')} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
