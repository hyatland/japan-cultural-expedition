import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface PackItem {
  label: string;
  checked: boolean;
}
interface PackSection {
  title: string;
  emoji: string;
  items: PackItem[];
}

const INITIAL_SECTIONS: PackSection[] = [
  {
    title: 'Documents & Money',
    emoji: '🪪',
    items: [
      { label: 'Passport (valid 6+ months)', checked: false },
      { label: 'Japan Rail Pass (order online, activate on arrival)', checked: false },
      { label: 'Travel insurance card', checked: false },
      { label: 'Expedia booking confirmations (printed)', checked: false },
      { label: 'Yen cash — Japan is still largely cash-first', checked: false },
      { label: 'IC card (Suica/Pasmo) — load it at Haneda', checked: false },
      { label: 'Credit card with no foreign fees', checked: false },
      { label: 'Emergency contact list', checked: false },
      { label: 'Copy of passport (stored separately)', checked: false },
    ],
  },
  {
    title: 'Clothing — July Heat & Humidity',
    emoji: '👕',
    items: [
      { label: '7–8 lightweight, moisture-wicking t-shirts', checked: false },
      { label: '3–4 pairs of quick-dry shorts/trousers', checked: false },
      { label: '1 pair of light long trousers (temples + cool evenings)', checked: false },
      { label: 'Light long-sleeve layer (a/c in trains/restaurants is fierce)', checked: false },
      { label: '1 light rain jacket / poncho — July = rainy season', checked: false },
      { label: '7+ pairs of socks (feet get sweaty in summer)', checked: false },
      { label: 'Slip-on shoes or sandals (easy to remove at temples)', checked: false },
      { label: 'Comfortable walking shoes (10,000+ steps daily)', checked: false },
      { label: 'Swimwear (Yakushima beaches + onsen ryokan)', checked: false },
      { label: 'Onsen etiquette: bring a small towel, no tattoo cover needed unless specified', checked: false },
    ],
  },
  {
    title: 'Yakushima Hiking Gear',
    emoji: '🌿',
    items: [
      { label: 'Waterproof hiking boots or trail shoes', checked: false },
      { label: 'Waterproof backpack cover', checked: false },
      { label: 'Trekking poles (optional but helpful on Jomon trails)', checked: false },
      { label: 'Lightweight rain pants', checked: false },
      { label: 'Gaiters (trails can be muddy)', checked: false },
      { label: 'Dry bags for electronics', checked: false },
      { label: 'High-energy trail snacks', checked: false },
      { label: 'Reusable water bottle — mountain water is drinkable', checked: false },
    ],
  },
  {
    title: 'Health & Toiletries',
    emoji: '💊',
    items: [
      { label: 'High SPF sunscreen (50+) — Japan sun is intense', checked: false },
      { label: 'Insect repellent (Yakushima forest)', checked: false },
      { label: 'Antihistamines (summer pollen + mosquitos)', checked: false },
      { label: 'Blister plasters (Compeed)', checked: false },
      { label: 'Pain relief (ibuprofen / paracetamol)', checked: false },
      { label: 'Electrolyte sachets — heat exhaustion is real in July', checked: false },
      { label: 'Anti-diarrhea / stomach meds', checked: false },
      { label: 'Toothbrush, toothpaste, floss', checked: false },
      { label: 'Travel-size shampoo/conditioner (onsens provide soap)', checked: false },
      { label: 'Deodorant — hard to find Western brands in Japan', checked: false },
      { label: 'Portable fan / cooling spray', checked: false },
      { label: 'Prescription medications with doctor\'s note if needed', checked: false },
    ],
  },
  {
    title: 'Tech & Power',
    emoji: '🔌',
    items: [
      { label: 'Universal power adapter (Japan: 100V, Type A)', checked: false },
      { label: 'Portable charger / power bank (10,000 mAh+)', checked: false },
      { label: 'Charging cables (phone, earbuds, camera)', checked: false },
      { label: 'Pocket Wi-Fi OR SIM card (rent at airport)', checked: false },
      { label: 'Camera + spare memory cards', checked: false },
      { label: 'Earphones / earbuds', checked: false },
      { label: 'Kindle or books for long train rides', checked: false },
    ],
  },
  {
    title: 'Bags & Organisation',
    emoji: '🎒',
    items: [
      { label: 'Main backpack or suitcase (≤60L for easy train travel)', checked: false },
      { label: 'Day pack (20–25L for daily excursions)', checked: false },
      { label: 'Packing cubes — keeps 16 days organised', checked: false },
      { label: 'Small crossbody bag for city days', checked: false },
      { label: 'Dry bag for Yakushima and rainy days', checked: false },
      { label: 'Lightweight laundry bag', checked: false },
    ],
  },
  {
    title: 'Japan-Specific Essentials',
    emoji: '🇯🇵',
    items: [
      { label: 'Pocket tissues — carry everywhere (some toilets have none)', checked: false },
      { label: 'Hand sanitiser', checked: false },
      { label: 'Small towel / handkerchief (to dry hands, wipe sweat)', checked: false },
      { label: 'Coin purse — Japan loves coins', checked: false },
      { label: 'Portable umbrella — July showers come without warning', checked: false },
      { label: 'Japan travel app: Google Maps, HyperDia (trains), Google Translate', checked: false },
      { label: 'Offline maps downloaded (Maps.me or Google offline)', checked: false },
    ],
  },
];

const PackingList: React.FC = () => {
  const [sections, setSections] = useState<PackSection[]>(INITIAL_SECTIONS);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0, 1]));

  const toggle = (secIdx: number, itemIdx: number) => {
    setSections(prev => prev.map((sec, si) =>
      si !== secIdx ? sec : {
        ...sec,
        items: sec.items.map((it, ii) => ii !== itemIdx ? it : { ...it, checked: !it.checked }),
      }
    ));
  };

  const toggleSection = (idx: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const totalItems = sections.reduce((a, s) => a + s.items.length, 0);
  const checkedItems = sections.reduce((a, s) => a + s.items.filter(i => i.checked).length, 0);
  const pct = Math.round((checkedItems / totalItems) * 100);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Packing List</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Japan · July 2026 · 16 days</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-blue-500">{pct}%</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500">{checkedItems}/{totalItems} packed</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {sections.map((sec, si) => {
          const isOpen = openSections.has(si);
          const secChecked = sec.items.filter(i => i.checked).length;
          return (
            <div key={si} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/40 overflow-hidden">
              <button
                onClick={() => toggleSection(si)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{sec.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{sec.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    {secChecked}/{sec.items.length}
                  </span>
                  <span className={`text-slate-400 transition-transform duration-200 text-[10px] ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-3.5 pb-2.5 space-y-1 border-t border-slate-200 dark:border-slate-700/40 pt-2">
                  {sec.items.map((item, ii) => (
                    <label
                      key={ii}
                      className="flex items-start gap-2.5 py-1 cursor-pointer group"
                    >
                      <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        item.checked
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400'
                      }`} onClick={() => toggle(si, ii)}>
                        {item.checked && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                      <span
                        className={`text-[11px] leading-snug transition-colors ${
                          item.checked
                            ? 'line-through text-slate-400 dark:text-slate-600'
                            : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`}
                        onClick={() => toggle(si, ii)}
                      >
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default PackingList;
