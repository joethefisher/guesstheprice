// amazon/data.js — mock product catalog for Pricetag: Amazon edition
// NOTE: product images are placeholder photos (Unsplash) standing in for the
// real Amazon Product API image; the bandColor shows through if any fail to load.

const PRODUCTS = [
  {
    id: "amz-headphones",
    title: "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
    brand: "Sony",
    category: "Electronics",
    subcategory: "Over-Ear Headphones",
    rating: 4.7, reviews: 28431,
    badge: "Amazon's Choice",
    prime: true,
    boughtBlurb: "5K+ bought in past month",
    rank: "#1 in Over-Ear Headphones",
    price: 399,
    bandColor: "#E9C760",
    blurb: "Industry-leading noise cancellation with 30-hour battery and crystal-clear hands-free calling.",
    bullets: [
      "Up to 30 hours of battery, 3 min charge = 3 hours play",
      "8 microphones and Auto NC Optimizer",
      "Multipoint connection to two devices at once",
    ],
    specs: [
      ["Form factor", "Over-ear"], ["Battery life", "30 hours"],
      ["Connectivity", "Bluetooth 5.2"], ["Weight", "250 g"],
      ["Color", "Midnight Black"], ["Noise control", "Active NC"],
    ],
    review: { stars: 5, name: "QuietCommuter", text: "Put these on, the screaming toddler on the plane simply ceased to exist. Worth every penny." },
    photos: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1600&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1600&q=80",
    ],
    photoCount: 8,
  },
  {
    id: "amz-watch",
    title: "Casio Vintage A158WA-1 Stainless Steel Digital Watch",
    brand: "Casio",
    category: "Fashion",
    subcategory: "Men's Watches",
    rating: 4.6, reviews: 61204,
    badge: "Best Seller",
    prime: true,
    boughtBlurb: "20K+ bought in past month",
    rank: "#1 in Men's Digital Watches",
    price: 25,
    bandColor: "#C9CDD2",
    blurb: "The classic silver-tone digital watch. Daily alarm, stopwatch, and an LED light, because it's still 1989 somewhere.",
    bullets: [
      "Stainless steel band and case",
      "Daily alarm and 1/100-second stopwatch",
      "Water resistant to 30 meters",
    ],
    specs: [
      ["Case", "Stainless steel"], ["Display", "Digital"],
      ["Water resist", "30 m"], ["Battery", "~7 years"],
      ["Band width", "18 mm"], ["Origin", "Reissue"],
    ],
    review: { stars: 5, name: "RetroByChoice", text: "Cheaper than my coffee habit, gets more compliments than my car. The math is undefeated." },
    photos: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80",
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1600&q=80",
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=1600&q=80",
    ],
    photoCount: 11,
  },
  {
    id: "amz-smartwatch",
    title: "Apple Watch SE (2nd Gen) GPS 40mm Smartwatch",
    brand: "Apple",
    category: "Electronics",
    subcategory: "Smartwatches",
    rating: 4.8, reviews: 19772,
    badge: "Amazon's Choice",
    prime: true,
    boughtBlurb: "10K+ bought in past month",
    rank: "#3 in Smartwatches",
    price: 249,
    bandColor: "#2E3338",
    blurb: "Crash detection, sleep tracking, and a heart-rate sensor on your wrist. The one that finally got you running. Once.",
    bullets: [
      "Crash & fall detection with Emergency SOS",
      "Sleep stages, heart-rate and workout tracking",
      "Water resistant to 50 meters",
    ],
    specs: [
      ["Case size", "40 mm"], ["Display", "Retina LTPO"],
      ["GPS", "Built-in"], ["Battery", "18 hours"],
      ["Water resist", "50 m"], ["Chip", "S8 SiP"],
    ],
    review: { stars: 4, name: "ClosedAllRings", text: "Bought it to get fit. Mostly use it to ignore texts more efficiently. Still: love it." },
    photos: [
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=1600&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1600&q=80",
      "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=1600&q=80",
    ],
    photoCount: 14,
  },
  {
    id: "amz-earbuds",
    title: "Apple AirPods Pro (2nd Generation) with MagSafe Case",
    brand: "Apple",
    category: "Electronics",
    subcategory: "Earbuds",
    rating: 4.8, reviews: 142005,
    badge: "Best Seller",
    prime: true,
    boughtBlurb: "50K+ bought in past month",
    rank: "#1 in Earbud Headphones",
    price: 189,
    bandColor: "#DEE2E6",
    blurb: "Active noise cancellation, Adaptive Audio, and a case you will lose at least twice this year.",
    bullets: [
      "2x more Active Noise Cancellation",
      "Adaptive Audio adjusts to your surroundings",
      "Up to 6 hours listening, 30 hours with case",
    ],
    specs: [
      ["Chip", "Apple H2"], ["Battery (buds)", "6 hours"],
      ["Battery (case)", "30 hours"], ["Case", "MagSafe / USB-C"],
      ["Water resist", "IP54"], ["Tips", "4 sizes"],
    ],
    review: { stars: 5, name: "OneEarLost", text: "Currently down to one. Still the best $189 of denial I have ever spent. Buying again." },
    photos: [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1600&q=80",
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1600&q=80",
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=1600&q=80",
    ],
    photoCount: 9,
  },
  {
    id: "amz-camera-instax",
    title: "Fujifilm Instax Mini 12 Instant Camera",
    brand: "Fujifilm",
    category: "Electronics",
    subcategory: "Instant Cameras",
    rating: 4.7, reviews: 9338,
    badge: "Amazon's Choice",
    prime: true,
    boughtBlurb: "7K+ bought in past month",
    rank: "#2 in Instant Cameras",
    price: 79,
    bandColor: "#A8D5E2",
    blurb: "Point, twist, print. Makes credit-card-sized memories and a slow, expensive film habit.",
    bullets: [
      "Automatic exposure and built-in selfie mode",
      "Close-up lens for 30–50 cm shots",
      "Prints in about 5 seconds",
    ],
    specs: [
      ["Film", "Instax Mini"], ["Print size", "2.4 × 1.8 in"],
      ["Power", "2x AA"], ["Selfie mirror", "Yes"],
      ["Modes", "Auto exposure"], ["Color", "Blossom Pink"],
    ],
    review: { stars: 5, name: "FilmIsNotDead", text: "The camera is cheap. The film is how they get you. Ten out of ten, send help and more film." },
    photos: [
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&q=80",
      "https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=1600&q=80",
      "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=1600&q=80",
    ],
    photoCount: 12,
  },
  {
    id: "amz-sneakers",
    title: "Nike Air Max 90 Men's Running Shoes",
    brand: "Nike",
    category: "Fashion",
    subcategory: "Sneakers",
    rating: 4.5, reviews: 4120,
    badge: null,
    prime: true,
    boughtBlurb: "3K+ bought in past month",
    rank: "#12 in Men's Running Shoes",
    price: 129,
    bandColor: "#C5453B",
    blurb: "Visible Max Air cushioning and the silhouette that has outlasted every trend since 1990.",
    bullets: [
      "Visible Max Air unit in the heel",
      "Waffle outsole for traction and durability",
      "Foam midsole with classic stitched overlays",
    ],
    specs: [
      ["Closure", "Lace-up"], ["Cushioning", "Max Air"],
      ["Upper", "Leather / mesh"], ["Outsole", "Rubber waffle"],
      ["Drop", "Mid"], ["Colorway", "Infrared"],
    ],
    review: { stars: 5, name: "StepDad42", text: "Comfortable, sharp, and they make me look 30% more athletic than I have any right to be." },
    photos: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80",
      "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=1600&q=80",
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&q=80",
    ],
    photoCount: 16,
  },
  {
    id: "amz-sunglasses",
    title: "Ray-Ban Original Wayfarer Classic Sunglasses",
    brand: "Ray-Ban",
    category: "Fashion",
    subcategory: "Sunglasses",
    rating: 4.6, reviews: 12889,
    badge: null,
    prime: true,
    boughtBlurb: "4K+ bought in past month",
    rank: "#5 in Men's Sunglasses",
    price: 161,
    bandColor: "#5A6066",
    blurb: "The shape every other sunglass has been quietly copying for seventy years.",
    bullets: [
      "G-15 lenses with 100% UV protection",
      "Acetate frame, made in Italy",
      "Includes case and cleaning cloth",
    ],
    specs: [
      ["Frame", "Acetate"], ["Lens", "G-15 green"],
      ["UV", "100% protection"], ["Lens width", "50 mm"],
      ["Made in", "Italy"], ["Style", "Wayfarer"],
    ],
    review: { stars: 4, name: "SquintNoMore", text: "Lost my last pair in the ocean. Bought the same ones again immediately. We do not learn." },
    photos: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1600&q=80",
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1600&q=80",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1600&q=80",
    ],
    photoCount: 10,
  },
  {
    id: "amz-keyboard",
    title: "Keychron K2 Wireless Mechanical Keyboard (Brown Switch)",
    brand: "Keychron",
    category: "Electronics",
    subcategory: "Keyboards",
    rating: 4.6, reviews: 7540,
    badge: "Amazon's Choice",
    prime: true,
    boughtBlurb: "6K+ bought in past month",
    rank: "#4 in Computer Keyboards",
    price: 89,
    bandColor: "#3A3F45",
    blurb: "75% layout, hot-swappable, and just loud enough to make your coworkers slightly resent you.",
    bullets: [
      "Wireless Bluetooth or wired USB-C",
      "Hot-swappable Gateron mechanical switches",
      "Mac and Windows layouts included",
    ],
    specs: [
      ["Layout", "75% / 84-key"], ["Switch", "Gateron Brown"],
      ["Connection", "BT 5.1 / USB-C"], ["Backlight", "White LED"],
      ["Battery", "4000 mAh"], ["Frame", "Aluminum"],
    ],
    review: { stars: 5, name: "ThockEnjoyer", text: "My productivity is unchanged but my desk now sounds extremely expensive. No notes." },
    photos: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1600&q=80",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1600&q=80",
      "https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=1600&q=80",
    ],
    photoCount: 13,
  },
  {
    id: "amz-tumbler",
    title: "Stanley Quencher H2.0 FlowState 40 oz Tumbler",
    brand: "Stanley",
    category: "Home & Kitchen",
    subcategory: "Drinkware",
    rating: 4.6, reviews: 88210,
    badge: "Best Seller",
    prime: true,
    boughtBlurb: "100K+ bought in past month",
    rank: "#1 in Tumblers & Water Glasses",
    price: 45,
    bandColor: "#9FB7A8",
    blurb: "Keeps water cold for 11 hours and your entire personality afloat for the foreseeable future.",
    bullets: [
      "Holds 40 oz; fits most car cup holders",
      "Double-wall vacuum insulation",
      "Reusable straw and FlowState lid",
    ],
    specs: [
      ["Capacity", "40 oz"], ["Material", "18/8 steel"],
      ["Cold", "Up to 11 hours"], ["Lid", "FlowState 3-position"],
      ["Dishwasher", "Safe"], ["Color", "Sage"],
    ],
    review: { stars: 5, name: "HydrationStation", text: "I own seven. I can stop whenever I want. I will not be stopping. The sage one matches my car." },
    photos: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1600&q=80",
      "https://images.unsplash.com/photo-1610847499832-918a1c3c6811?w=1600&q=80",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=1600&q=80",
    ],
    photoCount: 18,
  },
  {
    id: "amz-camera",
    title: "Canon EOS R50 Mirrorless Camera with 18-45mm Lens",
    brand: "Canon",
    category: "Electronics",
    subcategory: "Mirrorless Cameras",
    rating: 4.7, reviews: 1544,
    badge: null,
    prime: true,
    boughtBlurb: "1K+ bought in past month",
    rank: "#6 in Mirrorless Cameras",
    price: 679,
    bandColor: "#36393E",
    blurb: "24.2MP, 4K video, and the camera that will start a content empire you'll abandon in March.",
    bullets: [
      "24.2MP APS-C CMOS sensor",
      "Uncropped 4K 30p video",
      "Subject-detection autofocus (people, animals, vehicles)",
    ],
    specs: [
      ["Sensor", "24.2MP APS-C"], ["Video", "4K 30p"],
      ["Mount", "Canon RF"], ["Screen", "Vari-angle"],
      ["Burst", "15 fps"], ["Weight", "375 g"],
    ],
    review: { stars: 5, name: "AspiringAuteur", text: "Bought to start a YouTube channel. Two videos in, eight subscribers, zero regrets. Photos are stunning." },
    photos: [
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1600&q=80",
      "https://images.unsplash.com/photo-1606980625120-c5d8e5cd45b1?w=1600&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&q=80",
    ],
    photoCount: 20,
  },
  {
    id: "amz-espresso",
    title: "Breville Barista Express Espresso Machine",
    brand: "Breville",
    category: "Home & Kitchen",
    subcategory: "Espresso Machines",
    rating: 4.7, reviews: 16902,
    badge: "Amazon's Choice",
    prime: true,
    boughtBlurb: "2K+ bought in past month",
    rank: "#1 in Espresso Machines",
    price: 749,
    bandColor: "#B8BCC0",
    blurb: "Built-in grinder, steam wand, and the dream of never visiting a café again. (You will still visit cafés.)",
    bullets: [
      "Integrated conical burr grinder",
      "Dose-control grinding and PID temperature",
      "Steam wand for microfoam milk",
    ],
    specs: [
      ["Grinder", "Conical burr"], ["Pressure", "15 bar"],
      ["Water tank", "67 oz"], ["Heating", "ThermoCoil"],
      ["Portafilter", "54 mm"], ["Finish", "Stainless"],
    ],
    review: { stars: 5, name: "HomeBaristaNow", text: "Saved me a fortune in lattes by spending a fortune on a machine. Coffee's incredible though." },
    photos: [
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=1600&q=80",
      "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=1600&q=80",
      "https://images.unsplash.com/photo-1565452344518-47faca79dc69?w=1600&q=80",
    ],
    photoCount: 22,
  },
  {
    id: "amz-controller",
    title: "Xbox Wireless Controller — Carbon Black",
    brand: "Microsoft",
    category: "Video Games",
    subcategory: "Controllers",
    rating: 4.8, reviews: 33418,
    badge: "Best Seller",
    prime: true,
    boughtBlurb: "30K+ bought in past month",
    rank: "#2 in Xbox Accessories",
    price: 54,
    bandColor: "#2C3035",
    blurb: "Textured grips, a hybrid D-pad, and the single most-fought-over object in any household.",
    bullets: [
      "Bluetooth for PC, mobile and Xbox",
      "Textured triggers and bumpers",
      "Share button and 3.5mm headset jack",
    ],
    specs: [
      ["Connection", "Bluetooth / USB-C"], ["Battery", "2x AA"],
      ["D-pad", "Hybrid"], ["Share button", "Yes"],
      ["Headset jack", "3.5 mm"], ["Color", "Carbon Black"],
    ],
    review: { stars: 5, name: "TwoPlayerHouse", text: "Bought a second one to end the arguments. Now we argue about who gets the new one. Flawless product." },
    photos: [
      "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=1600&q=80",
      "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=1600&q=80",
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=1600&q=80",
    ],
    photoCount: 9,
  },
];

