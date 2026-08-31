import { Router } from 'express'
import Coupon from '../models/Coupon.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// POST /api/coupons/validate — public (apply coupon)
router.post('/validate', async (req, res, next) => {
  try {
    const { code, subtotal } = req.body
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true })
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' })
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Coupon expired' })
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: 'Coupon usage limit reached' })
    }
    if (subtotal < coupon.minOrder) {
      return res.status(400).json({ message: `Minimum order ৳${coupon.minOrder} required` })
    }

    const discount = coupon.discountType === 'percent'
      ? Math.round(subtotal * coupon.value / 100)
      : coupon.value

    res.json({ coupon: { code: coupon.code, discountType: coupon.discountType, value: coupon.value, discount } })
  } catch (err) { next(err) }
})

// GET /api/coupons — admin
router.get('/', protect, adminOnly, async (_req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json({ coupons })
  } catch (err) { next(err) }
})

// POST /api/coupons — admin
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body)
    res.status(201).json({ coupon })
  } catch (err) { next(err) }
})

// PUT /api/coupons/:id — admin
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' })
    res.json({ coupon })
  } catch (err) { next(err) }
})

// DELETE /api/coupons/:id — admin
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id)
    res.json({ message: 'Coupon deleted' })
  } catch (err) { next(err) }
})

export default router
