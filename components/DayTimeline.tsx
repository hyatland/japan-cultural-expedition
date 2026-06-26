import React, { useState, useRef } from 'react';
import { Train, MapPin, Bed, LogIn, Plus, Check, X, Pencil, Trash2, GripVertical } from 'lucide-react';
import { ItineraryDay, Activity, TrainInfo } from '../types';
import { useTheme } from '../ThemeContext';

export type ViewMode = 'list' | 'timeline';

// ─── Internal event union ───
type TLEvent =
  | { kind: 'depart'; time?: string; station?: string; trainInfo?: TrainInfo }
  | { kind: 'activity'; idx: number; text: string; time?: string }
  | { kind: 'arrive'; time?: string; station?: string; trainInfo?: TrainInfo }
  | { kind: 'checkin'; time?: string; hotel: string }
  | { kind: 'sleep'; hotel: string };

function toMins(t?: string, fallback = 99999): number {
  if (!t) return fallback;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const KIND_ORDER: Record<string, number> = {
  depart: 0,
  activity: 1,
  arrive: 2,
  checkin: 3,
  sleep: 9999,
};

function buildEvents(day: ItineraryDay): TLEvent[] {
  const events: TLEvent[] = [];

  const hasDep = day.departureTime || day.trainInfo?.departureStation || day.trainInfo?.departureTime;
  const hasArr = day.arrivalTime || day.trainInfo?.arrivalStation || day.trainInfo?.arrivalTime;

  if (hasDep) {
    events.push({
      kind: 'depart',
      time: day.trainInfo?.departureTime || day.departureTime,
      station: day.trainInfo?.departureStation,
      trainInfo: day.trainInfo,
    });
  }

  day.activities.forEach((act, idx) => {
    events.push({ kind: 'activity', idx, text: act.text, time: act.time });
  });

  if (hasArr) {
    events.push({
      kind: 'arrive',
      time: day.trainInfo?.arrivalTime || day.arrivalTime,
      station: day.trainInfo?.arrivalStation,
      trainInfo: day.trainInfo,
    });
  }

  if (day.checkInTime) {
    events.push({ kind: 'checkin', time: day.checkInTime, hotel: day.sleep });
  }

  events.push({ kind: 'sleep', hotel: day.sleep });

  return events.sort((a, b) => {
    if (a.kind === 'sleep') return 1;
    if (b.kind === 'sleep') return -1;
    const aT = a.kind === 'activity' ? toMins(a.time, 50000 + a.idx) : toMins((a as { time?: string }).time, 49000);
    const bT = b.kind === 'activity' ? toMins(b.time, 50000 + b.idx) : toMins((b as { time?: string }).time, 49000);
    if (aT !== bT) return aT - bT;
    return (KIND_ORDER[a.kind] ?? 5) - (KIND_ORDER[b.kind] ?? 5);
  });
}

// ─── Time badge ───
const TimeBadge: React.FC<{ time?: string; label?: string; isDark: boolean }> = ({ time, label, isDark }) => {
  const content = time ?? label ?? '';
  if (!content) return null;
  return (
    <div
      className="font-transit-mono shrink-0 flex items-center justify-center tabular-nums"
      style={{
        fontSize: '8px',
        fontWeight: 700,
        color: isDark ? '#888' : '#7a7876',
        backgroundColor: isDark ? '#252525' : '#e8e6e2',
        padding: '2px 5px',
        letterSpacing: '0.04em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        minWidth: '42px',
        textAlign: 'center',
      }}
    >
      {content}
    </div>
  );
};

// ─── Spine node ───
const SpineNode: React.FC<{ filled: boolean; color: string; isLast: boolean; spineColor: string }> = ({ filled, color, isLast, spineColor }) => (
  <div className="flex flex-col items-center" style={{ width: '20px', flexShrink: 0 }}>
    <div style={{
      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, marginTop: '3px', zIndex: 1, position: 'relative',
      backgroundColor: filled ? color : 'transparent',
      border: `2px solid ${color}`,
    }} />
    {!isLast && (
      <div style={{ flex: 1, width: '1px', backgroundColor: spineColor, minHeight: '12px' }} />
    )}
  </div>
);

// ─── Props ───
interface DayTimelineProps {
  day: ItineraryDay;
  mode: ViewMode;
  onUpdateActivities: (activities: Activity[]) => void;
}

// ─── Component ───
const DayTimeline: React.FC<DayTimelineProps> = ({ day, mode, onUpdateActivities }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTime, setNewTime] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const TEAL  = '#0d9488';
  const RED   = '#d02810';
  const GREEN = '#16a34a';

  const cardBase: React.CSSProperties = {
    flex: 1,
    marginLeft: '8px',
    marginBottom: '4px',
    fontSize: '11px',
    lineHeight: '1.4',
  };

  const tc = {
    bg:          isDark ? '#141414' : '#ffffff',
    rule:        isDark ? '#252525' : '#eeece8',
    text:        isDark ? '#d8d6d2' : '#1a1816',
    muted:       isDark ? '#585654' : '#7a7876',
    actBg:       isDark ? '#1e1e1e' : '#f9f8f6',
    actBorder:   isDark ? '#2c2c2c' : '#e4e2de',
    inputBg:     isDark ? '#1a1a1a' : '#f5f4f0',
    inputBorder: isDark ? '#333'    : '#d8d6d2',
    inputText:   isDark ? '#d8d6d2' : '#1a1816',
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditText(day.activities[idx].text);
    setEditTime(day.activities[idx].time || '');
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = day.activities.map((a, i) =>
      i === editingIdx ? { text: editText.trim(), time: editTime || undefined } : a
    );
    onUpdateActivities(updated.filter(a => a.text.trim() !== ''));
    setEditingIdx(null);
  };

  const cancelEdit = () => { setEditingIdx(null); setEditText(''); setEditTime(''); };
  const deleteActivity = (idx: number) => { onUpdateActivities(day.activities.filter((_, i) => i !== idx)); setEditingIdx(null); };
  const addActivity = () => {
    if (!newText.trim()) return;
    onUpdateActivities([...day.activities, { text: newText.trim(), time: newTime || undefined }]);
    setNewText(''); setNewTime(''); setIsAdding(false);
  };
  const beginAdding = () => { setIsAdding(true); setTimeout(() => addInputRef.current?.focus(), 50); };

  const handleDragStart = (idx: number) => { dragItem.current = idx; setDraggedIdx(idx); };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; setDropTargetIdx(idx); };
  const handleDragEnd = () => {
    const from = dragItem.current, to = dragOverItem.current;
    if (from !== null && to !== null && from !== to) {
      const reordered = [...day.activities];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      onUpdateActivities(reordered);
    }
    dragItem.current = null; dragOverItem.current = null;
    setDraggedIdx(null); setDropTargetIdx(null);
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.inputText,
    fontSize: '11px', padding: '4px 8px', outline: 'none', borderRadius: 0,
  };

  // ──────────────────────────────────────────────
  // LIST MODE
  // ──────────────────────────────────────────────
  if (mode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {day.activities.map((act, idx) => (
          <div
            key={idx}
            draggable={editingIdx !== idx}
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            className="group"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              opacity: draggedIdx === idx ? 0.4 : 1,
              borderTop: dropTargetIdx === idx && draggedIdx !== idx ? `2px solid ${RED}` : undefined,
            }}
          >
            {editingIdx === idx ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1 }}>
                <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} style={{ ...inputStyle, width: '78px', flexShrink: 0 }} />
                <input type="text" value={editText} onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  style={{ ...inputStyle, flex: 1 }} autoFocus
                />
                <button onClick={saveEdit} style={{ padding: '4px 8px', backgroundColor: GREEN, color: '#fff', fontSize: '10px' }}><Check size={11} /></button>
                <button onClick={cancelEdit} style={{ padding: '4px 8px', backgroundColor: tc.actBg, color: tc.muted, fontSize: '10px' }}><X size={11} /></button>
                <button onClick={() => deleteActivity(idx)} style={{ padding: '4px 8px', backgroundColor: tc.actBg, color: RED, fontSize: '10px' }}><Trash2 size={11} /></button>
              </div>
            ) : (
              <>
                <div className="shrink-0 cursor-grab" style={{ color: isDark ? '#333' : '#c0bebb' }}>
                  <GripVertical size={12} />
                </div>
                {act.time && <TimeBadge time={act.time} isDark={isDark} />}
                <div
                  onClick={() => startEdit(idx)}
                  className="group-hover:opacity-100 cursor-pointer"
                  style={{
                    flex: 1, fontSize: '11px', color: tc.text,
                    backgroundColor: tc.actBg, border: `1px solid ${tc.actBorder}`,
                    padding: '5px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                  }}
                >
                  <span>{act.text}</span>
                  <Pencil size={10} style={{ color: tc.muted, flexShrink: 0 }} />
                </div>
              </>
            )}
          </div>
        ))}

        {isAdding ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ ...inputStyle, width: '78px', flexShrink: 0 }} />
            <input
              ref={addInputRef}
              type="text" value={newText} onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addActivity(); if (e.key === 'Escape') { setIsAdding(false); setNewText(''); setNewTime(''); } }}
              placeholder="Activity description…"
              style={{ ...inputStyle, flex: 1 }} autoFocus
            />
            <button onClick={addActivity} style={{ padding: '4px 8px', backgroundColor: GREEN, color: '#fff' }}><Check size={11} /></button>
            <button onClick={() => { setIsAdding(false); setNewText(''); setNewTime(''); }} style={{ padding: '4px 8px', backgroundColor: tc.actBg, color: tc.muted }}><X size={11} /></button>
          </div>
        ) : (
          <button onClick={beginAdding} className="font-transit-mono flex items-center gap-1.5" style={{ fontSize: '8px', color: TEAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px', padding: '4px 0' }}>
            <Plus size={11} /> Add Activity
          </button>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // TIMELINE MODE — Station Record aesthetic
  // ──────────────────────────────────────────────
  const events = buildEvents(day);
  const total = events.length;

  return (
    <div>
      {events.map((evt, evtIdx) => {
        const isLast = evtIdx === total - 1;

        // ── Departure ── green card, filled teal node
        if (evt.kind === 'depart') {
          return (
            <div key={`depart-${evtIdx}`} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              <div style={{ width: '50px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '8px', paddingTop: '2px' }}>
                <TimeBadge time={evt.time} isDark={isDark} />
              </div>
              <SpineNode filled color={GREEN} isLast={isLast} spineColor={TEAL} />
              <div style={{
                ...cardBase,
                backgroundColor: isDark ? '#0f1f0e' : '#f0fdf4',
                border: `1px solid ${isDark ? '#1a3a1a' : '#bbf7d0'}`,
                borderLeft: `3px solid ${GREEN}`,
                padding: '6px 10px',
              }}>
                <div className="font-transit-mono" style={{ fontSize: '9px', fontWeight: 700, color: GREEN, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Train size={10} />
                  DEPART{evt.station ? `: ${evt.station}` : ''}
                </div>
                {evt.trainInfo?.trainName && (
                  <div className="font-transit-mono" style={{ fontSize: '8px', color: isDark ? '#2a7a3a' : '#4a8a5a', marginTop: '2px' }}>
                    {evt.trainInfo.trainName}{evt.trainInfo.trainNumber ? ` ${evt.trainInfo.trainNumber}` : ''}
                    {evt.trainInfo.carNumber ? ` · Car ${evt.trainInfo.carNumber}` : ''}
                    {evt.trainInfo.seatNumber ? ` · Seat ${evt.trainInfo.seatNumber}` : ''}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // ── Arrival ── red card, filled teal node
        if (evt.kind === 'arrive') {
          return (
            <div key={`arrive-${evtIdx}`} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              <div style={{ width: '50px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '8px', paddingTop: '2px' }}>
                <TimeBadge time={evt.time} isDark={isDark} />
              </div>
              <SpineNode filled color={RED} isLast={isLast} spineColor={TEAL} />
              <div style={{
                ...cardBase,
                backgroundColor: RED,
                border: `1px solid ${isDark ? '#a02008' : '#c02008'}`,
                padding: '6px 10px',
              }}>
                <div className="font-transit-mono" style={{ fontSize: '9px', fontWeight: 700, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={10} />
                  ARRIVE{evt.station ? `: ${evt.station}` : ''}
                </div>
              </div>
            </div>
          );
        }

        // ── Check-in ── orange-accented, filled node
        if (evt.kind === 'checkin') {
          return (
            <div key={`checkin-${evtIdx}`} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              <div style={{ width: '50px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '8px', paddingTop: '2px' }}>
                <TimeBadge time={evt.time} isDark={isDark} />
              </div>
              <SpineNode filled color="#ea580c" isLast={isLast} spineColor={TEAL} />
              <div style={{
                ...cardBase,
                backgroundColor: isDark ? '#1f1208' : '#fff7ed',
                border: `1px solid ${isDark ? '#3a2010' : '#fed7aa'}`,
                borderLeft: '3px solid #ea580c',
                padding: '6px 10px',
              }}>
                <div className="font-transit-mono" style={{ fontSize: '9px', fontWeight: 700, color: '#ea580c', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <LogIn size={10} />
                  CHECK-IN
                </div>
                <div style={{ fontSize: '10px', color: isDark ? '#b87040' : '#9a4a18', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.hotel}</div>
              </div>
            </div>
          );
        }

        // ── Sleep ── teal node, plain card
        if (evt.kind === 'sleep') {
          return (
            <div key={`sleep-${evtIdx}`} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              <div style={{ width: '50px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '8px', paddingTop: '2px' }}>
                <TimeBadge label="NIGHT" isDark={isDark} />
              </div>
              <SpineNode filled color={TEAL} isLast spineColor={TEAL} />
              <div style={{
                ...cardBase,
                backgroundColor: isDark ? '#0f1e1e' : '#f0fdfa',
                border: `1px solid ${isDark ? '#1a3838' : '#99f6e4'}`,
                borderLeft: `3px solid ${TEAL}`,
                padding: '6px 10px',
              }}>
                <div className="font-transit-mono" style={{ fontSize: '9px', fontWeight: 700, color: TEAL, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Bed size={10} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.hotel}</span>
                </div>
              </div>
            </div>
          );
        }

        // ── Activity ── white/light card, empty teal circle
        if (evt.kind === 'activity') {
          const actIdx = evt.idx;
          return (
            <div key={`act-${actIdx}`} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }} className="group">
              {/* Left: time badge or edit input */}
              <div style={{ width: '50px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '8px', paddingTop: '2px' }}>
                {editingIdx === actIdx ? (
                  <input
                    type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                    style={{ ...inputStyle, width: '42px', fontSize: '9px', padding: '2px 4px' }}
                  />
                ) : (
                  <TimeBadge time={evt.time} label={!evt.time ? String(actIdx + 1).padStart(2, '0') : undefined} isDark={isDark} />
                )}
              </div>

              {/* Spine node */}
              <SpineNode filled={false} color={TEAL} isLast={isLast} spineColor={TEAL} />

              {/* Card */}
              <div style={{ ...cardBase }}>
                {editingIdx === actIdx ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input type="text" value={editText} onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      style={{ ...inputStyle, flex: 1 }} autoFocus
                    />
                    <button onClick={saveEdit} style={{ padding: '3px 7px', backgroundColor: GREEN, color: '#fff' }}><Check size={10} /></button>
                    <button onClick={cancelEdit} style={{ padding: '3px 7px', backgroundColor: tc.actBg, color: tc.muted }}><X size={10} /></button>
                    <button onClick={() => deleteActivity(actIdx)} style={{ padding: '3px 7px', backgroundColor: tc.actBg, color: RED }}><Trash2 size={10} /></button>
                  </div>
                ) : (
                  <div
                    onClick={() => startEdit(actIdx)}
                    className="cursor-pointer"
                    style={{
                      fontSize: '11px', color: tc.text,
                      backgroundColor: tc.actBg,
                      border: `1px solid ${tc.actBorder}`,
                      padding: '5px 10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    }}
                  >
                    <span style={{ flex: 1 }}>{evt.text}</span>
                    <Pencil size={9} className="opacity-0 group-hover:opacity-100" style={{ color: tc.muted, flexShrink: 0 }} />
                  </div>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* Add activity */}
      {isAdding ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: '4px' }}>
          <div style={{ width: '50px', flexShrink: 0, paddingRight: '8px' }}>
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ ...inputStyle, width: '42px', fontSize: '9px', padding: '2px 4px' }} />
          </div>
          <div style={{ width: '20px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '8px', height: '8px', border: `2px dashed ${TEAL}`, borderRadius: '50%', marginTop: '3px' }} />
          </div>
          <div style={{ flex: 1, marginLeft: '8px', display: 'flex', gap: '4px' }}>
            <input
              ref={addInputRef}
              type="text" value={newText} onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addActivity(); if (e.key === 'Escape') { setIsAdding(false); setNewText(''); setNewTime(''); } }}
              placeholder="Activity description…"
              style={{ ...inputStyle, flex: 1 }} autoFocus
            />
            <button onClick={addActivity} style={{ padding: '4px 8px', backgroundColor: GREEN, color: '#fff' }}><Check size={11} /></button>
            <button onClick={() => { setIsAdding(false); setNewText(''); setNewTime(''); }} style={{ padding: '4px 8px', backgroundColor: tc.actBg, color: tc.muted }}><X size={11} /></button>
          </div>
        </div>
      ) : (
        <button onClick={beginAdding} className="font-transit-mono flex items-center gap-1.5" style={{ fontSize: '8px', color: TEAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '8px', paddingLeft: '70px' }}>
          <Plus size={11} /> Add Activity
        </button>
      )}
    </div>
  );
};

export default DayTimeline;
