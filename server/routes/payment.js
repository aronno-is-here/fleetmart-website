import { Router } from 'express'
import crypto from 'crypto'
import axios from 'axios'
import Order from '../models/Order.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import Product from '../models/Product.js'
import { protect, optionalAuth, adminOnly } from '../middleware/auth.js'
import { sendEmail, buildOrderReceiptEmail } from '../services/email.js'

const router = Router()

const UDDOKTAPAY_API_KEY = process.env.UDDOKTAPAY_API_KEY || ''
const UDDOKTAPAY_BASE_URL = process.env.UDDOKTAPAY_BASE_URL || 'https://sandbox.uddoktapay.com'
const SITE_URL = process.env.SITE_URL || 'https://fleetmartbd.vercel.app'

const isUddoktaPayConfigured = () => Boolean(UDDOKTAPAY_API_KEY)

const uddoktapayRequest = async (endpoint, body) => {
  const response = await axios.post(`${UDDOKTAPAY_BASE_URL}${endpoint}`, body, {
    headers: {
      'RT-UDDOKTAPAY-API-KEY': UDDOKTAPAY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000,
  })
  return response.data
}

const generateOrderId = () => `FM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
const generateAttemptId = () => `PA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

// ── Shared: server-side amount recalculation ──
const recalculateAmounts = async (items, couponCode) => {
  const productIds = items.map(i => i.product)
  const dbProducts = await Product.find({ _id: { $in: productIds } })
  const productMap = Object.fromEntries(dbProducts.map(p => [p._id.toString(), p]))

  let subtotal = 0
  const validatedItems = items.map(i => {
    const dbProduct = productMap[i.product]
    const price = dbProduct ? dbProduct.price : i.price
    const qty = Math.max(1, Math.floor(Number(i.qty) || 1))
    subtotal += price * qty
    return { ...i, price, qty }
  })

  const shippingFee = subtotal >= 3000 ? 0 : 80
  let discount = 0
  if (couponCode) {
    const Coupon = (await import('../models/Coupon.js')).default
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true })
    if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (coupon.maxUses <= 0 || coupon.usedCount < coupon.maxUses) && subtotal >= coupon.minOrder) {
      discount = coupon.discountType === 'percent' ? Math.round(subtotal * coupon.value / 100) : Math.min(coupon.value, subtotal)
      await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } })
    }
  }
  const grand = Math.max(0, subtotal + shippingFee - discount)
  return { validatedItems, subtotal, shippingFee, discount, grand }
}

