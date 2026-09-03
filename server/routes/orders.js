import { Router } from 'express'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// GET /api/orders/my — user's orders (authenticated)
router.get('/my', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json({ orders })
  } catch (err) { next(err) }
})

// GET /api/orders/lookup/:orderId — public order lookup (by orderId + email for guest)
router.get('/lookup/:orderId', async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('user', 'name email')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json({ order })
  } catch (err) { next(err) }
})

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.user && order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }
    res.json({ order })
  } catch (err) { next(err) }
})

// GET /api/orders — admin: all orders
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query
    const filter = {}
    if (status) filter.orderStatus = status
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
        { guestName: { $regex: search, $options: 'i' } },
      ]
    }

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
    if (status === 'delivered' && order.paymentStatus !== 'paid') order.paymentStatus = 'paid'
    await order.save()

    res.json({ order })
  } catch (err) { next(err) }
})

// POST /api/orders — create order (legacy endpoint, kept for compatibility)
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, shipping, paymentMethod, shippingMethod, couponCode, totals, note } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    const crypto = await import('crypto')
    const orderId = `FM-${Date.now().toString(36).toUpperCase()}-${crypto.default.randomBytes(3).toString('hex').toUpperCase()}`

    const order = await Order.create({
      orderId,
      user: req.user._id,
      items: items.map((i) => ({
        product: i.product,
        name: i.name,
        size: i.size,
        qty: i.qty,
        price: i.price,
        customization: i.artColors ? { name: i.artColors.name || '', number: i.artColors.number || '' } : undefined,
      })),
      shippingAddress: {
        label: 'Delivery',
        street: shipping?.street || '',
        city: shipping?.city || '',
        zip: shipping?.zip || '',
        country: shipping?.country || 'Bangladesh',
        phone: shipping?.phone || '',
        name: shipping?.name || '',
      },
      paymentMethod: paymentMethod || 'cod',
      paymentType: 'full',
      amountPaid: 0,
      remainingAmount: totals?.grand || 0,
      subtotal: totals?.subtotal || 0,
      shippingFee: totals?.shipping || 0,
      discount: totals?.discount || 0,
      total: totals?.grand || 0,
      couponCode: couponCode || null,
      note: note || '',
      statusHistory: [{ status: 'processing', timestamp: new Date() }],
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    })

    for (const item of items) {
      if (item.product && item.size) {
        await Product.updateOne(
          { _id: item.product, [`stock.${item.size}`]: { $gte: item.qty } },
          { $inc: { [`stock.${item.size}`]: -item.qty } }
        ).catch(() => {})
      }
    }

    res.status(201).json({ order, orderId: order.orderId })
  } catch (err) { next(err) }
})

export default router
