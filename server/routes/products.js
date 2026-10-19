import { Router } from 'express'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Brand from '../models/Brand.js'
import Team from '../models/Team.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { escapeRegex } from '../utils/sanitize.js'
import {
  buildCategoryIndex,
  getCategoryFamily,
  resolveCategoryPath,
} from '../services/taxonomy.js'

const router = Router()

async function validateProductRefs({ brand, team }) {
  if (brand) {
    const b = await Brand.findOne({ slug: brand })
    if (!b) return { ok: false, message: `Brand "${brand}" not found` }
  }
  if (team) {
    const t = await Team.findOne({ slug: team })
    if (!t) return { ok: false, message: `Team "${team}" not found` }
  }
  return { ok: true }
}

function resolveProductCategory(index, category) {
  if (typeof category !== 'string' || !category.trim()) {
    return { ok: false, message: 'Category is required' }
  }

  const resolved = resolveCategoryPath(index, category.trim())
  if (resolved.ok) {
    return {
      ok: true,
      category: resolved.category.id,
      categoryPath: resolved.path,
    }
  }

  if (resolved.reason === 'cycle') {
    return { ok: false, message: `Category hierarchy for "${category}" contains a cycle` }
  }
  if (resolved.reason === 'missing-parent') {
    return { ok: false, message: `Category hierarchy for "${category}" references a missing parent` }
  }
  return { ok: false, message: `Category "${category}" not found` }
}

// GET /api/products — public, with filters
router.get('/', async (req, res, next) => {
  try {
    const { category, brand, team, minPrice, maxPrice, size, sort, search, featured, customizable, page = 1, limit = 24 } = req.query
    const filter = { isActive: true }
    const and = []

    if (category) {
      const categories = await Category.find().select('_id id parent')
      const index = buildCategoryIndex(categories)
      const family = getCategoryFamily(index, category)
      const references = family.ok ? family.references : [category]
      and.push({
        $or: [
          { category: { $in: references } },
          { categoryPath: { $in: references } },
        ],
      })
    }
    if (brand) filter.brand = brand
    if (team) filter.team = team
    if (featured === '1') filter.featured = true
    if (customizable === '1') filter.customizable = true
    if (size) filter[`stock.${size}`] = { $gt: 0 }
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (search) {
      const safe = escapeRegex(search)
      and.push({
        $or: [
          { name: { $regex: safe, $options: 'i' } },
          { description: { $regex: safe, $options: 'i' } },
          { brand: { $regex: safe, $options: 'i' } },
        ],
      })
    }
    if (and.length) filter.$and = and

    let sortObj = { createdAt: -1 }
    if (sort === 'price_asc') sortObj = { price: 1 }
    else if (sort === 'price_desc') sortObj = { price: -1 }
    else if (sort === 'rating') sortObj = { rating: -1 }
    else if (sort === 'newest') sortObj = { createdAt: -1 }
    else if (sort === 'popular') sortObj = { numReviews: -1 }
    else if (sort === 'featured') sortObj = { featured: -1, rating: -1 }

    const skip = (Number(page) - 1) * Number(limit)
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ])

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (err) { next(err) }
})

// GET /api/products/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ product })
  } catch (err) { next(err) }
})

// POST /api/products — admin
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, slug, description, category, subCategory, brand, team, league, price, discountPrice, stock, images, featured, isNew, customizable, sizeChartType, artColors, isActive } = req.body

    const refCheck = await validateProductRefs({ brand, team })
    if (!refCheck.ok) return res.status(400).json({ message: refCheck.message })

    const categories = await Category.find().select('_id id parent')
    const index = buildCategoryIndex(categories)
    const categoryRef = resolveProductCategory(index, category)
    if (!categoryRef.ok) return res.status(400).json({ message: categoryRef.message })

    const product = await Product.create({
      name, slug, description,
      category: categoryRef.category,
      subCategory,
      categoryPath: categoryRef.categoryPath,
      brand, team, league, price, discountPrice, stock, images,
      featured, isNew, customizable, sizeChartType, artColors, isActive,
    })
    res.status(201).json({ product })
  } catch (err) { next(err) }
})

// PUT /api/products/:id — admin
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { category, brand, team } = req.body

    const existing = await Product.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Product not found' })

    const refCheck = await validateProductRefs({ brand, team })
    if (!refCheck.ok) return res.status(400).json({ message: refCheck.message })

    const update = {}
    const fields = [
      'name', 'slug', 'description', 'subCategory', 'brand', 'team', 'league',
      'price', 'discountPrice', 'stock', 'images', 'featured', 'isNew',
      'customizable', 'sizeChartType', 'artColors', 'isActive',
    ]
    for (const field of fields) {
      if (req.body[field] !== undefined) update[field] = req.body[field]
    }

    const categories = await Category.find().select('_id id parent')
    const index = buildCategoryIndex(categories)
    const categoryRef = resolveProductCategory(index, category !== undefined ? category : existing.category)
    if (!categoryRef.ok) return res.status(400).json({ message: categoryRef.message })
    update.category = categoryRef.category
    update.categoryPath = categoryRef.categoryPath

    const product = await Product.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ product })
  } catch (err) { next(err) }
})

// DELETE /api/products/:id — admin
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product deleted' })
  } catch (err) { next(err) }
})

export default router
