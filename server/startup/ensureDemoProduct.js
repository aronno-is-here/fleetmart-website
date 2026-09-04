import Product from '../models/Product.js'
import Category from '../models/Category.js'

const DEMO_PRODUCT = {
  name: 'Payment Test Jersey',
  slug: 'payment-test-jersey',
  description: 'Demo jersey product for testing FleetMart payment flow.',
  category: 'jersey',
  subCategory: 'Club',
  brand: 'fleetmart-pro',
  team: null,
  league: null,
  price: 20,
  discountPrice: null,
  stock: { S: 100, M: 100, L: 100, XL: 100, XXL: 100 },
  rating: 0,
  numReviews: 0,
  images: [],
  featured: false,
  isNew: false,
  customizable: false,
  artColors: {
    primary: '#C6F53F',
    secondary: '#0A0E13',
    accent: '#3FA9F5',
  },
  isActive: true,
}

let ensured = false

export default async function ensureDemoProduct() {
  if (ensured) return

  try {
    const exists = await Product.findOne({ slug: DEMO_PRODUCT.slug }).select('_id')
    if (exists) {
      ensured = true
      return
    }

    await Category.findOneAndUpdate(
      { id: 'jersey' },
      { $setOnInsert: { id: 'jersey', name: 'Jerseys', blurb: 'Club · National · Retro', isActive: true } },
      { upsert: true, new: true }
    )

    await Product.findOneAndUpdate(
      { slug: DEMO_PRODUCT.slug },
      { $setOnInsert: DEMO_PRODUCT },
      { upsert: true, new: true }
    )
    ensured = true
    console.log('[DEMO] Payment Test Jersey ensured (৳20)')
  } catch (err) {
    console.error('[DEMO] Failed to ensure demo product:', err.message)
  }
}
