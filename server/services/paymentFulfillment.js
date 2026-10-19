import crypto from 'crypto'
import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import Product from '../models/Product.js'
import { buildOrderReceiptEmail, sendEmail } from './email.js'
import { transactionRunner, TransactionsUnsupportedError } from './mongoTransactions.js'
import { uddoktapayRequest } from './uddoktapay.js'

const STALE_FULFILLMENT_MS = 5 * 60 * 1000
const RECEIPT_LEASE_MS = 5 * 60 * 1000
const RECEIPT_RETRY_DELAY_MS = 5 * 60 * 1000
const DUPLICATE_ORDER_RETRIES = 5
const VALID_GATEWAY_METHODS = ['bkash', 'nagad', 'rocket', 'upay', 'bank']

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

const statusNote = (order, note) => ({
  status: order?.orderStatus || 'confirmed',
  timestamp: new Date(),
  note,
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
    receiptEmail: attempt.customerEmail || attempt.guestEmail || null,
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

const findOrCreateOrder = async (attempt, verification, invoiceId, latePayment, session) => {
  const existing = await Order.findOne({ paymentAttemptId: attempt.attemptId }, null, { session })
  if (existing) return existing

  const [created] = await Order.create(
    [buildOrderPayload(attempt, verification, invoiceId, latePayment)],
    { session },
  )
  return created
}

const runFulfillmentTransaction = async (runner, callback) => {
  let lastError
  for (let attempt = 0; attempt < DUPLICATE_ORDER_RETRIES; attempt += 1) {
    try {
      return await runner.run(callback)
    } catch (err) {
      lastError = err
      if (err?.code !== 11000) throw err
      await sleep(20 * (attempt + 1))
    }
  }
  throw lastError
}

const applyStockDeduction = async (order, attempt, session, hooks) => {
  if (order.stockDeductedAt) return { status: 'already_deducted' }
  if (order.stockReconciliationRequired) return { status: 'needs_review' }

  if (order.stockProcessingAt) {
    await Order.updateOne(
      { _id: order._id },
      {
        $set: { stockReconciliationRequired: true, stockProcessingAt: null },
        $push: {
          statusHistory: statusNote(
            order,
            'STOCK ISSUE: A prior fulfillment attempt may or may not have deducted stock. Automatic deduction was skipped to avoid double counting. Manual reconciliation required.',
          ),
        },
      },
      { session },
    )
    return { status: 'ambiguous_review' }
  }

  const stockIssues = []
  const items = attempt.items || []

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    if (!item.product || !item.size) continue

    let deducted = false
    try {
      const result = await Product.updateOne(
        { _id: item.product, [`stock.${item.size}`]: { $gte: item.qty } },
        { $inc: { [`stock.${item.size}`]: -item.qty } },
        { session },
      )
      deducted = Boolean(result?.modifiedCount)
    } catch (err) {
      if (err?.name !== 'CastError' && err?.name !== 'ValidationError') throw err
      deducted = false
    }

    if (!deducted) stockIssues.push(`${item.name} (${item.size})`)
    await hooks?.afterStockItem?.({ index, item, deducted })
  }

  const update = {
    $set: { stockDeductedAt: new Date(), stockIssues },
  }
  if (stockIssues.length > 0) {
    update.$push = {
      statusHistory: statusNote(
        order,
        `STOCK ISSUE: Failed to deduct stock for: ${stockIssues.join(', ')}. Manual reconciliation required.`,
      ),
    }
  }

  await Order.updateOne(orderKey(order), update, { session })
  await hooks?.afterStockDeducted?.({ order, stockIssues })
  return { status: 'deducted', stockIssues }
}

const applyCouponConsumption = async (order, attempt, session, hooks) => {
  if (order.couponConsumedAt) return { status: 'already_consumed' }
  if (order.couponReconciliationRequired) return { status: 'needs_review' }

  let couponId = order.couponId || attempt.couponId || null
  const couponCode = order.couponCode || attempt.couponCode || null

  if (!couponId && couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode }, null, { session })
    couponId = coupon?._id || null
    if (couponId) {
      await Order.updateOne({ ...orderKey(order), couponId: null }, { $set: { couponId } }, { session })
    }
  }

  if (!couponId) return { status: 'no_coupon' }

  if (order.couponConsumptionStartedAt) {
    await Order.updateOne(
      { _id: order._id },
      {
        $set: { couponReconciliationRequired: true, couponConsumptionStartedAt: null },
        $push: {
          statusHistory: statusNote(
            order,
            'COUPON ISSUE: A prior fulfillment attempt may or may not have consumed the coupon. Automatic consumption was skipped to avoid double counting. Manual reconciliation required.',
          ),
        },
      },
      { session },
    )
    return { status: 'ambiguous_review' }
  }

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
      { session },
    )

    if (!result?.modifiedCount) {
      status = 'limit_reached'
      couponIssue = 'COUPON ISSUE: Payment succeeded but the coupon usage limit was already reached. Manual review required.'
    }
  } catch (err) {
    if (err?.name !== 'CastError') throw err
    status = 'failed'
    couponIssue = `COUPON ISSUE: Failed to consume coupon: ${err.message}. Manual review required.`
  }

  const update = {
    $set: { couponConsumedAt: new Date(), couponConsumptionStatus: status },
  }
  if (couponIssue) {
    update.$push = { statusHistory: statusNote(order, couponIssue) }
  }

  await Order.updateOne(orderKey(order), update, { session })
  await hooks?.afterCouponConsumed?.({ order, status })
  return { status }
}

