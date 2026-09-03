import { Router } from 'express'
import crypto from 'crypto'
import SSLCommerzPayment from 'sslcommerz-lts'
import Order from '../models/Order.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

const getSSLCommerz = () => {
  if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
    return null
  }
  return new SSLCommerzPayment(
    process.env.SSLCOMMERZ_STORE_ID,
    process.env.SSLCOMMERZ_STORE_PASSWORD,
    process.env.SSLCOMMERZ_IS_SANDBOX === 'true'
  )
}

const generateOrderId = () => `FM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
const generateAttemptId = () => `PA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

// POST /api/payment/initiate — create payment attempt + redirect to gateway
router.post('/initiate', async (req, res, next) => {
  try {
    const { items, shipping, paymentMethod, paymentType, shippingMethod, couponCode, totals, note, guestInfo } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    const user = req.user || null
    const guestEmail = !user ? guestInfo?.email : null
    const guestName = !user ? guestInfo?.name : null
    const guestPhone = !user ? guestInfo?.phone : null

    if (!user && !guestEmail) {
      return res.status(400).json({ message: 'Email is required for guest checkout' })
    }

    const amountToPay = paymentType === 'partial' ? 300 : (totals?.grand || 0)
    const attemptId = generateAttemptId()

    const attempt = await PaymentAttempt.create({
      attemptId,
      user: user?._id || null,
      guestEmail,
      items: items.map(i => ({
        product: i.product,
        name: i.name,
        size: i.size,
        qty: i.qty,
        price: i.price,
        customization: i.artColors,
      })),
      shippingAddress: {
        label: 'Delivery',
        name: shipping?.name || guestName || '',
        phone: shipping?.phone || guestPhone || '',
        street: shipping?.street || '',
        city: shipping?.city || '',
        zip: shipping?.zip || '',
        country: shipping?.country || 'Bangladesh',
      },
      paymentMethod: paymentMethod || 'sslcommerz',
      paymentType: paymentType || 'full',
      subtotal: totals?.subtotal || 0,
      shippingFee: totals?.shipping || 0,
      discount: totals?.discount || 0,
      total: totals?.grand || 0,
      amountToPay,
      couponCode: couponCode || null,
      note: note || '',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    const sslcz = getSSLCommerz()
    if (!sslcz) {
      return res.status(503).json({
        message: 'Payment gateway is not configured. Please use Cash on Delivery.',
        attemptId,
        amountToPay,
      })
    }

    const tranId = `FM_${attemptId}_${Date.now()}`

    const data = {
      total_amount: amountToPay,
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${req.headers.origin || 'https://fleetmartbd.vercel.app'}/api/payment/success`,
      fail_url: `${req.headers.origin || 'https://fleetmartbd.vercel.app'}/api/payment/fail`,
      cancel_url: `${req.headers.origin || 'https://fleetmartbd.vercel.app'}/api/payment/cancel`,
      ipn_url: `${req.headers.origin || 'https://fleetmartbd.vercel.app'}/api/payment/ipn`,
      shipping_method: 'Courier',
      product_name: items.map(i => i.name).join(', '),
      product_category: 'E-Commerce',
      product_profile: 'general',
      cus_name: shipping?.name || guestName || user?.name || 'Customer',
      cus_email: guestEmail || user?.email || '',
      cus_add1: shipping?.street || '',
      cus_city: shipping?.city || '',
      cus_postcode: shipping?.zip || '',
      cus_country: 'Bangladesh',
      cus_phone: shipping?.phone || guestPhone || '',
    }

    try {
      const sslResponse = await sslcz.init(data)
      if (sslResponse?.GatewayPageURL) {
        attempt.transactionId = tranId
        attempt.sslCommerzPayload = sslResponse
        await attempt.save()
        return res.json({
          gatewayUrl: sslResponse.GatewayPageURL,
          attemptId,
          tranId,
        })
      } else {
        return res.status(500).json({ message: 'Failed to connect to payment gateway', attemptId })
      }
    } catch (gatewayErr) {
      attempt.status = 'failed'
      await attempt.save()
      return res.status(500).json({ message: 'Payment gateway error. Please try again.', attemptId })
    }
  } catch (err) { next(err) }
})

// POST /api/payment/success — SSLCommerz success callback
router.post('/success', async (req, res, next) => {
  try {
    const { tran_id, val_id } = req.body

    const sslcz = getSSLCommerz()
    if (!sslcz) {
      return res.redirect('/checkout?payment=error')
    }

    let validation
    try {
      validation = await sslcz.validate({ tran_id, val_id })
    } catch {
      return res.redirect('/checkout?payment=error')
    }

    if (validation.status !== 'VALID') {
      return res.redirect('/checkout?payment=failed')
    }

    const attempt = await PaymentAttempt.findOne({ transactionId: tran_id, status: { $in: ['pending', 'processing'] } })
    if (!attempt) {
      return res.redirect('/checkout?payment=expired')
    }

    if (new Date() > attempt.expiresAt) {
      attempt.status = 'expired'
      await attempt.save()
      return res.redirect('/checkout?payment=expired')
    }

    const alreadyProcessed = await PaymentAttempt.findOne({ transactionId: tran_id, status: 'completed' })
    if (alreadyProcessed) {
      return res.redirect(`/order/success?orderId=${alreadyProcessed.orderId}`)
    }

    attempt.status = 'completed'
    attempt.transactionId = tran_id
    attempt.completedAt = new Date()
    await attempt.save()

    const orderId = generateOrderId()
    const amountPaid = attempt.amountToPay
    const remainingAmount = attempt.paymentType === 'partial' ? attempt.total - amountPaid : 0

    const order = await Order.create({
      orderId,
      user: attempt.user || null,
      guestEmail: attempt.guestEmail || null,
      guestName: attempt.shippingAddress?.name || null,
      guestPhone: attempt.shippingAddress?.phone || null,
      items: attempt.items,
      shippingAddress: attempt.shippingAddress,
      paymentMethod: attempt.paymentMethod,
      paymentType: attempt.paymentType,
      amountPaid,
      remainingAmount,
      paymentStatus: attempt.paymentType === 'partial' ? 'partial' : 'paid',
      orderStatus: 'confirmed',
      subtotal: attempt.subtotal,
      shippingFee: attempt.shippingFee,
      discount: attempt.discount,
      total: attempt.total,
      couponCode: attempt.couponCode,
      note: attempt.note,
      transactionId: tran_id,
      paymentAttemptId: attempt.attemptId,
      paymentVerifiedAt: new Date(),
      statusHistory: [
        { status: 'pending', timestamp: new Date() },
        { status: 'confirmed', timestamp: new Date() },
      ],
    })

    for (const item of attempt.items) {
      if (item.product && item.size) {
        await Product.updateOne(
          { _id: item.product, [`stock.${item.size}`]: { $gte: item.qty } },
          { $inc: { [`stock.${item.size}`]: -item.qty } }
        ).catch(() => {})
      }
    }

    attempt.orderId = orderId
    await attempt.save()

    res.redirect(`https://fleetmartbd.vercel.app/order/success?orderId=${orderId}`)
  } catch (err) { next(err) }
})

// POST /api/payment/fail
router.post('/fail', async (req, res) => {
  const { tran_id } = req.body
  if (tran_id) {
    await PaymentAttempt.findOneAndUpdate({ transactionId: tran_id }, { status: 'failed' })
  }
  res.redirect('https://fleetmartbd.vercel.app/checkout?payment=failed')
})

// POST /api/payment/cancel
router.post('/cancel', async (req, res) => {
  const { tran_id } = req.body
  if (tran_id) {
    await PaymentAttempt.findOneAndUpdate({ transactionId: tran_id }, { status: 'cancelled' })
  }
  res.redirect('https://fleetmartbd.vercel.app/checkout?payment=cancelled')
})

// POST /api/payment/ipn — Instant Payment Notification
router.post('/ipn', async (req, res) => {
  try {
    const { tran_id, status } = req.body
    const sslcz = getSSLCommerz()
    if (!sslcz) return res.status(503).json({ message: 'Not configured' })

    const validation = await sslcz.validate({ tran_id, val_id: req.body.val_id })
    if (validation.status === 'VALID') {
      const attempt = await PaymentAttempt.findOne({ transactionId: tran_id, status: 'completed' })
      if (attempt?.orderId) {
        res.json({ message: 'Already processed' })
      } else {
        res.json({ message: 'IPN received' })
      }
    } else {
      res.status(400).json({ message: 'Invalid payment' })
    }
  } catch {
    res.status(500).json({ message: 'IPN processing failed' })
  }
})

// GET /api/payment/status/:attemptId — check payment status
router.get('/status/:attemptId', async (req, res, next) => {
  try {
    const attempt = await PaymentAttempt.findOne({ attemptId: req.params.attemptId })
    if (!attempt) return res.status(404).json({ message: 'Payment attempt not found' })

    res.json({
      status: attempt.status,
      orderId: attempt.orderId,
      amountToPay: attempt.amountToPay,
      total: attempt.total,
      expiresAt: attempt.expiresAt,
    })
  } catch (err) { next(err) }
})

// GET /api/payment/cod — create order for COD (no gateway)
router.post('/cod', async (req, res, next) => {
  try {
    const { items, shipping, paymentType, shippingMethod, couponCode, totals, note, guestInfo } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    const user = req.user || null
    const guestEmail = !user ? guestInfo?.email : null

    if (!user && !guestEmail) {
      return res.status(400).json({ message: 'Email is required for guest checkout' })
    }

    const orderId = generateOrderId()
    const amountPaid = paymentType === 'partial' ? 300 : 0
    const remainingAmount = paymentType === 'partial' ? (totals?.grand || 0) - 300 : (totals?.grand || 0)

    const order = await Order.create({
      orderId,
      user: user?._id || null,
      guestEmail,
      guestName: shipping?.name || guestInfo?.name || null,
      guestPhone: shipping?.phone || guestInfo?.phone || null,
      items: items.map(i => ({
        product: i.product,
        name: i.name,
        size: i.size,
        qty: i.qty,
        price: i.price,
        customization: i.artColors,
      })),
      shippingAddress: {
        label: 'Delivery',
        name: shipping?.name || guestInfo?.name || '',
        phone: shipping?.phone || guestInfo?.phone || '',
        street: shipping?.street || '',
        city: shipping?.city || '',
        zip: shipping?.zip || '',
        country: shipping?.country || 'Bangladesh',
      },
      paymentMethod: 'cod',
      paymentType: paymentType || 'full',
      amountPaid: 0,
      remainingAmount,
      paymentStatus: 'pending',
      orderStatus: 'processing',
      subtotal: totals?.subtotal || 0,
      shippingFee: totals?.shipping || 0,
      discount: totals?.discount || 0,
      total: totals?.grand || 0,
      couponCode: couponCode || null,
      note: note || '',
      statusHistory: [{ status: 'processing', timestamp: new Date() }],
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
