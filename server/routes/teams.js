import { Router } from 'express'
import Team from '../models/Team.js'
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

// GET /api/teams — public, active teams
router.get('/', async (_req, res, next) => {
  try {
    const teams = await Team.find({ isActive: true }).sort({ displayOrder: 1, name: 1 })
    res.json({ teams })
  } catch (err) { next(err) }
})

// GET /api/teams/all — admin, all teams
router.get('/all', protect, adminOnly, async (_req, res, next) => {
  try {
    const teams = await Team.find().sort({ displayOrder: 1, name: 1 })
    res.json({ teams })
  } catch (err) { next(err) }
})

// POST /api/teams — admin, create
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, primary, secondary, number, displayOrder } = req.body
    if (!name) return res.status(400).json({ message: 'Name is required' })

    const slug = toSlug(name)
    const existing = await Team.findOne({ slug })
    if (existing) return res.status(400).json({ message: `Team "${name}" already exists` })

    const team = await Team.create({
      name, slug,
      primary: primary || '#000000',
      secondary: secondary || '#FFFFFF',
      number: number || '#FFFFFF',
      displayOrder: displayOrder || 0,
    })
    res.status(201).json({ team })
  } catch (err) { next(err) }
})

// PUT /api/teams/:id — admin, update
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
    if (!team) return res.status(404).json({ message: 'Team not found' })

    const { name, primary, secondary, number, displayOrder, isActive } = req.body
    if (name !== undefined) {
      team.name = name
      team.slug = toSlug(name)
    }
    if (primary !== undefined) team.primary = primary
    if (secondary !== undefined) team.secondary = secondary
    if (number !== undefined) team.number = number
    if (displayOrder !== undefined) team.displayOrder = displayOrder
    if (isActive !== undefined) team.isActive = isActive

    await team.save()
    res.json({ team })
  } catch (err) { next(err) }
})

// DELETE /api/teams/:id — admin, safe delete
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
    if (!team) return res.status(404).json({ message: 'Team not found' })

    const productCount = await Product.countDocuments({ team: team.slug })
    if (productCount > 0) {
      return res.status(400).json({ message: `Cannot delete team used by ${productCount} product(s). Deactivate instead.` })
    }

    await Team.findByIdAndDelete(team._id)
    res.json({ message: 'Team deleted' })
  } catch (err) { next(err) }
})

// PUT /api/teams/reorder/bulk — admin, bulk reorder
router.put('/reorder/bulk', protect, adminOnly, async (req, res, next) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array is required' })

    const ops = items.map(({ id, displayOrder }) => ({
      updateOne: { filter: { _id: id }, update: { $set: { displayOrder } } },
    }))

    await Team.bulkWrite(ops)
    res.json({ message: 'Reorder saved' })
  } catch (err) { next(err) }
})

export default router
