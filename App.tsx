
import React, { useState, useEffect, useCallback } from 'react';
import { JAPAN_ITINERARY, DEFAULT_COMPANIONS } from './constants';
import { ItineraryDay, Companion, POI, TrainInfo, Activity } from './types';
import Map from './components/Map';
import CompanionManager from './components/CompanionManager';
import TrainInfoPanel from './components/TrainInfoPanel';
import POIToggleList from './components/POIToggleList';
import EditDayModal from './components/EditDayModal';
import DayTimeline from './components/DayTimeline';
import PackingList from './components/PackingList';
import PrintView from './components/PrintView';
import { fetchNearbyPOIs } from './services/overpassService';
import { useTheme } from './ThemeContext';
import {
  Calendar, MapPin, Bed, ChevronRight, Compass,
  Zap, Waves, Layers, ChevronUp, ChevronDown,
  Maximize2, Minimize2, GripVertical, AlertTriangle, Pencil,
  Ticket, ExternalLink, Moon, Sun, Printer, ShoppingBag,
} from 'lucide-react';

// ─── Legend ───
const Legend = () => {
  const categories = [
    { label: 'Temple', color: 'bg-[#f87171]' },
    { label: 'Shrine', color: 'bg-[#fb923c]' },
    { label: 'Garden', color: 'bg-[#4ade80]' },
    { label: 'Town', color: 'bg-[#818cf8]' },
    { label: 'Hot Spring', color: 'bg-[#38bdf8]' },
    { label: 'Museum', color: 'bg-[#fbbf24]' },
    { label: 'Market', color: 'bg-[#34d399]' },
    { label: 'Station', color: 'bg-[#60a5fa]' },
  ];
  const routes = [
    { label: 'Standard Route', color: 'bg-[#ea580c]', dashed: false },
    { label: 'Mountain Route', color: 'bg-[#facc15]', dashed: true },
  ];
  return (
    <div className="hidden sm:block absolute bottom-10 left-10 z-10 bg-white/95 dark:bg-[#111]/95 backdrop-blur-sm p-4 rounded-xl border border-slate-100 dark:border-white/10 shadow-lg pointer-events-auto max-w-[200px]">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
        <Layers size={14} className="text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Legend</span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase mb-2">Destinations</p>
          <div className="grid grid-cols-2 gap-1.5">
            {categories.map(cat => (
              <div key={cat.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${cat.color}`} />
                <span className="text-[10px] text-slate-700 dark:text-slate-300">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase mb-2">Routes</p>
          <div className="space-y-1.5">
            {routes.map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <div className={`h-1 flex-1 min-w-[24px] rounded-full ${r.color}`} style={r.dashed ? { backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 4px,#020617 4px,#020617 8px)' } : {}} />
                <span className="text-[10px] text-slate-700 dark:text-slate-300">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── City label extractor ───
const cityLabel = (day: ItineraryDay): string => {
  // Prefer arrivalStation from trainInfo (most precise)
  if (day.trainInfo?.arrivalStation) {
    return day.trainInfo.arrivalStation.split(' ')[0].toUpperCase();
  }
  // Fallback: parse title
  let t = day.title.replace(/\s*\([^)]*\)/g, '').replace(/\s+with\s+\S+/gi, '').trim();
  if (t.includes('→')) t = (t.split('→').pop() ?? t).trim();
  return (t.split(/\s+/)[0] ?? t).toUpperCase();
};

// ─── App ───
const App: React.FC = () => {
  const { toggleTheme, theme } = useTheme();
  const [days, setDays] = useState<ItineraryDay[]>(JAPAN_ITINERARY);
  const [companions, setCompanions] = useState<Companion[]>(DEFAULT_COMPANIONS);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(JAPAN_ITINERARY[0].dayNum);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);

  // Drag & drop
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Overpass suggestions
  const [suggestedPois, setSuggestedPois] = useState<POI[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Day plan view mode
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');

  // Main content view
  const [mainView, setMainView] = useState<'map' | 'packing' | 'print'>('map');

  // Detail card minimized state — start minimized so map is visible
  const [isCardMinimized, setIsCardMinimized] = useState(true);

  // Switch view and close any open edit drawer
  const switchView = (v: 'map' | 'packing' | 'print') => {
    setEditingDay(null);
    setMainView(v);
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selectedDay = days.find(d => d.dayNum === selectedDayNum) || days[0];

  const handleDaySelect = (dayNum: number) => {
    setSelectedDayNum(dayNum);
    setSuggestedPois([]);
    setIsCardMinimized(true);
    if (isMobile) { setIsSidebarExpanded(false); setIsDetailExpanded(false); }
  };

  // ─── Drag & Drop ───
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const reordered = [...days];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    const renumbered = reordered.map((day, i) => ({ ...day, dayNum: i + 1 }));
    setDays(renumbered);
    setSelectedDayNum(renumbered[dropIdx].dayNum);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // ─── Edit Day ───
  const handleSaveDay = useCallback((updated: ItineraryDay) => {
    setDays(prev => prev.map(d => d.dayNum === updated.dayNum ? updated : d));
    setEditingDay(null);
  }, []);

  // ─── Companions ───
  const handleDayCompanionsChange = useCallback((ids: string[]) => {
    setDays(prev => prev.map(d => d.dayNum === selectedDayNum ? { ...d, companionIds: ids } : d));
  }, [selectedDayNum]);

  // ─── Train Info ───
  const handleTrainInfoChange = useCallback((info: TrainInfo) => {
    setDays(prev => prev.map(d => d.dayNum === selectedDayNum ? { ...d, trainInfo: info } : d));
  }, [selectedDayNum]);

  const handleTimingChange = useCallback((field: 'departureTime' | 'arrivalTime', value: string) => {
    setDays(prev => prev.map(d => {
      if (d.dayNum !== selectedDayNum) return d;
      const updated = { ...d, [field]: value };
      if (updated.departureTime && updated.arrivalTime) {
        const [dH, dM] = updated.departureTime.split(':').map(Number);
        const [aH, aM] = updated.arrivalTime.split(':').map(Number);
        const dep = dH * 60 + dM, arr = aH * 60 + aM;
        updated.travelDurationMinutes = arr >= dep ? arr - dep : (1440 - dep) + arr;
      }
      return updated;
    }));
  }, [selectedDayNum]);

  // ─── POIs ───
  const handleTogglePoi = useCallback((poiId: string) => {
    setDays(prev => prev.map(d => {
      if (d.dayNum !== selectedDayNum) return d;
      return { ...d, pois: d.pois.map(p => p.id === poiId ? { ...p, enabled: !p.enabled } : p) };
    }));
  }, [selectedDayNum]);

  const handleAddPoi = useCallback((poi: POI) => {
    setDays(prev => prev.map(d => {
      if (d.dayNum !== selectedDayNum) return d;
      if (d.pois.find(p => p.id === poi.id)) return d;
      return { ...d, pois: [...d.pois, { ...poi, enabled: true }] };
    }));
    setSuggestedPois(prev => prev.filter(p => p.id !== poi.id));
  }, [selectedDayNum]);

  const handleRemovePoi = useCallback((poiId: string) => {
    setDays(prev => prev.map(d => {
      if (d.dayNum !== selectedDayNum) return d;
      return { ...d, pois: d.pois.filter(p => p.id !== poiId) };
    }));
  }, [selectedDayNum]);

  const handleUpdateActivities = useCallback((activities: Activity[]) => {
    setDays(prev => prev.map(d =>
      d.dayNum === selectedDayNum ? { ...d, activities } : d
    ));
  }, [selectedDayNum]);

  const handleSearchNearby = useCallback(async () => {
    const day = days.find(d => d.dayNum === selectedDayNum);
    if (!day || !day.routeCoords[0]) return;
    setIsLoadingSuggestions(true);
    const center = day.routeCoords[day.routeCoords.length > 1 ? 1 : 0];
    const results = await fetchNearbyPOIs(center, 4000, day.pois.map(p => p.name));
    setSuggestedPois(results);
    setIsLoadingSuggestions(false);
  }, [days, selectedDayNum]);

  const isDark = theme === 'dark';

  // ── Theme-aware color tokens ──
  const sb = {
    bg:          isDark ? '#0e0e0e' : '#f2f1ed',
    listBg:      isDark ? '#141414' : '#f7f6f3',
    tripMuted:   isDark ? '#4e4c48' : '#c0bcb6',
    tripBold:    isDark ? '#f2f1ed' : '#0e0e0e',
    subText:     isDark ? '#3a3936' : '#a8a4a0',
    btnBg:       isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    btnColor:    isDark ? '#888' : '#666',
    rowBg:       isDark ? '#141414' : '#ffffff',
    rowBgHl:     isDark ? '#1a1c22' : '#faf9f3',
    rowRule:     isDark ? '#222222' : '#ebe9e5',
    rowRuleHl:   isDark ? '#282a32' : '#e2ddd4',
    badgeBg:     isDark ? '#2e2e2e' : '#e2e0dc',
    badgeTxt:    isDark ? '#888'    : '#706e6a',
    cityColor:   isDark ? '#dadad8' : '#1a1816',
    cityColorHl: isDark ? '#bc9224' : '#8a6c10',
    dateColor:   isDark ? '#484644' : '#a0a09c',
    dateColorHl: isDark ? '#948c48' : '#8a7820',
    routeMeta:   isDark ? '#3a3836' : '#c8c4c0',
    dragHandle:  isDark ? '#333'    : '#c0bebb',
    editBtn:     isDark ? '#555'    : '#aaa8a4',
  };

  const cd = {
    bg:          isDark ? '#141414' : '#ffffff',
    border:      isDark ? '#2a2a2a' : '#e0deda',
    rule:        isDark ? '#252525' : '#eeece8',
    label:       isDark ? '#4a4846' : '#a8a4a0',
    text:        isDark ? '#d8d6d2' : '#1a1816',
    textMuted:   isDark ? '#585654' : '#7a7876',
    accentRed:   '#d02810',
    terrainBg:   isDark ? '#1c1c1c' : '#faf9f7',
    terrainRule: isDark ? '#d02810' : '#d02810',
    trainBg:     isDark ? '#1c1c1c' : '#f5f4f0',
    trainBorder: isDark ? '#2e2e2e' : '#dcdad6',
    chipBorder:  isDark ? 'rgba(208,40,16,0.5)' : '#d02810',
    chipText:    isDark ? '#e06040' : '#d02810',
    sectionBg:   isDark ? '#1a1a1a' : '#f9f8f6',
    tipBg:       isDark ? '#1e1a12' : '#fffbf0',
    tipBorder:   isDark ? '#3a3018' : '#f0e8c8',
    tipText:     isDark ? '#a89060' : '#8a6a10',
    inputBg:     isDark ? '#1a1a1a' : '#f5f4f0',
    inputBorder: isDark ? '#333'    : '#d8d6d2',
    inputText:   isDark ? '#d8d6d2' : '#1a1816',
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100svh] w-full bg-[#f7f6f3] dark:bg-[#0f0f0f] text-slate-950 dark:text-slate-100 overflow-hidden">

      {/* ─── Edit Modal ─── */}
      {editingDay && (
        <EditDayModal
          day={editingDay}
          onSave={handleSaveDay}
          onClose={() => setEditingDay(null)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <div className={`fixed lg:relative inset-x-0 bottom-0 lg:inset-auto w-full lg:w-[400px] flex flex-col z-40 shrink-0 transition-transform duration-500 ease-in-out h-[90svh] lg:h-full overflow-hidden ${
        isMobile ? (isSidebarExpanded ? 'translate-y-0' : 'translate-y-[calc(90svh-100px)]') : 'translate-y-0'
      }`} style={{ backgroundColor: sb.bg }}>

        {/* ── Transit Header ── */}
        <div
          onClick={isMobile ? () => setIsSidebarExpanded(!isSidebarExpanded) : undefined}
          className="shrink-0 cursor-pointer lg:cursor-default"
          style={{ backgroundColor: sb.bg, borderBottom: '2px solid #d02810', padding: '16px 36px 14px' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-transit-city leading-none" style={{ fontSize: '42px', lineHeight: 1 }}>
                <span style={{ color: sb.tripMuted }}>TRIP </span>
                <span style={{ color: sb.tripBold }}>JPN</span>
              </div>
              <div className="font-transit-mono mt-2" style={{ fontSize: '8px', color: sb.subText, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Japan Cultural Expedition · July 2026
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                style={{ background: sb.btnBg, borderRadius: '50%', padding: '7px', color: sb.btnColor }}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              {isMobile && (
                <div style={{ background: sb.btnBg, borderRadius: '50%', padding: '7px', color: sb.btnColor }}>
                  {isSidebarExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Day List ── */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: sb.listBg }}>
          {days.map((day, idx) => {
            const isActive = selectedDayNum === day.dayNum;
            const city = cityLabel(day);
            const dep = day.trainInfo?.departureStation;
            const arr = day.trainInfo?.arrivalStation;

            if (isActive) {
              return (
                <div
                  key={`${day.dayNum}-active`}
                  className="relative cursor-pointer select-none"
                  style={{ backgroundColor: '#d02810' }}
                  onClick={() => { setIsCardMinimized(v => !v); }}
                >
                  <div className="absolute left-0 top-0 bottom-0" style={{ width: '3px', backgroundColor: '#ff5a32' }} />
                  <div style={{ padding: '14px 36px 0 36px' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-transit-mono" style={{ fontSize: '10px', color: 'rgba(255,175,155,0.9)' }}>
                        {String(day.dayNum).padStart(2, '0')}
                      </span>
                      <span className="font-transit-mono" style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                        {day.date}
                      </span>
                      {day.isHighland && (
                        <span className="font-transit-mono" style={{ fontSize: '8px', color: 'rgba(255,210,100,0.85)', letterSpacing: '0.15em' }}>· HIGHLAND</span>
                      )}
                    </div>
                    <div className="font-transit-city" style={{ fontSize: '88px', lineHeight: 0.9, color: '#fff', marginLeft: '-2px', letterSpacing: '-0.02em' }}>
                      {city}
                    </div>
                    <div className="font-transit-mono" style={{ fontSize: '8px', color: 'rgba(255,185,165,0.85)', marginTop: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                      {city}, JAPAN
                    </div>
                  </div>
                  <div style={{ margin: '12px 36px 18px', backgroundColor: '#faf9f7' }}>
                    <div className="flex">
                      <div className="flex-1" style={{ padding: '10px 14px', borderRight: '1px solid #c8c4be' }}>
                        <div className="font-transit-mono" style={{ fontSize: '7px', fontWeight: 700, color: '#958c84', marginBottom: '4px', letterSpacing: '0.1em' }}>DEPARTURE:</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0e0e0e', textTransform: 'uppercase' }}>{dep ?? '—'}</div>
                      </div>
                      <div className="flex-1" style={{ padding: '10px 14px' }}>
                        <div className="font-transit-mono" style={{ fontSize: '7px', fontWeight: 700, color: '#958c84', marginBottom: '4px', letterSpacing: '0.1em' }}>ARRIVAL:</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0e0e0e', textTransform: 'uppercase' }}>{arr ?? day.sleep}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingDay(day); }}
                    className="absolute top-3 right-3"
                    style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '4px', color: 'rgba(255,220,210,0.7)' }}
                    title="Edit day"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              );
            }

            /* ── INACTIVE ROW ── */
            const rowBg      = day.isHighland ? sb.rowBgHl  : sb.rowBg;
            const rowRule    = day.isHighland ? sb.rowRuleHl : sb.rowRule;
            const badgeBg    = day.isHighland ? '#bc9224'   : sb.badgeBg;
            const badgeTxt   = day.isHighland ? '#0e0e0e'   : sb.badgeTxt;
            const cityColor  = day.isHighland ? sb.cityColorHl : sb.cityColor;
            const dateColor  = day.isHighland ? sb.dateColorHl : sb.dateColor;

            return (
              <div
                key={`${day.dayNum}-${day.title}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                onClick={() => handleDaySelect(day.dayNum)}
                className="cursor-pointer group transition-colors"
                style={{
                  backgroundColor: rowBg,
                  borderTop: `1px solid ${rowRule}`,
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '36px',
                  paddingRight: '36px',
                  ...(dragOverIdx === idx && dragIdx !== idx ? { borderTop: '2px solid #d02810' } : {}),
                  ...(dragIdx === idx ? { opacity: 0.4 } : {}),
                }}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-2" style={{ color: sb.dragHandle }}>
                  <GripVertical size={11} />
                </div>
                <div className="shrink-0 flex items-center justify-center font-transit-mono"
                     style={{ width: '28px', height: '20px', backgroundColor: badgeBg, fontSize: '8px', fontWeight: 700, color: badgeTxt }}>
                  {String(day.dayNum).padStart(2, '0')}
                </div>
                <span className="font-transit-mono ml-2.5 shrink-0" style={{ fontSize: '9px', color: dateColor }}>
                  {day.date}
                </span>
                <span className="font-transit-city ml-3 shrink-0" style={{ fontSize: '14px', color: cityColor, textTransform: 'uppercase' }}>
                  {city}
                </span>
                {dep && arr && (
                  <span className="font-transit-mono ml-auto shrink-0" style={{ fontSize: '7px', color: sb.routeMeta, whiteSpace: 'nowrap' }}>
                    {dep.slice(0, 9).toUpperCase()} → {arr.slice(0, 9).toUpperCase()}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingDay(day); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                  style={{ padding: '3px', borderRadius: '3px', color: sb.editBtn }}
                  title="Edit day"
                >
                  <Pencil size={10} />
                </button>
              </div>
            );
          })}
          <div className="h-20 lg:hidden" />
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 relative flex flex-col bg-[#f7f6f3] dark:bg-[#0f0f0f] overflow-hidden">

        {/* Print overlay */}
        {mainView === 'print' && (
          <PrintView days={days} companions={companions} onClose={() => switchView('map')} />
        )}

        {/* Packing list panel */}
        {mainView === 'packing' && (
          <div className="absolute inset-0 z-40 bg-white dark:bg-[#111] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2 font-transit-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <ShoppingBag size={13} className="text-blue-500" />
                PACKING LIST
              </div>
              <button
                onClick={() => switchView('map')}
                className="font-transit-mono text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 uppercase tracking-widest"
              >
                ← Back to Map
              </button>
            </div>
            <PackingList />
          </div>
        )}

        {/* Tab bar */}
        <div className="absolute top-4 right-4 lg:right-6 z-30 flex items-center gap-0 pointer-events-auto"
             style={{ backgroundColor: cd.bg, border: `1px solid ${cd.border}` }}>
          {(['map', 'packing', 'print'] as const).map((v) => {
            const icons = { map: <MapPin size={11} />, packing: <ShoppingBag size={11} />, print: <Printer size={11} /> };
            const labels = { map: 'MAP', packing: 'PACKING', print: 'PRINT' };
            const isActive = mainView === v;
            return (
              <button
                key={v}
                onClick={() => switchView(v)}
                className="font-transit-mono flex items-center gap-1.5 px-3 py-2 text-[9px] transition-all"
                style={{
                  backgroundColor: isActive ? '#d02810' : 'transparent',
                  color: isActive ? '#fff' : cd.label,
                  letterSpacing: '0.12em',
                  borderRight: v !== 'print' ? `1px solid ${cd.border}` : 'none',
                }}
              >
                {icons[v]} {labels[v]}
              </button>
            );
          })}
        </div>

        {/* ─── Detail Card — Transit Manifesto Treatment ─── */}
        <div className={`absolute top-4 lg:top-6 left-4 lg:left-6 right-4 lg:right-36 pointer-events-none z-20 transition-all duration-500 ${
          mainView !== 'map' ? 'opacity-0 pointer-events-none' : (isMobile && isSidebarExpanded ? 'opacity-0 scale-95' : 'opacity-100 scale-100')
        }`}>
          <div className="max-w-4xl pointer-events-auto flex flex-col overflow-hidden"
               style={{ backgroundColor: cd.bg, border: `1px solid ${cd.border}`, borderRadius: 0 }}>

            {/* ── Ticket Header (always visible) ── */}
            <div className="flex items-stretch cursor-pointer select-none"
                 onClick={() => setIsCardMinimized(v => !v)}
                 style={{ borderBottom: `1px solid ${cd.rule}` }}>

              {/* Day number block */}
              <div className="shrink-0 flex items-center justify-center"
                   style={{ backgroundColor: selectedDay.isHighland ? '#bc9224' : '#d02810', width: '56px', minHeight: '52px' }}>
                <div className="font-transit-city text-white text-center" style={{ fontSize: '24px', lineHeight: 1 }}>
                  {String(selectedDay.dayNum).padStart(2, '0')}
                </div>
              </div>

              {/* Title + date */}
              <div className="flex-1 px-4 py-2.5 min-w-0">
                <div className="font-transit-mono mb-0.5" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  {selectedDay.date}{selectedDay.isHighland ? ' · HIGHLAND' : ''}
                </div>
                <h2 className="font-transit-city leading-tight truncate" style={{ fontSize: '17px', color: cd.text, letterSpacing: '-0.01em' }}>
                  {selectedDay.title.toUpperCase()}
                </h2>
              </div>

              {/* Sleep + actions */}
              <div className="flex items-center gap-0 shrink-0" style={{ borderLeft: `1px solid ${cd.rule}` }}>
                <div className="hidden sm:flex items-center gap-1.5 px-3"
                     style={{ borderRight: `1px solid ${cd.rule}` }}>
                  <Bed size={10} style={{ color: cd.label, flexShrink: 0 }} />
                  <span className="font-transit-mono truncate max-w-[110px]" style={{ fontSize: '8px', color: cd.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {selectedDay.sleep}
                  </span>
                </div>
                <div className="flex items-center px-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingDay(selectedDay)}
                    className="p-1.5 transition-colors"
                    style={{ color: cd.label }}
                    title="Edit this day"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
                <div className="px-2 transition-transform duration-300" style={{ color: cd.label, transform: isCardMinimized ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                  <ChevronDown size={15} />
                </div>
              </div>
            </div>

            {/* ── Expanded body ── */}
            {!isCardMinimized && (
              <div className={`overflow-y-auto ${isMobile ? 'max-h-[55svh]' : 'max-h-[68vh]'}`}>

                {/* ── Timing strip ── */}
                <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: `1px solid ${cd.rule}`, backgroundColor: cd.sectionBg }}>
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} style={{ color: '#16a34a', flexShrink: 0 }} />
                    <span className="font-transit-mono uppercase" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.15em' }}>Depart</span>
                    <input
                      type="time"
                      value={selectedDay.departureTime || ''}
                      onChange={(e) => handleTimingChange('departureTime', e.target.value)}
                      className="font-transit-mono outline-none"
                      style={{ backgroundColor: cd.inputBg, border: `1px solid ${cd.inputBorder}`, color: cd.inputText, fontSize: '11px', padding: '2px 6px', width: '80px' }}
                    />
                  </div>
                  <div className="flex-1 relative" style={{ borderTop: `1px dashed ${cd.inputBorder}` }}>
                    {selectedDay.travelDurationMinutes && (
                      <span className="font-transit-mono absolute -top-2.5 left-1/2 -translate-x-1/2 px-2"
                            style={{ fontSize: '8px', color: cd.label, backgroundColor: cd.sectionBg }}>
                        {Math.floor(selectedDay.travelDurationMinutes / 60) > 0
                          ? `${Math.floor(selectedDay.travelDurationMinutes / 60)}h ${selectedDay.travelDurationMinutes % 60}m`
                          : `${selectedDay.travelDurationMinutes}m`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-transit-mono uppercase" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.15em' }}>Arrive</span>
                    <input
                      type="time"
                      value={selectedDay.arrivalTime || ''}
                      onChange={(e) => handleTimingChange('arrivalTime', e.target.value)}
                      className="font-transit-mono outline-none"
                      style={{ backgroundColor: cd.inputBg, border: `1px solid ${cd.inputBorder}`, color: cd.inputText, fontSize: '11px', padding: '2px 6px', width: '80px' }}
                    />
                    <Clock size={10} style={{ color: '#ea580c', flexShrink: 0 }} />
                  </div>
                </div>

                {/* ── Train info ── */}
                {selectedDay.trainInfo && (selectedDay.trainInfo.trainName || selectedDay.trainInfo.departureStation) ? (
                  <div className="flex items-stretch" style={{ borderBottom: `1px solid ${cd.rule}`, backgroundColor: cd.trainBg }}>
                    {/* Train name column */}
                    <div className="shrink-0 px-4 py-2.5 flex items-center gap-2" style={{ borderRight: `1px solid ${cd.trainBorder}`, minWidth: '140px' }}>
                      <Train size={12} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                      <div>
                        <div className="font-transit-mono" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Train</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: cd.text }}>
                          {selectedDay.trainInfo.trainName}{selectedDay.trainInfo.trainNumber ? ` ${selectedDay.trainInfo.trainNumber}` : ''}
                        </div>
                        {(selectedDay.trainInfo.carNumber || selectedDay.trainInfo.seatNumber) && (
                          <div className="font-transit-mono" style={{ fontSize: '8px', color: cd.textMuted }}>
                            {selectedDay.trainInfo.carNumber && `Car ${selectedDay.trainInfo.carNumber}`}
                            {selectedDay.trainInfo.carNumber && selectedDay.trainInfo.seatNumber && ' · '}
                            {selectedDay.trainInfo.seatNumber && `Seat ${selectedDay.trainInfo.seatNumber}`}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Route */}
                    <div className="flex-1 flex items-center px-4 py-2.5">
                      <div className="flex items-center gap-2 w-full text-[10px]">
                        <div>
                          <div className="font-transit-mono" style={{ fontSize: '7px', color: '#16a34a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>FROM</div>
                          <div style={{ fontWeight: 700, color: cd.text }}>{selectedDay.trainInfo.departureStation}</div>
                          {selectedDay.trainInfo.departureTime && <div className="font-transit-mono" style={{ fontSize: '9px', color: '#16a34a' }}>{selectedDay.trainInfo.departureTime}</div>}
                        </div>
                        <div className="flex-1 relative" style={{ borderTop: `1px dotted ${cd.inputBorder}`, margin: '0 8px' }}>
                          {selectedDay.trainInfo.durationMinutes && (
                            <span className="font-transit-mono absolute -top-2 left-1/2 -translate-x-1/2 px-1"
                                  style={{ fontSize: '7px', color: '#0ea5e9', backgroundColor: cd.trainBg }}>
                              {Math.floor(selectedDay.trainInfo.durationMinutes / 60) > 0
                                ? `${Math.floor(selectedDay.trainInfo.durationMinutes / 60)}h ${selectedDay.trainInfo.durationMinutes % 60}m`
                                : `${selectedDay.trainInfo.durationMinutes}m`}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-transit-mono" style={{ fontSize: '7px', color: '#ea580c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>TO</div>
                          <div style={{ fontWeight: 700, color: cd.text }}>{selectedDay.trainInfo.arrivalStation}</div>
                          {selectedDay.trainInfo.arrivalTime && <div className="font-transit-mono" style={{ fontSize: '9px', color: '#ea580c' }}>{selectedDay.trainInfo.arrivalTime}</div>}
                        </div>
                      </div>
                    </div>
                    {/* Edit train */}
                    <div className="shrink-0 flex items-center px-3" style={{ borderLeft: `1px solid ${cd.trainBorder}` }}>
                      <button
                        onClick={() => setEditingDay(selectedDay)}
                        style={{ color: cd.label, padding: '4px' }}
                        title="Edit train info"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingDay(selectedDay)}
                    className="w-full flex items-center justify-center gap-2 font-transit-mono transition-colors"
                    style={{ fontSize: '9px', color: '#0ea5e9', letterSpacing: '0.15em', padding: '10px', borderBottom: `1px solid ${cd.rule}`, textTransform: 'uppercase' }}
                  >
                    <Train size={12} /> Add Train Details
                  </button>
                )}

                {/* ── Two-col body ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3" style={{ borderBottom: `1px solid ${cd.rule}` }}>

                  {/* Left 2/3 */}
                  <div className="lg:col-span-2">

                    {/* Terrain + Transport row */}
                    <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderBottom: `1px solid ${cd.rule}` }}>

                      {/* Terrain */}
                      <div className="p-4" style={{ borderRight: `1px solid ${cd.rule}` }}>
                        <div className="font-transit-mono mb-2" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                          ⚡ TERRAIN
                        </div>
                        <p style={{ fontSize: '11px', color: cd.textMuted, fontStyle: 'italic', lineHeight: 1.5, borderLeft: `2px solid ${cd.accentRed}`, paddingLeft: '10px' }}>
                          "{selectedDay.terrain}"
                        </p>
                      </div>

                      {/* Transport */}
                      <div className="p-4">
                        <div className="font-transit-mono mb-2" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                          ◎ TRANSPORT
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDay.routeOptions.map((opt, i) => (
                            <span key={i} className="font-transit-mono"
                                  style={{ fontSize: '9px', fontWeight: 700, color: cd.chipText, border: `1px solid ${cd.chipBorder}`, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Day Plan */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-transit-mono" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                          ≈ DAY PLAN
                        </div>
                        <div className="flex items-center gap-0" style={{ border: `1px solid ${cd.border}` }}>
                          <button
                            onClick={() => setViewMode('list')}
                            className="font-transit-mono px-2.5 py-1 transition-all"
                            style={{ fontSize: '8px', letterSpacing: '0.1em', backgroundColor: viewMode === 'list' ? '#d02810' : 'transparent', color: viewMode === 'list' ? '#fff' : cd.label, textTransform: 'uppercase' }}
                          >
                            LIST
                          </button>
                          <button
                            onClick={() => setViewMode('timeline')}
                            className="font-transit-mono px-2.5 py-1 transition-all"
                            style={{ fontSize: '8px', letterSpacing: '0.1em', backgroundColor: viewMode === 'timeline' ? '#d02810' : 'transparent', color: viewMode === 'timeline' ? '#fff' : cd.label, textTransform: 'uppercase', borderLeft: `1px solid ${cd.border}` }}
                          >
                            TIMELINE
                          </button>
                        </div>
                      </div>
                      <DayTimeline
                        key={selectedDay.dayNum}
                        day={selectedDay}
                        mode={viewMode}
                        onUpdateActivities={handleUpdateActivities}
                      />
                    </div>

                    {/* POI Toggle */}
                    <div className="px-4 pb-4">
                      <POIToggleList
                        pois={selectedDay.pois}
                        onTogglePoi={handleTogglePoi}
                        onAddPoi={handleAddPoi}
                        onRemovePoi={handleRemovePoi}
                        suggestedPois={suggestedPois}
                        isLoadingSuggestions={isLoadingSuggestions}
                        onSearchNearby={handleSearchNearby}
                      />
                    </div>
                  </div>

                  {/* Right 1/3 */}
                  <div style={{ borderLeft: `1px solid ${cd.rule}` }}>

                    {/* Base Camp */}
                    <div className="p-4" style={{ borderBottom: `1px solid ${cd.rule}` }}>
                      <div className="font-transit-mono mb-2" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        🛏 BASE CAMP
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: cd.text, marginBottom: '8px' }}>{selectedDay.sleep}</div>

                      {(selectedDay.bookingRef || selectedDay.bookingUrl || selectedDay.checkInTime || selectedDay.checkOutTime) ? (
                        <div className="space-y-2">
                          {(selectedDay.checkInTime || selectedDay.checkOutTime) && (
                            <div className="flex items-stretch" style={{ border: `1px solid ${cd.border}` }}>
                              {selectedDay.checkInTime && (
                                <div className="flex-1 text-center py-1.5 px-2">
                                  <div className="font-transit-mono" style={{ fontSize: '6px', color: cd.label, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Check-in</div>
                                  <div className="font-transit-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>{selectedDay.checkInTime}</div>
                                </div>
                              )}
                              {selectedDay.checkInTime && selectedDay.checkOutTime && (
                                <div style={{ width: '1px', backgroundColor: cd.border }} />
                              )}
                              {selectedDay.checkOutTime && (
                                <div className="flex-1 text-center py-1.5 px-2">
                                  <div className="font-transit-mono" style={{ fontSize: '6px', color: cd.label, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Check-out</div>
                                  <div className="font-transit-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c' }}>{selectedDay.checkOutTime}</div>
                                </div>
                              )}
                            </div>
                          )}
                          {selectedDay.bookingRef && (
                            <div className="font-transit-mono" style={{ fontSize: '10px', fontWeight: 700, color: cd.accentRed }}>
                              # {selectedDay.bookingRef}
                            </div>
                          )}
                          {selectedDay.bookingNote && (
                            <p style={{ fontSize: '10px', color: cd.textMuted, lineHeight: 1.4 }}>{selectedDay.bookingNote}</p>
                          )}
                          {selectedDay.bookingUrl && (
                            <a href={selectedDay.bookingUrl} target="_blank" rel="noopener noreferrer"
                               onClick={e => e.stopPropagation()}
                               className="font-transit-mono flex items-center gap-1.5 transition-colors"
                               style={{ fontSize: '9px', color: cd.accentRed, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              <ExternalLink size={10} /> VIEW BOOKING
                            </a>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingDay(selectedDay); }}
                          className="font-transit-mono flex items-center gap-1.5 transition-colors"
                          style={{ fontSize: '8px', color: cd.label, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                        >
                          <Ticket size={10} /> Add booking reference
                        </button>
                      )}
                    </div>

                    {/* Travelers */}
                    <div className="p-4" style={{ borderBottom: `1px solid ${cd.rule}` }}>
                      <div className="font-transit-mono mb-2" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        ◎ TRAVELERS
                      </div>
                      <CompanionManager
                        companions={companions}
                        onCompanionsChange={setCompanions}
                        dayCompanionIds={selectedDay.companionIds}
                        onDayCompanionsChange={handleDayCompanionsChange}
                        dayNum={selectedDay.dayNum}
                      />
                    </div>

                    {/* Travel Tip */}
                    <div className="p-4" style={{ backgroundColor: cd.tipBg, borderTop: `2px solid ${cd.accentRed}` }}>
                      <div className="font-transit-mono mb-1.5" style={{ fontSize: '7px', color: cd.tipText, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        ★ TRAVEL TIP
                      </div>
                      <p style={{ fontSize: '11px', color: cd.textMuted, lineHeight: 1.5 }}>
                        Get a <b>Suica/Pasmo</b> card for seamless transit. July is humid — stay hydrated!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <Legend />

        {/* Map */}
        <div className="flex-1">
          <Map
            days={days}
            selectedDay={selectedDayNum}
            onSelectDay={handleDaySelect}
            companions={companions}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
