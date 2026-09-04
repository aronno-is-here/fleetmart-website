import Product from '../models/Product.js'
import Brand from '../models/Brand.js'
import Team from '../models/Team.js'

let migrated = false

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default async function migrateProductReferences() {
  if (migrated) return

  try {
    // Build brand name-to-slug lookup
    const brands = await Brand.find().select('name slug')
    const brandMap = {}
    brands.forEach(b => { brandMap[b.name] = b.slug })

    // Fix products that store brand name instead of slug
    const products = await Product.find()
    let brandFixed = 0
    for (const p of products) {
      if (p.brand && brandMap[p.brand] && p.brand !== brandMap[p.brand]) {
        await Product.findByIdAndUpdate(p._id, { brand: brandMap[p.brand] })
        brandFixed++
      }
    }

    if (brandFixed > 0) {
      console.log(`[MIGRATE] Fixed ${brandFixed} product brand references from name to slug`)
    }

    migrated = true
  } catch (err) {
    console.error('[MIGRATE] Failed to migrate product references:', err.message)
  }
}