const deliverReceipt = async (order, sendReceiptEmail, hooks) => {
  if (!order) return { status: 'no_order' }

  const key = orderKey(order)
  const current = await Order.findOne(key)
  if (!current) return { status: 'no_order' }
  if (current.receiptSentAt) return { status: 'already_sent' }

  const now = new Date()
  if (current.receiptNextAttemptAt && new Date(current.receiptNextAttemptAt) > now) {
    return { status: 'backoff' }
  }

  const recipient = current.receiptEmail || current.guestEmail
  if (!recipient) {
    await Order.updateOne(key, {
      $set: {
        receiptStatus: 'failed',
        receiptLastError: 'No recipient email address is available',
        receiptNextAttemptAt: new Date(now.getTime() + RECEIPT_RETRY_DELAY_MS),
      },
    })
    return { status: 'no_recipient' }
  }

  const leaseCutoff = new Date(now.getTime() - RECEIPT_LEASE_MS)
  const claim = await Order.updateOne(
    {
      ...key,
      receiptSentAt: null,
      $or: [{ receiptSendingAt: null }, { receiptSendingAt: { $lt: leaseCutoff } }],
    },
    {
      $set: { receiptSendingAt: now, receiptStatus: 'sending', receiptLastAttemptAt: now },
      $inc: { receiptAttempts: 1 },
    },
  )

  if (!claim?.modifiedCount) return { status: 'in_progress' }

  await hooks?.beforeReceiptSend?.({ order: current })

  try {
    const sent = await sendReceiptEmail(
      recipient,
      `FleetMart Order Confirmation - #${current.orderId}`,
      buildOrderReceiptEmail(current),
    )
    if (sent === false) throw new Error('Email delivery failed')
    await hooks?.afterReceiptSent?.({ order: current })

    await Order.updateOne(key, {
      $set: {
        receiptSentAt: new Date(),
        receiptSendingAt: null,
        receiptStatus: 'sent',
        receiptLastError: null,
        receiptNextAttemptAt: null,
      },
    })
    return { status: 'sent' }
  } catch (err) {
    const message = String(err?.message || 'Email delivery failed').slice(0, 500)
    await Order.updateOne(key, {
      $set: {
        receiptSendingAt: null,
        receiptStatus: 'failed',
        receiptLastError: message,
        receiptNextAttemptAt: new Date(Date.now() + RECEIPT_RETRY_DELAY_MS),
      },
    }).catch(() => {})
    return { status: 'failed', error: message }
  }
}