// POST /api/payment/initiate — create payment attempt + redirect to UddoktaPay
router.post('/initiate', optionalAuth, async (req, res, next) => {
  try {
    const { items, shipping, paymentType, couponCode, note, guestInfo } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    const user = req.user || null
    const guestEmail = !user ? guestInfo?.email : null
    const guestName = !user ? guestInfo?.name : null

    if (!user && !guestEmail) {
      return res.status(400).json({ message: 'Email is required for guest checkout' })
    }

    // ── Server-side amount recalculation (never trust client totals) ──
    const { validatedItems, subtotal, shippingFee, discount, grand } = await recalculateAmounts(items, couponCode)
    const amountToPay = paymentType === 'partial' ? Math.min(300, grand) : grand
    const attemptId = generateAttemptId()

    const attempt = await PaymentAttempt.create({
      attemptId,
      user: user?._id || null,
      guestEmail,
      items: validatedItems.map(i => ({
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
        phone: shipping?.phone || guestInfo?.phone || '',
        street: shipping?.street || '',
        city: shipping?.city || '',
        zip: shipping?.zip || '',
        country: shipping?.country || 'Bangladesh',
      },
      paymentMethod: 'uddoktapay',
      paymentType: paymentType || 'full',
      subtotal,
      shippingFee,
      discount,
      total: grand,
      amountToPay,
      couponCode: couponCode || null,
      note: note || '',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    if (!isUddoktaPayConfigured()) {
      return res.status(503).json({
        message: 'Payment gateway is not configured. Please use Cash on Delivery.',
        attemptId,
        amountToPay,
      })
    }

    const customerName = shipping?.name || guestName || user?.name || 'Customer'
    const customerEmail = guestEmail || user?.email || ''

    try {
      const uddoktaResponse = await uddoktapayRequest('/api/checkout-v2', {
        full_name: customerName,
        email: customerEmail,
        amount: String(amountToPay),
        metadata: { attemptId },
        redirect_url: `${SITE_URL}/api/payment/success`,
        return_type: 'POST',
        cancel_url: `${SITE_URL}/api/payment/cancel`,
        webhook_url: `${SITE_URL}/api/payment/ipn`,
      })

      if (uddoktaResponse.status && uddoktaResponse.payment_url) {
        attempt.invoiceId = null // will be set on success callback
        attempt.uddoktapayPayload = uddoktaResponse
        await attempt.save()
        return res.json({
          gatewayUrl: uddoktaResponse.payment_url,
          attemptId,
        })
      } else {
        attempt.status = 'failed'
        await attempt.save()
        return res.status(500).json({ message: uddoktaResponse.message || 'Failed to connect to payment gateway', attemptId })
      }
    } catch (gatewayErr) {
      attempt.status = 'failed'
      await attempt.save()
      const msg = gatewayErr.response?.data?.message || 'Payment gateway error. Please try again.'
      return res.status(500).json({ message: msg, attemptId })
    }
  } catch (err) { next(err) }
})

// POST /api/payment/success — UddoktaPay success callback (receives invoice_id via POST)
router.post('/success', async (req, res, next) => {
  try {
    const { invoice_id } = req.body

    if (!invoice_id) {
      return res.redirect(`${SITE_URL}/checkout?payment=error`)
    }

    if (!isUddoktaPayConfigured()) {
      return res.redirect(`${SITE_URL}/checkout?payment=error`)
    }

    // ── Verify payment with UddoktaPay ──
    let verification
    try {
      verification = await uddoktapayRequest('/api/verify-payment', { invoice_id })
    } catch {
      return res.redirect(`${SITE_URL}/checkout?payment=error`)
    }

    if (verification.status !== 'COMPLETED') {
      return res.redirect(`${SITE_URL}/checkout?payment=failed`)
    }

    // ── Find the payment attempt by attemptId from metadata ──
    const metadata = typeof verification.metadata === 'string' ? JSON.parse(verification.metadata) : verification.metadata
    const attemptId = metadata?.attemptId

    if (!attemptId) {
      return res.redirect(`${SITE_URL}/checkout?payment=error`)
    }

    const attempt = await PaymentAttempt.findOne({ attemptId, status: { $in: ['pending', 'processing'] } })
    if (!attempt) {
      // Check if already processed (idempotent)
      const existing = await PaymentAttempt.findOne({ attemptId, status: 'completed' })
      if (existing?.orderId) {
        return res.redirect(`${SITE_URL}/order/success?orderId=${existing.orderId}`)
      }
      return res.redirect(`${SITE_URL}/checkout?payment=expired`)
    }

    if (new Date() > attempt.expiresAt) {
      attempt.status = 'expired'
      await attempt.save()
      return res.redirect(`${SITE_URL}/checkout?payment=expired`)
    }

    // ── Verify amount matches (prevent tampering) ──
    const verifiedAmount = parseFloat(verification.amount)
    if (Math.abs(verifiedAmount - attempt.amountToPay) > 0.01) {
      attempt.status = 'failed'
      await attempt.save()
      return res.redirect(`${SITE_URL}/checkout?payment=failed`)
    }

    // ── Mark attempt as completed ──
    attempt.status = 'completed'
    attempt.invoiceId = invoice_id
    attempt.completedAt = new Date()
    await attempt.save()

    // ── Create Order ──
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
      paymentMethod: 'uddoktapay',
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
      transactionId: verification.transaction_id || invoice_id,
      paymentAttemptId: attempt.attemptId,
      paymentVerifiedAt: new Date(),
      statusHistory: [
        { status: 'pending', timestamp: new Date() },
        { status: 'confirmed', timestamp: new Date() },
      ],
    })

    // ── Atomic stock deduction ──
    const stockIssues = []
    for (const item of attempt.items) {
      if (item.product && item.size) {
        const result = await Product.updateOne(
          { _id: item.product, [`stock.${item.size}`]: { $gte: item.qty } },
          { $inc: { [`stock.${item.size}`]: -item.qty } }
        ).catch((err) => {
          console.error(`[STOCK] Deduction failed | Product: ${item.product} | Size: ${item.size} | Error: ${err.message}`)
          return { modifiedCount: 0 }
        })
        if (result.modifiedCount === 0) {
          console.warn(`[STOCK] Insufficient stock or not found | Product: ${item.product} | Size: ${item.size} | Qty: ${item.qty}`)
          stockIssues.push(`${item.name} (${item.size})`)
        }
      }
    }

    // Flag order if stock deduction failed — admin must reconcile
    if (stockIssues.length > 0) {
      const stockNote = `STOCK ISSUE: Failed to deduct stock for: ${stockIssues.join(', ')}. Manual reconciliation required.`
      order.note = order.note ? `${order.note}\n${stockNote}` : stockNote
      order.statusHistory.push({ status: order.orderStatus, timestamp: new Date(), note: stockNote })
      await order.save()
    }

    attempt.orderId = orderId
    await attempt.save()

    // ── Send receipt email ──
    const receiptHtml = buildOrderReceiptEmail(order)
    const recipientEmail = order.user?.email || order.guestEmail
    if (recipientEmail) {
      sendEmail(recipientEmail, `FleetMart Order Confirmation — #${orderId}`, receiptHtml)
        .catch((err) => console.error(`[EMAIL] Receipt failed | Order: ${orderId} | Error: ${err.message}`))
    }

    res.redirect(`${SITE_URL}/order/success?orderId=${orderId}`)
  } catch (err) { next(err) }
})

// POST /api/payment/cancel — UddoktaPay cancel callback
router.post('/cancel', async (req, res) => {
  try {
    const { invoice_id } = req.body
    if (invoice_id) {
      // Try to find attempt by invoice_id and mark cancelled
      const attempt = await PaymentAttempt.findOne({ invoiceId: invoice_id })
      if (attempt) {
        attempt.status = 'cancelled'
        await attempt.save()
      }
    }
  } catch { /* best effort */ }
  res.redirect(`${SITE_URL}/checkout?payment=cancelled`)
})

// POST /api/payment/ipn — Instant Payment Notification (webhook from UddoktaPay)
router.post('/ipn', async (req, res) => {
  try {
    if (!isUddoktaPayConfigured()) {
      return res.status(400).json({ message: 'Payment gateway not configured' })
    }

    // ── FIX 2: Timing-safe API key validation ──
    const incomingKey = req.headers['rt-uddoktapay-api-key'] || ''
    if (!incomingKey || incomingKey.length !== UDDOKTAPAY_API_KEY.length) {
      return res.status(403).json({ message: 'Invalid API key' })
    }
    const keyBuffer = Buffer.from(incomingKey, 'utf8')
    const expectedBuffer = Buffer.from(UDDOKTAPAY_API_KEY, 'utf8')
    if (!crypto.timingSafeEqual(keyBuffer, expectedBuffer)) {
      return res.status(403).json({ message: 'Invalid API key' })
    }

    // ── FIX 3: Read full webhook payload ──
    const {
      invoice_id,
      full_name,
      email,
      amount,
      fee,
      charged_amount,
      payment_method,
      sender_number,
      transaction_id,
      date,
      status: webhookStatus,
      metadata: webhookMetadata,
    } = req.body

    if (!invoice_id) {
      return res.status(400).json({ message: 'Invalid request' })
    }

    // ── Server-side verification remains authoritative ──
    const verification = await uddoktapayRequest('/api/verify-payment', { invoice_id })

    if (verification.status === 'COMPLETED') {
      const metadata = typeof verification.metadata === 'string' ? JSON.parse(verification.metadata) : verification.metadata
      const attemptId = metadata?.attemptId

      if (attemptId) {
        const attempt = await PaymentAttempt.findOne({ attemptId })
        if (attempt?.orderId) {
          return res.json({ message: 'Already processed' })
        }

        // Log webhook data for audit trail (no sensitive data)
        console.log(`[IPN] Verified payment | Invoice: ${invoice_id} | Amount: ${amount} | Method: ${payment_method} | Txn: ${transaction_id}`)
      }
    }

    res.json({ message: 'IPN received' })
  } catch {
    res.status(500).json({ message: 'IPN processing failed' })
  }
})

// GET /api/payment/status/:attemptId — check payment status (owner/admin/guest only)
router.get('/status/:attemptId', optionalAuth, async (req, res, next) => {
  try {
    const attempt = await PaymentAttempt.findOne({ attemptId: req.params.attemptId })
    if (!attempt) return res.status(404).json({ message: 'Payment attempt not found' })

    const isOwner = req.user && attempt.user?.toString() === req.user._id.toString()
    const isAdmin = req.user?.role === 'admin'
    const isGuest = !req.user && attempt.guestEmail && req.query.email === attempt.guestEmail
    if (!isOwner && !isAdmin && !isGuest) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({
      status: attempt.status,
      orderId: attempt.orderId,
      amountToPay: attempt.amountToPay,
      total: attempt.total,
      expiresAt: attempt.expiresAt,
    })
  } catch (err) { next(err) }
})

// POST /api/payment/cod — create order for COD (no gateway)
router.post('/cod', optionalAuth, async (req, res, next) => {
  try {
    const { items, shipping, paymentType, couponCode, note, guestInfo } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    const user = req.user || null
    const guestEmail = !user ? guestInfo?.email : null

    if (!user && !guestEmail) {
      return res.status(400).json({ message: 'Email is required for guest checkout' })
    }

    // ── Server-side amount recalculation ──
    const { validatedItems, subtotal, shippingFee, discount, grand } = await recalculateAmounts(items, couponCode)
    const orderId = generateOrderId()
    const amountPaid = paymentType === 'partial' ? Math.min(300, grand) : 0
    const remainingAmount = grand - amountPaid

    const order = await Order.create({
      orderId,
      user: user?._id || null,
      guestEmail,
      guestName: shipping?.name || guestInfo?.name || null,
      guestPhone: shipping?.phone || guestInfo?.phone || null,
      items: validatedItems.map(i => ({
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
      subtotal,
      shippingFee,
      discount,
      total: grand,
      couponCode: couponCode || null,
      note: note || '',
      statusHistory: [{ status: 'processing', timestamp: new Date() }],
    })

    // ── Atomic stock deduction with validation ──
    const stockErrors = []
    for (const item of validatedItems) {
      if (item.product && item.size) {
        const result = await Product.updateOne(
          { _id: item.product, [`stock.${item.size}`]: { $gte: item.qty } },
          { $inc: { [`stock.${item.size}`]: -item.qty } }
        )
        if (result.modifiedCount === 0) {
          stockErrors.push(item.name)
        }
      }
    }
    if (stockErrors.length > 0) {
      await Order.findByIdAndDelete(order._id)
      return res.status(400).json({ message: `Insufficient stock for: ${stockErrors.join(', ')}` })
    }

    const receiptHtml = buildOrderReceiptEmail(order)
    const recipientEmail = order.user?.email || order.guestEmail
    if (recipientEmail) {
      sendEmail(recipientEmail, `FleetMart Order Confirmation — #${order.orderId}`, receiptHtml)
        .catch((err) => console.error(`[EMAIL] Receipt failed | Order: ${order.orderId} | Error: ${err.message}`))
    }

    res.status(201).json({ order, orderId: order.orderId })
  } catch (err) { next(err) }
})

export default router
