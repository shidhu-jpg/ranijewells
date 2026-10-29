/* Rani Jewellers — shared data store (used by index.html and admin.html)
   Everything is saved in the browser's localStorage. For multi-device sync,
   swap these get/save helpers for a backend (e.g. Supabase). */

const RJ_KEYS = {
  settings: 'rj_settings',
  rates: 'rj_rates',
  stock: 'rj_stock',
  bookings: 'rj_bookings',
  scheme: 'rj_scheme'
};

const RJ_DEFAULTS = {
  settings: {
    shopName: 'Rani Jewellers',
    tagline: 'Purity you can trust, designs you will treasure',
    phone: '+91 99999 99999',          // TODO: real shop number
    whatsapp: '919999999999',          // TODO: country code + number, digits only
    address: 'Main Bazaar Road, Your City, Bihar',
    hours: 'Mon – Sat · 10:30 AM – 8:30 PM',
    pin: '1234',
    advancePct: 10,                    // rate booking advance %
    bookingDays: 30,                   // rate lock validity
    gstPct: 3
  },
  rates: {
    gold24: 78500,   // per 10 g
    gold22: 72000,   // per 10 g
    gold18: 58900,   // per 10 g
    silver: 96000,   // per kg
    prev: { gold24: 78100, gold22: 71650, gold18: 58600, silver: 95200 },
    updatedAt: new Date().toISOString()
  },
  stock: [
    { id: 's1', name: 'Rajwadi Bridal Necklace', category: 'Necklace', metal: 'gold22', weight: 42.5, making: 14, qty: 1, hallmark: true },
    { id: 's2', name: 'Temple Jhumka Earrings', category: 'Earrings', metal: 'gold22', weight: 12.8, making: 12, qty: 3, hallmark: true },
    { id: 's3', name: 'Classic Kada Pair', category: 'Bangles', metal: 'gold22', weight: 28.2, making: 10, qty: 2, hallmark: true },
    { id: 's4', name: 'Solitaire Style Ring', category: 'Ring', metal: 'gold18', weight: 4.6, making: 15, qty: 5, hallmark: true },
    { id: 's5', name: 'Rope Chain 20"', category: 'Chain', metal: 'gold22', weight: 15.0, making: 8, qty: 4, hallmark: true },
    { id: 's6', name: 'Lakshmi Pendant', category: 'Pendant', metal: 'gold22', weight: 5.2, making: 11, qty: 0, hallmark: true },
    { id: 's7', name: 'Ghungroo Payal Pair', category: 'Anklet', metal: 'silver', weight: 85, making: 18, qty: 6, hallmark: false },
    { id: 's8', name: '24K Gold Coin 10 g', category: 'Coin', metal: 'gold24', weight: 10, making: 3, qty: 8, hallmark: true },
    { id: 's9', name: 'Silver Pooja Kalash', category: 'Silverware', metal: 'silver', weight: 220, making: 12, qty: 2, hallmark: false }
  ],
  bookings: [],
  scheme: []
};

/* Photos from Unsplash (free for commercial use under the Unsplash License).
   Replace with the shop's own product photos when available. */
const PHOTOS = {
  bridalSet: '1758995115857-2de1eb6283d0',
  necklaceCase: '1640183298005-3a4497cc6a37',
  chokerSet: '1758995115785-d13726ac93f0',
  jhumka: '1714733831162-0a6e849141be',
  kada: '1728381031272-ba3f537feadd',
  bangleStack: '1758995116383-f51775896add',
  ring: '1598560917807-1bae44bd2be8',
  ringBox: '1631982690223-8aa4be0a2497',
  chain: '1721807550979-6e662d370e92',
  chainLinks: '1585711715631-1e6bf224f092',
  pendant: '1758995115560-59c10d6cc28f',
  payal: '1760163287823-8786a65fd269',
  coins: '1623743587733-469438d17975',
  kalash: '1786903122229-c1c97409cf99',
  bride: '1600685890506-593fdf55949b',
  bride2: '1594140700783-f9e70c7abc25',
  showroom: '1758995115867-4ef47c98824e'
};
const photo = (key, w = 600, h) =>
  `https://images.unsplash.com/photo-${PHOTOS[key] || key}?auto=format&fit=crop&w=${w}${h ? '&h=' + h : ''}&q=75`;

/* Used when a stock item has no image of its own */
const CATEGORY_PHOTOS = {
  Necklace: 'bridalSet', Earrings: 'jhumka', Bangles: 'kada', Ring: 'ring', Chain: 'chain',
  Pendant: 'pendant', Anklet: 'payal', Coin: 'coins', Silverware: 'kalash'
};

const METALS = {
  gold24: { label: '24K Gold', purity: '999', unit: '10 g', perGram: r => r.gold24 / 10 },
  gold22: { label: '22K Gold', purity: '916', unit: '10 g', perGram: r => r.gold22 / 10 },
  gold18: { label: '18K Gold', purity: '750', unit: '10 g', perGram: r => r.gold18 / 10 },
  silver: { label: 'Silver',   purity: '925', unit: '1 kg', perGram: r => r.silver / 1000 }
};

function rjGet(name) {
  try {
    const raw = localStorage.getItem(RJ_KEYS[name]);
    if (raw) {
      const val = JSON.parse(raw);
      // merge so newly added setting keys still get defaults
      if (name === 'settings') return { ...RJ_DEFAULTS.settings, ...val };
      return val;
    }
  } catch (e) { /* storage blocked — fall back to defaults */ }
  return structuredClone(RJ_DEFAULTS[name]);
}

function rjSave(name, value) {
  try { localStorage.setItem(RJ_KEYS[name], JSON.stringify(value)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('rj:update', { detail: name }));
}

function inr(n, decimals = 0) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/* Price of a stock item at today's rate: metal + making, then GST */
function itemPrice(item, rates, gstPct) {
  const metal = METALS[item.metal].perGram(rates) * item.weight;
  const making = metal * (item.making / 100);
  const gst = (metal + making) * (gstPct / 100);
  return { metal, making, gst, total: metal + making + gst };
}

function rjId(prefix) {
  return prefix + '-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 90 + 10);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function waLink(number, text) {
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
}
