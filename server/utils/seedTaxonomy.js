import Category from '../models/Category.js'
import Brand from '../models/Brand.js'
import Team from '../models/Team.js'

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

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

const BRANDS = [
  { name: 'Fleetmart Pro', displayOrder: 0 },
  { name: 'StrikerX', displayOrder: 1 },
  { name: 'Velocita', displayOrder: 2 },
  { name: 'Northwall', displayOrder: 3 },
  { name: 'TitanGrip', displayOrder: 4 },
]

const TEAMS = [
  { name: 'Omega FC', slug: 'omega', primary: '#7C1D2E', secondary: '#F5E9DC', number: '#F5E9DC', displayOrder: 0 },
  { name: 'Azure City', slug: 'azurecity', primary: '#1D5C9E', secondary: '#0A0E13', number: '#F5F7F4', displayOrder: 1 },
  { name: 'Volt Armada', slug: 'voltarmada', primary: '#2A3320', secondary: '#C6F53F', number: '#C6F53F', displayOrder: 2 },
  { name: 'Crimson United', slug: 'crimson', primary: '#B3222B', secondary: '#1A1A1A', number: '#FFFFFF', displayOrder: 3 },
  { name: 'Royal Athletic', slug: 'royal', primary: '#23306B', secondary: '#E8C36A', number: '#F5F7F4', displayOrder: 4 },
  { name: 'Midnight SC', slug: 'midnight', primary: '#101418', secondary: '#3FA9F5', number: '#3FA9F5', displayOrder: 5 },
  { name: 'Saffron Kings', slug: 'saffron', primary: '#E07C1F', secondary: '#12203A', number: '#FFFFFF', displayOrder: 6 },
  { name: 'Emerald Rovers', slug: 'emerald', primary: '#146B45', secondary: '#F5F7F4', number: '#F5F7F4', displayOrder: 7 },
  { name: 'Bangladesh', slug: 'bd', primary: '#0E6B3A', secondary: '#C62828', number: '#F5F7F4', displayOrder: 8 },
  { name: 'Argento Bianco', slug: 'argento', primary: '#F5F7F4', secondary: '#0A3D91', number: '#0A3D91', displayOrder: 9 },
]

export async function seedCategories() {
  let created = 0
  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ id: cat.id })
    if (!existing) {
      await Category.create({
        id: cat.id,
        name: cat.name,
        blurb: cat.blurb,
        autoBlurb: false,
        level: 0,
        path: '/',
      })
      created++
    }
  }
  return created
}

export async function seedBrands() {
  let created = 0
  for (const brand of BRANDS) {
    const slug = toSlug(brand.name)
    const existing = await Brand.findOne({ slug })
    if (!existing) {
      await Brand.create({
        name: brand.name,
        slug,
        displayOrder: brand.displayOrder,
      })
      created++
    }
  }
  return created
}

export async function seedTeams() {
  let created = 0
  for (const team of TEAMS) {
    const existing = await Team.findOne({ slug: team.slug })
    if (!existing) {
      await Team.create({
        name: team.name,
        slug: team.slug,
        primary: team.primary,
        secondary: team.secondary,
        number: team.number,
        displayOrder: team.displayOrder,
      })
      created++
    }
  }
  return created
}

export default async function seedTaxonomy() {
  const cats = await seedCategories()
  const brands = await seedBrands()
  const teams = await seedTeams()
  if (cats || brands || teams) {
    console.log(`Taxonomy seeded: ${cats} categories, ${brands} brands, ${teams} teams`)
  }
}
