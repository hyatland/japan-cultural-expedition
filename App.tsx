
import React, { useState, useEffect, useCallback } from 'react';
import { JAPAN_ITINERARY, DEFAULT_COMPANIONS } from './constants';
import { ItineraryDay, Companion, POI, TrainInfo, Activity } from './types';
import Map from './components/Map';
import CompanionManager from './components/CompanionManager';
import POIToggleList from './components/POIToggleList';
import EditDayModal from './components/EditDayModal';
import DayTimeline from './components/DayTimeline';
import PackingList from './components/PackingList';
import PrintView from './components/PrintView';
import { fetchNearbyPOIs } from './services/overpassService';
import { useTheme } from './ThemeContext';
import {
  MapPin, Bed, Layers, ChevronUp, ChevronDown,
  GripVertical, Pencil, Ticket, ExternalLink,
  Moon, Sun, Printer, ShoppingBag, Clock, Train,
  ChevronLeft, ChevronRight,
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
    <div className="hidden sm:block absolute bottom-10 left-4 z-10 bg-white/95 dark:bg-[#111]/95 backdrop-blur-sm p-3 rounded-none border border-slate-200 dark:border-white/10 pointer-events-auto max-w-[180px]">
      <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1.5">
        <Layers size={12} className="text-blue-500" />
        <span className="font-transit-mono text-[8px] uppercase tracking-widest text-slate-600 dark:text-slate-300">Legend</span>
      </div>
      <div className="space-y-2.5">
        <div>
          <p className="font-transit-mono text-[7px] text-slate-500 uppercase tracking-widest mb-1.5">Destinations</p>
          <div className="grid grid-cols-2 gap-1">
            {categories.map(cat => (
              <div key={cat.label} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.color}`} />
                <span className="font-transit-mono text-[8px] text-slate-700 dark:text-slate-300">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
          <p className="font-transit-mono text-[7px] text-slate-500 uppercase tracking-widest mb-1.5">Routes</p>
          <div className="space-y-1">
            {routes.map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <div className={`h-0.5 flex-1 min-w-[20px] ${r.color}`} style={r.dashed ? { backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 3px,#020617 3px,#020617 6px)' } : {}} />
                <span className="font-transit-mono text-[8px] text-slate-700 dark:text-slate-300">{r.label}</span>
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
  if (day.trainInfo?.arrivalStation) {
    return day.trainInfo.arrivalStation.split(' ')[0].toUpperCase();
  }
  let t = day.title.replace(/\s*\([^)]*\)/g, '').replace(/\s+with\s+\S+/gi, '').trim();
  if (t.includes('→')) t = (t.split('→').pop() ?? t).trim();
  return (t.split(/\s+/)[0] ?? t).toUpperCase();
};

const fmtDuration = (mins?: number) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ─── App ───
const App: React.FC = () => {
  const { toggleTheme, theme } = useTheme();
  const [days, setDays] = useState<ItineraryDay[]>(JAPAN_ITINERARY);
  const [companions, setCompanions] = useState<Companion[]>(DEFAULT_COMPANIONS);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(JAPAN_ITINERARY[0].dayNum);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [suggestedPois, setSuggestedPois] = useState<POI[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  const [mainView, setMainView] = useState<'map' | 'packing' | 'print'>('map');

  const isDark = theme === 'dark';

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
    trainBg:     isDark ? '#1c1c1c' : '#f5f4f0',
    trainBorder: isDark ? '#2e2e2e' : '#dcdad6',
    chipBorder:  isDark ? 'rgba(208,40,16,0.5)' : '#d02810',
    chipText:    isDark ? '#e06040' : '#d02810',
    sectionBg:   isDark ? '#1a1a1a' : '#f9f8f6',
    tipBg:       isDark ? '#1e1a12' : '#fffbf0',
    tipText:     isDark ? '#a89060' : '#8a6a10',
    inputBg:     isDark ? '#1a1a1a' : '#f5f4f0',
    inputBorder: isDark ? '#333'    : '#d8d6d2',
    inputText:   isDark ? '#d8d6d2' : '#1a1816',
    toggleBg:    isDark ? '#2a2828' : '#1a1816',
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
    if (isMobile) {
      setIsSidebarExpanded(false);
      setIsPanelOpen(true);
    }
  };

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
    setDragIdx(null); setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const handleSaveDay = useCallback((updated: ItineraryDay) => {
    setDays(prev => prev.map(d => d.dayNum === updated.dayNum ? updated : d));
    setEditingDay(null);
  }, []);

  const handleDayCompanionsChange = useCallback((ids: string[]) => {
    setDays(prev => prev.map(d => d.dayNum === selectedDayNum ? { ...d, companionIds: ids } : d));
  }, [selectedDayNum]);

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

  const switchView = (v: 'map' | 'packing' | 'print') => {
    setEditingDay(null);
    setMainView(v);
  };

  const PANEL_W = 460;

  return (
    <div className="flex flex-row h-[100svh] w-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f0f0f' : '#f7f6f3' }}>

      {editingDay && (
        <EditDayModal day={editingDay} onSave={handleSaveDay} onClose={() => setEditingDay(null)} />
      )}

      {/* ─── SIDEBAR ─── */}
      <div
        className={`shrink-0 flex flex-col h-full overflow-hidden z-40 transition-all duration-300 ${
          isMobile ? 'fixed inset-x-0 bottom-0 w-full h-[90svh]' : ''
        }`}
        style={{
          width: isMobile ? '100%' : '300px',
          backgroundColor: sb.bg,
          transform: isMobile ? (isSidebarExpanded ? 'translateY(0)' : 'translateY(calc(90svh - 100px))') : 'none',
          transition: 'transform 0.4s ease',
          borderRight: isMobile ? 'none' : `1px solid ${isDark ? '#222' : '#e0deda'}`,
        }}
      >
        {/* Header */}
        <div
          onClick={isMobile ? () => setIsSidebarExpanded(!isSidebarExpanded) : undefined}
          style={{ backgroundColor: sb.bg, borderBottom: '2px solid #d02810', padding: '14px 28px 12px', flexShrink: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-transit-city" style={{ fontSize: '36px', lineHeight: 1 }}>
                <span style={{ color: sb.tripMuted }}>TRIP </span>
                <span style={{ color: sb.tripBold }}>JPN</span>
              </div>
              <div className="font-transit-mono mt-1.5" style={{ fontSize: '7px', color: sb.subText, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Japan Cultural Expedition · July 2026
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                style={{ background: sb.btnBg, borderRadius: '50%', padding: '6px', color: sb.btnColor }}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              {isMobile && (
                <div style={{ background: sb.btnBg, borderRadius: '50%', padding: '6px', color: sb.btnColor }}>
                  {isSidebarExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Day list */}
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
                  onClick={() => { if (isMobile) setIsSidebarExpanded(false); setIsPanelOpen(true); }}
                >
                  <div className="absolute left-0 top-0 bottom-0" style={{ width: '3px', backgroundColor: '#ff5a32' }} />
                  <div style={{ padding: '12px 28px 0 28px' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-transit-mono" style={{ fontSize: '9px', color: 'rgba(255,175,155,0.9)' }}>
                        {String(day.dayNum).padStart(2, '0')}
                      </span>
                      <span className="font-transit-mono" style={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>
                        {day.date}
                      </span>
                      {day.isHighland && (
                        <span className="font-transit-mono" style={{ fontSize: '7px', color: 'rgba(255,210,100,0.85)', letterSpacing: '0.15em' }}>· HIGHLAND</span>
                      )}
                    </div>
                    <div className="font-transit-city" style={{ fontSize: '72px', lineHeight: 0.9, color: '#fff', marginLeft: '-2px', letterSpacing: '-0.02em' }}>
                      {city}
                    </div>
                    <div className="font-transit-mono" style={{ fontSize: '7px', color: 'rgba(255,185,165,0.85)', marginTop: '8px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                      {city}, JAPAN
                    </div>
                  </div>
                  <div style={{ margin: '10px 28px 14px', backgroundColor: '#faf9f7' }}>
                    <div className="flex">
                      <div className="flex-1" style={{ padding: '8px 12px', borderRight: '1px solid #c8c4be' }}>
                        <div className="font-transit-mono" style={{ fontSize: '6px', fontWeight: 700, color: '#958c84', marginBottom: '3px', letterSpacing: '0.1em' }}>DEPARTURE:</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#0e0e0e', textTransform: 'uppercase' }}>{dep ?? '—'}</div>
                      </div>
                      <div className="flex-1" style={{ padding: '8px 12px' }}>
                        <div className="font-transit-mono" style={{ fontSize: '6px', fontWeight: 700, color: '#958c84', marginBottom: '3px', letterSpacing: '0.1em' }}>ARRIVAL:</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#0e0e0e', textTransform: 'uppercase' }}>{arr ?? day.sleep}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingDay(day); }}
                    className="absolute top-3 right-3"
                    style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '3px', padding: '3px', color: 'rgba(255,220,210,0.7)' }}
                  >
                    <Pencil size={10} />
                  </button>
                </div>
              );
            }

            const rowBg     = day.isHighland ? sb.rowBgHl  : sb.rowBg;
            const rowRule   = day.isHighland ? sb.rowRuleHl : sb.rowRule;
            const badgeBg   = day.isHighland ? '#bc9224'   : sb.badgeBg;
            const badgeTxt  = day.isHighland ? '#0e0e0e'   : sb.badgeTxt;
            const cityColor = day.isHighland ? sb.cityColorHl : sb.cityColor;
            const dateColor = day.isHighland ? sb.dateColorHl : sb.dateColor;

            return (
              <div
                key={`${day.dayNum}-${day.title}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                onClick={() => handleDaySelect(day.dayNum)}
                className="cursor-pointer group"
                style={{
                  backgroundColor: rowBg,
                  borderTop: `1px solid ${rowRule}`,
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '28px',
                  paddingRight: '28px',
                  ...(dragOverIdx === idx && dragIdx !== idx ? { borderTop: '2px solid #d02810' } : {}),
                  ...(dragIdx === idx ? { opacity: 0.4 } : {}),
                }}
              >
                <div className="opacity-0 group-hover:opacity-100 mr-1.5 shrink-0" style={{ color: sb.dragHandle }}>
                  <GripVertical size={10} />
                </div>
                <div className="shrink-0 flex items-center justify-center font-transit-mono"
                     style={{ width: '26px', height: '18px', backgroundColor: badgeBg, fontSize: '7px', fontWeight: 700, color: badgeTxt }}>
                  {String(day.dayNum).padStart(2, '0')}
                </div>
                <span className="font-transit-mono ml-2 shrink-0" style={{ fontSize: '8px', color: dateColor }}>
                  {day.date}
                </span>
                <span className="font-transit-city ml-2.5 shrink-0 flex-1 truncate" style={{ fontSize: '13px', color: cityColor, textTransform: 'uppercase' }}>
                  {city}
                </span>
                {dep && arr && (
                  <div className="shrink-0 flex items-center gap-1 ml-2">
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', border: `1px solid ${sb.routeMeta}` }} />
                    <div style={{ width: '12px', height: '1px', backgroundColor: sb.rowRule }} />
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: sb.routeMeta }} />
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingDay(day); }}
                  className="opacity-0 group-hover:opacity-100 ml-1.5 shrink-0"
                  style={{ padding: '2px', borderRadius: '2px', color: sb.editBtn }}
                >
                  <Pencil size={9} />
                </button>
              </div>
            );
          })}
          <div className="h-20 lg:hidden" />
        </div>
      </div>

      {/* ─── DETAIL PANEL ─── */}
      <div
        className="shrink-0 flex flex-col h-full overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{
          width: isPanelOpen ? `${PANEL_W}px` : '0px',
          backgroundColor: cd.bg,
          borderRight: `1px solid ${cd.border}`,
          position: isMobile ? 'absolute' : 'relative',
          ...(isMobile ? { left: 0, top: 0, zIndex: 30 } : {}),
        }}
      >
        {/* Inner content — fixed width so it doesn't squish during animation */}
        <div style={{ width: `${PANEL_W}px`, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Panel Header */}
          <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '54px', borderBottom: `1px solid ${cd.rule}`, backgroundColor: cd.sectionBg, flexShrink: 0 }}>
            {/* Day number */}
            <div style={{
              width: '54px', flexShrink: 0,
              backgroundColor: selectedDay.isHighland ? '#bc9224' : '#d02810',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="font-transit-city text-white" style={{ fontSize: '22px', lineHeight: 1 }}>
                {String(selectedDay.dayNum).padStart(2, '0')}
              </span>
            </div>
            {/* Date + Title */}
            <div style={{ flex: 1, padding: '7px 14px', minWidth: 0 }}>
              <div className="font-transit-mono" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1px' }}>
                {selectedDay.date}{selectedDay.isHighland ? ' · HIGHLAND' : ''}
              </div>
              <h2 className="font-transit-city truncate" style={{ fontSize: '16px', color: cd.text, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                {selectedDay.title.toUpperCase()}
              </h2>
            </div>
            {/* Sleep + actions */}
            <div style={{ display: 'flex', alignItems: 'center', borderLeft: `1px solid ${cd.rule}`, flexShrink: 0 }}>
              <div style={{ padding: '0 10px', maxWidth: '120px' }}>
                <div className="font-transit-mono" style={{ fontSize: '6px', color: cd.label, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>SLEEP</div>
                <div className="font-transit-mono truncate" style={{ fontSize: '8px', color: cd.textMuted }}>{selectedDay.sleep}</div>
              </div>
              <button onClick={() => setEditingDay(selectedDay)} style={{ padding: '0 10px', color: cd.label, borderLeft: `1px solid ${cd.rule}`, height: '100%', display: 'flex', alignItems: 'center' }}>
                <Pencil size={11} />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

            {/* Timing strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', borderBottom: `1px solid ${cd.rule}`, backgroundColor: cd.sectionBg }}>
              <Clock size={10} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span className="font-transit-mono uppercase" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.12em', flexShrink: 0 }}>Depart</span>
              <input
                type="time" value={selectedDay.departureTime || ''}
                onChange={(e) => handleTimingChange('departureTime', e.target.value)}
                className="font-transit-mono outline-none"
                style={{ backgroundColor: cd.inputBg, border: `1px solid ${cd.inputBorder}`, color: cd.inputText, fontSize: '10px', padding: '2px 6px', width: '76px', flexShrink: 0 }}
              />
              <div style={{ flex: 1, borderTop: `1px dashed ${cd.inputBorder}`, position: 'relative' }}>
                {fmtDuration(selectedDay.travelDurationMinutes) && (
                  <span className="font-transit-mono absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5"
                        style={{ fontSize: '7px', color: cd.label, backgroundColor: cd.sectionBg }}>
                    {fmtDuration(selectedDay.travelDurationMinutes)}
                  </span>
                )}
              </div>
              <span className="font-transit-mono uppercase" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.12em', flexShrink: 0 }}>Arrive</span>
              <input
                type="time" value={selectedDay.arrivalTime || ''}
                onChange={(e) => handleTimingChange('arrivalTime', e.target.value)}
                className="font-transit-mono outline-none"
                style={{ backgroundColor: cd.inputBg, border: `1px solid ${cd.inputBorder}`, color: cd.inputText, fontSize: '10px', padding: '2px 6px', width: '76px', flexShrink: 0 }}
              />
              <Clock size={10} style={{ color: '#ea580c', flexShrink: 0 }} />
            </div>

            {/* Train row */}
            {selectedDay.trainInfo && (selectedDay.trainInfo.trainName || selectedDay.trainInfo.departureStation) ? (
              <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${cd.rule}`, backgroundColor: cd.trainBg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRight: `1px solid ${cd.trainBorder}`, minWidth: '130px', flexShrink: 0 }}>
                  <Train size={11} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                  <div>
                    <div className="font-transit-mono" style={{ fontSize: '6px', color: cd.label, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>TRAIN</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: cd.text, whiteSpace: 'nowrap' }}>
                      {selectedDay.trainInfo.trainName}{selectedDay.trainInfo.trainNumber ? ` ${selectedDay.trainInfo.trainNumber}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '8px 14px', gap: '8px' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div className="font-transit-mono" style={{ fontSize: '6px', color: '#16a34a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>FROM</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: cd.text }}>{selectedDay.trainInfo.departureStation}</div>
                    {selectedDay.trainInfo.departureTime && (
                      <div className="font-transit-mono" style={{ fontSize: '8px', color: '#16a34a' }}>{selectedDay.trainInfo.departureTime}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, borderTop: `1px dotted ${cd.trainBorder}`, position: 'relative', margin: '0 4px' }}>
                    {fmtDuration(selectedDay.trainInfo?.durationMinutes) && (
                      <span className="font-transit-mono absolute -top-2 left-1/2 -translate-x-1/2 px-1"
                            style={{ fontSize: '7px', color: '#0ea5e9', backgroundColor: cd.trainBg }}>
                        {fmtDuration(selectedDay.trainInfo?.durationMinutes)}
                      </span>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <div className="font-transit-mono" style={{ fontSize: '6px', color: '#ea580c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>TO</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: cd.text }}>{selectedDay.trainInfo.arrivalStation}</div>
                    {selectedDay.trainInfo.arrivalTime && (
                      <div className="font-transit-mono" style={{ fontSize: '8px', color: '#ea580c' }}>{selectedDay.trainInfo.arrivalTime}</div>
                    )}
                  </div>
                </div>
                <button onClick={() => setEditingDay(selectedDay)} style={{ padding: '0 10px', color: cd.label, borderLeft: `1px solid ${cd.trainBorder}`, flexShrink: 0 }}>
                  <Pencil size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingDay(selectedDay)}
                className="font-transit-mono w-full flex items-center justify-center gap-2 transition-colors"
                style={{ fontSize: '8px', color: '#0ea5e9', letterSpacing: '0.15em', padding: '8px', borderBottom: `1px solid ${cd.rule}`, textTransform: 'uppercase', backgroundColor: cd.sectionBg }}
              >
                <Train size={11} /> Add Train Details
              </button>
            )}

            {/* Transport | Base Camp + Travelers grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', borderBottom: `1px solid ${cd.rule}` }}>

              {/* Transport */}
              <div style={{ padding: '10px 16px', borderRight: `1px solid ${cd.rule}` }}>
                <div className="font-transit-mono mb-2" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>◎ TRANSPORT</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedDay.routeOptions.map((opt, i) => (
                    <span key={i} className="font-transit-mono"
                          style={{ fontSize: '8px', fontWeight: 700, color: cd.chipText, border: `1px solid ${cd.chipBorder}`, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      {opt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Base Camp + Travelers */}
              <div style={{ padding: '10px 14px' }}>
                <div className="font-transit-mono mb-1.5" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>🛏 BASE CAMP</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: cd.text, marginBottom: '6px' }}>{selectedDay.sleep}</div>
                {(selectedDay.bookingRef || selectedDay.bookingUrl || selectedDay.checkInTime || selectedDay.checkOutTime) ? (
                  <div style={{ marginBottom: '6px' }}>
                    {(selectedDay.checkInTime || selectedDay.checkOutTime) && (
                      <div style={{ display: 'flex', border: `1px solid ${cd.border}`, marginBottom: '4px' }}>
                        {selectedDay.checkInTime && (
                          <div style={{ flex: 1, textAlign: 'center', padding: '4px' }}>
                            <div className="font-transit-mono" style={{ fontSize: '6px', color: cd.label, textTransform: 'uppercase', letterSpacing: '0.1em' }}>In</div>
                            <div className="font-transit-mono" style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>{selectedDay.checkInTime}</div>
                          </div>
                        )}
                        {selectedDay.checkInTime && selectedDay.checkOutTime && <div style={{ width: '1px', backgroundColor: cd.border }} />}
                        {selectedDay.checkOutTime && (
                          <div style={{ flex: 1, textAlign: 'center', padding: '4px' }}>
                            <div className="font-transit-mono" style={{ fontSize: '6px', color: cd.label, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Out</div>
                            <div className="font-transit-mono" style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c' }}>{selectedDay.checkOutTime}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedDay.bookingRef && (
                      <div className="font-transit-mono" style={{ fontSize: '9px', fontWeight: 700, color: cd.accentRed }}>#{selectedDay.bookingRef}</div>
                    )}
                    {selectedDay.bookingUrl && (
                      <a href={selectedDay.bookingUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                         className="font-transit-mono flex items-center gap-1"
                         style={{ fontSize: '8px', color: cd.accentRed, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <ExternalLink size={9} /> View
                      </a>
                    )}
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setEditingDay(selectedDay); }}
                          className="font-transit-mono flex items-center gap-1 transition-colors"
                          style={{ fontSize: '7px', color: cd.label, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    <Ticket size={9} /> Add booking
                  </button>
                )}

                <div style={{ borderTop: `1px solid ${cd.rule}`, paddingTop: '6px', marginTop: '4px' }}>
                  <div className="font-transit-mono mb-1" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>◎ TRAVELERS</div>
                  <CompanionManager
                    companions={companions}
                    onCompanionsChange={setCompanions}
                    dayCompanionIds={selectedDay.companionIds}
                    onDayCompanionsChange={handleDayCompanionsChange}
                    dayNum={selectedDay.dayNum}
                  />
                </div>
              </div>
            </div>

            {/* Day Plan */}
            <div>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: `1px solid ${cd.rule}`, backgroundColor: cd.sectionBg }}>
                <span className="font-transit-mono" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>≈ DAY PLAN</span>
                <div style={{ display: 'flex', border: `1px solid ${cd.border}` }}>
                  <button
                    onClick={() => setViewMode('list')}
                    className="font-transit-mono px-2.5 py-1 transition-all"
                    style={{ fontSize: '7px', letterSpacing: '0.1em', backgroundColor: viewMode === 'list' ? '#d02810' : 'transparent', color: viewMode === 'list' ? '#fff' : cd.label, textTransform: 'uppercase' }}
                  >
                    LIST
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className="font-transit-mono px-2.5 py-1 transition-all"
                    style={{ fontSize: '7px', letterSpacing: '0.1em', backgroundColor: viewMode === 'timeline' ? '#d02810' : 'transparent', color: viewMode === 'timeline' ? '#fff' : cd.label, textTransform: 'uppercase', borderLeft: `1px solid ${cd.border}` }}
                  >
                    TIMELINE
                  </button>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <DayTimeline
                  key={selectedDay.dayNum}
                  day={selectedDay}
                  mode={viewMode}
                  onUpdateActivities={handleUpdateActivities}
                />
              </div>
            </div>

            {/* Places */}
            <div style={{ borderTop: `1px solid ${cd.rule}` }}>
              <div style={{ padding: '8px 16px', backgroundColor: cd.sectionBg, borderBottom: `1px solid ${cd.rule}` }}>
                <span className="font-transit-mono" style={{ fontSize: '7px', color: cd.label, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  ◉ PLACES ({selectedDay.pois.filter(p => p.enabled).length}/{selectedDay.pois.length})
                </span>
              </div>
              <div style={{ padding: '8px 16px 16px' }}>
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

          </div>{/* end scrollable body */}
        </div>
      </div>

      {/* ─── MAP AREA ─── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Panel toggle arrow */}
        <button
          onClick={() => setIsPanelOpen(v => !v)}
          className="absolute z-30 flex items-center justify-center transition-all"
          style={{
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '48px',
            backgroundColor: cd.toggleBg,
            color: '#888',
            borderRadius: '0 3px 3px 0',
          }}
          title={isPanelOpen ? 'Collapse panel' : 'Expand panel'}
        >
          {isPanelOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>

        {/* Print overlay */}
        {mainView === 'print' && (
          <PrintView days={days} companions={companions} onClose={() => switchView('map')} />
        )}

        {/* Packing list */}
        {mainView === 'packing' && (
          <div className="absolute inset-0 z-40 overflow-hidden flex flex-col" style={{ backgroundColor: cd.bg }}>
            <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${cd.border}` }}>
              <div className="font-transit-mono flex items-center gap-2 uppercase tracking-widest" style={{ fontSize: '9px', color: cd.label }}>
                <ShoppingBag size={12} style={{ color: '#3b82f6' }} />
                Packing List
              </div>
              <button onClick={() => switchView('map')}
                      className="font-transit-mono uppercase transition-colors"
                      style={{ fontSize: '8px', color: cd.label, letterSpacing: '0.12em', padding: '4px 10px', border: `1px solid ${cd.border}` }}>
                ← Back
              </button>
            </div>
            <PackingList />
          </div>
        )}

        {/* Tab bar */}
        <div className="absolute top-3 right-4 z-30 flex items-center"
             style={{ backgroundColor: '#0e0e0e', border: '1px solid #2a2a2a' }}>
          {(['map', 'packing', 'print'] as const).map((v) => {
            const icons = { map: <MapPin size={10} />, packing: <ShoppingBag size={10} />, print: <Printer size={10} /> };
            const labels = { map: 'MAP', packing: 'PACKING', print: 'PRINT' };
            const isAct = mainView === v;
            return (
              <button
                key={v}
                onClick={() => switchView(v)}
                className="font-transit-mono flex items-center gap-1.5 px-3 py-2 transition-all"
                style={{
                  fontSize: '8px', letterSpacing: '0.12em',
                  backgroundColor: isAct ? '#d02810' : 'transparent',
                  color: isAct ? '#fff' : '#666',
                  borderRight: v !== 'print' ? '1px solid #2a2a2a' : 'none',
                }}
              >
                {icons[v]} {labels[v]}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <Legend />

        {/* Map */}
        <div className="absolute inset-0">
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
