
import React, { useState } from 'react';
import { Train, Clock, Pencil, Check, MapPin } from 'lucide-react';
import { TrainInfo } from '../types';

interface TrainInfoPanelProps {
  trainInfo?: TrainInfo;
  onTrainInfoChange: (info: TrainInfo) => void;
  departureTime?: string;
  arrivalTime?: string;
  travelDurationMinutes?: number;
  onTimingChange: (field: 'departureTime' | 'arrivalTime', value: string) => void;
}

const TrainInfoPanel: React.FC<TrainInfoPanelProps> = ({
  trainInfo,
  onTrainInfoChange,
  departureTime,
  arrivalTime,
  travelDurationMinutes,
  onTimingChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<TrainInfo>(
    trainInfo || {
      trainName: '',
      trainNumber: '',
      carNumber: '',
      seatNumber: '',
      departureStation: '',
      arrivalStation: '',
      departureTime: '',
      arrivalTime: '',
    }
  );

  const handleSave = () => {
    if (draft.departureTime && draft.arrivalTime) {
      const [dH, dM] = draft.departureTime.split(':').map(Number);
      const [aH, aM] = draft.arrivalTime.split(':').map(Number);
      const depMin = dH * 60 + dM;
      const arrMin = aH * 60 + aM;
      draft.durationMinutes = arrMin >= depMin ? arrMin - depMin : (24 * 60 - depMin) + arrMin;
    }
    onTrainInfoChange({ ...draft });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(trainInfo || {
      trainName: '', trainNumber: '', carNumber: '', seatNumber: '',
      departureStation: '', arrivalStation: '', departureTime: '', arrivalTime: '',
    });
    setIsEditing(false);
  };

  const formatDuration = (mins?: number) => {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const hasTrainData = trainInfo && (trainInfo.trainName || trainInfo.trainNumber);

  return (
    <div className="space-y-3">
      {/* Day Timing Bar */}
      <div className="flex items-center gap-3 text-[10px] lg:text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Clock size={12} className="text-emerald-500 dark:text-emerald-400" />
          <span className="font-bold uppercase text-[9px] text-slate-600 dark:text-slate-500">Depart</span>
          <input
            type="time"
            value={departureTime || ''}
            onChange={(e) => onTimingChange('departureTime', e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-slate-800 dark:text-slate-200 text-[11px] w-[80px] focus:ring-1 focus:ring-emerald-500/50 outline-none"
          />
        </div>
        <div className="flex-1 border-t border-dashed border-slate-300 dark:border-slate-700 relative">
          {travelDurationMinutes && (
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-2 text-[9px] text-slate-500 font-bold">
              {formatDuration(travelDurationMinutes)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <span className="font-bold uppercase text-[9px] text-slate-600 dark:text-slate-500">Arrive</span>
          <input
            type="time"
            value={arrivalTime || ''}
            onChange={(e) => onTimingChange('arrivalTime', e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-slate-800 dark:text-slate-200 text-[11px] w-[80px] focus:ring-1 focus:ring-emerald-500/50 outline-none"
          />
          <Clock size={12} className="text-orange-500 dark:text-orange-400" />
        </div>
      </div>

      {/* Train Info Section */}
      {isEditing ? (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/30 p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-slate-600 dark:text-slate-500 font-bold uppercase block mb-0.5">Train Name</label>
              <input
                value={draft.trainName}
                onChange={(e) => setDraft({ ...draft, trainName: e.target.value })}
                placeholder="e.g. Nozomi"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-600 dark:text-slate-500 font-bold uppercase block mb-0.5">Train Number</label>
              <input
                value={draft.trainNumber}
                onChange={(e) => setDraft({ ...draft, trainNumber: e.target.value })}
                placeholder="e.g. 225"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-600 dark:text-slate-500 font-bold uppercase block mb-0.5">Car #</label>
              <input
                value={draft.carNumber}
                onChange={(e) => setDraft({ ...draft, carNumber: e.target.value })}
                placeholder="e.g. 7"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-600 dark:text-slate-500 font-bold uppercase block mb-0.5">Seat #</label>
              <input
                value={draft.seatNumber}
                onChange={(e) => setDraft({ ...draft, seatNumber: e.target.value })}
                placeholder="e.g. 14A"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-slate-600 dark:text-slate-500 font-bold uppercase block mb-0.5">From Station</label>
              <input
                value={draft.departureStation}
                onChange={(e) => setDraft({ ...draft, departureStation: e.target.value })}
                placeholder="e.g. Odawara"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-600 dark:text-slate-500 font-bold uppercase block mb-0.5">To Station</label>
              <input
                value={draft.arrivalStation}
                onChange={(e) => setDraft({ ...draft, arrivalStation: e.target.value })}
                placeholder="e.g. Kyoto"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-slate-600 dark:text-slate-500 font-bold uppercase block mb-0.5">Departure Time</label>
              <input
                type="time"
                value={draft.departureTime}
                onChange={(e) => setDraft({ ...draft, departureTime: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-600 dark:text-slate-500 font-bold uppercase block mb-0.5">Arrival Time</label>
              <input
                type="time"
                value={draft.arrivalTime}
                onChange={(e) => setDraft({ ...draft, arrivalTime: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1 bg-sky-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-sky-500 transition-all"
            >
              <Check size={14} /> Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold py-1.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : hasTrainData ? (
        <div className="bg-gradient-to-r from-sky-50 dark:from-sky-950/40 to-slate-100 dark:to-slate-800/40 rounded-xl border border-sky-200 dark:border-sky-800/30 p-3 relative group">
          <button
            onClick={() => { setDraft(trainInfo!); setIsEditing(true); }}
            className="absolute top-2 right-2 text-slate-400 dark:text-slate-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Edit train info"
          >
            <Pencil size={12} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Train size={16} className="text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-black text-sky-700 dark:text-sky-300">
              {trainInfo!.trainName} {trainInfo!.trainNumber}
            </span>
            {(trainInfo!.carNumber || trainInfo!.seatNumber) && (
              <span className="text-[9px] bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded-md font-bold border border-sky-200 dark:border-sky-800/50">
                {trainInfo!.carNumber && `Car ${trainInfo!.carNumber}`}
                {trainInfo!.carNumber && trainInfo!.seatNumber && ' · '}
                {trainInfo!.seatNumber && `Seat ${trainInfo!.seatNumber}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-emerald-500 dark:text-emerald-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{trainInfo!.departureStation}</span>
              {trainInfo!.departureTime && <span className="text-slate-500">{trainInfo!.departureTime}</span>}
            </div>
            <div className="flex-1 border-t border-dotted border-slate-300 dark:border-slate-700 relative">
              {trainInfo!.durationMinutes && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-1.5 text-[8px] text-sky-600 dark:text-sky-400 font-bold">
                  {formatDuration(trainInfo!.durationMinutes)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{trainInfo!.arrivalStation}</span>
              {trainInfo!.arrivalTime && <span className="text-slate-500">{trainInfo!.arrivalTime}</span>}
              <MapPin size={10} className="text-orange-500 dark:text-orange-400" />
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-bold py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500/50 hover:bg-sky-50 dark:hover:bg-sky-500/5 transition-all"
        >
          <Train size={14} />
          Add Train Details
        </button>
      )}
    </div>
  );
};

export default TrainInfoPanel;
