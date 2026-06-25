
import { ItineraryDay, Companion } from './types';

let _poiId = 0;
const pid = () => `poi_${++_poiId}`;

export const DEFAULT_COMPANIONS: Companion[] = [];

export const JAPAN_ITINERARY: ItineraryDay[] = [
  // ── Day 1: July 4 — Arrive → Atami ──
  {
    date: "7/4/2026",
    dayNum: 1,
    title: "Arrival → Atami",
    where: "Haneda → Atami",
    isHighland: false,
    terrain: "Airport arrival, then coastal train ride to the resort town of Atami.",
    routeOptions: ["Narita Express + Shinkansen", "Limousine Bus + Shinkansen", "Direct Odoriko Express"],
    activities: [
      { text: "3:30 PM: Arrive at Haneda (HND) — clear customs and pick up IC card (Suica) at airport" },
      { text: "Catch Odoriko Express from Shinagawa → Atami (~90 min, scenic coastal run)" },
      { text: "Check into Pearl Star Atami — enjoy rooftop onsen with sea views" },
      { text: "Evening stroll along Atami's seafront promenade and Atami Ginza" },
      { text: "Dinner at a harborside seafood restaurant — try Atami's famous abalone and kamaboko" },
    ],
    sleep: "Pearl Star Atami",
    routeCoords: [
      { lat: 35.5494, lng: 139.7798 }, // Haneda
      { lat: 35.0972, lng: 139.0744 }, // Atami
    ],
    pois: [
      { id: pid(), name: "Haneda Airport (HND)", type: "station", coord: { lat: 35.5494, lng: 139.7798 }, elevation: "5m", difficulty: "Easy", note: "Arrival point — 3:30 PM.", enabled: true, imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&w=800&q=80" },
      { id: pid(), name: "Atami Waterfront", type: "other", coord: { lat: 35.0972, lng: 139.0744 }, elevation: "10m", difficulty: "Easy", note: "Coastal resort town famous for hot springs and seafood.", enabled: true },
      { id: pid(), name: "Atami MOA Museum", type: "museum", coord: { lat: 35.1008, lng: 139.0793 }, elevation: "170m", difficulty: "Easy", note: "World-class art museum perched above the bay.", enabled: true },
    ],
    companionIds: [],
    arrivalTime: "15:30",
    trainInfo: {
      trainName: "Odoriko / Shinkansen",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Haneda",
      arrivalStation: "Atami",
      departureTime: "16:30",
      arrivalTime: "18:00",
      durationMinutes: 90,
    },
  },

  // ── Day 2: July 5 — Atami → Iizuka ──
  {
    date: "7/5/2026",
    dayNum: 2,
    title: "Atami → Iizuka (with Kay)",
    where: "Iizuka, Fukuoka Prefecture",
    isHighland: false,
    terrain: "Long Shinkansen journey across Honshu and into Kyushu, then local train to Iizuka.",
    routeOptions: ["Nozomi to Hakata + JR Kagoshima Line to Iizuka", "Hikari + Sakura + Local", "Overnight Bus"],
    activities: [
      { text: "9:00 AM: Nozomi Shinkansen from Atami — long but smooth ride through Kyushu" },
      { text: "Transfer at Hakata Station and catch JR Kagoshima Line to Iizuka (~40 min)" },
      { text: "Arrive and meet Kay in Iizuka — drop bags, breathe, explore" },
      { text: "Stroll through Honmachi Shotengai arcade — local snacks and drinks" },
      { text: "Wind down at Uchino Onsen after 6 hrs of travel" },
    ],
    sleep: "With Kay (TBD)",
    routeCoords: [
      { lat: 35.0972, lng: 139.0744 }, // Atami
      { lat: 33.5902, lng: 130.4017 }, // Hakata (transfer)
      { lat: 33.6495, lng: 130.6900 }, // Iizuka
    ],
    pois: [
      { id: pid(), name: "Iizuka City Center", type: "town", coord: { lat: 33.6495, lng: 130.6900 }, elevation: "30m", difficulty: "Easy", note: "Former coal-mining town with a rich industrial heritage.", enabled: true },
      { id: pid(), name: "Iizuka Honmachi Shotengai", type: "market", coord: { lat: 33.6485, lng: 130.6920 }, elevation: "25m", difficulty: "Easy", note: "Traditional shopping arcade — local food, drinks, and crafts.", enabled: true },
      { id: pid(), name: "Uchino Onsen", type: "hotspring", coord: { lat: 33.6610, lng: 130.7150 }, elevation: "60m", difficulty: "Easy", note: "Local onsen — great for unwinding after the long travel day.", enabled: true },
    ],
    companionIds: [],
    departureTime: "09:00",
    trainInfo: {
      trainName: "Nozomi + JR Kagoshima",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Atami",
      arrivalStation: "Iizuka",
      departureTime: "09:00",
      arrivalTime: "15:00",
      durationMinutes: 360,
    },
  },

  // ── Day 3: July 6 — Iizuka → Hakata ──
  {
    date: "7/6/2026",
    dayNum: 3,
    title: "Iizuka → Hakata with Kay",
    where: "Hakata, Fukuoka",
    isHighland: false,
    terrain: "Short 40-minute train hop to Fukuoka's buzzing city centre.",
    routeOptions: ["JR Kagoshima Line (40 min)", "Nishitetsu Bus", "Highway Bus"],
    activities: [
      { text: "Morning: JR Kagoshima Line from Iizuka → Hakata (40 min)" },
      { text: "Kushida Shrine — Hakata's guardian shrine, home of the giant Gion Yamakasa float" },
      { text: "Hakata Machiya Folk Museum — traditional townhouse life in old Fukuoka" },
      { text: "Lunch at Nakasu yatai food stalls along the Naka River — ramen, yakitori, sake" },
      { text: "Ohori Park walk — lakeside paths perfect for an afternoon wander" },
      { text: "Hakata Ramen dinner at Shin-Shin or Ippudo Watanabe Dori flagship" },
      { text: "Evening drinks in Daimyo or Tenjin nightlife district" },
    ],
    sleep: "With Kay (TBD)",
    routeCoords: [
      { lat: 33.6495, lng: 130.6900 }, // Iizuka
      { lat: 33.5902, lng: 130.4017 }, // Hakata
    ],
    pois: [
      { id: pid(), name: "Hakata Station", type: "station", coord: { lat: 33.5902, lng: 130.4202 }, elevation: "5m", difficulty: "Easy", note: "Arrival hub for Kyushu — massive shopping complex inside.", enabled: true },
      { id: pid(), name: "Nakasu Food Stalls (Yatai)", type: "town", coord: { lat: 33.5914, lng: 130.4084 }, elevation: "5m", difficulty: "Easy", note: "Famous open-air food stalls along the river — ramen, yakitori, sake.", enabled: true },
      { id: pid(), name: "Kushida Shrine", type: "shrine", coord: { lat: 33.5990, lng: 130.4134 }, elevation: "5m", difficulty: "Easy", note: "Hakata's guardian shrine, home of the massive Gion Yamakasa float.", enabled: true },
      { id: pid(), name: "Ohori Park", type: "garden", coord: { lat: 33.5830, lng: 130.3773 }, elevation: "5m", difficulty: "Easy", note: "Beautiful central park with a large pond — great for a morning walk.", enabled: true },
    ],
    companionIds: [],
    departureTime: "10:00",
    trainInfo: {
      trainName: "JR Kagoshima Line",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Iizuka",
      arrivalStation: "Hakata",
      departureTime: "10:00",
      arrivalTime: "10:40",
      durationMinutes: 40,
    },
  },

  // ── Day 4: July 7 — Hakata → Iizuka ──
  {
    date: "7/7/2026",
    dayNum: 4,
    title: "Hakata → Iizuka (Pre-Yakushima Rest)",
    where: "Iizuka, Fukuoka Prefecture",
    isHighland: false,
    terrain: "Short ride back to Iizuka. Rest day before the Yakushima adventure.",
    routeOptions: ["JR Kagoshima Line (40 min)", "Nishitetsu Bus", "Taxi"],
    activities: [
      { text: "Morning: JR Kagoshima Line back to Iizuka (40 min)" },
      { text: "Kaho Theater — stunning Taisho-era playhouse, beautifully restored" },
      { text: "Pack and organize hiking kit for Yakushima (layers, rain gear, trail snacks)" },
      { text: "Stock up on supplies at Iizuka Honmachi Shotengai" },
      { text: "Early dinner, early night — ferry departure is tomorrow morning" },
    ],
    sleep: "With Kay (TBD)",
    routeCoords: [
      { lat: 33.5902, lng: 130.4017 }, // Hakata
      { lat: 33.6495, lng: 130.6900 }, // Iizuka
    ],
    pois: [
      { id: pid(), name: "Kaho Theater", type: "museum", coord: { lat: 33.6490, lng: 130.6890 }, elevation: "25m", difficulty: "Easy", note: "Historic Taisho-era theater, beautifully restored.", enabled: true },
      { id: pid(), name: "Iizuka Honmachi Shotengai", type: "market", coord: { lat: 33.6485, lng: 130.6920 }, elevation: "25m", difficulty: "Easy", note: "Traditional shopping arcade — stock up on snacks for Yakushima.", enabled: true },
    ],
    companionIds: [],
    departureTime: "09:00",
    trainInfo: {
      trainName: "JR Kagoshima Line",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Hakata",
      arrivalStation: "Iizuka",
      departureTime: "09:00",
      arrivalTime: "09:40",
      durationMinutes: 40,
    },
  },

  // ── Day 5: July 8 — Iizuka → Yakushima ──
  {
    date: "7/8/2026",
    dayNum: 5,
    title: "Iizuka → Yakushima",
    where: "Yakushima Island",
    isHighland: false,
    terrain: "Train to Kagoshima, then a 2-hour high-speed ferry crossing to Yakushima.",
    routeOptions: ["JR to Kagoshima + Toppy Ferry", "JR to Kagoshima + Rocket (Hydrofoil)", "Bus to Kagoshima Airport + Flight"],
    activities: [
      { text: "10:00 AM: Depart Iizuka — JR Kagoshima Line to Kagoshima Central (3–4 hrs)" },
      { text: "1:30 PM: Board Toppy hydrofoil ferry from Kagoshima Honko" },
      { text: "3:30 PM: Arrive at Miyanoura Port, Yakushima — check into Ocean and Forest" },
      { text: "Sunset walk on the rocky southern coastline — listen for deer" },
      { text: "Dinner at the hotel: fresh Yakushima flying fish (tobiuo) and mountain vegetables" },
    ],
    sleep: "Ocean and Forest",
    routeCoords: [
      { lat: 33.6495, lng: 130.6900 }, // Iizuka
      { lat: 31.5966, lng: 130.5571 }, // Kagoshima
      { lat: 30.3700, lng: 130.6700 }, // Yakushima
    ],
    pois: [
      { id: pid(), name: "Kagoshima Ferry Terminal", type: "station", coord: { lat: 31.5966, lng: 130.5671 }, elevation: "3m", difficulty: "Easy", note: "Toppy & Rocket hydrofoil terminal for Yakushima.", enabled: true },
      { id: pid(), name: "Miyanoura Port", type: "station", coord: { lat: 30.4463, lng: 130.5426 }, elevation: "5m", difficulty: "Easy", note: "Main port of Yakushima island.", enabled: true },
      { id: pid(), name: "Hotel Yakushima Ocean & Forest", type: "other", coord: { lat: 30.3700, lng: 130.6700 }, elevation: "10m", difficulty: "Easy", note: "Boutique hotel nestled between ocean and ancient forest.", enabled: true },
    ],
    companionIds: [],
    departureTime: "10:00",
    arrivalTime: "15:30",
    trainInfo: {
      trainName: "Toppy Ferry",
      trainNumber: "1:30 PM",
      carNumber: "",
      seatNumber: "",
      departureStation: "Kagoshima",
      arrivalStation: "Yakushima (Miyanoura)",
      departureTime: "13:30",
      arrivalTime: "15:30",
      durationMinutes: 120,
    },
  },

  // ── Day 6: July 9 — Yakushima ──
  {
    date: "7/9/2026",
    dayNum: 6,
    title: "Ancient Cedars of Yakushima",
    where: "Yakushima Island",
    isHighland: true,
    terrain: "Dense primeval forest, mossy trails, river crossings. UNESCO World Heritage Site.",
    routeOptions: ["Shiratani Unsuikyo Trail", "Jomonsugi Cedar Trek (10hr)", "Yakusugi Land (easier loop)"],
    activities: [
      { text: "6:00 AM: Bus to Shiratani Unsuikyo — the mossy forest that inspired Princess Mononoke" },
      { text: "Hike the main Shiratani Unsuikyo trail (4–5 hrs) — ancient cedar groves, river crossings" },
      { text: "Spot wild Yakushima deer and Japanese macaques on the trail" },
      { text: "Optional detour: Yakusugi Land for easier cedar trails at 1,000m elevation" },
      { text: "Afternoon swim at Isso Beach or cool off under Yunogo Waterfall" },
      { text: "Evening: Soak in Onoaida Onsen — a natural seaside pool carved into coastal rock" },
    ],
    sleep: "Ocean and Forest",
    routeCoords: [
      { lat: 30.3700, lng: 130.6700 },
      { lat: 30.3350, lng: 130.5450 }, // Shiratani Unsuikyo
    ],
    pois: [
      { id: pid(), name: "Shiratani Unsuikyo Ravine", type: "garden", coord: { lat: 30.3350, lng: 130.5450 }, elevation: "620m", difficulty: "Moderate", note: "The forest that inspired Studio Ghibli's Princess Mononoke.", enabled: true, imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80" },
      { id: pid(), name: "Yakusugi Land", type: "garden", coord: { lat: 30.3680, lng: 130.6060 }, elevation: "1000m", difficulty: "Moderate", note: "Accessible ancient cedar grove with well-maintained trails.", enabled: true },
      { id: pid(), name: "Oko no Taki Waterfall", type: "waterfall", coord: { lat: 30.3030, lng: 130.5620 }, elevation: "150m", difficulty: "Easy", note: "Japan's largest waterfall plunging directly into the sea.", enabled: true },
    ],
    companionIds: [],
    departureTime: "06:00",
  },

  // ── Day 7: July 10 — Yakushima → Ureshino Onsen ──
  {
    date: "7/10/2026",
    dayNum: 7,
    title: "Yakushima → Ureshino Onsen",
    where: "Ureshino, Saga Prefecture",
    isHighland: false,
    terrain: "Ferry back to Kagoshima, then train to Saga's renowned hot spring town.",
    routeOptions: ["Toppy Ferry + JR to Ureshino", "Ferry + Bus via Saga", "Hydrofoil + Highway Bus"],
    activities: [
      { text: "10:30 AM: Toppy Ferry from Yakushima Miyanoura → Kagoshima (~2 hrs)" },
      { text: "JR Nagasaki Line / Express Bus from Kagoshima toward Ureshino via Saga" },
      { text: "Check into Wataya Besso Ryokan — one of Japan's oldest and most famous hot spring inns" },
      { text: "Soak in Ureshino's famous silky alkaline waters — said to visibly soften skin" },
      { text: "Multi-course kaiseki dinner, beautifully plated with local Ureshino green tea" },
      { text: "Morning bonus: Walk through Ureshino's rolling tea fields at dawn" },
    ],
    sleep: "Wataya Besso (Ryokan)",
    routeCoords: [
      { lat: 30.3700, lng: 130.6700 }, // Yakushima
      { lat: 31.5966, lng: 130.5571 }, // Kagoshima
      { lat: 33.1024, lng: 129.9762 }, // Ureshino
    ],
    pois: [
      { id: pid(), name: "Wataya Besso", type: "hotspring", coord: { lat: 33.1024, lng: 129.9762 }, elevation: "30m", difficulty: "Easy", note: "Historic ryokan — Ureshino's famous silky alkaline waters said to soften skin.", enabled: true },
      { id: pid(), name: "Ureshino Onsen Town", type: "town", coord: { lat: 33.0990, lng: 129.9740 }, elevation: "25m", difficulty: "Easy", note: "One of Japan's top three skin-beautifying hot springs.", enabled: true },
      { id: pid(), name: "Ureshino Tea Fields", type: "garden", coord: { lat: 33.1100, lng: 129.9900 }, elevation: "80m", difficulty: "Easy", note: "Ureshino is also famed for its green tea — rolling hills of tea farms.", enabled: true },
    ],
    companionIds: [],
    departureTime: "10:30",
    trainInfo: {
      trainName: "Toppy Ferry",
      trainNumber: "10:30 AM",
      carNumber: "",
      seatNumber: "",
      departureStation: "Yakushima (Miyanoura)",
      arrivalStation: "Kagoshima",
      departureTime: "10:30",
      arrivalTime: "12:30",
      durationMinutes: 120,
    },
  },

  // ── Day 8: July 11 — Ureshino → Nagasaki (day visit) → Takamatsu ──
  {
    date: "7/11/2026",
    dayNum: 8,
    title: "Nagasaki Day Visit → Takamatsu",
    where: "Nagasaki (day visit) → Takamatsu",
    isHighland: false,
    terrain: "Check out of Ureshino, a powerful half-day in Nagasaki, then a long evening journey to Takamatsu.",
    routeOptions: ["Bus: Ureshino → Nagasaki (~1 hr) + JR/Bus → Hakata → Marine Liner → Takamatsu", "Express Bus Nagasaki → Hakata → Shinkansen → Okayama → Takamatsu", "Split: Nagasaki → overnight in Hakata → Takamatsu next morning"],
    activities: [
      { text: "8:00 AM: Check out of Wataya Besso — squeeze in one last morning soak before the road" },
      { text: "Bus/JR to Nagasaki (~1 hr) — stow bags at station lockers" },
      { text: "Nagasaki Peace Memorial Museum — deeply moving, allow 1.5–2 hours" },
      { text: "Walk through Nagasaki Peace Park and the iconic bronze peace statue" },
      { text: "Quick lunch: champon noodles at Ringer Hut or Hamakatsu near Chinatown" },
      { text: "Glover Garden — Meiji-era mansions with sweeping harbour views" },
      { text: "Afternoon: Head toward Hakata Station and connect toward Takamatsu" },
      { text: "Late evening: Check into Dormy Inn Takamatsu" },
    ],
    sleep: "Dormy Inn Takamatsuchuokoenmae Natural Hot Springs",
    routeCoords: [
      { lat: 33.1024, lng: 129.9762 }, // Ureshino
      { lat: 32.7503, lng: 129.8779 }, // Nagasaki
      { lat: 33.5902, lng: 130.4017 }, // Hakata (transit)
      { lat: 34.3401, lng: 134.0434 }, // Takamatsu
    ],
    pois: [
      { id: pid(), name: "Nagasaki Peace Park", type: "other", coord: { lat: 32.7742, lng: 129.8670 }, elevation: "30m", difficulty: "Easy", note: "Iconic peace statue commemorating the August 9, 1945 atomic bombing.", enabled: true, imageUrl: "https://images.unsplash.com/photo-1570459027562-4a916cc6113f?auto=format&fit=crop&w=800&q=80" },
      { id: pid(), name: "Atomic Bomb Museum", type: "museum", coord: { lat: 32.7733, lng: 129.8658 }, elevation: "25m", difficulty: "Easy", note: "Deeply moving museum documenting the events of 1945 — reserve 1.5–2 hours.", enabled: true },
      { id: pid(), name: "Glover Garden", type: "garden", coord: { lat: 32.7327, lng: 129.8700 }, elevation: "80m", difficulty: "Easy", note: "Western-style Meiji-era mansions perched above Nagasaki Harbour.", enabled: true },
      { id: pid(), name: "Nagasaki Chinatown (Shinchi)", type: "town", coord: { lat: 32.7432, lng: 129.8736 }, elevation: "5m", difficulty: "Easy", note: "Japan's oldest Chinatown — try champon noodles for a quick lunch stop.", enabled: true },
    ],
    companionIds: [],
    departureTime: "08:00",
  },

  // ── Day 9: July 12 — Takamatsu (Solo begins) ──
  {
    date: "7/12/2026",
    dayNum: 9,
    title: "Takamatsu — Gardens & Udon",
    where: "Takamatsu, Kagawa",
    isHighland: false,
    terrain: "First full solo day. Strolling gardens, legendary udon, and Seto Inland Sea vibes.",
    routeOptions: ["Walk and local bus all day", "Bicycle rental from Takamatsu Station", "Takamatsu City Loop Bus"],
    activities: [
      { text: "Morning: Ritsurin Garden — one of Japan's finest strolling gardens (open 7 AM)" },
      { text: "Tea ceremony at Kikugetsu-tei teahouse inside the garden" },
      { text: "Sanuki udon brunch at Yamada-ya or Udon-jizo — chewy, dashi-rich, unforgettable" },
      { text: "Afternoon: Takamatsu Sunport waterfront and Tamamo Park seaside walk" },
      { text: "Explore Marugame-machi Shotengai arcade — coffee, crafts, local bakeries" },
      { text: "Dinner at a quiet izakaya — grilled octopus and local Kagawa sake" },
    ],
    sleep: "Dormy Inn Takamatsuchuokoenmae Natural Hot Springs",
    routeCoords: [
      { lat: 34.3401, lng: 134.0434 }, // Takamatsu
      { lat: 34.3310, lng: 134.0480 }, // Ritsurin Garden
    ],
    pois: [
      { id: pid(), name: "Takamatsu Station", type: "station", coord: { lat: 34.3501, lng: 134.0484 }, elevation: "5m", difficulty: "Easy", note: "Gateway to Kagawa and the Seto Inland Sea islands.", enabled: true },
      { id: pid(), name: "Ritsurin Garden", type: "garden", coord: { lat: 34.3310, lng: 134.0480 }, elevation: "10m", difficulty: "Easy", note: "One of Japan's most celebrated historic gardens — tea ceremony available.", enabled: true, imageUrl: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?auto=format&fit=crop&w=800&q=80" },
      { id: pid(), name: "Takamatsu Sanuki Udon Alley", type: "market", coord: { lat: 34.3420, lng: 134.0490 }, elevation: "5m", difficulty: "Easy", note: "Kagawa is the birthplace of Sanuki udon — chewy, dashi-rich, unforgettable.", enabled: true },
    ],
    companionIds: [],
    departureTime: "09:00",
  },

  // ── Day 10: July 13 — Takamatsu → Gero Onsen ──
  {
    date: "7/13/2026",
    dayNum: 10,
    title: "Takamatsu → Gero Onsen",
    where: "Gero Onsen, Gifu Prefecture",
    isHighland: false,
    terrain: "Long cross-island journey from Kagawa via Okayama and Nagoya into the mountain valleys of Gifu.",
    routeOptions: ["Marine Liner → Nozomi Shinkansen → JR Hida Line to Gero", "Highway Bus via Nagoya", "Marine Liner → Shinkansen → bus via Takayama"],
    activities: [
      { text: "9:00 AM: Check out Dormy Inn, board Marine Liner from Takamatsu → Okayama (55 min)" },
      { text: "Nozomi Shinkansen from Okayama → Nagoya (~50 min)" },
      { text: "JR Hida Line: Nagoya → Gero (~1 hr 30 min) — the mountains close in around you" },
      { text: "Arrive Gero Onsen ~2:30 PM — check into Suimeikan Ryokan" },
      { text: "First soak in Suimeikan's open-air rotenburo overlooking the Hida River" },
      { text: "Ryokan kaiseki dinner — seasonal Hida mountain cuisine, delicately presented" },
    ],
    sleep: "Suimeikan",
    routeCoords: [
      { lat: 34.3401, lng: 134.0434 }, // Takamatsu
      { lat: 34.6638, lng: 133.9178 }, // Okayama (transfer)
      { lat: 35.1709, lng: 136.8815 }, // Nagoya (transfer)
      { lat: 35.8082, lng: 137.2449 }, // Gero Onsen
    ],
    pois: [
      { id: pid(), name: "Gero Onsen Town", type: "hotspring", coord: { lat: 35.8082, lng: 137.2449 }, elevation: "210m", difficulty: "Easy", note: "One of Japan's Three Famous Hot Springs — bicarbonate sodium water said to visibly smooth skin.", enabled: true },
      { id: pid(), name: "Suimeikan Ryokan", type: "hotspring", coord: { lat: 35.8082, lng: 137.2449 }, elevation: "210m", difficulty: "Easy", note: "Grand historic ryokan with multiple open-air baths perched above the Hida River gorge.", enabled: true },
      { id: pid(), name: "Gero Onsen Gassho Village", type: "museum", coord: { lat: 35.8050, lng: 137.2400 }, elevation: "220m", difficulty: "Easy", note: "Open-air museum of traditional thatched farmhouses — a warm-up for tomorrow's Shirakawa-go.", enabled: true },
    ],
    companionIds: [],
    departureTime: "09:00",
    trainInfo: {
      trainName: "Marine Liner + Nozomi + JR Hida",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Takamatsu",
      arrivalStation: "Gero",
      departureTime: "09:00",
      arrivalTime: "14:30",
      durationMinutes: 330,
    },
  },

  // ── Day 11: July 14 — Gero Onsen (Full Rest Day) ──
  {
    date: "7/14/2026",
    dayNum: 11,
    title: "Gero Onsen — Suimeikan Day",
    where: "Gero Onsen, Gifu Prefecture",
    isHighland: false,
    terrain: "Hida River valley — steaming outdoor baths, riverside strolls, mountain air. Do nothing. Soak everything.",
    routeOptions: ["Walk everywhere — Gero is tiny and perfect on foot", "Bicycle rental along the Hida River", "Day trip: Gassho Village open-air museum"],
    activities: [
      { text: "Morning: Long soak in Suimeikan's outdoor rotenburo — mist rises off the Hida River at dawn" },
      { text: "Explore Gero town — free ashiyu footbaths are scattered throughout the streets" },
      { text: "Gero Onsen Gassho Village — wander through relocated thatched farmhouses at your own pace" },
      { text: "Onsen-manju (hot spring buns) and local sake from riverside shops" },
      { text: "Afternoon nap, evening kaiseki dinner — then back into the baths under the stars" },
      { text: "Pack tonight for tomorrow's 9 AM departure to Shirakawa-go" },
    ],
    sleep: "Suimeikan",
    routeCoords: [
      { lat: 35.8082, lng: 137.2449 }, // Gero
      { lat: 35.8050, lng: 137.2400 }, // Gassho Village
    ],
    pois: [
      { id: pid(), name: "Suimeikan Outdoor Baths (Rotenburo)", type: "hotspring", coord: { lat: 35.8082, lng: 137.2449 }, elevation: "210m", difficulty: "Easy", note: "Multiple open-air baths with gorge views — visit at dawn and after dark for different moods.", enabled: true },
      { id: pid(), name: "Gero Onsen Gassho Village", type: "museum", coord: { lat: 35.8050, lng: 137.2400 }, elevation: "220m", difficulty: "Easy", note: "8 relocated gassho-zukuri farmhouses you can walk through — good Shirakawa-go preview.", enabled: true },
      { id: pid(), name: "Gero Street Ashiyu Footbaths", type: "hotspring", coord: { lat: 35.8082, lng: 137.2470 }, elevation: "210m", difficulty: "Easy", note: "Free public footbaths throughout the onsen town — soak your feet between sightseeing spots.", enabled: true },
    ],
    companionIds: [],
    departureTime: "07:00",
  },

  // ── Day 12: July 15 — Gero → Shirakawa-go → Kanazawa ──
  {
    date: "7/15/2026",
    dayNum: 12,
    title: "Gero → Shirakawa-go → Kanazawa",
    where: "Shirakawa-go (en route) → Kanazawa",
    isHighland: true,
    terrain: "Mountain bus through the Japan Alps to UNESCO World Heritage Shirakawa-go, then onward to Kanazawa on the Sea of Japan coast.",
    routeOptions: ["JR Hida: Gero → Takayama (40 min) + Nohhi Bus: Takayama → Shirakawa-go (50 min) + Hokutetsu Bus: Shirakawa-go → Kanazawa (1h 15m)", "Direct Highway Bus Gero → Kanazawa (via Takayama/Shirakawa-go)", "Taxi Gero → Shirakawa-go then bus to Kanazawa"],
    activities: [
      { text: "9:00 AM: Check out of Suimeikan, catch JR Hida train toward Takayama (~40 min)" },
      { text: "Nohhi Bus from Takayama → Shirakawa-go (~50 min) — arrive mid-morning" },
      { text: "Wander Ogimachi village — UNESCO gassho-zukuri thatched farmhouses in a mountain valley" },
      { text: "Climb to Ogimachi Castle Ruins viewpoint — the quintessential Shirakawa-go panorama" },
      { text: "Lunch: Hida beef or sansai (mountain vegetable) dishes in the village" },
      { text: "Hokutetsu Bus: Shirakawa-go → Kanazawa (~1 hr 15 min, depart ~1:00 PM)" },
      { text: "Check into Super Hotel Premier Kanazawaeki Higashiguchi, explore the station area" },
    ],
    sleep: "Super Hotel Premier Kanazawaeki Higashiguchi",
    routeCoords: [
      { lat: 35.8082, lng: 137.2449 }, // Gero
      { lat: 36.1461, lng: 137.2520 }, // Takayama (transfer)
      { lat: 36.2573, lng: 136.9066 }, // Shirakawa-go
      { lat: 36.5613, lng: 136.6562 }, // Kanazawa
    ],
    pois: [
      { id: pid(), name: "Shirakawa-go (Ogimachi)", type: "town", coord: { lat: 36.2573, lng: 136.9066 }, elevation: "490m", difficulty: "Easy", note: "UNESCO World Heritage village — iconic steep-roofed gassho-zukuri farmhouses in a river valley.", enabled: true, imageUrl: "https://images.unsplash.com/photo-1548616977-7fa9b17e8b44?auto=format&fit=crop&w=800&q=80" },
      { id: pid(), name: "Ogimachi Castle Ruins Viewpoint", type: "other", coord: { lat: 36.2565, lng: 136.9075 }, elevation: "540m", difficulty: "Easy", note: "10-minute walk from the village — the postcard viewpoint over the entire Shirakawa-go valley.", enabled: true },
      { id: pid(), name: "Wada House (Wada-ke)", type: "museum", coord: { lat: 36.2573, lng: 136.9066 }, elevation: "490m", difficulty: "Easy", note: "Largest gassho-zukuri house in Shirakawa-go — five stories of living history, open to visitors.", enabled: true },
      { id: pid(), name: "Super Hotel Premier Kanazawaeki Higashiguchi", type: "other", coord: { lat: 36.5780, lng: 136.6475 }, elevation: "10m", difficulty: "Easy", note: "Modern hotel steps from Kanazawa Station — ideal base for the city and Komatsu Airport.", enabled: true },
    ],
    companionIds: [],
    departureTime: "09:00",
    trainInfo: {
      trainName: "JR Hida + Nohhi Bus + Hokutetsu Bus",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Gero",
      arrivalStation: "Kanazawa (via Shirakawa-go)",
      departureTime: "09:00",
      arrivalTime: "16:00",
      durationMinutes: 420,
    },
  },

  // ── Day 13: July 16 — Kanazawa + Meet Brother at Komatsu ──
  {
    date: "7/16/2026",
    dayNum: 13,
    title: "Kanazawa → Komatsu (Brother Arrives!)",
    where: "Kanazawa / Komatsu Airport",
    isHighland: false,
    terrain: "Morning in Kanazawa, then a quick hop to Komatsu Airport to pick up your brother.",
    routeOptions: ["Hokuriku Tetsu Bus: Kanazawa Station → Komatsu Airport (40 min)", "JR Hokuriku Line: Kanazawa → Komatsu (18 min) + taxi to airport", "Taxi direct (~40 min)"],
    activities: [
      { text: "Morning: Omicho Market stroll and Kenroku-en — make the most of Kanazawa before pickup" },
      { text: "Hokuriku Tetsu Bus or JR to Komatsu Airport to meet brother" },
      { text: "Return to Kanazawa together — first stop: Higashi Chaya geisha district" },
      { text: "21st Century Museum of Contemporary Art — the famous swimming pool illusion" },
      { text: "Omakase sushi dinner to celebrate — Kanazawa is Japan's top city for fresh sushi outside Tokyo" },
    ],
    sleep: "With Brother (TBD)",
    routeCoords: [
      { lat: 36.5613, lng: 136.6562 }, // Kanazawa
      { lat: 36.3944, lng: 136.4066 }, // Komatsu Airport
      { lat: 36.5613, lng: 136.6562 }, // Back to Kanazawa
    ],
    pois: [
      { id: pid(), name: "Komatsu Airport (KMQ)", type: "station", coord: { lat: 36.3944, lng: 136.4066 }, elevation: "36m", difficulty: "Easy", note: "Small regional airport — 40 min Hokuriku Tetsu Bus from Kanazawa Station. Easy pickup.", enabled: true },
      { id: pid(), name: "Kenroku-en Garden", type: "garden", coord: { lat: 36.5624, lng: 136.6625 }, elevation: "60m", difficulty: "Easy", note: "One of Japan's Three Great Gardens — beautiful in every season.", enabled: true, imageUrl: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?auto=format&fit=crop&w=800&q=80" },
      { id: pid(), name: "Higashi Chaya District", type: "town", coord: { lat: 36.5727, lng: 136.6664 }, elevation: "10m", difficulty: "Easy", note: "Geisha district with Edo-era teahouses and gold-leaf artisan shops.", enabled: true },
      { id: pid(), name: "21st Century Museum of Contemporary Art", type: "museum", coord: { lat: 36.5601, lng: 136.6578 }, elevation: "30m", difficulty: "Easy", note: "Circular glass building with world-class contemporary art including the famous pool illusion.", enabled: true },
    ],
    companionIds: [],
    departureTime: "09:00",
    trainInfo: {
      trainName: "Hokuriku Tetsu Bus / JR Hokuriku",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Kanazawa",
      arrivalStation: "Komatsu Airport",
      departureTime: "10:00",
      arrivalTime: "10:40",
      durationMinutes: 40,
    },
  },

  // ── Day 14: July 17 — With Brother in Kanazawa ──
  {
    date: "7/17/2026",
    dayNum: 14,
    title: "Kanazawa with Brother",
    where: "Kanazawa",
    isHighland: false,
    terrain: "Full city day — samurai districts, contemporary art, and the best market in the Hokuriku region.",
    routeOptions: ["Kanazawa Loop Bus", "Walking Tour (compact city)", "Bicycle Rental"],
    activities: [
      { text: "7:00 AM: Omicho Market with brother — arrive early for fresh crab, uni, and sea bream" },
      { text: "Nagamachi Samurai District — clay-walled lanes, preserved residences, optional teahouse visit" },
      { text: "Gold-leaf craft workshop in Higashi Chaya — try applying gold leaf yourself" },
      { text: "Kanazawa Castle Park walk — expansive grounds with reconstructed turrets" },
      { text: "Afternoon: Izakaya crawl through Katamachi and Korinbo" },
      { text: "Late evening: Kanazawa's hidden jazz bar scene — the city has an unlikely but excellent jazz culture" },
    ],
    sleep: "With Brother (TBD)",
    routeCoords: [
      { lat: 36.5613, lng: 136.6562 },
      { lat: 36.5713, lng: 136.6560 }, // Omicho
    ],
    pois: [
      { id: pid(), name: "Omicho Market", type: "market", coord: { lat: 36.5713, lng: 136.6560 }, elevation: "5m", difficulty: "Easy", note: "Kanazawa's 300-year-old market — fresh crab, sea bream, and matcha sweets.", enabled: true },
      { id: pid(), name: "Nagamachi Samurai District", type: "town", coord: { lat: 36.5607, lng: 136.6498 }, elevation: "15m", difficulty: "Easy", note: "Preserved samurai and merchant residences with earthen walls and narrow lanes.", enabled: true },
      { id: pid(), name: "Kanazawa Castle Park", type: "other", coord: { lat: 36.5618, lng: 136.6567 }, elevation: "50m", difficulty: "Easy", note: "Expansive castle grounds with reconstructed Edo-period turrets and stone walls.", enabled: true },
    ],
    companionIds: [],
    departureTime: "07:00",
  },

  // ── Day 15: July 18 — Kanazawa → Tokyo Kamata ──
  {
    date: "7/18/2026",
    dayNum: 15,
    title: "Kanazawa → Tokyo Kamata",
    where: "Kamata, Tokyo (Ota Ward)",
    isHighland: false,
    terrain: "Shinkansen back toward Tokyo. Kamata is a local Tokyo neighbourhood near Haneda.",
    routeOptions: ["Hokuriku Shinkansen → Tokaido Shinkansen → Keikyu to Kamata", "JR to Shinagawa + Keikyu", "Shinkansen to Tokyo + Yamanote to Kamata"],
    activities: [
      { text: "Morning: Head to Kanazawa Station, board Hokuriku Shinkansen toward Tokyo (2 hrs 30 min)" },
      { text: "Connect at Tokyo/Shinagawa → Keikyu Line to Kamata (~15 min)" },
      { text: "Check into Asyl Hotel Tokyo Kamata — Haneda Airport is literally 2 stops away" },
      { text: "Explore Kamata Shotengai — covered shopping arcade with real old-school Tokyo neighbourhood feel" },
      { text: "Organise luggage, pack souvenirs, prepare for tomorrow's airport run" },
      { text: "Farewell dinner at a neighbourhood izakaya — cold Sapporo, yakitori, final kanpai" },
    ],
    sleep: "Asyl Hotel Tokyo Kamata",
    routeCoords: [
      { lat: 36.5613, lng: 136.6562 }, // Kanazawa
      { lat: 35.5610, lng: 139.7158 }, // Kamata, Tokyo
    ],
    pois: [
      { id: pid(), name: "Asyl Hotel Tokyo Kamata", type: "other", coord: { lat: 35.5610, lng: 139.7158 }, elevation: "5m", difficulty: "Easy", note: "Boutique hotel in the local Kamata neighbourhood, close to Haneda Airport.", enabled: true },
      { id: pid(), name: "Kamata Shotengai", type: "market", coord: { lat: 35.5630, lng: 139.7160 }, elevation: "5m", difficulty: "Easy", note: "One of Tokyo's liveliest covered shopping arcades — a real neighbourhood feel away from the tourist trail.", enabled: true },
      { id: pid(), name: "Haneda Airport (HND)", type: "station", coord: { lat: 35.5494, lng: 139.7798 }, elevation: "5m", difficulty: "Easy", note: "Just 2 stops from Kamata — convenient for the final departure day.", enabled: true },
    ],
    companionIds: [],
    trainInfo: {
      trainName: "Hokuriku + Tokaido Shinkansen",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Kanazawa Station",
      arrivalStation: "Kamata, Tokyo",
      departureTime: "09:00",
      arrivalTime: "13:00",
      durationMinutes: 240,
    },
    departureTime: "09:00",
    arrivalTime: "13:00",
  },

  // ── Day 16: July 19 — Farewell Tokyo → NYC ──
  {
    date: "7/19/2026",
    dayNum: 16,
    title: "Sayonara Tokyo → NYC",
    where: "Tokyo / Flight",
    isHighland: false,
    terrain: "Final morning in Tokyo. Evening departure.",
    routeOptions: ["Narita Express from Tokyo", "Limousine Bus to Narita", "Monorail to Haneda"],
    activities: [
      { text: "5:00 AM: Toyosu Market — book a tuna auction viewing slot in advance (limited, free)" },
      { text: "Sushi breakfast at Sushi Dai or Sushi Zanmai inside Toyosu" },
      { text: "Last-minute Shibuya or Shinjuku shopping — Tokyu Hands, Don Quijote for final gifts" },
      { text: "2 stops from Kamata: Keikyu to Haneda — fast and stress-free airport access" },
      { text: "10:45 PM: Flight departs for NYC — sayonara, Japan!" },
    ],
    sleep: "In-flight / NYC",
    routeCoords: [
      { lat: 35.5610, lng: 139.7158 }, // Kamata
      { lat: 35.6478, lng: 139.7988 }, // Toyosu
      { lat: 35.7767, lng: 140.3183 }, // Narita
      { lat: 40.6413, lng: -73.7781 }, // JFK
    ],
    pois: [
      { id: pid(), name: "Toyosu Market", type: "market", coord: { lat: 35.6478, lng: 139.7988 }, elevation: "3m", difficulty: "Easy", note: "Tokyo's world-class wholesale fish market — the best sushi breakfast in Japan.", enabled: true },
      { id: pid(), name: "Narita International Airport", type: "station", coord: { lat: 35.7767, lng: 140.3183 }, elevation: "40m", difficulty: "Easy", note: "10:45 PM flight departs for NYC. Sayonara, Japan!", enabled: true, imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&w=800&q=80" },
    ],
    companionIds: [],
    departureTime: "08:00",
    trainInfo: {
      trainName: "Narita Express",
      trainNumber: "",
      carNumber: "",
      seatNumber: "",
      departureStation: "Tokyo",
      arrivalStation: "Narita Airport",
      departureTime: "19:30",
      arrivalTime: "20:30",
      durationMinutes: 60,
    },
  },
];
