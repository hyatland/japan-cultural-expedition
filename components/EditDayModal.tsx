
import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, MapPin, Check, Mountain, Calendar,
  Bed, Compass, Zap, Navigation, Ticket,
} from 'lucide-react';
import { ItineraryDay, POI, Activity } from '../types';

interface EditDayModalProps {
  day: ItineraryDay;
  onSave: (updated: ItineraryDay) => void;
  onClose: () => void;
}

let _draftPoiId = 0;
const newPoiId = () => `draft_poi_${++_draftPoiId}_${Date.now()}`;

const POI_TYPES: POI['type'][] = [
  'temple', 'shrine', 'garden', 'town', 'hotspring',
  'volcano', 'waterfall', 'canyon', 'museum', 'market', 'station', 'other',
];

const POI_ICONS: Record<string, string> = {
  temple: '⛩️', shrine: '🏯', garden: '🌿', town: '🏘️',
  hotspring: '♨️', volcano: '🌋', waterfall: '💧', canyon: '🏜️',
  museum: '🏛️', market: '🛒', station: '🚉', other: '📍',
};

// Small reusable labeled input
const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}> = ({ label, value, onChange, placeholder, type = 'text', className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
    />
  </div>
);

const EditDayModal: React.FC<EditDayModalProps> = ({ day, onSave, onClose }) => {
  const [draft, setDraft] = useState<ItineraryDay>(() => ({
    ...day,
    // deep-copy arrays/objects so we don't mutate original
    activities: [...day.activities],
    routeOptions: [...day.routeOptions],
    pois: day.pois.map(p => ({ ...p })),
    routeCoords: day.routeCoords.map(c => ({ ...c })),
    companionIds: [...day.companionIds],
    trainInfo: day.trainInfo ? { ...day.trainInfo } : undefined,
  }));

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ─── Helpers ───
  const updateField = <K extends keyof ItineraryDay>(key: K, value: ItineraryDay[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  // Activities
  const setActivityField = (idx: number, field: keyof Activity, val: string) =>
    setDraft(d => {
      const a = [...d.activities];
      a[idx] = { ...a[idx], [field]: val };
      return { ...d, activities: a };
    });
  const addActivity = () =>
    setDraft(d => ({ ...d, activities: [...d.activities, { text: '' }] }));
  const removeActivity = (idx: number) =>
    setDraft(d => ({ ...d, activities: d.activities.filter((_, i) => i !== idx) }));

  // Route Options
  const setRouteOption = (idx: number, val: string) =>
    setDraft(d => { const a = [...d.routeOptions]; a[idx] = val; return { ...d, routeOptions: a }; });
  const addRouteOption = () =>
    setDraft(d => ({ ...d, routeOptions: [...d.routeOptions, ''] }));
  const removeRouteOption = (idx: number) =>
    setDraft(d => ({ ...d, routeOptions: d.routeOptions.filter((_, i) => i !== idx) }));

  // Route Coords
  const setCoordField = (idx: number, field: 'lat' | 'lng', val: string) => {
    const num = parseFloat(val);
    setDraft(d => {
      const coords = d.routeCoords.map((c, i) =>
        i === idx ? { ...c, [field]: isNaN(num) ? c[field] : num } : c
      );
      return { ...d, routeCoords: coords };
    });
  };
  const addCoord = () =>
    setDraft(d => ({ ...d, routeCoords: [...d.routeCoords, { lat: 0, lng: 0 }] }));
  const removeCoord = (idx: number) =>
    setDraft(d => ({ ...d, routeCoords: d.routeCoords.filter((_, i) => i !== idx) }));

  // POIs
  const updatePoi = (poiId: string, key: keyof POI, val: any) =>
    setDraft(d => ({ ...d, pois: d.pois.map(p => p.id === poiId ? { ...p, [key]: val } : p) }));
  const addPoi = () => {
    const newPoi: POI = {
      id: newPoiId(),
      name: '',
      type: 'other',
      coord: { lat: 0, lng: 0 },
      enabled: true,
      note: '',
      difficulty: 'Easy',
    };
    setDraft(d => ({ ...d, pois: [...d.pois, newPoi] }));
  };
  const removePoi = (poiId: string) =>
    setDraft(d => ({ ...d, pois: d.pois.filter(p => p.id !== poiId) }));

  const handleSave = () => {
    onSave({
      ...draft,
      activities: draft.activities.filter(a => a.text.trim() !== ''),
      routeOptions: draft.routeOptions.filter(r => r.trim() !== ''),
    });
  };

  return (
    <>
      {/* Backdrop — clicking it closes the drawer */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer — slides in from the right */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
          <div>
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-0.5">Editing Day {draft.dayNum}</p>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{draft.title || 'Untitled Day'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

          {/* ── Basic Info ── */}
          <section className="space-y-4">
            <SectionHeader icon={<Calendar size={14} />} label="Basic Info" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title" value={draft.title} onChange={v => updateField('title', v)} placeholder="e.g. Arrival in Tokyo" className="col-span-2" />
              <Field label="Date" value={draft.date} onChange={v => updateField('date', v)} placeholder="e.g. 7/5/2026" />
              <Field label="Location" value={draft.where} onChange={v => updateField('where', v)} placeholder="e.g. Shinjuku, Tokyo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Departure Time" value={draft.departureTime || ''} onChange={v => updateField('departureTime', v)} type="time" />
              <Field label="Arrival Time" value={draft.arrivalTime || ''} onChange={v => updateField('arrivalTime', v)} type="time" />
            </div>
          </section>

          {/* ── Overnight ── */}
          <section className="space-y-3">
            <SectionHeader icon={<Bed size={14} />} label="Overnight / Base Camp" />
            <Field label="Sleep" value={draft.sleep} onChange={v => updateField('sleep', v)} placeholder="e.g. Park Hyatt Tokyo, Shinjuku" />
          </section>

          {/* ── Booking Reference ── */}
          <section className="space-y-4">
            <SectionHeader icon={<Ticket size={14} />} label="Hotel Booking" />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Confirmation #"
                value={draft.bookingRef || ''}
                onChange={v => updateField('bookingRef', v)}
                placeholder="e.g. EXP-38271049"
              />
              <Field
                label="Booking Note"
                value={draft.bookingNote || ''}
                onChange={v => updateField('bookingNote', v)}
                placeholder="e.g. Free cancellation until 7/3"
              />
              <Field
                label="Check-in Time"
                value={draft.checkInTime || ''}
                onChange={v => updateField('checkInTime', v)}
                type="time"
              />
              <Field
                label="Check-out Time"
                value={draft.checkOutTime || ''}
                onChange={v => updateField('checkOutTime', v)}
                type="time"
              />
            </div>
            <Field
              label="Booking Link (Expedia / Booking.com / etc.)"
              value={draft.bookingUrl || ''}
              onChange={v => updateField('bookingUrl', v)}
              placeholder="https://www.expedia.com/trips/..."
            />
          </section>

          {/* ── Terrain ── */}
          <section className="space-y-3">
            <SectionHeader icon={<Mountain size={14} />} label="Terrain" />
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Terrain Description</label>
              <textarea
                value={draft.terrain}
                onChange={e => updateField('terrain', e.target.value)}
                placeholder="Describe the terrain for this day..."
                rows={2}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 resize-none transition-all"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => updateField('isHighland', !draft.isHighland)}
                className={`w-10 h-5 rounded-full transition-all relative ${draft.isHighland ? 'bg-yellow-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${draft.isHighland ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">Mountain / Highland Day</span>
              {draft.isHighland && <span className="text-yellow-500 text-xs">⚠️</span>}
            </label>
          </section>

          {/* ── Activities ── */}
          <section className="space-y-3">
            <SectionHeader icon={<Zap size={14} />} label="Activities" />
            <div className="space-y-2">
              {draft.activities.map((act, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  {/* Time pill */}
                  <input
                    type="time"
                    value={act.time || ''}
                    onChange={e => setActivityField(idx, 'time', e.target.value)}
                    className="w-[90px] shrink-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                  <input
                    value={act.text}
                    onChange={e => setActivityField(idx, 'text', e.target.value)}
                    placeholder={`Activity ${idx + 1}`}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                  <button onClick={() => removeActivity(idx)} className="p-2 text-slate-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button onClick={addActivity} className="flex items-center gap-1.5 text-xs text-red-400 font-bold px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/5 w-full justify-center transition-all">
                <Plus size={14} /> Add Activity
              </button>
            </div>
          </section>

          {/* ── Transport Options ── */}
          <section className="space-y-3">
            <SectionHeader icon={<Compass size={14} />} label="Transport Options" />
            <div className="space-y-2">
              {draft.routeOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={e => setRouteOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                  <button onClick={() => removeRouteOption(idx)} className="p-2 text-slate-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button onClick={addRouteOption} className="flex items-center gap-1.5 text-xs text-red-400 font-bold px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/5 w-full justify-center transition-all">
                <Plus size={14} /> Add Option
              </button>
            </div>
          </section>

          {/* ── Points of Interest ── */}
          <section className="space-y-3">
            <SectionHeader icon={<MapPin size={14} />} label="Points of Interest" />
            <div className="space-y-3">
              {draft.pois.map(poi => (
                <div key={poi.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base">{POI_ICONS[poi.type]}</span>
                    <button onClick={() => removePoi(poi.id)} className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Name</label>
                      <input
                        value={poi.name}
                        onChange={e => updatePoi(poi.id, 'name', e.target.value)}
                        placeholder="e.g. Senso-ji Temple"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Type</label>
                      <select
                        value={poi.type}
                        onChange={e => updatePoi(poi.id, 'type', e.target.value as POI['type'])}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                      >
                        {POI_TYPES.map(t => (
                          <option key={t} value={t}>{POI_ICONS[t]} {t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Difficulty</label>
                      <select
                        value={poi.difficulty || 'Easy'}
                        onChange={e => updatePoi(poi.id, 'difficulty', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                      >
                        {['Easy', 'Moderate', 'Technical', 'Extreme'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Coordinates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={poi.coord.lat}
                        onChange={e => updatePoi(poi.id, 'coord', { ...poi.coord, lat: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={poi.coord.lng}
                        onChange={e => updatePoi(poi.id, 'coord', { ...poi.coord, lng: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                      />
                    </div>
                  </div>
                  {/* Note / Description */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Note / Description</label>
                    <input
                      value={poi.note || ''}
                      onChange={e => updatePoi(poi.id, 'note', e.target.value)}
                      placeholder="Short description..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                    />
                  </div>
                  {/* Elevation */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Elevation</label>
                      <input
                        value={poi.elevation || ''}
                        onChange={e => updatePoi(poi.id, 'elevation', e.target.value)}
                        placeholder="e.g. 150m"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Image URL</label>
                      <input
                        value={poi.imageUrl || ''}
                        onChange={e => updatePoi(poi.id, 'imageUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                      />
                    </div>
                  </div>
                  {/* Visibility toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => updatePoi(poi.id, 'enabled', !poi.enabled)}
                      className={`w-8 h-4 rounded-full transition-all relative ${poi.enabled ? 'bg-green-600' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${poi.enabled ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-xs text-slate-400">{poi.enabled ? 'Visible on map' : 'Hidden from map'}</span>
                  </label>
                </div>
              ))}
              <button onClick={addPoi} className="flex items-center gap-1.5 text-xs text-blue-400 font-bold px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 w-full justify-center transition-all">
                <Plus size={14} /> Add Point of Interest
              </button>
            </div>
          </section>

          {/* ── Route Coordinates ── */}
          <section className="space-y-3">
            <SectionHeader icon={<Navigation size={14} />} label="Route Coordinates" />
            <p className="text-[10px] text-slate-500">These define the path drawn on the map. Add waypoints in order from start to end.</p>
            <div className="space-y-2">
              {draft.routeCoords.map((coord, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-[10px] font-black text-slate-600 w-5 text-right shrink-0">{idx + 1}</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={coord.lat}
                    onChange={e => setCoordField(idx, 'lat', e.target.value)}
                    placeholder="Lat"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={coord.lng}
                    onChange={e => setCoordField(idx, 'lng', e.target.value)}
                    placeholder="Lng"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                  <button onClick={() => removeCoord(idx)} className="p-2 text-slate-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button onClick={addCoord} className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 w-full justify-center transition-all">
                <Plus size={14} /> Add Waypoint
              </button>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-black text-sm py-3 rounded-xl hover:bg-red-500 transition-all shadow-lg shadow-red-900/30"
          >
            <Check size={18} /> Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-6 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

// ─── SectionHeader helper ───
const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
    <span className="text-red-500 dark:text-red-400">{icon}</span>
    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

export default EditDayModal;
