
import React, { useEffect, useRef, useCallback } from 'react';
import { ItineraryDay, POI, Companion } from '../types';
// AI/pronunciation features removed

interface MapProps {
  days: ItineraryDay[];
  selectedDay: number | null;
  onSelectDay: (dayNum: number) => void;
  companions: Companion[];
}

const Map: React.FC<MapProps> = ({ days, selectedDay, onSelectDay, companions }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});
  const lastSelectedDayRef = useRef<number | null>(null);
  const isMapInteraction = useRef(false);

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;

  const getPoiColor = (type: POI['type']) => {
    const colors: Record<string, string> = {
      temple: '#f87171',
      shrine: '#fb923c',
      garden: '#4ade80',
      town: '#818cf8',
      hotspring: '#38bdf8',
      volcano: '#f87171',
      museum: '#fbbf24',
      market: '#34d399',
      station: '#60a5fa',
      other: '#94a3b8',
    };
    return colors[type] || '#94a3b8';
  };

  const drawItinerary = useCallback((map: any) => {
    if (!map) return;

    Object.values(layersRef.current).forEach(layer => {
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    });
    layersRef.current = {};

    const L = (window as any).L;

    days.forEach((day) => {
      if (!day.routeCoords || day.routeCoords.length === 0) return;

      const isSelected = selectedDay === day.dayNum;

      const validPoints = day.routeCoords
        .filter(c => c && typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng))
        .map(c => [c.lat, c.lng]);

      if (validPoints.length >= 2) {
        const path = L.polyline(validPoints, {
          color: day.isHighland ? '#facc15' : '#ef4444',
          weight: isSelected ? 8 : 4,
          opacity: isSelected ? 1 : 0.4,
          dashArray: day.isHighland ? '10, 15' : undefined,
          interactive: true
        }).addTo(map);

        path.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          if (selectedDay !== day.dayNum) {
            isMapInteraction.current = true;
            onSelectDay(day.dayNum);
          }
        });
        layersRef.current[`path_${day.dayNum}`] = path;

        // Directional arrows for selected day
        if (isSelected) {
          for (let i = 0; i < validPoints.length - 1; i++) {
            const start = validPoints[i];
            const end = validPoints[i + 1];
            const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
            const dy = end[0] - start[0];
            const dx = end[1] - start[1];
            const bearing = Math.atan2(dx, dy) * 180 / Math.PI;

            const arrow = L.marker(mid, {
              icon: L.divIcon({
                className: 'direction-arrow',
                html: `<div style="transform: rotate(${bearing}deg); color: ${day.isHighland ? '#facc15' : '#ef4444'}; font-size: 20px; font-weight: bold; text-shadow: 0 0 5px rgba(0,0,0,0.8)">➤</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              }),
              interactive: false
            }).addTo(map);
            layersRef.current[`arrow_${day.dayNum}_${i}`] = arrow;
          }

          // Train info badge on route midpoint
          if (day.trainInfo && day.trainInfo.trainName) {
            const routeMid = validPoints.length >= 2
              ? [(validPoints[0][0] + validPoints[validPoints.length - 1][0]) / 2,
                 (validPoints[0][1] + validPoints[validPoints.length - 1][1]) / 2]
              : validPoints[0];

            const trainBadge = L.marker(routeMid, {
              icon: L.divIcon({
                className: 'train-badge',
                html: `<div style="
                  background: linear-gradient(135deg, #0c4a6e, #0369a1);
                  color: white;
                  padding: 4px 10px;
                  border-radius: 12px;
                  font-size: 10px;
                  font-weight: 800;
                  font-family: 'Inter', sans-serif;
                  white-space: nowrap;
                  border: 2px solid #38bdf8;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">🚄 ${day.trainInfo.trainName} ${day.trainInfo.trainNumber}${day.trainInfo.carNumber ? ` · Car ${day.trainInfo.carNumber}` : ''}${day.trainInfo.seatNumber ? ` · ${day.trainInfo.seatNumber}` : ''}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
              }),
              interactive: false,
              zIndexOffset: 1000,
            }).addTo(map);
            layersRef.current[`train_${day.dayNum}`] = trainBadge;
          }
        }
      }

      // Draw POIs (only enabled ones, or all if selected day with reduced opacity)
      day.pois.forEach(poi => {
        if (!poi.coord || isNaN(poi.coord.lat) || isNaN(poi.coord.lng)) return;
        if (!poi.enabled && !isSelected) return; // Hide disabled POIs unless day is selected

        const marker = L.circleMarker([poi.coord.lat, poi.coord.lng], {
          radius: isSelected ? (poi.enabled ? 12 : 7) : 8,
          fillColor: getPoiColor(poi.type),
          color: isSelected && poi.enabled ? '#fff' : '#000',
          weight: isSelected && poi.enabled ? 3 : 2,
          opacity: poi.enabled ? 1 : 0.3,
          fillOpacity: poi.enabled ? 0.95 : 0.3,
        }).addTo(map);

        const difficultyColor = poi.difficulty === 'Extreme' ? 'text-red-500' : poi.difficulty === 'Technical' ? 'text-orange-500' : 'text-green-500';

        // Find companions for this day
        const dayCompanions = companions.filter(c => day.companionIds.includes(c.id));
        const companionBadges = dayCompanions.length > 0
          ? `<div class="flex gap-1 mt-2 flex-wrap">
              ${dayCompanions.map(c => `<span style="background:${c.color}" class="text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold">${c.avatar || ''} ${c.name}</span>`).join('')}
            </div>`
          : `<div class="mt-2"><span class="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">Solo</span></div>`;

        const trainBadge = day.trainInfo && day.trainInfo.trainName
          ? `<div class="mt-2 flex items-center gap-1 bg-sky-50 p-1.5 rounded-md border border-sky-100">
              <span class="text-sm">🚄</span>
              <span class="text-[10px] font-bold text-sky-700">${day.trainInfo.trainName} ${day.trainInfo.trainNumber}</span>
              ${day.trainInfo.carNumber ? `<span class="text-[9px] text-sky-500">Car ${day.trainInfo.carNumber}</span>` : ''}
              ${day.trainInfo.seatNumber ? `<span class="text-[9px] text-sky-500">Seat ${day.trainInfo.seatNumber}</span>` : ''}
            </div>`
          : '';

        const popupContent = `
          <div class="w-64 sm:w-72 overflow-hidden rounded-xl font-sans text-slate-900 bg-white" data-poi-name="${poi.name}">
            ${poi.imageUrl ? `<img src="${poi.imageUrl}" class="w-full h-28 sm:h-40 object-cover rounded-t-xl" alt="${poi.name}" onerror="this.style.display='none'" />` : ''}
            <div class="p-2.5 sm:p-4">
              <div class="flex justify-between items-start mb-0.5 sm:mb-1">
                <b class="text-slate-900 text-lg sm:text-xl font-black leading-tight">${poi.name}</b>
                <span class="bg-slate-950 text-white text-[9px] sm:text-[10px] px-2 py-0.5 sm:py-1 rounded-full font-black shrink-0 ml-2">DAY ${day.dayNum}</span>
              </div>
              <div class="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <span class="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest font-black">${poi.type}</span>
                <span class="text-slate-300">•</span>
                <span class="text-[9px] sm:text-[10px] font-bold ${difficultyColor}">${poi.difficulty || 'Easy'} Terrain</span>
              </div>
              <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3 bg-slate-50 p-1.5 sm:p-2 rounded-lg border border-slate-100">
                <div>
                  <p class="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase">Elevation</p>
                  <p class="text-[10px] sm:text-xs font-bold text-slate-700">${poi.elevation || 'Sea Level'}</p>
                </div>
                <div>
                  <p class="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase">Status</p>
                  <p class="text-[10px] sm:text-xs font-bold text-slate-700">${poi.enabled ? '✅ Planned' : '⏸️ Skipped'}</p>
                </div>
              </div>
              ${poi.note ? `<p class="text-slate-600 text-[10px] sm:text-[11px] leading-snug italic border-l-2 border-slate-200 pl-2 mb-1 sm:mb-2">"${poi.note}"</p>` : ''}
              ${trainBadge}
              ${companionBadges}
              <p class="text-slate-400 text-[9px] sm:text-[10px] mt-1.5 sm:mt-2 border-t pt-1.5 sm:pt-2">Schedule: ${day.date}</p>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-leaflet-popup',
          offset: [0, -5],
          maxWidth: 300
        });

        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          if (selectedDay !== day.dayNum) {
            isMapInteraction.current = true;
            onSelectDay(day.dayNum);
          }
        });
        layersRef.current[`poi_${day.dayNum}_${poi.id}`] = marker;
      });

      // Companion markers on starting point for selected day
      if (isSelected && day.routeCoords[0]) {
        const start = day.routeCoords[0];
        const dayCompanions = companions.filter(c => day.companionIds.includes(c.id));

        if (dayCompanions.length > 0) {
          const avatarHtml = dayCompanions.slice(0, 5).map((c, i) =>
            `<div style="
              position: absolute;
              left: ${i * 18}px;
              width: 24px; height: 24px;
              border-radius: 50%;
              background: ${c.color};
              border: 2px solid #1e293b;
              display: flex; align-items: center; justify-content: center;
              font-size: 12px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              z-index: ${10 - i};
            ">${c.avatar || c.name[0]}</div>`
          ).join('');

          const companionOverlay = L.marker([start.lat, start.lng], {
            icon: L.divIcon({
              className: 'companion-overlay',
              html: `<div style="position:relative; width:${dayCompanions.length * 18 + 10}px; height:28px;">${avatarHtml}</div>`,
              iconSize: [dayCompanions.length * 18 + 10, 28],
              iconAnchor: [(dayCompanions.length * 18 + 10) / 2, 40],
            }),
            interactive: false,
            zIndexOffset: 900,
          }).addTo(map);
          layersRef.current[`companions_${day.dayNum}`] = companionOverlay;
        }
      }
    });
  }, [days, selectedDay, onSelectDay, companions]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true
    }).setView([36.2048, 138.2529], 5);

    mapInstanceRef.current = map;

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    drawItinerary(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      drawItinerary(map);

      if (selectedDay !== lastSelectedDayRef.current) {
        if (!isMapInteraction.current) {
          const day = days.find(d => d.dayNum === selectedDay);
          if (day && day.routeCoords?.[0]) {
            const start = day.routeCoords[0];
            if (!isNaN(start.lat) && !isNaN(start.lng)) {
              map.invalidateSize();
              map.flyTo([start.lat, start.lng], isMobile() ? 9 : 10, {
                duration: 1.5,
                easeLinearity: 0.25
              });
            }
          }
        }
        isMapInteraction.current = false;
        lastSelectedDayRef.current = selectedDay;
      }
    }
  }, [selectedDay, drawItinerary, days]);

  return (
    <div className="relative h-full w-full">
      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        }
        .custom-leaflet-popup .leaflet-popup-content { margin: 0; }
        .direction-arrow, .train-badge, .companion-overlay { pointer-events: none; }
        .leaflet-popup-tip { background: white; }
      `}</style>
      <div ref={mapContainerRef} className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-950" />
    </div>
  );
};

export default Map;
