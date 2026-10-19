import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  MANUAL_PAYMENT_STATUSES,
  resolveOrderStatusUpdate,
} from '../services/orderStatus.js'

test('status lists match the Order schema values the API accepts', () => {
  assert.deepEqual(ORDER_STATUSES, [
    'pending',
    'processing',
    'confirmed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'returned',
  ])
  assert.deepEqual(PAYMENT_STATUSES, [
    'pending',
    'partial',
    'paid',
    'failed',
    'refunded',
    'refund_requested',
    'refund_failed',
    'expired',
  ])
  assert.deepEqual(MANUAL_PAYMENT_STATUSES, ['pending', 'failed'])
})

test('accepts a valid order status without a payment change', () => {
  const result = resolveOrderStatusUpdate({
    status: 'shipped',
    currentPaymentStatus: 'paid',
  })

  assert.equal(result.ok, true)
  assert.equal(result.orderStatus, 'shipped')
  assert.equal(result.paymentStatus, undefined)
  assert.equal(result.shouldRefund, false)
})

test('accepts manual payment status changes', () => {
  const pending = resolveOrderStatusUpdate({ paymentStatus: 'pending', currentPaymentStatus: 'failed' })
  assert.equal(pending.ok, true)
  assert.equal(pending.paymentStatus, 'pending')

  const failed = resolveOrderStatusUpdate({ paymentStatus: 'failed', currentPaymentStatus: 'pending' })
  assert.equal(failed.ok, true)
  assert.equal(failed.paymentStatus, 'failed')
})

test('rejects unknown order and payment statuses', () => {
  assert.equal(resolveOrderStatusUpdate({ status: 'archived' }).ok, false)
  assert.equal(resolveOrderStatusUpdate({ status: 'delivered', paymentStatus: 'cancelled' }).ok, false)
})

test('rejects gateway-owned payment statuses', () => {
  for (const status of ['paid', 'partial', 'refunded', 'refund_requested', 'refund_failed', 'expired']) {
    const result = resolveOrderStatusUpdate({ paymentStatus: status, currentPaymentStatus: 'pending' })
    assert.equal(result.ok, false, `${status} must not be set manually`)
  }
})

test('does not auto-mark delivered orders as paid', () => {
  const result = resolveOrderStatusUpdate({ status: 'delivered', currentPaymentStatus: 'pending' })
  assert.equal(result.ok, true)
  assert.equal(result.paymentStatus, undefined)
  assert.equal(result.shouldRefund, false)
})

test('requests an automatic refund only when cancelling an unmodified paid or partial order', () => {
  assert.equal(
    resolveOrderStatusUpdate({ status: 'cancelled', currentPaymentStatus: 'paid' }).shouldRefund,
    true,
  )
  assert.equal(
    resolveOrderStatusUpdate({ status: 'cancelled', currentPaymentStatus: 'partial' }).shouldRefund,
    true,
  )
  assert.equal(
    resolveOrderStatusUpdate({ status: 'cancelled', currentPaymentStatus: 'pending' }).shouldRefund,
    false,
  )
  assert.equal(
    resolveOrderStatusUpdate({
      status: 'cancelled',
      paymentStatus: 'failed',
      currentPaymentStatus: 'paid',
    }).shouldRefund,
    false,
  )
  assert.equal(
    resolveOrderStatusUpdate({ status: 'shipped', currentPaymentStatus: 'paid' }).shouldRefund,
    false,
  )
})

test('treats empty values as absent', () => {
  const result = resolveOrderStatusUpdate({
    status: '',
    paymentStatus: null,
    currentPaymentStatus: 'paid',
  })
  assert.equal(result.ok, true)
  assert.equal(result.orderStatus, undefined)
  assert.equal(result.paymentStatus, undefined)
})
