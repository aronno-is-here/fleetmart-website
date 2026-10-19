import { Router } from 'express'
import Coupon from '../models/Coupon.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { evaluateCoupon, normalizeCouponCode } from '../services/pricing.js'

const router = Router()

// POST /api/coupons/validate — public (apply coupon)
router.post('/validate', async (req, res, next) => {
  try {
    const normalizedCode = normalizeCouponCode(req.body?.code)
    const rawSubtotal = req.body?.subtotal
    const subtotal = Number(rawSubtotal)

    if (!normalizedCode) {
      return res.status(400).json({ message: 'Coupon code is required' })
    }
    if (rawSubtotal === undefined || rawSubtotal === null || rawSubtotal === '' || !Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({ message: 'Valid subtotal is required' })
    }

    const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true })
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' })

    const result = evaluateCoupon(coupon, subtotal)
    if (!result.ok) {
      return res.status(400).json({ message: result.message })
    }

    res.json({
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        discount: result.discount,
      },
    })
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
