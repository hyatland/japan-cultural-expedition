
import { POI, Coordinate } from '../types';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const POI_TYPE_MAP: Record<string, POI['type']> = {
  'place_of_worship': 'temple',
  'temple': 'temple',
  'shrine': 'shrine',
  'museum': 'museum',
  'garden': 'garden',
  'park': 'garden',
  'marketplace': 'market',
  'hot_spring': 'hotspring',
  'station': 'station',
  'viewpoint': 'other',
  'castle': 'other',
  'monument': 'other',
  'artwork': 'other',
  'attraction': 'other',
};

function classifyPoi(tags: Record<string, string>): POI['type'] {
  if (tags.religion === 'shinto') return 'shrine';
  if (tags.religion === 'buddhism') return 'temple';
  if (tags.tourism === 'museum') return 'museum';
  if (tags.tourism === 'hot_spring' || tags.natural === 'hot_spring') return 'hotspring';
  if (tags.leisure === 'garden' || tags.leisure === 'park') return 'garden';
  if (tags.shop === 'marketplace' || tags.amenity === 'marketplace') return 'market';
  if (tags.railway === 'station' || tags.public_transport === 'station') return 'station';
  if (tags.natural === 'volcano') return 'volcano';
  if (tags.natural === 'waterfall') return 'waterfall';
  if (tags.historic === 'castle') return 'other';
  if (tags.tourism) return POI_TYPE_MAP[tags.tourism] || 'other';
  if (tags.amenity) return POI_TYPE_MAP[tags.amenity] || 'other';
  return 'other';
}

export async function fetchNearbyPOIs(
  center: Coordinate,
  radiusMeters: number = 3000,
  existingPoiNames: string[] = []
): Promise<POI[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["tourism"~"museum|attraction|viewpoint|artwork"](around:${radiusMeters},${center.lat},${center.lng});
      node["amenity"="place_of_worship"](around:${radiusMeters},${center.lat},${center.lng});
      node["historic"~"castle|monument|memorial"](around:${radiusMeters},${center.lat},${center.lng});
      node["leisure"~"garden|park"](around:${radiusMeters},${center.lat},${center.lng});
      node["natural"~"hot_spring|volcano|waterfall"](around:${radiusMeters},${center.lat},${center.lng});
      way["tourism"~"museum|attraction"](around:${radiusMeters},${center.lat},${center.lng});
      way["amenity"="place_of_worship"](around:${radiusMeters},${center.lat},${center.lng});
    );
    out center 30;
  `;

  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);

    const data = await response.json();
    const elements: OverpassElement[] = data.elements || [];

    const existingNamesLower = new Set(existingPoiNames.map(n => n.toLowerCase()));

    const pois: POI[] = elements
      .filter(el => {
        const name = el.tags?.name || el.tags?.['name:en'];
        return name && !existingNamesLower.has(name.toLowerCase());
      })
      .map(el => {
        const lat = el.lat ?? el.center?.lat ?? 0;
        const lon = el.lon ?? el.center?.lon ?? 0;
        const tags = el.tags || {};
        const name = tags['name:en'] || tags.name || 'Unknown';
        const type = classifyPoi(tags);
        const description = tags.description || tags['description:en'] || '';
        const note = tags.wikipedia
          ? `Wikipedia: ${tags.wikipedia}`
          : description || undefined;

        return {
          id: `osm_${el.id}`,
          name,
          type,
          coord: { lat, lng: lon },
          note,
          enabled: false,
          difficulty: 'Easy' as const,
        };
      })
      .filter(poi => poi.coord.lat !== 0 && poi.coord.lng !== 0);

    return pois.slice(0, 15);
  } catch (error) {
    console.error('Overpass API fetch failed:', error);
    return [];
  }
}

/**
 * Fetch estimated travel duration between two points using OSRM
 */
export async function fetchTravelDuration(
  from: Coordinate,
  to: Coordinate
): Promise<{ durationMinutes: number; distanceKm: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        durationMinutes: Math.round(route.duration / 60),
        distanceKm: Math.round(route.distance / 1000),
      };
    }
    return null;
  } catch (error) {
    console.error('OSRM routing failed:', error);
    return null;
  }
}
