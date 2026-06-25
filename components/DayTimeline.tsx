import React, { useState, useRef } from 'react';
import { Train, MapPin, Bed, LogIn, Plus, Check, X, Pencil, Trash2, GripVertical } from 'lucide-react';
import { ItineraryDay, Activity, TrainInfo } from '../types';

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

  const hasDep =
    day.departureTime ||
    day.trainInfo?.departureStation ||
    day.trainInfo?.departureTime;

  const hasArr =
    day.arrivalTime ||
    day.trainInfo?.arrivalStation ||
    day.trainInfo?.arrivalTime;

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

    const aT =
      a.kind === 'activity'
        ? toMins(a.time, 50000 + a.idx)
        : toMins((a as { time?: string }).time, 49000);
    const bT =
      b.kind === 'activity'
        ? toMins(b.time, 50000 + b.idx)
        : toMins((b as { time?: string }).time, 49000);

    if (aT !== bT) return aT - bT;
    return (KIND_ORDER[a.kind] ?? 5) - (KIND_ORDER[b.kind] ?? 5);
  });
}

// ─── Activity dot colours cycling ───
const DOT_COLORS = [
  'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]',
  'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]',
  'bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]',
  'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
];

// ─── Shared inline-edit row component ───
interface EditRowProps {
  text: string;
  time: string;
  onTextChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  autoFocus?: boolean;
}
const EditRow: React.FC<EditRowProps> = ({
  text, time, onTextChange, onTimeChange, onSave, onCancel, onDelete, autoFocus,
}) => (
  <div className="flex gap-1.5 items-center w-full">
    <input
      type="time"
      value={time}
      onChange={e => onTimeChange(e.target.value)}
      className="w-[82px] shrink-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/50"
    />
    <input
      type="text"
      value={text}
      onChange={e => onTextChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') onSave();
        if (e.key === 'Escape') onCancel();
      }}
      placeholder="Activity description…"
      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50"
      autoFocus={autoFocus}
    />
    <button onClick={onSave} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shrink-0"><Check size={13} /></button>
    <button onClick={onCancel} className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all shrink-0"><X size={13} /></button>
    <button onClick={onDelete} className="p-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-all shrink-0"><Trash2 size={13} /></button>
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
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTime, setNewTime] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

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

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditText('');
    setEditTime('');
  };

  const deleteActivity = (idx: number) => {
    onUpdateActivities(day.activities.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const addActivity = () => {
    if (!newText.trim()) return;
    onUpdateActivities([...day.activities, { text: newText.trim(), time: newTime || undefined }]);
    setNewText('');
    setNewTime('');
    setIsAdding(false);
  };

  const beginAdding = () => {
    setIsAdding(true);
    setTimeout(() => addInputRef.current?.focus(), 50);
  };

  // ── Drag handlers ──
  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
    setDraggedIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx;
    setDropTargetIdx(idx);
  };

  const handleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from !== null && to !== null && from !== to) {
      const reordered = [...day.activities];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      onUpdateActivities(reordered);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedIdx(null);
    setDropTargetIdx(null);
  };

  // ──────────────────────────────────────────────
  // LIST MODE
  // ──────────────────────────────────────────────
  if (mode === 'list') {
    return (
      <div className="space-y-1.5">
        {day.activities.map((act, idx) => (
          <div
            key={idx}
            draggable={editingIdx !== idx}
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            className={`group flex items-center gap-2 rounded-lg transition-all duration-150 ${
              draggedIdx === idx ? 'opacity-40 scale-[0.98]' : 'opacity-100'
            } ${
              dropTargetIdx === idx && draggedIdx !== idx
                ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                : ''
            }`}
          >
            {editingIdx === idx ? (
              <EditRow
                text={editText}
                time={editTime}
                onTextChange={setEditText}
                onTimeChange={setEditTime}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onDelete={() => deleteActivity(idx)}
                autoFocus
              />
            ) : (
              <>
                {/* Drag handle */}
                <div
                  className="shrink-0 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 transition-colors touch-none"
                  title="Drag to reorder"
                >
                  <GripVertical size={14} />
                </div>

                {act.time && (
                  <span className="shrink-0 text-[10px] font-black tabular-nums text-blue-600 dark:text-blue-400 w-[38px] text-right">
                    {act.time}
                  </span>
                )}
                <div
                  className={`flex-1 text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800/70 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/20 transition-all leading-snug cursor-pointer ${!act.time ? 'ml-0' : ''}`}
                  onClick={() => startEdit(idx)}
                >
                  {act.text}
                </div>
                <button
                  onClick={() => startEdit(idx)}
                  className="shrink-0 p-1 text-slate-400 dark:text-slate-700 hover:text-blue-500 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil size={12} />
                </button>
              </>
            )}
          </div>
        ))}

        {/* Add row */}
        {isAdding ? (
          <div className="flex gap-1.5 items-center mt-1">
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="w-[82px] shrink-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <input
              ref={addInputRef}
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addActivity();
                if (e.key === 'Escape') { setIsAdding(false); setNewText(''); setNewTime(''); }
              }}
              placeholder="Activity description…"
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50"
              autoFocus
            />
            <button onClick={addActivity} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shrink-0"><Check size={13} /></button>
            <button
              onClick={() => { setIsAdding(false); setNewText(''); setNewTime(''); }}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button onClick={beginAdding} className="flex items-center gap-2 mt-1 ml-6 text-[11px] font-bold text-slate-500 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            <Plus size={13} /> Add activity
          </button>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // TIMELINE MODE — unified chronological view
  // ──────────────────────────────────────────────
  const events = buildEvents(day);
  const total = events.length;

  return (
    <div className="space-y-0">
      {events.map((evt, evtIdx) => {
        const isLast = evtIdx === total - 1;

        // ── Departure ──
        if (evt.kind === 'depart') {
          return (
            <div key={`depart-${evtIdx}`} className="flex items-stretch gap-0">
              <div className="w-14 shrink-0 flex flex-col items-end pr-3 pt-2.5">
                {evt.time && (
                  <span className="text-[11px] font-black tabular-nums text-emerald-600 dark:text-emerald-400 leading-none">
                    {evt.time}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center w-5 shrink-0">
                <div className="mt-2.5 w-2.5 h-2.5 rounded-full shrink-0 z-10 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] ring-2 ring-white dark:ring-slate-900" />
                {!isLast && <div className="flex-1 w-px bg-gradient-to-b from-emerald-400/40 dark:from-emerald-600/40 to-slate-200/20 dark:to-slate-800/20 mt-1" />}
              </div>
              <div className="flex-1 mb-1.5 ml-2 text-[11px] bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Train size={11} />
                  <span>Depart{evt.station ? ` · ${evt.station}` : ''}</span>
                </div>
                {evt.trainInfo?.trainName && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-700 mt-0.5">
                    {evt.trainInfo.trainName}
                    {evt.trainInfo.trainNumber ? ` ${evt.trainInfo.trainNumber}` : ''}
                    {evt.trainInfo.carNumber ? ` · Car ${evt.trainInfo.carNumber}` : ''}
                    {evt.trainInfo.seatNumber ? ` · Seat ${evt.trainInfo.seatNumber}` : ''}
                  </p>
                )}
              </div>
            </div>
          );
        }

        // ── Arrival ──
        if (evt.kind === 'arrive') {
          return (
            <div key={`arrive-${evtIdx}`} className="flex items-stretch gap-0">
              <div className="w-14 shrink-0 flex flex-col items-end pr-3 pt-2.5">
                {evt.time && (
                  <span className="text-[11px] font-black tabular-nums text-orange-600 dark:text-orange-400 leading-none">
                    {evt.time}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center w-5 shrink-0">
                <div className="mt-2.5 w-2.5 h-2.5 rounded-full shrink-0 z-10 bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.8)] ring-2 ring-white dark:ring-slate-900" />
                {!isLast && <div className="flex-1 w-px bg-gradient-to-b from-orange-400/40 dark:from-orange-600/40 to-slate-200/20 dark:to-slate-800/20 mt-1" />}
              </div>
              <div className="flex-1 mb-1.5 ml-2 text-[11px] bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800/30">
                <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-bold">
                  <MapPin size={11} />
                  <span>Arrive{evt.station ? ` · ${evt.station}` : ''}</span>
                </div>
              </div>
            </div>
          );
        }

        // ── Check-in ──
        if (evt.kind === 'checkin') {
          return (
            <div key={`checkin-${evtIdx}`} className="flex items-stretch gap-0">
              <div className="w-14 shrink-0 flex flex-col items-end pr-3 pt-2.5">
                {evt.time && (
                  <span className="text-[11px] font-black tabular-nums text-orange-600 dark:text-orange-400 leading-none">
                    {evt.time}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center w-5 shrink-0">
                <div className="mt-2.5 w-2.5 h-2.5 rounded-full shrink-0 z-10 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] ring-2 ring-white dark:ring-slate-900" />
                {!isLast && <div className="flex-1 w-px bg-gradient-to-b from-orange-400/40 dark:from-orange-600/40 to-slate-200/20 dark:to-slate-800/20 mt-1" />}
              </div>
              <div className="flex-1 mb-1.5 ml-2 text-[11px] bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800/30">
                <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-bold">
                  <LogIn size={11} />
                  <span>Check-in</span>
                </div>
                <p className="text-[10px] text-orange-600 dark:text-orange-700 mt-0.5 truncate">{evt.hotel}</p>
              </div>
            </div>
          );
        }

        // ── Sleep / Overnight ──
        if (evt.kind === 'sleep') {
          return (
            <div key={`sleep-${evtIdx}`} className="flex items-stretch gap-0">
              <div className="w-14 shrink-0 flex flex-col items-end pr-3 pt-2.5">
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-600 leading-none uppercase tracking-wide">
                  night
                </span>
              </div>
              <div className="flex flex-col items-center w-5 shrink-0">
                <div className="mt-2.5 w-2.5 h-2.5 rounded-full shrink-0 z-10 bg-indigo-400 dark:bg-indigo-900 ring-2 ring-indigo-200 dark:ring-indigo-700/40" />
              </div>
              <div className="flex-1 mb-1.5 ml-2 text-[11px] bg-indigo-50 dark:bg-indigo-950/20 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800/20">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold">
                  <Bed size={11} />
                  <span className="truncate">{evt.hotel}</span>
                </div>
              </div>
            </div>
          );
        }

        // ── Activity ──
        if (evt.kind === 'activity') {
          const actIdx = evt.idx;
          const dotColor = DOT_COLORS[actIdx % DOT_COLORS.length];

          return (
            <div key={`act-${actIdx}`} className="flex items-stretch gap-0 group">
              {/* Left: time / edit time input */}
              <div className="w-14 shrink-0 flex flex-col items-end pr-3 pt-2.5">
                {editingIdx === actIdx ? (
                  <input
                    type="time"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-1 py-0.5 text-[9px] text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                ) : evt.time ? (
                  <span className="text-[11px] font-black tabular-nums text-blue-600 dark:text-blue-400 leading-none">
                    {evt.time}
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-700 tabular-nums leading-none">
                    {String(actIdx + 1).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Centre: dot + spine */}
              <div className="flex flex-col items-center w-5 shrink-0">
                <div
                  className={`mt-2.5 w-2.5 h-2.5 rounded-full shrink-0 z-10 ${dotColor} ring-2 ring-white dark:ring-slate-900 transition-transform group-hover:scale-125`}
                />
                {!isLast && (
                  <div className="flex-1 w-px bg-gradient-to-b from-slate-300/50 dark:from-slate-600/50 to-slate-200/20 dark:to-slate-800/20 mt-1" />
                )}
              </div>

              {/* Right: card or inline edit */}
              <div className="flex-1 mb-1.5 ml-2">
                {editingIdx === actIdx ? (
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500/50"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shrink-0"><Check size={13} /></button>
                    <button onClick={cancelEdit} className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all shrink-0"><X size={13} /></button>
                    <button onClick={() => deleteActivity(actIdx)} className="p-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-all shrink-0"><Trash2 size={13} /></button>
                  </div>
                ) : (
                  <div
                    className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800/70 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/20 transition-all leading-snug cursor-pointer flex items-start justify-between gap-2"
                    onClick={() => startEdit(actIdx)}
                  >
                    <span>{evt.text}</span>
                    <Pencil
                      size={11}
                      className="shrink-0 mt-0.5 text-slate-400 dark:text-slate-700 group-hover:text-slate-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* ── Add activity row ── */}
      {isAdding ? (
        <div className="flex items-center gap-0 mt-1">
          <div className="w-14 shrink-0 pr-3">
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-1 text-[10px] text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <div className="w-5 shrink-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <div className="flex-1 ml-2 flex gap-1.5">
            <input
              ref={addInputRef}
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addActivity();
                if (e.key === 'Escape') { setIsAdding(false); setNewText(''); setNewTime(''); }
              }}
              placeholder="Activity description…"
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50"
              autoFocus
            />
            <button onClick={addActivity} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shrink-0"><Check size={13} /></button>
            <button
              onClick={() => { setIsAdding(false); setNewText(''); setNewTime(''); }}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={beginAdding}
          className="flex items-center gap-2 mt-2 ml-[76px] text-[11px] font-bold text-slate-500 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={13} /> Add activity
        </button>
      )}
    </div>
  );
};

export default DayTimeline;
