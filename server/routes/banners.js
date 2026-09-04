import { Router } from 'express'
import Banner from '../models/Banner.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// GET /api/banners — public, active banners ordered
router.get('/', async (_req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 })
    res.json({ banners })
  } catch (err) { next(err) }
})

// GET /api/banners/all — admin, all banners
router.get('/all', protect, adminOnly, async (_req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 })
    res.json({ banners })
  } catch (err) { next(err) }
})

// POST /api/banners — admin, create banner
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { imageUrl, targetUrl, title, displayOrder } = req.body
    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required' })
    }
    const banner = await Banner.create({
      imageUrl,
      targetUrl: targetUrl || '/shop',
      title: title || '',
      displayOrder: displayOrder || 0,
    })
    res.status(201).json({ banner })
  } catch (err) { next(err) }
})

// PUT /api/banners/:id — admin, update banner
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id)
    if (!banner) return res.status(404).json({ message: 'Banner not found' })

    const { imageUrl, targetUrl, title, isActive, displayOrder } = req.body
    if (imageUrl !== undefined) banner.imageUrl = imageUrl
    if (targetUrl !== undefined) banner.targetUrl = targetUrl
    if (title !== undefined) banner.title = title
    if (isActive !== undefined) banner.isActive = isActive
    if (displayOrder !== undefined) banner.displayOrder = displayOrder

    await banner.save()
    res.json({ banner })
  } catch (err) { next(err) }
})

// DELETE /api/banners/:id — admin, delete banner
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id)
    if (!banner) return res.status(404).json({ message: 'Banner not found' })
    res.json({ message: 'Banner deleted' })
  } catch (err) { next(err) }
})

// PUT /api/banners/reorder/bulk — admin, bulk reorder
router.put('/reorder/bulk', protect, adminOnly, async (req, res, next) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items array is required' })
    }
    const ops = items.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder } },
      },
    }))
    await Banner.bulkWrite(ops)
    res.json({ message: 'Reorder saved' })
  } catch (err) { next(err) }
})

export default router
