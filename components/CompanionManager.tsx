
import React, { useState } from 'react';
import { UserPlus, X, Users, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Companion } from '../types';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];
const PRESET_AVATARS = ['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰', '👨‍🦳', '🧑‍🎤', '🎒'];

interface CompanionManagerProps {
  companions: Companion[];
  onCompanionsChange: (companions: Companion[]) => void;
  dayCompanionIds: string[];
  onDayCompanionsChange: (ids: string[]) => void;
  dayNum: number;
}

const CompanionManager: React.FC<CompanionManagerProps> = ({
  companions,
  onCompanionsChange,
  dayCompanionIds,
  onDayCompanionsChange,
  dayNum,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newAvatar, setNewAvatar] = useState(PRESET_AVATARS[0]);

  const addCompanion = () => {
    if (!newName.trim()) return;
    const companion: Companion = {
      id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      color: newColor,
      avatar: newAvatar,
    };
    onCompanionsChange([...companions, companion]);
    onDayCompanionsChange([...dayCompanionIds, companion.id]);
    setNewName('');
    setIsAdding(false);
  };

  const removeCompanion = (id: string) => {
    onCompanionsChange(companions.filter(c => c.id !== id));
    onDayCompanionsChange(dayCompanionIds.filter(cid => cid !== id));
  };

  const toggleCompanionForDay = (id: string) => {
    if (dayCompanionIds.includes(id)) {
      onDayCompanionsChange(dayCompanionIds.filter(cid => cid !== id));
    } else {
      onDayCompanionsChange([...dayCompanionIds, id]);
    }
  };

  const soloMode = dayCompanionIds.length === 0;

  return (
    <div className="space-y-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <Users size={14} className="text-violet-500 dark:text-violet-400" />
          <span className="text-[9px] lg:text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">
            Travelers — Day {dayNum}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {soloMode ? (
            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">Solo</span>
          ) : (
            <div className="flex -space-x-1.5">
              {companions
                .filter(c => dayCompanionIds.includes(c.id))
                .slice(0, 4)
                .map(c => (
                  <div
                    key={c.id}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] border-2 border-white dark:border-slate-900"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {c.avatar}
                  </div>
                ))}
              {dayCompanionIds.length > 4 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900 text-slate-600 dark:text-slate-300">
                  +{dayCompanionIds.length - 4}
                </div>
              )}
            </div>
          )}
          {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/30 p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Existing Companions */}
          {companions.length > 0 && (
            <div className="space-y-1.5">
              {companions.map(c => {
                const isOnThisDay = dayCompanionIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer ${
                      isOnThisDay
                        ? 'bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50'
                        : 'bg-slate-50 dark:bg-slate-800/30 border border-transparent opacity-50 hover:opacity-80'
                    }`}
                    onClick={() => toggleCompanionForDay(c.id)}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.avatar}
                    </div>
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold flex-1 truncate">{c.name}</span>
                    {isOnThisDay && (
                      <Check size={14} className="text-green-600 dark:text-green-400 shrink-0" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCompanion(c.id); }}
                      className="text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0 p-0.5"
                      title="Remove traveler"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add New Companion Form */}
          {isAdding ? (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCompanion()}
                placeholder="Traveler name..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none"
                autoFocus
              />
              {/* Color Picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-500 font-bold uppercase w-10 shrink-0">Color</span>
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-5 h-5 rounded-full transition-all ${newColor === color ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-slate-800 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {/* Avatar Picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-500 font-bold uppercase w-10 shrink-0">Icon</span>
                <div className="flex gap-1 flex-wrap">
                  {PRESET_AVATARS.map(av => (
                    <button
                      key={av}
                      onClick={() => setNewAvatar(av)}
                      className={`w-6 h-6 rounded-md text-sm flex items-center justify-center transition-all ${newAvatar === av ? 'bg-violet-100 dark:bg-slate-600 ring-1 ring-violet-400' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addCompanion}
                  disabled={!newName.trim()}
                  className="flex-1 bg-violet-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-violet-500 disabled:opacity-40 transition-all"
                >
                  Add Traveler
                </button>
                <button
                  onClick={() => { setIsAdding(false); setNewName(''); }}
                  className="px-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold py-1.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-bold py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all"
            >
              <UserPlus size={14} />
              Add Traveler
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanionManager;