// A few extra products to seed the Saved tab
const EXTRA_PRODUCTS = [
  {
    id: "amz-vacuum", title: "Dyson V8 Cordless Vacuum Cleaner", brand: "Dyson",
    category: "Home & Kitchen", subcategory: "Stick Vacuums", rating: 4.7, reviews: 21540,
    badge: "Amazon's Choice", prime: true, boughtBlurb: "4K+ bought in past month",
    rank: "#3 in Stick Vacuums", price: 469, bandColor: "#B49BC8",
    blurb: "Cord-free cleaning that turns into a 40-minute house-wide deep clean you didn't plan on.",
    bullets: ["Up to 40 min run time", "Whole-machine filtration", "Converts to handheld"],
    specs: [["Run time","40 min"],["Bin","0.54 L"],["Weight","2.6 kg"],["Filter","HEPA"],["Modes","2"],["Tools","4 included"]],
    review: { stars: 5, name: "DustDestroyer", text: "Cleaned the couch once and questioned every life decision that led to that much dust." },
    photos: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=1600&q=80"], photoCount: 7,
  },
  {
    id: "amz-backpack", title: "Patagonia Black Hole 25L Backpack", brand: "Patagonia",
    category: "Outdoors", subcategory: "Backpacks", rating: 4.8, reviews: 6204,
    badge: null, prime: true, boughtBlurb: "2K+ bought in past month",
    rank: "#8 in Casual Daypacks", price: 139, bandColor: "#4F6B82",
    blurb: "Weather-resistant, laptop-ready, and made largely from recycled bottles. Practically a personality.",
    bullets: ["Water-resistant recycled fabric", "Padded 15in laptop sleeve", "Lifetime repair guarantee"],
    specs: [["Capacity","25 L"],["Laptop","15 in"],["Fabric","Recycled"],["Weight","0.7 kg"],["Pockets","4"],["Warranty","Lifetime"]],
    review: { stars: 5, name: "OneBagForever", text: "Survived three airports, one downpour, and a toddler. Still looks brand new. Annoyingly perfect." },
    photos: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1600&q=80"], photoCount: 8,
  },
  {
    id: "amz-blender", title: "Vitamix 5200 Professional Blender", brand: "Vitamix",
    category: "Home & Kitchen", subcategory: "Blenders", rating: 4.8, reviews: 28110,
    badge: "Best Seller", prime: true, boughtBlurb: "3K+ bought in past month",
    rank: "#1 in Countertop Blenders", price: 449, bandColor: "#C0C4C8",
    blurb: "Blends a smoothie, soup, or your warranty fears into oblivion. Loud enough to wake the block.",
    bullets: ["Aircraft-grade stainless blades", "Variable speed control", "7-year warranty"],
    specs: [["Motor","2 HP"],["Jar","64 oz"],["Speeds","Variable"],["Warranty","7 yr"],["Height","20.5 in"],["Self-clean","Yes"]],
    review: { stars: 5, name: "SmoothieSzn", text: "Could blend a brick. Have not tried. Will not say I won't. Best kitchen purchase, full stop." },
    photos: ["https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=1600&q=80"], photoCount: 10,
  },
  {
    id: "amz-drone", title: "DJI Mini 4K Camera Drone", brand: "DJI",
    category: "Electronics", subcategory: "Camera Drones", rating: 4.7, reviews: 4988,
    badge: "Amazon's Choice", prime: true, boughtBlurb: "1K+ bought in past month",
    rank: "#2 in Hobby RC Quadcopters", price: 759, bandColor: "#9AA0A6",
    blurb: "Under 249g of pure 'I will absolutely fly this twice'. 4K footage your friends will love once.",
    bullets: ["4K HDR video, 3-axis gimbal", "Under 249g — no registration in many regions", "10km video transmission"],
    specs: [["Video","4K HDR"],["Weight","<249 g"],["Flight","31 min"],["Range","10 km"],["Gimbal","3-axis"],["Wind","Level 5"]],
    review: { stars: 4, name: "GroundedPilot", text: "Incredible footage of my roof, my other roof, and a tree. Truly cinematic. Battery life shocked me." },
    photos: ["https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1600&q=80"], photoCount: 12,
  },
];

