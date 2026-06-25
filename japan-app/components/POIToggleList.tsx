
import React, { useState } from 'react';
import { MapPin, Eye, EyeOff, Search, Loader, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { POI } from '../types';

interface POIToggleListProps {
  pois: POI[];
  onTogglePoi: (poiId: string) => void;
  onAddPoi: (poi: POI) => void;
  onRemovePoi: (poiId: string) => void;
  suggestedPois: POI[];
  isLoadingSuggestions: boolean;
  onSearchNearby: () => void;
}

const getPoiIcon = (type: POI['type']) => {
  const map: Record<string, string> = {
    temple: '⛩️',
    shrine: '🏯',
    garden: '🌿',
    town: '🏘️',
    hotspring: '♨️',
    volcano: '🌋',
    waterfall: '💧',
    canyon: '🏜️',
    museum: '🏛️',
    market: '🛒',
    station: '🚉',
    camp: '⛺',
    other: '📍',
  };
  return map[type] || '📍';
};

const getPoiColor = (type: POI['type']) => {
  const map: Record<string, string> = {
    temple: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 border-red-300 dark:border-red-500/20',
    shrine: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 border-orange-300 dark:border-orange-500/20',
    garden: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 border-green-300 dark:border-green-500/20',
    town: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/20',
    hotspring: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10 border-cyan-300 dark:border-cyan-500/20',
    volcano: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 border-red-300 dark:border-red-500/20',
    museum: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/20',
    market: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/20',
    station: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/20',
    other: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/10 border-slate-300 dark:border-slate-500/20',
  };
  return map[type] || map.other;
};

const POIToggleList: React.FC<POIToggleListProps> = ({
  pois,
  onTogglePoi,
  onAddPoi,
  onRemovePoi,
  suggestedPois,
  isLoadingSuggestions,
  onSearchNearby,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const enabledCount = pois.filter(p => p.enabled).length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-blue-400" />
          <span className="text-[9px] lg:text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">
            Places ({enabledCount}/{pois.length})
          </span>
        </div>
      </div>

      {/* Active POIs */}
      <div className="space-y-1.5">
        {pois.map(poi => (
          <div
            key={poi.id}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all border ${
              poi.enabled
                ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
                : 'bg-slate-50 dark:bg-slate-900/30 border-transparent opacity-40'
            }`}
          >
            <span className="text-sm shrink-0">{getPoiIcon(poi.type)}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-semibold truncate ${poi.enabled ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 line-through'}`}>
                {poi.name}
              </p>
              {poi.note && poi.enabled && (
                <p className="text-[9px] text-slate-500 truncate">{poi.note}</p>
              )}
            </div>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${getPoiColor(poi.type)}`}>
              {poi.type}
            </span>
            <button
              onClick={() => onTogglePoi(poi.id)}
              className={`p-1 rounded-md transition-all shrink-0 ${
                poi.enabled
                  ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/10'
                  : 'text-slate-400 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700/50'
              }`}
              title={poi.enabled ? 'Hide from plan' : 'Add to plan'}
            >
              {poi.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        ))}
      </div>

      {/* Discover Nearby */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setShowSuggestions(!showSuggestions); if (!showSuggestions) onSearchNearby(); }}
          className="w-full flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold py-2 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all"
        >
          <div className="flex items-center gap-1.5">
            <Search size={14} />
            Discover Nearby Places
          </div>
          {showSuggestions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showSuggestions && (
          <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
            {isLoadingSuggestions ? (
              <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
                <Loader size={14} className="animate-spin" />
                Searching nearby points of interest...
              </div>
            ) : suggestedPois.length > 0 ? (
              suggestedPois.map(poi => (
                <div
                  key={poi.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/20 hover:border-emerald-400 dark:hover:border-emerald-700/40 transition-all"
                >
                  <span className="text-sm shrink-0">{getPoiIcon(poi.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{poi.name}</p>
                    {poi.note && <p className="text-[9px] text-slate-500 truncate">{poi.note}</p>}
                  </div>
                  <button
                    onClick={() => onAddPoi(poi)}
                    className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 rounded-md transition-all shrink-0"
                    title="Add to this day"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-600 text-xs py-3">No additional places found nearby.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default POIToggleList;
