import { Router } from 'express'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { sendEmail } from '../services/email.js'
import { escapeRegex } from '../utils/sanitize.js'

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
      const safe = escapeRegex(search)
      filter.$or = [
        { orderId: { $regex: safe, $options: 'i' } },
        { guestEmail: { $regex: safe, $options: 'i' } },
        { guestName: { $regex: safe, $options: 'i' } },
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
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) return res.status(404).json({ message: 'Order not found' })

    order.orderStatus = status
    order.statusHistory.push({ status, timestamp: new Date(), note })
    if (status === 'delivered' && order.paymentStatus !== 'paid') order.paymentStatus = 'paid'
    await order.save()

    const recipientEmail = order.user?.email || order.guestEmail
    if (recipientEmail) {
      const customerName = order.user?.name || order.guestName || 'Customer'
      const statusLabels = {
        confirmed: 'Your order has been confirmed',
        shipped: 'Your order has been shipped',
        out_for_delivery: 'Your order is out for delivery',
        delivered: 'Your order has been delivered',
        cancelled: 'Your order has been cancelled',
        returned: 'Your order has been returned',
      }
      const subject = `FleetMart — Order #${order.orderId} ${statusLabels[status] ? '— ' + statusLabels[status] : ''}`
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',system-ui,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:32px 20px;"><div style="text-align:center;margin-bottom:24px;"><div style="display:inline-block;background:#ccff00;color:#0a0a0a;font-size:18px;font-weight:900;letter-spacing:3px;padding:6px 14px;">FLEETMART</div></div><div style="background:#111;border:1px solid #222;padding:32px;text-align:center;"><h1 style="margin:0 0 12px;color:#fff;font-size:20px;text-transform:uppercase;letter-spacing:2px;">Order Update</h1><p style="margin:0 0 8px;color:#999;font-size:14px;">Hi ${customerName},</p><p style="margin:0 0 16px;color:#ccc;font-size:16px;">${statusLabels[status] || `Your order status has been updated to ${status}`}</p><p style="margin:0;color:#ccff00;font-size:14px;font-weight:700;">#${order.orderId}</p>${note ? `<p style="margin:12px 0 0;color:#999;font-size:13px;">Note: ${note}</p>` : ''}</div><div style="text-align:center;padding:20px 0;"><p style="margin:0;color:#666;font-size:11px;">© ${new Date().getFullYear()} FleetMart</p></div></div></body></html>`
      sendEmail(recipientEmail, subject, html)
        .catch((err) => console.error(`[EMAIL] Status notification failed | Order: ${order.orderId} | Status: ${status} | Error: ${err.message}`))
    }

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
