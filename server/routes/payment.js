import { Router } from 'express'
import crypto from 'crypto'
import Order from '../models/Order.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import { protect, optionalAuth, adminOnly } from '../middleware/auth.js'
import { priceOrder } from '../services/orderPricing.js'
import { PricingError } from '../services/pricing.js'
import { processRefund } from '../services/refund.js'
import { processInvoice } from '../services/paymentFulfillment.js'
import {
  isUddoktaPayConfigured,
  isValidWebhookKey,
  uddoktapayRequest,
} from '../services/uddoktapay.js'

const router = Router()

const SITE_URL = process.env.SITE_URL || 'https://fleetmartbd.vercel.app'

const generateAttemptId = () => `PA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

// POST /api/payment/initiate — create payment attempt + redirect to UddoktaPay
router.post('/initiate', optionalAuth, async (req, res, next) => {
  try {
    const { items, shipping, paymentType, couponCode, note, guestInfo } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    const user = req.user || null
    const guestEmail = !user ? guestInfo?.email : null
    const guestName = !user ? guestInfo?.name : null

    if (!user && !guestEmail) {
      return res.status(400).json({ message: 'Email is required for guest checkout' })
    }

    if (!paymentType || !['partial', 'full'].includes(paymentType)) {
      return res.status(400).json({ message: 'Invalid payment type. Choose partial or full.' })
    }

    const pricing = await priceOrder({ items, couponCode, paymentType })
    const {
      validatedItems,
      subtotal,
      shippingFee,
      discount,
      total,
      amountToPay,
      couponId,
      couponCode: appliedCouponCode,
    } = pricing

    const attemptId = generateAttemptId()
    const customerName = shipping?.name || guestName || user?.name || 'Customer'
    const customerEmail = guestEmail || user?.email || ''

    const attempt = await PaymentAttempt.create({
      attemptId,
      user: user?._id || null,
      guestEmail,
      customerEmail,
      items: validatedItems,
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
      total,
      amountToPay,
      couponCode: appliedCouponCode,
      couponId,
      note: note || '',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    if (!isUddoktaPayConfigured()) {
      return res.status(503).json({
        message: 'Payment gateway is not configured. Please try again later.',
        attemptId,
        amountToPay,
      })
    }

    try {
      const uddoktaResponse = await uddoktapayRequest('/checkout-v2', {
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
  } catch (err) {
    if (err instanceof PricingError) {
      return res.status(err.status).json({ message: err.message })
    }
    next(err)
  }
})

const attemptQuery = (attemptId) => (attemptId ? `&attemptId=${encodeURIComponent(attemptId)}` : '')

const redirectPaymentResult = (res, result = {}) => {
  if ((result.status === 'completed' || result.status === 'already_completed') && result.orderId) {
    return res.redirect(`${SITE_URL}/order/success?orderId=${encodeURIComponent(result.orderId)}`)
  }

  if (result.status === 'pending') {
    return res.redirect(`${SITE_URL}/checkout?payment=pending${attemptQuery(result.attemptId)}`)
  }

  return res.redirect(`${SITE_URL}/checkout?payment=failed${attemptQuery(result.attemptId)}`)
}

// POST /api/payment/success — UddoktaPay success callback (receives invoice_id via POST)
router.post('/success', async (req, res, next) => {
  try {
    const { invoice_id } = req.body || {}

    if (!invoice_id) {
      return res.redirect(`${SITE_URL}/checkout?payment=error`)
    }

    if (!isUddoktaPayConfigured()) {
      return res.redirect(`${SITE_URL}/checkout?payment=error`)
    }

    let result
    try {
      result = await processInvoice(invoice_id)
    } catch {
      const attempt = await PaymentAttempt.findOne({ invoiceId: invoice_id }).catch(() => null)
      return res.redirect(`${SITE_URL}/checkout?payment=pending${attemptQuery(attempt?.attemptId)}`)
    }

    return redirectPaymentResult(res, result)
  } catch (err) { next(err) }
})

// POST /api/payment/cancel — UddoktaPay cancel callback
router.post('/cancel', async (req, res) => {
  try {
    const { invoice_id, metadata } = req.body || {}
    let attempt = null

    if (invoice_id) {
      attempt = await PaymentAttempt.findOne({ invoiceId: invoice_id })
    }

    if (!attempt && metadata) {
      let parsed = metadata
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed) } catch { parsed = null }
      }
      if (parsed?.attemptId) {
        attempt = await PaymentAttempt.findOne({ attemptId: parsed.attemptId })
      }
    }

    if (attempt && ['pending', 'processing'].includes(attempt.status)) {
      await PaymentAttempt.updateOne({ attemptId: attempt.attemptId, status: { $in: ['pending', 'processing'] } }, { $set: { status: 'cancelled' } })
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

    const incomingKey = req.headers['rt-uddoktapay-api-key'] || ''
    if (!isValidWebhookKey(incomingKey)) {
      return res.status(403).json({ message: 'Invalid API key' })
    }

    const { invoice_id } = req.body || {}
    if (!invoice_id) {
      return res.status(400).json({ message: 'Invalid request' })
    }

    let result
    try {
      result = await processInvoice(invoice_id)
    } catch {
      return res.status(500).json({ message: 'IPN processing failed' })
    }

    if (result.status === 'completed' || result.status === 'already_completed') {
      return res.json({ message: 'IPN processed', orderId: result.orderId })
    }

    return res.json({ message: 'IPN ignored', reason: result.code || result.status })
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
      latePayment: attempt.latePayment,
      paymentReceivedAt: attempt.paymentReceivedAt,
    })
  } catch (err) { next(err) }
})

// POST /api/payment/reconcile/:attemptId — admin retry for a verified payment whose order creation failed
router.post('/reconcile/:attemptId', protect, adminOnly, async (req, res, next) => {
  try {
    const attempt = await PaymentAttempt.findOne({ attemptId: req.params.attemptId })
    if (!attempt) return res.status(404).json({ message: 'Payment attempt not found' })

    if (!attempt.invoiceId) {
      return res.status(400).json({ message: 'Payment has not been verified yet' })
    }

    const wasCompleted = attempt.status === 'completed'

    const result = await processInvoice(attempt.invoiceId)
    if (result.status === 'completed' || result.status === 'already_completed') {
      return res.json({
        message: wasCompleted ? 'Payment already reconciled' : 'Payment reconciled',
        orderId: result.orderId,
        receipt: result.receipt,
      })
    }

    return res.status(409).json({ message: 'Reconciliation pending', status: result.status, reason: result.code })
  } catch (err) { next(err) }
})

// POST /api/payment/refund — request refund for a paid order
router.post('/refund', protect, async (req, res, next) => {
  try {
    const { orderId, reason } = req.body

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' })
    }

    const order = await Order.findOne({ orderId })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // ── Authorization: only order owner or admin can request refund ──
    const isOwner = order.user && order.user.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const result = await processRefund(order, {
      reason,
      context: 'customer',
      uddoktapayRequest,
      isConfigured: isUddoktaPayConfigured,
    })

    if (!result.ok) {
      return res.status(400).json({ message: result.message })
    }

    res.json({ message: result.message, refundAmount: result.refundAmount, orderId: order.orderId })
  } catch (err) { next(err) }
})

export default router