const recoverOrderSideEffects = async (order, attempt, deps) => {
  if (!order) return { ok: true }

  const needsStock = !order.stockDeductedAt && !order.stockReconciliationRequired
  const needsCoupon = !order.couponConsumedAt
    && !order.couponReconciliationRequired
    && Boolean(order.couponId || attempt.couponId || order.couponCode || attempt.couponCode)

  if (!needsStock && !needsCoupon) return { ok: true }

  try {
    await runFulfillmentTransaction(deps.transactionRunner, async (session) => {
      const fresh = await Order.findOne({ _id: order._id }, null, { session })
      if (!fresh) return
      await applyStockDeduction(fresh, attempt, session, deps.hooks)
      await applyCouponConsumption(fresh, attempt, session, deps.hooks)
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err }
  }
}

const recoverCompletedAttempt = async (attempt, deps, attemptId) => {
  const orderRef = attempt.orderId ? { orderId: attempt.orderId } : { paymentAttemptId: attempt.attemptId }
  const order = await Order.findOne(orderRef)
  if (!order) return { receipt: 'no_order' }

  const recovery = await recoverOrderSideEffects(order, attempt, deps)
  if (!recovery.ok) {
    await PaymentAttempt.updateOne(
      { attemptId, status: 'completed' },
      {
        $set: {
          fulfillmentError: `Completed payment still has unfinished side effects: ${String(recovery.error?.message || recovery.error).slice(0, 400)}`,
        },
      },
    ).catch(() => {})
  }

  const receipt = await deliverReceipt(order, deps.sendReceiptEmail, deps.hooks)
  return { receipt: receipt.status, orderId: order.orderId }
}

export const fulfillmentDeps = {
  transactionRunner,
  sendReceiptEmail: sendEmail,
  verifyPayment: uddoktapayRequest,
}

const resolveDeps = (deps) => ({ ...fulfillmentDeps, ...(deps || {}) })

export const fulfillVerifiedPayment = async ({ invoiceId, verification }, deps = {}) => {
  const resolved = resolveDeps(deps)
  const hooks = resolved.hooks

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
    const recovery = await recoverCompletedAttempt(attempt, resolved, attemptId)
    return {
      status: 'already_completed',
      orderId: recovery.orderId || attempt.orderId,
      attemptId,
      receipt: recovery.receipt,
    }
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
      const recovery = await recoverCompletedAttempt(current, resolved, attemptId)
      return {
        status: 'already_completed',
        orderId: recovery.orderId || current.orderId,
        attemptId,
        receipt: recovery.receipt,
      }
    }

    if (current?.status === 'processing') {
      const existingOrder = await Order.findOne({ paymentAttemptId: attemptId })
      if (existingOrder) {
        const recovery = await recoverOrderSideEffects(existingOrder, current, resolved)
        if (!recovery.ok) {
          return { status: 'pending', code: 'side_effect_recovery_failed', attemptId }
        }

        await PaymentAttempt.updateOne(
          { attemptId, status: 'processing' },
          {
            $set: {
              status: 'completed',
              orderId: existingOrder.orderId,
              completedAt: new Date(),
              fulfillmentStartedAt: null,
              fulfillmentError: null,
            },
          },
        )

        const receipt = await deliverReceipt(existingOrder, resolved.sendReceiptEmail, hooks)
        return {
          status: 'completed',
          orderId: existingOrder.orderId,
          attemptId,
          latePayment: current.latePayment,
          receipt: receipt.status,
        }
      }
    }

    return { status: 'pending', code: 'fulfillment_in_progress', attemptId }
  }

  try {
    await hooks?.afterClaim?.({ attempt: claimed })

    const order = await runFulfillmentTransaction(resolved.transactionRunner, async (session) => {
      const created = await findOrCreateOrder(claimed, verification, invoiceId, latePayment, session)
      await hooks?.afterOrderCreated?.({ order: created })
      await applyStockDeduction(created, claimed, session, hooks)
      await applyCouponConsumption(created, claimed, session, hooks)
      return created
    })

    await hooks?.beforeAttemptCompleted?.({ order })

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

    const receipt = await deliverReceipt(order, resolved.sendReceiptEmail, hooks)

    return {
      status: 'completed',
      orderId: order.orderId,
      attemptId,
      latePayment,
      receipt: receipt.status,
    }
  } catch (err) {
    await markNeedsReconciliation(attemptId, invoiceId, verification, paymentReceivedAt, err)
    if (err instanceof TransactionsUnsupportedError || err?.code === 'transactions_unsupported') {
      return { status: 'pending', code: 'transactions_unsupported', attemptId }
    }
    throw err
  }
}

export const processInvoice = async (invoiceId, deps = {}) => {
  const resolved = resolveDeps(deps)
  const verification = await resolved.verifyPayment('/verify-payment', { invoice_id: invoiceId })
  return fulfillVerifiedPayment({ invoiceId, verification }, deps)
}