// ─── Reactions bank by accuracy tier (shopping flavored) ────────────
const REACTIONS = {
  bullseye: [   // <= 2%
    "Are you a personal shopper?",
    "Suspiciously precise.",
    "You have Prime, don't you.",
    "We'd like to see your order history.",
  ],
  nailed: [     // <= 5%
    "Add to cart.",
    "Nailed it.",
    "Frighteningly close.",
    "That's the one.",
  ],
  solid: [      // <= 15%
    "Solid guess.",
    "You shop too much.",
    "Respectable.",
    "You read the listing.",
  ],
  ballpark: [   // <= 30%
    "In the ballpark.",
    "Close enough.",
    "Eh, not bad.",
    "Within shipping distance.",
  ],
  off: [        // <= 50%
    "Not quite.",
    "We've all impulse-bought.",
    "Vibes were off.",
    "Swing and a miss.",
  ],
  yikes: [      // > 50%
    "Yikes.",
    "Inflation isn't THAT bad.",
    "Did you read the reviews?",
    "Bold checkout.",
    "The wishlist would like a word.",
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
  if (n >= 1000) return "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return "$" + Math.round(n);
}

window.PRODUCTS = PRODUCTS;
window.EXTRA_PRODUCTS = EXTRA_PRODUCTS;
window.ALL_PRODUCTS = [...PRODUCTS, ...EXTRA_PRODUCTS];
window.REACTIONS = REACTIONS;
window.reactionFor = reactionFor;
window.pickReaction = pickReaction;
window.tileFor = tileFor;
window.fmtPrice = fmtPrice;
window.fmtShortPrice = fmtShortPrice;
