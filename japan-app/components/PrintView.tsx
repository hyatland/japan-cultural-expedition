import React from 'react';
import { ItineraryDay, Companion } from '../types';

interface PrintViewProps {
  days: ItineraryDay[];
  companions: Companion[];
  onClose: () => void;
}

const PrintView: React.FC<PrintViewProps> = ({ days, companions, onClose }) => {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" id="print-view">
      {/* Screen-only toolbar */}
      <div className="print:hidden flex items-center justify-between px-6 py-3 bg-slate-900 text-white shrink-0">
        <span className="font-bold text-sm">🗾 Japan Expedition — Print View</span>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all"
          >
            🖨 Print / Save as PDF
          </button>
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-8 py-10 print:px-6 print:py-4">
          {/* Title */}
          <div className="mb-8 pb-6 border-b-2 border-slate-900">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Japan Cultural Expedition
            </h1>
            <p className="text-slate-500 text-sm mt-1">July 4 – 19, 2026 · {days.length} Days</p>
            {companions.length > 0 && (
              <p className="text-slate-500 text-sm">
                Travelers: {companions.map(c => c.name).join(', ')}
              </p>
            )}
          </div>

          {/* Days */}
          <div className="space-y-8">
            {days.map((day, idx) => {
              const dayCompanions = companions.filter(c => day.companionIds.includes(c.id));
              return (
                <div
                  key={day.dayNum}
                  className="print:break-inside-avoid"
                  style={idx > 0 ? {} : {}}
                >
                  {/* Day header */}
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wide">
                      Day {day.dayNum}
                    </span>
                    <span className="text-xs text-slate-500">{day.date}</span>
                    {day.isHighland && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ⛰ Mountain
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight mb-1">{day.title}</h2>

                  {/* Travel info */}
                  {(day.departureTime || day.trainInfo?.departureStation) && (
                    <div className="mb-2 text-[11px] text-slate-600 flex items-center gap-3 flex-wrap">
                      {day.departureTime && (
                        <span>🚉 Depart {day.departureTime}</span>
                      )}
                      {day.trainInfo?.departureStation && day.trainInfo?.arrivalStation && (
                        <span>{day.trainInfo.departureStation} → {day.trainInfo.arrivalStation}</span>
                      )}
                      {day.trainInfo?.trainName && (
                        <span className="font-bold">{day.trainInfo.trainName} {day.trainInfo.trainNumber}</span>
                      )}
                      {day.trainInfo?.carNumber && <span>Car {day.trainInfo.carNumber}</span>}
                      {day.trainInfo?.seatNumber && <span>Seat {day.trainInfo.seatNumber}</span>}
                      {day.arrivalTime && <span>→ Arrive {day.arrivalTime}</span>}
                    </div>
                  )}

                  {/* Activities */}
                  <ol className="space-y-0.5 mb-3">
                    {day.activities.map((act, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                        {act.time ? (
                          <span className="shrink-0 font-bold text-slate-900 w-[38px] text-right tabular-nums">{act.time}</span>
                        ) : (
                          <span className="shrink-0 text-slate-400 w-[38px] text-right">{String(i + 1).padStart(2, '0')}.</span>
                        )}
                        <span className="leading-snug">{act.text}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Hotel */}
                  <div className="flex items-start gap-4 text-[11px] border-t border-slate-100 pt-2 flex-wrap">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Sleep</span>
                      <span className="text-slate-700 font-semibold">{day.sleep}</span>
                    </div>
                    {(day.checkInTime || day.checkOutTime) && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Hotel Times</span>
                        <span className="text-slate-700">
                          {day.checkInTime && `Check-in ${day.checkInTime}`}
                          {day.checkInTime && day.checkOutTime && ' · '}
                          {day.checkOutTime && `Check-out ${day.checkOutTime}`}
                        </span>
                      </div>
                    )}
                    {day.bookingRef && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Ref</span>
                        <span className="text-slate-700 font-mono">{day.bookingRef}</span>
                      </div>
                    )}
                    {dayCompanions.length > 0 && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">With</span>
                        <span className="text-slate-700">{dayCompanions.map(c => c.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
            <span>Japan Cultural Expedition · July 2026</span>
            <span>Printed {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          #print-view { position: static !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintView;
