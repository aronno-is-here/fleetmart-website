export const ORDER_STATUSES = [
  'pending',
  'processing',
  'confirmed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
]

export const PAYMENT_STATUSES = [
  'pending',
  'partial',
  'paid',
  'failed',
  'refunded',
  'refund_requested',
  'refund_failed',
  'expired',
]

export const MANUAL_PAYMENT_STATUSES = ['pending', 'failed']

/**
 * Validate an admin order status update. Payment and refund states that only
 * the gateway can prove are rejected so admin actions cannot fake a payment.
 */
export function resolveOrderStatusUpdate({ status, paymentStatus, currentPaymentStatus }) {
  const nextStatus = status != null && status !== '' ? String(status) : undefined
  const nextPaymentStatus =
    paymentStatus != null && paymentStatus !== '' ? String(paymentStatus) : undefined

  if (nextStatus !== undefined && !ORDER_STATUSES.includes(nextStatus)) {
    return { ok: false, message: 'Invalid order status' }
  }

  if (nextPaymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(nextPaymentStatus)) {
      return { ok: false, message: 'Invalid payment status' }
    }
    if (!MANUAL_PAYMENT_STATUSES.includes(nextPaymentStatus)) {
      return {
        ok: false,
        message: `Payment status "${nextPaymentStatus}" can only be set by the payment gateway`,
      }
    }
  }

  const shouldRefund =
    nextStatus === 'cancelled' &&
    nextPaymentStatus === undefined &&
    ['paid', 'partial'].includes(currentPaymentStatus)

  return {
    ok: true,
    orderStatus: nextStatus,
    paymentStatus: nextPaymentStatus,
    shouldRefund,
  }
}
