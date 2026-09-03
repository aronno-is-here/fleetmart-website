import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import User from './models/User.js'
import Product from './models/Product.js'
import Category from './models/Category.js'
import Coupon from './models/Coupon.js'

const CATEGORIES = [
  { id: 'jersey', name: 'Jerseys', blurb: 'Club · National · Retro' },
  { id: 'boots', name: 'Boots', blurb: 'FG · Turf · Indoor' },
  { id: 'football', name: 'Footballs', blurb: 'Match · Training · Futsal' },
  { id: 'training', name: 'Training', blurb: 'Cones · Bibs · Ladders' },
  { id: 'goalkeeper', name: 'Goalkeeping', blurb: 'Gloves · GK Kits' },
  { id: 'turf', name: 'Turf & Grass', blurb: 'Artificial · Installation' },
  { id: 'accessories', name: 'Accessories', blurb: 'Guards · Socks · Bags' },
  { id: 'merch', name: 'Fan Merch', blurb: 'Scarves · Caps · Mugs' },
]

const PRODUCTS = [
  { id: 'j1', slug: 'omega-fc-home-25', name: 'Omega FC Home Kit 25/26', category: 'jersey', subCategory: 'Club', brand: 'Fleetmart Pro', team: 'omega', league: 'Premier Division', price: 2499, discountPrice: 1999, stock: { S: 8, M: 14, L: 3, XL: 9, XXL: 5 }, rating: 4.8, numReviews: 64, featured: true, isNew: true, customizable: true, artColors: { primary: '#C6F53F', secondary: '#0A0E13', accent: '#C6F53F' }, description: 'The Omega FC Home Kit 25/26 captures the electric energy of the pitch. Designed with moisture-wicking fabric and a bold volt-green accent, this jersey lets you rep your club in style.' },
  { id: 'j2', slug: 'azure-city-away-25', name: 'Azure City Away Kit 25/26', category: 'jersey', subCategory: 'Club', brand: 'Fleetmart Pro', team: 'azurecity', league: 'Premier Division', price: 2499, discountPrice: 1999, stock: { S: 6, M: 10, L: 8, XL: 4, XXL: 2 }, rating: 4.6, numReviews: 38, featured: true, isNew: true, customizable: true, artColors: { primary: '#3FA9F5', secondary: '#0A1520', accent: '#3FA9F5' }, description: 'Azure City\'s away strip brings sky-blue swagger to hostile territory. Lightweight construction with mesh ventilation panels for maximum comfort.' },
  { id: 'j3', slug: 'volt-armada-third-25', name: 'Volt Armada Third Kit 25/26', category: 'jersey', subCategory: 'Club', brand: 'Fleetmart Pro', team: 'voltarmada', league: 'Premier Division', price: 2299, discountPrice: null, stock: { S: 12, M: 18, L: 15, XL: 10, XXL: 6 }, rating: 4.9, numReviews: 82, featured: true, isNew: false, customizable: true, artColors: { primary: '#C6F53F', secondary: '#1A1A2E', accent: '#FFD700' }, description: 'The Volt Armada Third Kit is a statement piece. Neon volt accents on a deep navy base, designed for players who own the spotlight.' },
  { id: 'j4', slug: 'crimson-united-home-25', name: 'Crimson United Home Kit 25/26', category: 'jersey', subCategory: 'Club', brand: 'StrikerX', team: 'crimson', league: 'Premier Division', price: 2199, discountPrice: 1799, stock: { S: 5, M: 8, L: 12, XL: 7, XXL: 3 }, rating: 4.5, numReviews: 45, featured: false, isNew: true, customizable: true, artColors: { primary: '#DC2626', secondary: '#1A0A0A', accent: '#F5F5F5' }, description: 'Crimson United\'s home jersey is pure fire. Deep red with white trim, built for the warriors who never back down.' },
  { id: 'j5', slug: 'royal-athletic-home-25', name: 'Royal Athletic Home Kit 25/26', category: 'jersey', subCategory: 'Club', brand: 'Fleetmart Pro', team: 'royal', league: 'Premier Division', price: 2699, discountPrice: 2199, stock: { S: 4, M: 6, L: 10, XL: 8, XXL: 4 }, rating: 4.7, numReviews: 56, featured: true, isNew: false, customizable: true, artColors: { primary: '#7C3AED', secondary: '#0F0A1A', accent: '#C0A050' }, description: 'Royal Athletic brings regal purple to the pitch. Premium stitching and gold accents mark this as the kit for champions.' },
  { id: 'j6', slug: 'midnight-sc-home-25', name: 'Midnight SC Home Kit 25/26', category: 'jersey', subCategory: 'Club', brand: 'Northwall', team: 'midnight', league: 'Night League', price: 2399, discountPrice: null, stock: { S: 9, M: 14, L: 11, XL: 6, XXL: 3 }, rating: 4.4, numReviews: 31, featured: false, isNew: false, customizable: true, artColors: { primary: '#1E293B', secondary: '#0A0E13', accent: '#60A5FA' }, description: 'Midnight SC\'s kit is stealth incarnate. Dark tones with electric blue highlights — designed for the night shift.' },
  { id: 'j7', slug: 'bangladesh-home-25', name: 'Bangladesh National Home Kit 25/26', category: 'jersey', subCategory: 'National', brand: 'Velocita', team: 'bd', league: 'International', price: 2999, discountPrice: 2499, stock: { S: 15, M: 22, L: 20, XL: 12, XXL: 8 }, rating: 4.9, numReviews: 156, featured: true, isNew: true, customizable: true, artColors: { primary: '#16A34A', secondary: '#052E16', accent: '#DC2626' }, description: 'Rep your nation with pride. The Bangladesh home kit features the national colors in a modern athletic cut, built for the beautiful game.' },
  { id: 'j8', slug: 'argento-bianco-away-25', name: 'Argento Bianco Away Kit 25/26', category: 'jersey', subCategory: 'Club', brand: 'TitanGrip', team: 'argento', league: 'Serie A', price: 2799, discountPrice: 2299, stock: { S: 3, M: 7, L: 9, XL: 5, XXL: 2 }, rating: 4.6, numReviews: 42, featured: false, isNew: true, customizable: true, artColors: { primary: '#F5F5F5', secondary: '#1A1A1A', accent: '#C0C0C0' }, description: 'Argento Bianco\'s silver-white away kit is Italian elegance meets on-pitch aggression. Sleek, minimal, deadly.' },
  { id: 'b1', slug: 'velocita-x1-firm-ground', name: 'Velocita X1 Firm Ground', category: 'boots', subCategory: 'Firm Ground', brand: 'Velocita', team: null, league: null, price: 5999, discountPrice: 4999, stock: { '39': 4, '40': 8, '41': 12, '42': 10, '43': 7, '44': 5, '45': 3 }, rating: 4.7, numReviews: 89, featured: true, isNew: false, customizable: false, description: 'The Velocita X1 is built for explosive speed. Carbon fiber plate, knitted upper, and aggressive stud pattern for maximum acceleration on firm ground.' },
  { id: 'b2', slug: 'strikerx-blade-turf', name: 'StrikerX Blade Turf', category: 'boots', subCategory: 'Turf', brand: 'StrikerX', team: null, league: null, price: 3499, discountPrice: null, stock: { '39': 6, '40': 10, '41': 14, '42': 12, '43': 8, '44': 6, '45': 4 }, rating: 4.5, numReviews: 67, featured: false, isNew: true, customizable: false, description: 'Dominate artificial surfaces with the StrikerX Blade. Multi-directional studs and a padded collar for comfort during long sessions.' },
  { id: 'b3', slug: 'northwall-titan-indoor', name: 'Northwall Titan Indoor', category: 'boots', subCategory: 'Indoor', brand: 'Northwall', team: null, league: null, price: 2999, discountPrice: 2499, stock: { '39': 5, '40': 7, '41': 10, '42': 9, '43': 6, '44': 4, '45': 2 }, rating: 4.3, numReviews: 41, featured: false, isNew: false, customizable: false, description: 'Indoor precision meets street style. The Northwall Titan features a gum rubber outsole and reinforced toe for futsal and indoor courts.' },
  { id: 'b4', slug: 'titangrip-phantom-fg', name: 'TitanGrip Phantom FG', category: 'boots', subCategory: 'Firm Ground', brand: 'TitanGrip', team: null, league: null, price: 6499, discountPrice: 5499, stock: { '39': 3, '40': 5, '41': 8, '42': 7, '43': 5, '44': 3, '45': 2 }, rating: 4.8, numReviews: 73, featured: true, isNew: false, customizable: false, description: 'The Phantom is TitanGrip\'s flagship. Engineered for power and precision, with a textured striking zone and adaptive fit system.' },
  { id: 'f1', slug: 'fleetmart-pro-match-5', name: 'Fleetmart Pro Match 5', category: 'football', subCategory: 'Match', brand: 'Fleetmart Pro', team: null, league: null, price: 1999, discountPrice: 1599, stock: { '4': 20, '5': 30, '6+': 15 }, rating: 4.6, numReviews: 112, featured: true, isNew: false, customizable: false, description: 'FIFA-quality match ball. Thermal-bonded panels, aerodynamic surface texture, and elite flight stability for competitive play.' },
  { id: 'f2', slug: 'strikerx-training-pro', name: 'StrikerX Training Pro', category: 'football', subCategory: 'Training', brand: 'StrikerX', team: null, league: null, price: 999, discountPrice: null, stock: { '4': 25, '5': 35, '6+': 20 }, rating: 4.4, numReviews: 88, featured: false, isNew: false, customizable: false, description: 'Built for daily training sessions. Durable machine-stitched panels with a consistent touch and flight path.' },
  { id: 'f3', slug: 'velocita-futsal-3', name: 'Velocita Futsal 3', category: 'football', subCategory: 'Futsal', brand: 'Velocita', team: null, league: null, price: 799, discountPrice: 599, stock: { '4': 30, '5': 25, '6+': 10 }, rating: 4.2, numReviews: 54, featured: false, isNew: true, customizable: false, description: 'Low-bounce futsal ball with superior control. Reinforced cover for extended use on hard courts.' },
  { id: 't1', slug: 'fleetmart-speed-cone-set', name: 'Fleetmart Speed Cone Set (20)', category: 'training', subCategory: 'Cones', brand: 'Fleetmart Pro', team: null, league: null, price: 499, discountPrice: null, stock: { 'one_size': 50 }, rating: 4.3, numReviews: 67, featured: false, isNew: false, customizable: false, description: 'Set of 20 bright orange speed cones for agility drills. Flexible, stackable, and includes a carrying strap.' },
  { id: 't2', slug: 'strikerx-agility-ladder', name: 'StrikerX Agility Ladder (6m)', category: 'training', subCategory: 'Ladders', brand: 'StrikerX', team: null, league: null, price: 699, discountPrice: 549, stock: { 'one_size': 35 }, rating: 4.5, numReviews: 43, featured: false, isNew: true, customizable: false, description: '6-meter agility ladder with 12 adjustable rungs. Anti-slip feet and heavy-duty nylon straps for indoor or outdoor use.' },
  { id: 't3', slug: 'fleetmart-pro-training-bib-set', name: 'Fleetmart Pro Training Bib Set (10)', category: 'training', subCategory: 'Bibs', brand: 'Fleetmart Pro', team: null, league: null, price: 899, discountPrice: null, stock: { 'S': 15, 'M': 20, 'L': 20, 'XL': 10 }, rating: 4.1, numReviews: 29, featured: false, isNew: false, customizable: false, description: 'Set of 10 mesh training bibs in two colors (5 red, 5 blue). Lightweight, breathable, and machine washable.' },
  { id: 'g1', slug: 'titangrip-gk-fury', name: 'TitanGrip GK Fury Gloves', category: 'goalkeeper', subCategory: 'Gloves', brand: 'TitanGrip', team: null, league: null, price: 2499, discountPrice: 1999, stock: { '7': 5, '8': 10, '9': 12, '10': 8, '11': 4 }, rating: 4.7, numReviews: 58, featured: true, isNew: false, customizable: false, description: 'Professional-grade goalkeeper gloves with 4mm German latex palms and finger protection technology.' },
  { id: 'g2', slug: 'fleetmart-gk-pro-kit', name: 'Fleetmart GK Pro Kit', category: 'goalkeeper', subCategory: 'GK Jersey', brand: 'Fleetmart Pro', team: null, league: null, price: 1999, discountPrice: null, stock: { 'S': 6, 'M': 10, 'L': 12, 'XL': 8, 'XXL': 4 }, rating: 4.4, numReviews: 34, featured: false, isNew: true, customizable: false, description: 'Complete goalkeeper kit with padded jersey, shorts, and built-in elbow protection.' },
  { id: 'tf1', slug: 'fleetmart-pro-turf-roll', name: 'Fleetmart Pro Turf Roll (2m²)', category: 'turf', subCategory: 'Artificial Grass', brand: 'Fleetmart Pro', team: null, league: null, price: 4999, discountPrice: 3999, stock: { 'one_size': 15 }, rating: 4.6, numReviews: 21, featured: false, isNew: false, customizable: false, description: 'Premium artificial grass turf. 40mm pile height, UV-resistant, and FIFA-quality ball bounce simulation.' },
  { id: 'tf2', slug: 'fleetmart-turf-installation', name: 'Fleetmart Turf Installation Service', category: 'turf', subCategory: 'Service', brand: 'Fleetmart Pro', team: null, league: null, price: 9999, discountPrice: null, stock: { 'one_size': 99 }, rating: 4.8, numReviews: 15, featured: false, isNew: false, customizable: false, description: 'Professional turf installation service. Includes site assessment, base preparation, turf laying, and finishing.' },
  { id: 'a1', slug: 'northwall-shin-guard-x', name: 'Northwall Shin Guard X', category: 'accessories', subCategory: 'Shin Guards', brand: 'Northwall', team: null, league: null, price: 399, discountPrice: 299, stock: { 'S': 20, 'M': 25, 'L': 20, 'XL': 15 }, rating: 4.2, numReviews: 76, featured: false, isNew: false, customizable: false, description: 'Lightweight EVA foam shin guards with hard shell protection. Anatomical fit for maximum coverage.' },
  { id: 'a2', slug: 'fleetmart-pro-socks-3pack', name: 'Fleetmart Pro Football Socks (3-Pack)', category: 'accessories', subCategory: 'Socks', brand: 'Fleetmart Pro', team: null, league: null, price: 599, discountPrice: null, stock: { 'S': 30, 'M': 35, 'L': 25, 'XL': 15 }, rating: 4.4, numReviews: 92, featured: false, isNew: false, customizable: false, description: 'Over-the-calf football socks with reinforced heel and toe. Moisture-wicking fabric with compression arch support.' },
  { id: 'a3', slug: 'velocita-sport-bag', name: 'Velocita Sport Duffel Bag', category: 'accessories', subCategory: 'Bags', brand: 'Velocita', team: null, league: null, price: 1499, discountPrice: 1199, stock: { 'one_size': 25 }, rating: 4.5, numReviews: 48, featured: false, isNew: true, customizable: false, description: 'Spacious 45L duffel bag with separate boot compartment, ventilated shoe pocket, and padded shoulder straps.' },
  { id: 'm1', slug: 'omega-fc-scarf', name: 'Omega FC Fan Scarf', category: 'merch', subCategory: 'Scarves', brand: 'Fleetmart Pro', team: 'omega', league: null, price: 599, discountPrice: null, stock: { 'one_size': 40 }, rating: 4.6, numReviews: 37, featured: false, isNew: false, customizable: false, description: 'Official Omega FC fan scarf. Knitted polyester with club crest and volt-green detailing.' },
  { id: 'm2', slug: 'fleetmart-snapback-cap', name: 'Fleetmart Logo Snapback Cap', category: 'merch', subCategory: 'Caps', brand: 'Fleetmart Pro', team: null, league: null, price: 799, discountPrice: 599, stock: { 'one_size': 30 }, rating: 4.3, numReviews: 55, featured: false, isNew: true, customizable: false, description: 'Structured snapback cap with embroidered Fleetmart logo. Adjustable strap, flat brim, and premium cotton twill.' },
]

