export const CATEGORIES = [
  { id: 'jersey', name: 'Jerseys', blurb: 'Club · National · Retro' },
  { id: 'boots', name: 'Boots', blurb: 'FG · Turf · Indoor' },
  { id: 'football', name: 'Footballs', blurb: 'Match · Training · Futsal' },
  { id: 'training', name: 'Training', blurb: 'Cones · Bibs · Ladders' },
  { id: 'goalkeeper', name: 'Goalkeeping', blurb: 'Gloves · GK Kits' },
  { id: 'turf', name: 'Turf & Grass', blurb: 'Artificial · Installation' },
  { id: 'accessories', name: 'Accessories', blurb: 'Guards · Socks · Bags' },
  { id: 'merch', name: 'Fan Merch', blurb: 'Scarves · Caps · Mugs' },
]

export const BRANDS = ['Fleetmart Pro', 'StrikerX', 'Velocita', 'Northwall', 'TitanGrip']

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
export const BOOT_SIZES = ['39', '40', '41', '42', '43', '44', '45']

export const TEAMS = {
  omega: { name: 'Omega FC', primary: '#7C1D2E', secondary: '#F5E9DC', number: '#F5E9DC' },
  azurecity: { name: 'Azure City', primary: '#1D5C9E', secondary: '#0A0E13', number: '#F5F7F4' },
  voltarmada: { name: 'Volt Armada', primary: '#2A3320', secondary: '#C6F53F', number: '#C6F53F' },
  crimson: { name: 'Crimson United', primary: '#B3222B', secondary: '#1A1A1A', number: '#FFFFFF' },
  royal: { name: 'Royal Athletic', primary: '#23306B', secondary: '#E8C36A', number: '#F5F7F4' },
  midnight: { name: 'Midnight SC', primary: '#101418', secondary: '#3FA9F5', number: '#3FA9F5' },
  saffron: { name: 'Saffron Kings', primary: '#E07C1F', secondary: '#12203A', number: '#FFFFFF' },
  emerald: { name: 'Emerald Rovers', primary: '#146B45', secondary: '#F5F7F4', number: '#F5F7F4' },
  bd: { name: 'Bangladesh', primary: '#0E6B3A', secondary: '#C62828', number: '#F5F7F4' },
  argento: { name: 'Argento Bianco', primary: '#F5F7F4', secondary: '#0A3D91', number: '#0A3D91' },
}

const p = (o) => ({
  rating: 4.5,
  numReviews: 12,
  sizes: SIZES,
  featured: false,
  isNew: false,
  customizable: false,
  compareArt: 'alt',
  ...o,
})

