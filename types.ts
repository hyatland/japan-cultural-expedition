
export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Companion {
  id: string;
  name: string;
  color: string;
  avatar?: string; // emoji or initials
}

export interface TrainInfo {
  trainName: string;      // e.g. "Nozomi 225"
  trainNumber: string;    // e.g. "225"
  carNumber: string;      // e.g. "7"
  seatNumber: string;     // e.g. "14A"
  departureStation: string;
  arrivalStation: string;
  departureTime: string;  // HH:mm
  arrivalTime: string;    // HH:mm
  durationMinutes?: number;
}

export interface POI {
  id: string;
  name: string;
  type: 'waterfall' | 'volcano' | 'hotspring' | 'town' | 'canyon' | 'other' | 'camp' | 'temple' | 'shrine' | 'garden' | 'museum' | 'market' | 'station';
  coord: Coordinate;
  description?: string;
  imageUrl?: string;
  elevation?: string;
  difficulty?: 'Easy' | 'Moderate' | 'Technical' | 'Extreme';
  note?: string;
  enabled: boolean; // toggle in/out of day plan
}

export interface Activity {
  text: string;
  time?: string; // HH:mm
}

export interface ItineraryDay {
  date: string;
  dayNum: number;
  title: string;
  where: string;
  activities: Activity[];
  sleep: string;
  routeCoords: Coordinate[];
  pois: POI[];
  isHighland: boolean;
  terrain: string;
  routeOptions: string[];
  companionIds: string[];   // IDs of companions present this day
  trainInfo?: TrainInfo;    // optional train details for this day
  arrivalTime?: string;     // HH:mm arrival at destination
  departureTime?: string;   // HH:mm departure from previous location
  travelDurationMinutes?: number; // calculated or manual
  bookingRef?: string;      // e.g. Expedia confirmation number
  bookingUrl?: string;      // direct link back to the booking page
  bookingNote?: string;     // e.g. "Expedia · Free cancellation until 7/3"
  checkInTime?: string;     // HH:mm hotel check-in time
  checkOutTime?: string;    // HH:mm hotel check-out time
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppState {
  days: ItineraryDay[];
  companions: Companion[];
  selectedDayNum: number | null;
}
