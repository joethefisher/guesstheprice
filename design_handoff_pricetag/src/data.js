// src/data.js — mock listings for Pricetag
// Photos via Unsplash known photo IDs; if any fail, dominant color shows through.

const LISTINGS = [
  {
    id: "bk-001",
    nickname: "Carroll Gardens brownstone",
    neighborhood: "Carroll Gardens",
    city: "Brooklyn",
    state: "NY",
    address: "388 Sackett St",
    beds: 4, baths: 3.5, sqft: 3200, year: 1899, lot: 2010,
    price: 3_295_000,
    bandColor: "#7B5E3B",
    blurb: "Limestone facade, parlor floor with original moldings.",
    photos: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
    ],
    photoCount: 14,
  },
  {
    id: "phx-001",
    nickname: "Paradise Valley desert modern",
    neighborhood: "Paradise Valley",
    city: "Phoenix",
    state: "AZ",
    address: "5142 N Casa Blanca Dr",
    beds: 5, baths: 5.5, sqft: 5840, year: 2019, lot: 38000,
    price: 4_850_000,
    bandColor: "#C8896A",
    blurb: "Single-level desert modern. Wraparound saguaro views.",
    photos: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1600&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80",
    ],
    photoCount: 22,
  },
  {
    id: "sf-001",
    nickname: "Marina studio (yes, really)",
    neighborhood: "Marina",
    city: "San Francisco",
    state: "CA",
    address: "2240 Beach St #4",
    beds: 0, baths: 1, sqft: 480, year: 1924, lot: null,
    price: 895_000,
    bandColor: "#A8B5BD",
    blurb: "Top-floor studio. Bay glimpse from the kitchen if you stand on the counter.",
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=80",
    ],
    photoCount: 9,
  },
  {
    id: "atx-001",
    nickname: "Travis Heights bungalow",
    neighborhood: "Travis Heights",
    city: "Austin",
    state: "TX",
    address: "1604 Newning Ave",
    beds: 3, baths: 2, sqft: 1820, year: 1937, lot: 7400,
    price: 1_375_000,
    bandColor: "#9B7B4F",
    blurb: "Restored 1930s bungalow. Pecan tree older than the house.",
    photos: [
      "https://images.unsplash.com/photo-1518883429432-f8a55c1aa1be?w=1600&q=80",
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1600&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80",
    ],
    photoCount: 18,
  },
  {
    id: "det-001",
    nickname: "Indian Village fixer",
    neighborhood: "Indian Village",
    city: "Detroit",
    state: "MI",
    address: "8120 Iroquois Ave",
    beds: 6, baths: 3, sqft: 4400, year: 1908, lot: 9200,
    price: 385_000,
    bandColor: "#6E5A40",
    blurb: "Tudor revival. Original woodwork. Roof is 'a project'.",
    photos: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80",
      "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=1600&q=80",
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1600&q=80",
    ],
    photoCount: 11,
  },
  {
    id: "mal-001",
    nickname: "Carbon Beach glass box",
    neighborhood: "Carbon Beach",
    city: "Malibu",
    state: "CA",
    address: "22436 Pacific Coast Hwy",
    beds: 4, baths: 5, sqft: 4100, year: 2021, lot: 4800,
    price: 18_750_000,
    bandColor: "#7AA0B5",
    blurb: "Beachfront. 80 feet of frontage. The water is right there.",
    photos: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1600&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=80",
    ],
    photoCount: 31,
  },
  {
    id: "atl-001",
    nickname: "Old Fourth Ward loft",
    neighborhood: "Old Fourth Ward",
    city: "Atlanta",
    state: "GA",
    address: "560 Dutch Valley Rd #318",
    beds: 2, baths: 2, sqft: 1340, year: 2008, lot: null,
    price: 615_000,
    bandColor: "#8C7155",
    blurb: "Concrete loft. Exposed ductwork. Walking distance to the BeltLine.",
    photos: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80",
      "https://images.unsplash.com/photo-1600566753104-685f4f24cb4d?w=1600&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1600&q=80",
    ],
    photoCount: 12,
  },
  {
    id: "no-001",
    nickname: "Bywater shotgun",
    neighborhood: "Bywater",
    city: "New Orleans",
    state: "LA",
    address: "3217 Burgundy St",
    beds: 3, baths: 2, sqft: 1620, year: 1893, lot: 3100,
    price: 545_000,
    bandColor: "#A8896A",
    blurb: "Restored shotgun double. Ceilings forever. Off-street parking — rare.",
    photos: [
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1600&q=80",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1600&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1600&q=80",
    ],
    photoCount: 16,
  },
  {
    id: "asp-001",
    nickname: "Red Mountain ski chalet",
    neighborhood: "Red Mountain",
    city: "Aspen",
    state: "CO",
    address: "411 Willoughby Way",
    beds: 6, baths: 7.5, sqft: 7800, year: 2017, lot: 22000,
    price: 27_500_000,
    bandColor: "#5E6B6B",
    blurb: "Direct ski-out. Heated stone driveway. Ten-car garage.",
    photos: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1600&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80",
    ],
    photoCount: 28,
  },
  {
    id: "pdx-001",
    nickname: "Alberta Arts cottage",
    neighborhood: "Alberta Arts",
    city: "Portland",
    state: "OR",
    address: "1827 NE Going St",
    beds: 3, baths: 2, sqft: 1640, year: 1922, lot: 5000,
    price: 725_000,
    bandColor: "#7A8A6B",
    blurb: "Storybook cottage. Detached studio in back. Tomato garden conveys.",
    photos: [
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1600&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80",
    ],
    photoCount: 14,
  },
];

