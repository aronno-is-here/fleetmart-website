import crypto from 'crypto'
import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import Product from '../models/Product.js'
import { buildOrderReceiptEmail, sendEmail } from './email.js'
import { uddoktapayRequest } from './uddoktapay.js'

const STALE_FULFILLMENT_MS = 5 * 60 * 1000
const VALID_GATEWAY_METHODS = ['bkash', 'nagad', 'rocket', 'upay', 'bank']

const generateOrderId = () => `FM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

const parseMetadata = (metadata) => {
  if (!metadata) return {}
  if (typeof metadata === 'object') return metadata
  if (typeof metadata !== 'string') return {}
  try {
    const parsed = JSON.parse(metadata)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const normalizeGatewayMethod = (method) => {
  const normalized = String(method || '').toLowerCase()
  if (VALID_GATEWAY_METHODS.includes(normalized)) return normalized
  return normalized ? 'other' : null
}

const orderKey = (order) => (
  order?._id ? { _id: order._id } : { orderId: order?.orderId }
)

const verificationPatch = (invoiceId, verification, paymentReceivedAt) => ({
  invoiceId,
  paymentReceivedAt,
  verifiedAt: new Date(),
  uddoktapayPayload: verification,
})

const markNeedsReconciliation = async (attemptId, invoiceId, verification, paymentReceivedAt, err) => {
  await PaymentAttempt.updateOne(
    { attemptId, status: { $ne: 'completed' } },
    {
      $set: {
        ...verificationPatch(invoiceId, verification, paymentReceivedAt),
        status: 'paid_pending_order',
        fulfillmentStartedAt: null,
        fulfillmentError: String(err?.message || 'Order fulfillment failed').slice(0, 500),
      },
    },
  ).catch(() => {})
}

const buildOrderPayload = (attempt, verification, invoiceId, latePayment) => {
  const now = new Date()
  const amountPaid = attempt.amountToPay
  const remainingAmount = attempt.paymentType === 'partial' ? attempt.total - amountPaid : 0
  const lateNote = latePayment ? 'Payment verified after the checkout session expired; order created by reconciliation.' : ''
  const note = [attempt.note, lateNote].filter(Boolean).join('\n')

  return {
    orderId: generateOrderId(),
    user: attempt.user || null,
    guestEmail: attempt.guestEmail || null,
    guestName: attempt.shippingAddress?.name || null,
    guestPhone: attempt.shippingAddress?.phone || null,
    items: attempt.items,
    shippingAddress: attempt.shippingAddress,
    paymentMethod: 'uddoktapay',
    paymentGatewayMethod: normalizeGatewayMethod(verification.payment_method),
    paymentType: attempt.paymentType,
    amountPaid,
    remainingAmount,
    paymentStatus: attempt.paymentType === 'partial' ? 'partial' : 'paid',
    orderStatus: 'confirmed',
    subtotal: attempt.subtotal,
    shippingFee: attempt.shippingFee,
    discount: attempt.discount,
    total: attempt.total,
    couponCode: attempt.couponCode || null,
    couponId: attempt.couponId || null,
    note,
    transactionId: verification.transaction_id || invoiceId,
    paymentAttemptId: attempt.attemptId,
    paymentVerifiedAt: now,
    latePayment,
    statusHistory: [
      { status: 'pending', timestamp: now },
      { status: 'confirmed', timestamp: now, note: lateNote || undefined },
    ],
  }
}

const findOrCreateOrder = async (attempt, verification, invoiceId, latePayment) => {
  const existing = await Order.findOne({ paymentAttemptId: attempt.attemptId })
  if (existing) return existing

  try {
    return await Order.create(buildOrderPayload(attempt, verification, invoiceId, latePayment))
  } catch (err) {
    if (err?.code === 11000) {
      const duplicate = await Order.findOne({ paymentAttemptId: attempt.attemptId })
      if (duplicate) return duplicate
    }
    throw err
  }
}

const ensureStockDeduction = async (order, attempt) => {
  const key = orderKey(order)
  const now = new Date()
  const claim = await Order.updateOne(
    { ...key, stockDeductedAt: null, stockProcessingAt: null },
    { $set: { stockProcessingAt: now } },
  )

  if (!claim?.modifiedCount) return

  const stockIssues = []
  for (const item of attempt.items || []) {
    if (!item.product || !item.size) continue
    try {
      const result = await Product.updateOne(
        { _id: item.product, [`stock.${item.size}`]: { $gte: item.qty } },
        { $inc: { [`stock.${item.size}`]: -item.qty } },
      )
      if (!result?.modifiedCount) {
        stockIssues.push(`${item.name} (${item.size})`)
      }
    } catch {
      stockIssues.push(`${item.name} (${item.size})`)
    }
  }

  const update = {
    $set: {
      stockDeductedAt: new Date(),
      stockProcessingAt: null,
      stockIssues,
    },
  }

  if (stockIssues.length > 0) {
    update.$push = {
      statusHistory: {
        status: order.orderStatus || 'confirmed',
        timestamp: new Date(),
        note: `STOCK ISSUE: Failed to deduct stock for: ${stockIssues.join(', ')}. Manual reconciliation required.`,
      },
    }
  }

  await Order.updateOne(key, update)
}

const ensureCouponConsumption = async (order, attempt) => {
  const key = orderKey(order)
  let couponId = order.couponId || attempt.couponId || null
  const couponCode = order.couponCode || attempt.couponCode || null

  if (!couponId && couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode })
    couponId = coupon?._id || null
    if (couponId) {
      await Order.updateOne({ ...key, couponId: null }, { $set: { couponId } })
    }
  }

  if (!couponId || order.couponConsumedAt) return

  const claim = await Order.updateOne(
    { ...key, couponConsumedAt: null, couponConsumptionStartedAt: null },
    { $set: { couponConsumptionStartedAt: new Date() } },
  )

  if (!claim?.modifiedCount) return

  let status = 'consumed'
  let couponIssue = null

  try {
    const result = await Coupon.updateOne(
      {
        _id: couponId,
        $expr: {
          $or: [
            { $lte: [{ $ifNull: ['$maxUses', 0] }, 0] },
            { $lt: [{ $ifNull: ['$usedCount', 0] }, '$maxUses'] },
          ],
        },
      },
      { $inc: { usedCount: 1 } },
    )

    if (!result?.modifiedCount) {
      status = 'limit_reached'
      couponIssue = 'COUPON ISSUE: Payment succeeded but the coupon usage limit was already reached. Manual review required.'
    }
  } catch (err) {
    status = 'failed'
    couponIssue = `COUPON ISSUE: Failed to consume coupon: ${err.message}. Manual review required.`
  }

  const update = {
    $set: {
      couponConsumedAt: new Date(),
      couponConsumptionStartedAt: null,
      couponConsumptionStatus: status,
    },
  }

  if (couponIssue) {
    update.$push = {
      statusHistory: {
        status: order.orderStatus || 'confirmed',
        timestamp: new Date(),
        note: couponIssue,
      },
    }
  }

  await Order.updateOne(key, update)
}

const sendReceiptOnce = async (order) => {
  if (!order || order.receiptSentAt) return
  const recipientEmail = order.user?.email || order.guestEmail
  if (!recipientEmail) return

  const key = orderKey(order)
  const claim = await Order.updateOne(
    { ...key, receiptSentAt: null, receiptSendingAt: null },
    { $set: { receiptSendingAt: new Date() } },
  )
  if (!claim?.modifiedCount) return

  try {
    const sent = await sendEmail(
      recipientEmail,
      `FleetMart Order Confirmation - #${order.orderId}`,
      buildOrderReceiptEmail(order),
    )
    if (sent === false) throw new Error('Email delivery failed')
    await Order.updateOne(key, {
      $set: { receiptSentAt: new Date(), receiptSendingAt: null },
    })
  } catch {
    await Order.updateOne(key, { $set: { receiptSendingAt: null } }).catch(() => {})
  }
}

