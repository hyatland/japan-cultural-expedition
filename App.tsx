
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
      <div className={`fixed lg:relative inset-x-0 bottom-0 lg:inset-auto w-full lg:w-[420px] bg-white dark:bg-[#111] shadow-none flex flex-col z-40 border-r border-slate-100 dark:border-white/5 shrink-0 transition-transform duration-500 ease-in-out h-[90svh] lg:h-full ${
        isMobile ? (isSidebarExpanded ? 'translate-y-0' : 'translate-y-[calc(90svh-120px)]') : 'translate-y-0'
      }`}>
        {/* Header */}
        <div
          onClick={isMobile ? () => setIsSidebarExpanded(!isSidebarExpanded) : undefined}
          className="px-5 py-5 lg:px-6 lg:py-6 bg-white dark:bg-[#0a0a0a] border-b border-slate-100 dark:border-white/5 cursor-pointer lg:cursor-default shrink-0 flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              JAPAN <span className="text-orange-500">EXPEDITION</span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] lg:text-[10px] mt-1 uppercase tracking-[0.25em] font-semibold flex items-center gap-2">
              <Compass size={12} className="text-orange-400" />
              July 2026 · {days.length} Days · {companions.length > 0 ? `${companions.length} Traveler${companions.length > 1 ? 's' : ''}` : 'Solo Journey'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="bg-slate-100 dark:bg-white/10 p-2 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isMobile && (
              <div className="bg-slate-100 dark:bg-white/10 p-2 rounded-full text-slate-500 dark:text-slate-400">
                {isSidebarExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 bg-white dark:bg-[#111]">
          {days.map((day, idx) => (
            <div
              key={`${day.dayNum}-${day.title}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-150 ${dragOverIdx === idx && dragIdx !== idx ? 'border-t-2 border-orange-500 pt-0.5' : ''} ${dragIdx === idx ? 'opacity-40 scale-95' : ''}`}
            >
              <div className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 group cursor-pointer ${
                selectedDayNum === day.dayNum
                  ? 'bg-orange-50 dark:bg-[#1e1e1e] shadow-none'
                  : 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/5'
              }`}>
                {/* Drag handle */}
                <div className="shrink-0 text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={12} />
                </div>
                {/* Day number badge */}
                <button onClick={() => handleDaySelect(day.dayNum)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                    day.isHighland
                      ? (selectedDayNum === day.dayNum ? 'bg-yellow-500 text-white' : 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500')
                      : (selectedDayNum === day.dayNum ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400')
                  }`}>
                    {day.dayNum}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <h3 className={`font-medium truncate text-[13px] ${selectedDayNum === day.dayNum ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {day.title}
                    </h3>
                    {day.companionIds.length > 0 && (
                      <div className="flex -space-x-1 shrink-0">
                        {companions.filter(c => day.companionIds.includes(c.id)).slice(0, 3).map(c => (
                          <div key={c.id} className="w-3.5 h-3.5 rounded-full text-[6px] flex items-center justify-center border border-white dark:border-slate-900" style={{ backgroundColor: c.color }}>
                            {c.avatar}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-500 font-mono tabular-nums">
                    {day.date}
                  </span>
                </button>
                {/* Edit button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingDay(day); }}
                  className="shrink-0 p-1 rounded text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
                  title="Edit this day"
                >
                  <Pencil size={11} />
                </button>
                {selectedDayNum === day.dayNum && <ChevronRight className="text-orange-500 shrink-0" size={14} />}
              </div>
            </div>
          ))}
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
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <ShoppingBag size={14} className="text-blue-500" />
                PACKING LIST
              </div>
              <button
                onClick={() => switchView('map')}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ← Back to Map
              </button>
            </div>
            <PackingList />
          </div>
        )}

        {/* Tab bar */}
        <div className="absolute top-4 right-4 lg:right-6 z-30 flex items-center gap-0.5 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-100 dark:border-white/10 p-1 shadow-sm pointer-events-auto">
          <button
            onClick={() => switchView('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${mainView === 'map' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
          >
            <MapPin size={12} /> Map
          </button>
          <button
            onClick={() => switchView('packing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${mainView === 'packing' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
          >
            <ShoppingBag size={12} /> Packing
          </button>
          <button
            onClick={() => switchView('print')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${mainView === 'print' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
          >
            <Printer size={12} /> Print
          </button>
        </div>

        {/* Detail Card — only visible on map view */}
        <div className={`absolute top-4 lg:top-6 left-4 lg:left-6 right-4 lg:right-56 pointer-events-none z-20 transition-all duration-500 ${
          mainView !== 'map' ? 'opacity-0 pointer-events-none' : (isMobile && isSidebarExpanded ? 'opacity-0 scale-95' : 'opacity-100 scale-100')
        }`}>
          <div
            className={`bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-slate-100 dark:border-white/10 max-w-4xl pointer-events-auto transition-all duration-300 flex flex-col overflow-hidden`}
          >
            {/* ── Minimized pill (always visible) ── */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none"
              onClick={() => setIsCardMinimized(v => !v)}
            >
              {/* Day badge */}
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${selectedDay.isHighland ? 'bg-yellow-500' : 'bg-orange-500'}`}>
                {selectedDay.dayNum}
              </div>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 tabular-nums">{selectedDay.date}</span>
                  {selectedDay.isHighland && <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase">· Mountain</span>}
                </div>
                <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  {selectedDay.title}
                </h2>
              </div>

              {/* Sleep chip */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/10 max-w-[160px]">
                <Bed size={11} className="text-slate-400 shrink-0" />
                <span className="text-[10px] text-slate-500 dark:text-slate-300 truncate">{selectedDay.sleep}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setEditingDay(selectedDay)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  title="Edit this day"
                >
                  <Pencil size={13} />
                </button>
              </div>

              {/* Expand chevron */}
              <div className="shrink-0 text-slate-400 dark:text-slate-600 transition-transform duration-300" style={{ transform: isCardMinimized ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                <ChevronDown size={16} />
              </div>
            </div>

            {/* ── Expanded body ── */}
            {!isCardMinimized && (
              <div className={`border-t border-slate-100 dark:border-white/10 flex-1 overflow-y-auto ${isMobile ? 'max-h-[55svh]' : 'max-h-[68vh]'}`}>
                <div className="p-4 lg:p-5 space-y-4 lg:space-y-5">

                  {/* Train & Timing */}
                  <TrainInfoPanel
                    trainInfo={selectedDay.trainInfo}
                    onTrainInfoChange={handleTrainInfoChange}
                    departureTime={selectedDay.departureTime}
                    arrivalTime={selectedDay.arrivalTime}
                    travelDurationMinutes={selectedDay.travelDurationMinutes}
                    onTimingChange={handleTimingChange}
                  />

                  {/* Two-col layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      {/* Terrain & Transport */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Zap size={13} className="text-yellow-500" /> Terrain
                          </p>
                          <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">"{selectedDay.terrain}"</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Compass size={13} className="text-orange-500" /> Transport
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDay.routeOptions.map((opt, i) => (
                              <span key={i} className="bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-orange-300 dark:border-orange-500/20">{opt}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Day Plan — List / Timeline */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Waves size={13} className="text-blue-400" /> Day Plan
                          </p>
                          <div className="flex items-center bg-slate-100 dark:bg-white/10 rounded-lg p-0.5 gap-0.5">
                            <button
                              onClick={() => setViewMode('list')}
                              className={`px-2.5 py-1 rounded-md text-[9px] font-semibold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              List
                            </button>
                            <button
                              onClick={() => setViewMode('timeline')}
                              className={`px-2.5 py-1 rounded-md text-[9px] font-semibold transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              Timeline
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

                    {/* Right column */}
                    <div className="space-y-4 lg:border-l lg:border-slate-100 dark:lg:border-white/5 lg:pl-6">
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg">
                            <Bed size={16} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] text-slate-600 dark:text-slate-500 uppercase font-black tracking-widest">Base Camp</p>
                            <p className="text-xs font-bold text-slate-950 dark:text-white truncate">{selectedDay.sleep}</p>
                          </div>
                        </div>

                        {/* Booking Reference */}
                        {(selectedDay.bookingRef || selectedDay.bookingUrl || selectedDay.checkInTime || selectedDay.checkOutTime) ? (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Ticket size={11} className="text-orange-500 dark:text-orange-400 shrink-0" />
                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Booking</span>
                            </div>
                            {(selectedDay.checkInTime || selectedDay.checkOutTime) && (
                              <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-2">
                                {selectedDay.checkInTime && (
                                  <div className="flex-1 text-center">
                                    <p className="text-[8px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">Check-in</p>
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{selectedDay.checkInTime}</p>
                                  </div>
                                )}
                                {selectedDay.checkInTime && selectedDay.checkOutTime && (
                                  <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
                                )}
                                {selectedDay.checkOutTime && (
                                  <div className="flex-1 text-center">
                                    <p className="text-[8px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">Check-out</p>
                                    <p className="text-sm font-black text-orange-600 dark:text-orange-400">{selectedDay.checkOutTime}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            {selectedDay.bookingRef && (
                              <p className="text-[11px] font-bold text-orange-600 dark:text-orange-300 font-mono tracking-wide"># {selectedDay.bookingRef}</p>
                            )}
                            {selectedDay.bookingNote && (
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">{selectedDay.bookingNote}</p>
                            )}
                            {selectedDay.bookingUrl && (
                              <a
                                href={selectedDay.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors group"
                              >
                                <ExternalLink size={12} className="group-hover:scale-110 transition-transform" />
                                View Booking
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingDay(selectedDay); }}
                            className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 w-full flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-600 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                          >
                            <Ticket size={11} />
                            Add booking reference
                          </button>
                        )}
                      </div>

                      <CompanionManager
                        companions={companions}
                        onCompanionsChange={setCompanions}
                        dayCompanionIds={selectedDay.companionIds}
                        onDayCompanionsChange={handleDayCompanionsChange}
                        dayNum={selectedDay.dayNum}
                      />

                      <div className="p-3 bg-amber-50 dark:bg-amber-500/5 rounded-lg border border-amber-100 dark:border-amber-500/10">
                        <p className="text-[10px] text-amber-600 dark:text-amber-500/70 font-semibold uppercase tracking-wide mb-1">Travel Tip</p>
                        <p className="text-[11px] text-amber-800/70 dark:text-slate-400 leading-relaxed">
                          Get a <b>Suica/Pasmo</b> card for seamless transit. July is humid — stay hydrated!
                        </p>
                      </div>
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
