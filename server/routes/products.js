import { Router } from 'express'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { escapeRegex } from '../utils/sanitize.js'

const router = Router()

// GET /api/products — public, with filters
router.get('/', async (req, res, next) => {
  try {
    const { category, brand, team, minPrice, maxPrice, size, sort, search, featured, page = 1, limit = 24 } = req.query
    const filter = { isActive: true }

    if (category) filter.category = category
    if (brand) filter.brand = brand
    if (team) filter.team = team
    if (featured === '1') filter.featured = true
    if (size) filter[`stock.${size}`] = { $gt: 0 }
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (search) {
      const safe = escapeRegex(search)
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { brand: { $regex: safe, $options: 'i' } },
      ]
    }

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
    const { name, slug, description, category, subCategory, brand, team, league, price, discountPrice, stock, images, featured, isNew, customizable, artColors, isActive } = req.body
    const product = await Product.create({ name, slug, description, category, subCategory, brand, team, league, price, discountPrice, stock, images, featured, isNew, customizable, artColors, isActive })
    res.status(201).json({ product })
  } catch (err) { next(err) }
})

// PUT /api/products/:id — admin
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, slug, description, category, subCategory, brand, team, league, price, discountPrice, stock, images, featured, isNew, customizable, artColors, isActive } = req.body
    const product = await Product.findByIdAndUpdate(req.params.id, { name, slug, description, category, subCategory, brand, team, league, price, discountPrice, stock, images, featured, isNew, customizable, artColors, isActive }, { new: true, runValidators: true })
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
