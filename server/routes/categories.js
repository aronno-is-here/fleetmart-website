import { Router } from 'express'
import Category from '../models/Category.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// GET /api/categories — public
router.get('/', async (_req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
    res.json({ categories })
  } catch (err) { next(err) }
})

// POST /api/categories — admin
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.create(req.body)
    res.status(201).json({ category })
  } catch (err) { next(err) }
})

// PUT /api/categories/:id — admin
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json({ category })
  } catch (err) { next(err) }
})

// DELETE /api/categories/:id — admin
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id)
    res.json({ message: 'Category deleted' })
  } catch (err) { next(err) }
})

export default router