export const fulfillVerifiedPayment = async ({ invoiceId, verification }) => {
  if (!invoiceId) return { status: 'rejected', code: 'missing_invoice' }
  if (String(verification?.status || '').toUpperCase() !== 'COMPLETED') {
    return { status: 'not_paid', code: 'not_completed' }
  }

  const metadata = parseMetadata(verification?.metadata)
  const attemptId = typeof metadata.attemptId === 'string' ? metadata.attemptId : ''
  if (!attemptId) return { status: 'rejected', code: 'missing_attempt' }

  const attempt = await PaymentAttempt.findOne({ attemptId })
  if (!attempt) return { status: 'rejected', code: 'attempt_not_found' }

  if (verification.invoice_id && verification.invoice_id !== invoiceId) {
    return { status: 'rejected', code: 'invoice_mismatch', attemptId }
  }

  if (attempt.invoiceId && attempt.invoiceId !== invoiceId) {
    await PaymentAttempt.updateOne(
      { attemptId, status: { $ne: 'completed' } },
      {
        $set: {
          status: 'failed',
          ...verificationPatch(invoiceId, verification, attempt.paymentReceivedAt || new Date()),
          fulfillmentError: 'Invoice ID does not match the attempt',
        },
      },
    ).catch(() => {})
    return { status: 'rejected', code: 'invoice_mismatch', attemptId }
  }

  const verifiedAmount = Number(verification.amount)
  if (!Number.isFinite(verifiedAmount) || Math.abs(verifiedAmount - Number(attempt.amountToPay)) > 0.01) {
    await PaymentAttempt.updateOne(
      { attemptId, status: { $ne: 'completed' } },
      {
        $set: {
          status: 'failed',
          ...verificationPatch(invoiceId, verification, attempt.paymentReceivedAt || new Date()),
          fulfillmentError: `Verified amount ${verification.amount} does not match expected amount ${attempt.amountToPay}`,
        },
      },
    ).catch(() => {})
    return { status: 'rejected', code: 'amount_mismatch', attemptId }
  }

  if (attempt.status === 'completed') {
    return { status: 'already_completed', orderId: attempt.orderId, attemptId }
  }

  const now = new Date()
  const paymentReceivedAt = attempt.paymentReceivedAt || now
  const latePayment = Boolean(attempt.latePayment)
    || ['expired', 'cancelled'].includes(attempt.status)
    || Boolean(attempt.expiresAt && new Date(attempt.expiresAt) < now)
  const staleBefore = new Date(now.getTime() - STALE_FULFILLMENT_MS)

  const claimed = await PaymentAttempt.findOneAndUpdate(
    {
      attemptId,
      $and: [
        {
          $or: [
            { status: { $in: ['pending', 'expired', 'cancelled', 'failed', 'paid_pending_order'] } },
            { status: 'processing', fulfillmentStartedAt: null },
            { status: 'processing', fulfillmentStartedAt: { $lt: staleBefore } },
          ],
        },
        { $or: [{ invoiceId: null }, { invoiceId }] },
      ],
    },
    {
      $set: {
        status: 'processing',
        fulfillmentStartedAt: now,
        fulfillmentError: null,
        latePayment,
        ...verificationPatch(invoiceId, verification, paymentReceivedAt),
      },
    },
    { new: true },
  )

  if (!claimed) {
    const current = await PaymentAttempt.findOne({ attemptId })
    if (current?.status === 'completed' && current.orderId) {
      return { status: 'already_completed', orderId: current.orderId, attemptId }
    }
    return { status: 'pending', code: 'fulfillment_in_progress', attemptId }
  }

  try {
    const order = await findOrCreateOrder(claimed, verification, invoiceId, latePayment)
    await ensureStockDeduction(order, claimed)
    await ensureCouponConsumption(order, claimed)
    await sendReceiptOnce(order)

    await PaymentAttempt.updateOne(
      { attemptId, status: { $in: ['processing', 'paid_pending_order'] } },
      {
        $set: {
          status: 'completed',
          orderId: order.orderId,
          completedAt: now,
          fulfillmentStartedAt: null,
          fulfillmentError: null,
          ...verificationPatch(invoiceId, verification, paymentReceivedAt),
        },
      },
    )

    return {
      status: 'completed',
      orderId: order.orderId,
      attemptId,
      latePayment,
    }
  } catch (err) {
    await markNeedsReconciliation(attemptId, invoiceId, verification, paymentReceivedAt, err)
    throw err
  }
}

export const processInvoice = async (invoiceId) => {
  const verification = await uddoktapayRequest('/verify-payment', { invoice_id: invoiceId })
  return fulfillVerifiedPayment({ invoiceId, verification })
}