// ─── Reactions bank by accuracy tier ────────────────
const REACTIONS = {
  bullseye: [   // <= 2%
    "Are you a real estate agent?",
    "Disturbing accuracy.",
    "We need to talk.",
    "Suspiciously specific.",
  ],
  nailed: [     // <= 5%
    "You nailed it.",
    "Locked in.",
    "Frighteningly close.",
    "That's the one.",
  ],
  solid: [      // <= 15%
    "Solid guess.",
    "You've done this before.",
    "Respectable.",
    "Reading the room.",
  ],
  ballpark: [   // <= 30%
    "In the ballpark.",
    "Close enough.",
    "Eh, not bad.",
    "Within the gravitational pull.",
  ],
  off: [        // <= 50%
    "Not quite.",
    "We've all been there.",
    "Vibes were off.",
    "Swing and a miss.",
  ],
  yikes: [      // > 50%
    "Yikes.",
    "What were you thinking?",
    "That's a felony in some states.",
    "The market would like a word.",
    "Bold strategy.",
  ],
};

function reactionFor(pctOff) {
  if (pctOff <= 0.02) return { tier: "bullseye", label: "Bullseye", color: "var(--moss)" };
  if (pctOff <= 0.05) return { tier: "nailed",   label: "Nailed it", color: "var(--moss)" };
  if (pctOff <= 0.15) return { tier: "solid",    label: "Solid",     color: "var(--moss)" };
  if (pctOff <= 0.30) return { tier: "ballpark", label: "Ballpark",  color: "var(--gold)" };
  if (pctOff <= 0.50) return { tier: "off",      label: "Off",       color: "var(--flag)" };
  return                    { tier: "yikes",    label: "Yikes",     color: "var(--flag)" };
}

function pickReaction(pctOff) {
  const r = reactionFor(pctOff);
  const bank = REACTIONS[r.tier];
  return { ...r, copy: bank[Math.floor(Math.random() * bank.length)] };
}

function tileFor(pctOff) {
  if (pctOff <= 0.05) return "🟩";
  if (pctOff <= 0.15) return "🟨";
  if (pctOff <= 0.30) return "🟧";
  return "🟥";
}

function fmtPrice(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}
function fmtShortPrice(n) {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000) return "$" + Math.round(n / 1_000) + "K";
  return "$" + n;
}

window.LISTINGS = LISTINGS;
window.REACTIONS = REACTIONS;
window.reactionFor = reactionFor;
window.pickReaction = pickReaction;
window.tileFor = tileFor;
window.fmtPrice = fmtPrice;
window.fmtShortPrice = fmtShortPrice;
