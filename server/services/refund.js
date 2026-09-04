/**
 * Shared refund service — single source of truth for refund logic.
 * Used by both payment.js (POST /refund) and orders.js (admin cancellation).
 */

const VALID_GATEWAY_METHODS = ['bkash', 'nagad', 'rocket', 'upay', 'bank', 'other']

/**
 * Process a refund for a paid order.
 *
 * @param {Object}  order          - Mongoose Order document (must be pre-fetched)
 * @param {Object}  opts
 * @param {string}  opts.reason    - Human-readable refund reason
 * @param {string}  opts.context   - 'customer' | 'admin_cancel' (for audit trail only)
 * @param {Function} opts.uddoktapayRequest - async (endpoint, body) => data
 * @param {Function} opts.isConfigured      - () => boolean
 * @returns {{ ok: boolean, message: string, refundAmount?: number }}
 */
export async function processRefund(order, { reason, context, uddoktapayRequest, isConfigured }) {
  // ── Eligibility ──
  if (!['paid', 'partial'].includes(order.paymentStatus)) {
    return { ok: false, message: 'Order payment is not eligible for refund' }
  }

  if (order.paymentStatus === 'refunded') {
    return { ok: false, message: 'Order has already been refunded' }
  }

  if (order.paymentStatus === 'refund_requested') {
    return { ok: false, message: 'Refund is already being processed' }
  }

  if (!order.transactionId) {
    return { ok: false, message: 'No transaction ID found for this order' }
  }

  if (!order.paymentGatewayMethod || !VALID_GATEWAY_METHODS.includes(order.paymentGatewayMethod)) {
    console.warn(`[REFUND] Missing paymentGatewayMethod | Order: ${order.orderId}`)
    return { ok: false, message: 'Refund not available for this order. Contact support for manual processing.' }
  }

  // ── Refund amount from authoritative order data ──
  const refundAmount = order.amountPaid

  if (!refundAmount || refundAmount <= 0) {
    return { ok: false, message: 'No paid amount available for refund' }
  }

  // ── Mark refund as requested (prevents duplicates) ──
  order.paymentStatus = 'refund_requested'
  order.refundAmount = refundAmount
  order.refundReason = reason || 'Refund requested'
  order.refundRequestedAt = new Date()
  order.statusHistory.push({ status: order.orderStatus, timestamp: new Date(), note: `Refund requested: ৳${refundAmount}` })
  await order.save()

  // ── Gateway not configured ──
  if (!isConfigured()) {
    order.paymentStatus = 'refund_failed'
    order.statusHistory.push({ status: order.orderStatus, timestamp: new Date(), note: 'Refund failed: Payment gateway not configured' })
    await order.save()
    return { ok: false, message: 'Payment gateway not configured. Refund request saved for manual processing.' }
  }

  // ── Call UddoktaPay refund API ──
  try {
    const refundResponse = await uddoktapayRequest('/refund-payment', {
      transaction_id: order.transactionId,
      payment_method: order.paymentGatewayMethod,
      amount: String(refundAmount),
      product_name: order.items.map(i => i.name).join(', '),
      reason: reason || 'Refund requested',
    })

    order.paymentStatus = 'refunded'
    order.refundTransactionId = refundResponse.transaction_id || refundResponse.refund_id || null
    order.refundedAt = new Date()
    order.statusHistory.push({ status: order.orderStatus, timestamp: new Date(), note: `Refund confirmed: ৳${refundAmount}` })
    await order.save()

    return { ok: true, message: 'Refund processed successfully', refundAmount }
  } catch (refundErr) {
    order.paymentStatus = 'refund_failed'
    order.statusHistory.push({ status: order.orderStatus, timestamp: new Date(), note: `Refund failed: ${refundErr.response?.data?.message || 'Gateway error'}` })
    await order.save()

    console.error(`[REFUND] Failed | Order: ${order.orderId} | Amount: ${refundAmount} | Error: ${refundErr.message}`)
    return { ok: false, message: 'Refund request failed. Please try again or contact support.' }
  }
}
