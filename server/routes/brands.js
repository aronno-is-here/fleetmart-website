import { Router } from 'express'
import Brand from '../models/Brand.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/brands — public, active brands
router.get('/', async (_req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ displayOrder: 1, name: 1 })
    res.json({ brands })
  } catch (err) { next(err) }
})

// GET /api/brands/all — admin, all brands
router.get('/all', protect, adminOnly, async (_req, res, next) => {
  try {
    const brands = await Brand.find().sort({ displayOrder: 1, name: 1 })
    res.json({ brands })
  } catch (err) { next(err) }
})

// POST /api/brands — admin, create
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, displayOrder } = req.body
    if (!name) return res.status(400).json({ message: 'Name is required' })

    const slug = toSlug(name)
    const existing = await Brand.findOne({ slug })
    if (existing) return res.status(400).json({ message: `Brand "${name}" already exists` })

    const brand = await Brand.create({ name, slug, displayOrder: displayOrder || 0 })
    res.status(201).json({ brand })
  } catch (err) { next(err) }
})

// PUT /api/brands/:id — admin, update
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id)
    if (!brand) return res.status(404).json({ message: 'Brand not found' })

    const { name, displayOrder, isActive } = req.body
    if (name !== undefined) {
      brand.name = name
      brand.slug = toSlug(name)
    }
    if (displayOrder !== undefined) brand.displayOrder = displayOrder
    if (isActive !== undefined) brand.isActive = isActive

    await brand.save()
    res.json({ brand })
  } catch (err) { next(err) }
})

// DELETE /api/brands/:id — admin, safe delete
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id)
    if (!brand) return res.status(404).json({ message: 'Brand not found' })

    const productCount = await Product.countDocuments({ brand: brand.slug })
    if (productCount > 0) {
      return res.status(400).json({ message: `Cannot delete brand used by ${productCount} product(s). Deactivate instead.` })
    }

    await Brand.findByIdAndDelete(brand._id)
    res.json({ message: 'Brand deleted' })
  } catch (err) { next(err) }
})

// PUT /api/brands/reorder/bulk — admin, bulk reorder
router.put('/reorder/bulk', protect, adminOnly, async (req, res, next) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array is required' })

    const ops = items.map(({ id, displayOrder }) => ({
      updateOne: { filter: { _id: id }, update: { $set: { displayOrder } } },
    }))

    await Brand.bulkWrite(ops)
    res.json({ message: 'Reorder saved' })
  } catch (err) { next(err) }
})

export default router
