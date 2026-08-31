import { Router } from 'express'
import Order from '../models/Order.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// POST /api/orders — create order (auth)
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, subtotal, shippingFee, discount, total, couponCode, note } = req.body
    const orderId = `#FM-${Date.now().toString(36).toUpperCase()}`

    const order = await Order.create({
      orderId,
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total,
      couponCode,
      note,
      statusHistory: [{ status: 'processing', timestamp: new Date() }],
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    })

    res.status(201).json({ order })
  } catch (err) { next(err) }
})

// GET /api/orders/my — user's orders
router.get('/my', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json({ orders })
  } catch (err) { next(err) }
})

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json({ order })
  } catch (err) { next(err) }
})

// GET /api/orders — admin: all orders
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = {}
    if (status) filter.orderStatus = status

    const skip = (Number(page) - 1) * Number(limit)
    const [orders, total] = await Promise.all([
      Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ])

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (err) { next(err) }
})

// PUT /api/orders/:id/status — admin
router.put('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, note } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    order.orderStatus = status
    order.statusHistory.push({ status, timestamp: new Date(), note })
    if (status === 'delivered') order.paymentStatus = 'paid'
    await order.save()

    res.json({ order })
  } catch (err) { next(err) }
})

export default router