const COUPONS = [
  { code: 'GEARUP10', discountType: 'percent', value: 10, minOrder: 1000, maxUses: 100, isActive: true },
  { code: 'MATCHDAY5', discountType: 'percent', value: 5, minOrder: 500, maxUses: 200, isActive: true },
  { code: 'WELCOME20', discountType: 'percent', value: 20, minOrder: 2000, maxUses: 50, isActive: true },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Coupon.deleteMany({}),
    ])

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@fleetmart.com',
      password: 'Fleet@Admin2026',
      role: 'admin',
      phone: '+8801700000000',
    })
    console.log(`Admin user created: ${admin.email}`)

    // Create demo customer
    await User.create({
      name: 'Demo Customer',
      email: 'demo@fleetmart.com',
      password: 'demo123',
      role: 'customer',
    })
    console.log('Demo customer created: demo@fleetmart.com')

    // Create categories
    await Category.insertMany(CATEGORIES)
    console.log(`${CATEGORIES.length} categories created`)

    // Create products
    const products = PRODUCTS.map(({ id, ...rest }) => rest)
    await Product.insertMany(products)
    console.log(`${products.length} products created`)

    // Create coupons
    await Coupon.insertMany(COUPONS)
    console.log(`${COUPONS.length} coupons created`)

    console.log('\nSeed complete!')
    console.log('Admin: admin@fleetmart.com / Fleet@Admin2026')
    console.log('Customer: demo@fleetmart.com / demo123')
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seed()