export const PRODUCTS = [
  // ---------------- JERSEYS ----------------
  p({
    id: 'j1', slug: 'omega-fc-home-25', name: 'Omega FC Home Kit 25/26', category: 'jersey', subCategory: 'Club',
    brand: 'Fleetmart Pro', team: 'omega', league: 'Premier Division',
    price: 2499, discountPrice: 1999, stock: { S: 8, M: 14, L: 3, XL: 9, XXL: 5 },
    rating: 4.8, numReviews: 64, featured: true, isNew: true, customizable: true,
    description: 'The 25/26 home shirt in classic garnet & cream. Breathable AeroDry mesh back panel, heat-pressed crest, and a tailored athletic cut built for the stands or the Sunday league.',
  }),
  p({
    id: 'j2', slug: 'azure-city-away-25', name: 'Azure City Away Kit 25/26', category: 'jersey', subCategory: 'Club',
    brand: 'StrikerX', team: 'azurecity', league: 'Premier Division',
    price: 2399, discountPrice: 1899, stock: { S: 6, M: 11, L: 12, XL: 7, XXL: 2 },
    rating: 4.6, numReviews: 41, featured: true, customizable: true,
    description: 'Cobalt storm colours with a subtle wave graphic. Moisture-wicking fabric keeps you light when the match heats up.',
  }),
  p({
    id: 'j3', slug: 'volt-armada-special', name: 'Volt Armada Special Edition', category: 'jersey', subCategory: 'Club',
    brand: 'Fleetmart Pro', team: 'voltarmada', league: 'Premier Division',
    price: 2999, discountPrice: 2499, stock: { S: 4, M: 9, L: 15, XL: 6, XXL: 4 },
    rating: 4.9, numReviews: 88, featured: true, isNew: true, customizable: true,
    description: 'Limited drop. Charcoal blackout base sliced with volt lightning sleeves — the loudest shirt we have ever made. Numbered run of 500.',
  }),
  p({
    id: 'j4', slug: 'bangladesh-home-25', name: 'Bangladesh Home Jersey 25/26', category: 'jersey', subCategory: 'National',
    brand: 'Fleetmart Pro', team: 'bd', league: 'International',
    price: 1799, discountPrice: 1499, stock: { S: 12, M: 20, L: 18, XL: 10, XXL: 6 },
    rating: 4.7, numReviews: 120, featured: true, customizable: true,
    description: 'Official red & green design with gold trim. Show your colours for the Tigers — home and away days, cup finals and rooftop screenings.',
  }),
  p({
    id: 'j5', slug: 'crimson-retro-94', name: 'Crimson United Retro 94', category: 'jersey', subCategory: 'Retro',
    brand: 'Velocita', team: 'crimson', league: 'Classics',
    price: 3299, discountPrice: null, stock: { S: 3, M: 5, L: 5, XL: 2, XXL: 0 },
    rating: 4.9, numReviews: 57,
    description: 'A faithful reissue of the legendary 94 shirt. Heavyweight cotton-feel knit, fold-over collar, embroidered era crest.',
  }),
  p({
    id: 'j6', slug: 'midnight-third-kit', name: 'Midnight SC Third Kit', category: 'jersey', subCategory: 'Club',
    brand: 'Northwall', team: 'midnight', league: 'Premier Division',
    price: 2599, discountPrice: 2199, stock: { S: 7, M: 10, L: 8, XL: 8, XXL: 3 },
    rating: 4.5, numReviews: 33, customizable: true,
    description: 'Stealth black with electric azure accents. All-over tonal pinstripe that only reveals itself under floodlights.',
  }),
  p({
    id: 'j7', slug: 'royal-athletic-home', name: 'Royal Athletic Home Kit', category: 'jersey', subCategory: 'Club',
    brand: 'StrikerX', team: 'royal', league: 'Champions Cup',
    price: 2899, discountPrice: null, stock: { S: 9, M: 13, L: 11, XL: 5, XXL: 4 },
    rating: 4.6, numReviews: 45, customizable: true,
    description: 'Deep navy sash with antique-gold detailing — a modern classic fit for European nights.',
  }),
  p({
    id: 'j8', slug: 'saffron-kings-away', name: 'Saffron Kings Away Kit', category: 'jersey', subCategory: 'Club',
    brand: 'Velocita', team: 'saffron', league: 'Champions Cup',
    price: 2699, discountPrice: 2299, stock: { S: 5, M: 8, L: 9, XL: 6, XXL: 2 },
    rating: 4.4, numReviews: 29,
    description: 'Sunset orange fading into midnight navy — engineered gradient dye with zero-weight print.',
  }),

  // ---------------- BOOTS ----------------
  p({
    id: 'b1', slug: 'strikerx-velocity-fg', name: 'StrikerX Velocity FG', category: 'boots', subCategory: 'Firm Ground',
    brand: 'StrikerX', team: null, league: null,
    price: 8999, discountPrice: 7499, sizes: BOOT_SIZES,
    stock: { '39': 3, '40': 5, '41': 7, '42': 9, '43': 6, '44': 4, '45': 2 },
    rating: 4.7, numReviews: 52, featured: true, isNew: true,
    artColors: { primary: '#C6F53F', secondary: '#0A0E13' },
    description: 'Featherweight 190g speed boot. Ultrathin microfibre skin on a sprint plate with bladed traction studs — built to punish high lines.',
  }),
  p({
    id: 'b2', slug: 'velocita-control-tf', name: 'Velocita Control TF', category: 'boots', subCategory: 'Turf',
    brand: 'Velocita', team: null, league: null,
    price: 5499, discountPrice: 4499, sizes: BOOT_SIZES,
    stock: { '39': 4, '40': 6, '41': 8, '42': 10, '43': 8, '44': 5, '45': 3 },
    rating: 4.5, numReviews: 38,
    artColors: { primary: '#FF5A1F', secondary: '#111923' },
    description: 'Turf-specific outsole with 40 rubber studs for grip on artificial grass. Wide-fit last with cushioned heel pod.',
  }),
  p({
    id: 'b3', slug: 'northwall-sentinel-fg', name: 'Northwall Sentinel FG', category: 'boots', subCategory: 'Firm Ground',
    brand: 'Northwall', team: null, league: null,
    price: 11999, discountPrice: 9999, sizes: BOOT_SIZES,
    stock: { '39': 2, '40': 4, '41': 5, '42': 6, '43': 5, '44': 3, '45': 1 },
    rating: 4.8, numReviews: 61,
    artColors: { primary: '#EDF1F5', secondary: '#0A3D91' },
    description: 'Kangaroo-touch leather forefoot fused to a carbon-infused chassis. The predator of passing lanes.',
  }),
  p({
    id: 'b4', slug: 'fleetmart-academy-tf', name: 'Fleetmart Academy Turf', category: 'boots', subCategory: 'Turf',
    brand: 'Fleetmart Pro', team: null, league: null,
    price: 3499, discountPrice: 2999, sizes: BOOT_SIZES,
    stock: { '39': 6, '40': 8, '41': 10, '42': 12, '43': 9, '44': 6, '45': 4 },
    rating: 4.3, numReviews: 74, isNew: true,
    artColors: { primary: '#1D5C9E', secondary: '#C6F53F' },
    description: 'The everyday turf warrior. Durable synthetic upper, padded collar, and grip that laughs at wet mornings.',
  }),

  // ---------------- FOOTBALLS ----------------
  p({
    id: 'f1', slug: 'fleetmart-match-pro-ball', name: 'Fleetmart Match Pro Ball', category: 'football', subCategory: 'Match',
    brand: 'Fleetmart Pro', team: null, league: null,
    price: 2499, discountPrice: 1999, sizes: ['5'],
    stock: { '5': 24 },
    rating: 4.8, numReviews: 96, featured: true,
    artColors: { primary: '#F5F7F4', secondary: '#0A0E13', accent: '#C6F53F' },
    description: 'FIFA Basic standard, thermally bonded 12-panel construction. True flight seams and a butyl bladder that holds air for weeks.',
  }),
  p({
    id: 'f2', slug: 'strikerx-trainer-ball', name: 'StrikerX Trainer Ball', category: 'football', subCategory: 'Training',
    brand: 'StrikerX', team: null, league: null,
    price: 1299, discountPrice: 999, sizes: ['4', '5'],
    stock: { '4': 15, '5': 30 },
    rating: 4.4, numReviews: 58,
    artColors: { primary: '#FF5A1F', secondary: '#EDF1F5', accent: '#111923' },
    description: 'Machine-stitched workhorse with a scuff-resistant TPU shell. The ball you buy two of.',
  }),
  p({
    id: 'f3', slug: 'velocita-futsal-pro', name: 'Velocita Futsal Pro', category: 'football', subCategory: 'Futsal',
    brand: 'Velocita', team: null, league: null,
    price: 1899, discountPrice: null, sizes: ['4'],
    stock: { '4': 12 },
    rating: 4.6, numReviews: 27,
    artColors: { primary: '#E8C36A', secondary: '#12203A', accent: '#F5F7F4' },
    description: 'Low-bounce felt-coated futsal ball that hugs the deck. Referee-approved for the hard court.',
  }),

  // ---------------- TRAINING ----------------
  p({
    id: 't1', slug: 'pro-cone-set-12', name: 'Pro Training Cone Set (12)', category: 'training', subCategory: 'Cones',
    brand: 'Fleetmart Pro', team: null, league: null,
    price: 899, discountPrice: 699, sizes: ['OS'],
    stock: { OS: 40 },
    rating: 4.5, numReviews: 88,
    artColors: { primary: '#C6F53F', secondary: '#0A0E13' },
    description: 'Twelve crushable cones with carry strap. High-vis volt — visible at pace, night sessions too.',
  }),
  p({
    id: 't2', slug: 'agility-ladder-6m', name: 'Agility Ladder 6m', category: 'training', subCategory: 'Ladders',
    brand: 'StrikerX', team: null, league: null,
    price: 1199, discountPrice: null, sizes: ['OS'],
    stock: { OS: 18 },
    rating: 4.4, numReviews: 35,
    artColors: { primary: '#FF5A1F', secondary: '#111923' },
    description: 'Adjustable flat-rung ladder with durable nylon webbing. Includes drill card from our academy coaches.',
  }),
  p({
    id: 't3', slug: 'training-bibs-pack-10', name: 'Mesh Training Bibs (Pack of 10)', category: 'training', subCategory: 'Bibs',
    brand: 'Fleetmart Pro', team: null, league: null,
    price: 1499, discountPrice: 1249, sizes: ['Youth', 'Adult'],
    stock: { Youth: 20, Adult: 25 },
    rating: 4.6, numReviews: 44,
    artColors: { primary: '#1D5C9E', secondary: '#F5F7F4' },
    description: 'Feather-light mesh pinnies that breathe. One pack splits the squad for scrimmages all season.',
  }),

  // ---------------- GOALKEEPER ----------------
  p({
    id: 'g1', slug: 'titan-grip-pro-gloves', name: 'TitanGrip Pro GK Gloves', category: 'goalkeeper', subCategory: 'Gloves',
    brand: 'TitanGrip', team: null, league: null,
    price: 3299, discountPrice: 2799, sizes: ['8', '9', '10', '11'],
    stock: { '8': 5, '9': 8, '10': 10, '11': 6 },
    rating: 4.7, numReviews: 49, featured: true,
    artColors: { primary: '#E8C36A', secondary: '#0A0E13', accent: '#C6F53F' },
    description: '4mm German latex palm on a negative-cut chassis. Confident contact in wet conditions, wrapped thumb for security.',
  }),
  p({
    id: 'g2', slug: 'gk-padded-jersey', name: 'Sentinel GK Padded Jersey', category: 'goalkeeper', subCategory: 'GK Jersey',
    brand: 'Northwall', team: null, league: null,
    price: 2899, discountPrice: 2399, sizes: SIZES,
    stock: { S: 4, M: 6, L: 7, XL: 4, XXL: 2 },
    rating: 4.5, numReviews: 21,
    artColors: { primary: '#146B45', secondary: '#F5F7F4', accent: '#E8C36A' },
    description: 'Elbow and hip padding with stretch-mesh back. Dive without the land-ing pain.',
  }),

  // ---------------- TURF ----------------
  p({
    id: 'tf1', slug: 'premier-artificial-turf', name: 'Premier Artificial Grass 50mm', category: 'turf', subCategory: 'Artificial Grass',
    brand: 'Northwall', team: null, league: null,
    price: 220, discountPrice: 185, sizes: ['per sq.ft'],
    stock: { 'per sq.ft': 9999 },
    rating: 4.7, numReviews: 66,
    artColors: { primary: '#146B45', secondary: '#0A0E13', accent: '#C6F53F' },
    description: '50mm UV-stabilised monofilament turf with 10-year warranty. Price per sq.ft — request an installation quote and our team measures within 48 hours.',
  }),
  p({
    id: 'tf2', slug: 'turf-installation-service', name: 'Turf Installation Service', category: 'turf', subCategory: 'Service',
    brand: 'Fleetmart Pro', team: null, league: null,
    price: 90, discountPrice: null, sizes: ['per sq.ft'],
    stock: { 'per sq.ft': 9999 },
    rating: 4.8, numReviews: 31,
    artColors: { primary: '#0A0E13', secondary: '#C6F53F', accent: '#146B45' },
    description: 'End-to-end ground prep, drainage, base layer and pro turf laying for rooftops, compounds and arenas. Book a site visit.',
  }),

  // ---------------- ACCESSORIES ----------------
  p({
    id: 'a1', slug: 'mercurial-shin-guards', name: 'StrikerX Shin Guards', category: 'accessories', subCategory: 'Shin Guards',
    brand: 'StrikerX', team: null, league: null,
    price: 999, discountPrice: 799, sizes: ['S', 'M', 'L'],
    stock: { S: 10, M: 14, L: 9 },
    rating: 4.4, numReviews: 52,
    artColors: { primary: '#1D5C9E', secondary: '#F5F7F4', accent: '#C6F53F' },
    description: 'Impact-dispersing EVA shell with anatomical left/right fit and lock-in sleeve. Barely there, always there.',
  }),
  p({
    id: 'a2', slug: 'stadium-backpack', name: 'Kit Stadium Backpack 35L', category: 'accessories', subCategory: 'Bags',
    brand: 'Fleetmart Pro', team: null, league: null,
    price: 2199, discountPrice: 1799, sizes: ['OS'],
    stock: { OS: 16 },
    rating: 4.6, numReviews: 40,
    artColors: { primary: '#111923', secondary: '#C6F53F', accent: '#8A98A6' },
    description: 'Separate ventilated boot garage, ball net, wet-kit compartment and a padded 15" laptop sleeve. Built for the weekly grind.',
  }),
  p({
    id: 'a3', slug: 'grip-socks-pro-3pack', name: 'Pro Grip Socks (3-Pack)', category: 'accessories', subCategory: 'Socks',
    brand: 'Velocita', team: null, league: null,
    price: 899, discountPrice: 749, sizes: ['S', 'M', 'L'],
    stock: { S: 22, M: 30, L: 18 },
    rating: 4.5, numReviews: 77, isNew: true,
    artColors: { primary: '#C6F53F', secondary: '#0A0E13', accent: '#F5F7F4' },
    description: 'Anti-slip silicone pads inside the calf-length cuff. Locked-in feel inside any boot.',
  }),

  // ---------------- MERCH ----------------
  p({
    id: 'm1', slug: 'omega-fc-scarf', name: 'Omega FC Matchday Scarf', category: 'merch', subCategory: 'Scarves',
    brand: 'Fleetmart Pro', team: 'omega', league: null,
    price: 699, discountPrice: 549, sizes: ['OS'],
    stock: { OS: 35 },
    rating: 4.7, numReviews: 26,
    artColors: { primary: '#7C1D2E', secondary: '#F5E9DC', accent: '#0A0E13' },
    description: 'Heavy-knit jacquard scarf — club motto on one side, "UNTIL THE LAST WHISTLE" on the other.',
  }),
  p({
    id: 'm2', slug: 'volt-armada-cap', name: 'Volt Armada Snapback', category: 'merch', subCategory: 'Caps',
    brand: 'Fleetmart Pro', team: 'voltarmada', league: null,
    price: 899, discountPrice: null, sizes: ['OS'],
    stock: { OS: 22 },
    rating: 4.4, numReviews: 19,
    artColors: { primary: '#0A0E13', secondary: '#C6F53F', accent: '#C6F53F' },
    description: 'Structured six-panel snapback with 3D puff embroidery. Matchday from dawn kickoff to after-party.',
  }),
]

export const getProduct = (slug) => PRODUCTS.find((x) => x.slug === slug)
export const categoryMeta = (id) => CATEGORIES.find((c) => c.id === id)
