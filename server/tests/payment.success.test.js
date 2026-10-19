import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import axios from 'axios'
import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import Product from '../models/Product.js'
import { fulfillmentDeps } from '../services/paymentFulfillment.js'
import { transactionRunner, TransactionsUnsupportedError } from '../services/mongoTransactions.js'

process.env.UDDOKTAPAY_API_KEY = 'test-key'
process.env.UDDOKTAPAY_BASE_URL = 'https://gateway.test'
process.env.SITE_URL = 'http://localhost:3000'

const coupon = {
  _id: '507f1f77bcf86cd799439041',
  code: 'SAVE10',
  discountType: 'percent',
  value: 10,
  maxUses: 10,
  usedCount: 0,
}

const createAttempt = (overrides = {}) => ({
  attemptId: 'PA-TEST-1',
  user: null,
  guestEmail: null,
  guestName: 'Test Customer',
  items: [{
    product: '507f1f77bcf86cd799439051',
    name: 'Custom Jersey',
    slug: 'custom-jersey',
    size: 'M',
    qty: 2,
    price: 1150,
    customization: { name: 'TAMIM', number: '10' },
  }],
  shippingAddress: { name: 'Test Customer', phone: '01700000000', street: '1 Test Road', city: 'Dhaka' },
  paymentType: 'partial',
  subtotal: 2300,
  shippingFee: 80,
  discount: 230,
  total: 2070,
  amountToPay: 300,
  couponCode: null,
  couponId: null,
  note: '',
  expiresAt: new Date(Date.now() + 60_000),
  status: 'pending',
  invoiceId: null,
  paymentReceivedAt: null,
  fulfillmentStartedAt: null,
  fulfillmentError: null,
  latePayment: false,
  ...overrides,
})

const verificationFor = (attempt, overrides = {}) => ({
  status: 'COMPLETED',
  amount: String(attempt.amountToPay),
  invoice_id: 'invoice-test-1',
  metadata: { attemptId: attempt.attemptId },
  transaction_id: 'txn-test-1',
  payment_method: 'bkash',
  ...overrides,
})

const matchesFilter = (doc, filter) => {
  for (const [field, expected] of Object.entries(filter || {})) {
    if (field === '$or') {
      if (!expected.some((sub) => matchesFilter(doc, sub))) return false
      continue
    }
    if (field.startsWith('$')) continue

    const value = field.split('.').reduce((current, key) => current?.[key], doc)

    if (expected === null) {
      if (value !== null && value !== undefined) return false
      continue
    }

    if (typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$lt' in expected && !(value != null && new Date(value) < new Date(expected.$lt))) return false
      if ('$gte' in expected && !(Number(value) >= Number(expected.$gte))) return false
      if ('$in' in expected && !expected.$in.map(String).includes(String(value))) return false
      if ('$ne' in expected && String(value) === String(expected.$ne)) return false
      continue
    }

    if (String(value) !== String(expected)) return false
  }
  return true
}

const installMocks = (t, {
  attempt,
  verification,
  failCreate = false,
  couponLimitReached = false,
  createDelay = 0,
  sendReceipt = async () => true,
  transactionFailure = null,
  initialOrders = [],
}) => {
  const state = {
    attempt,
    verification,
    orders: [...initialOrders],
    stockDeductions: 0,
    couponUses: 0,
    failNextCreate: failCreate,
    couponLimitReached,
    createDelay,
    receiptSends: 0,
  }

  t.mock.method(transactionRunner, 'run', async (callback) => {
    if (transactionFailure) throw transactionFailure
    return callback({ id: 'test-session' })
  })
  t.mock.method(fulfillmentDeps, 'sendReceiptEmail', async (...args) => {
    state.receiptSends += 1
    return sendReceipt(...args)
  })

  t.mock.method(axios, 'post', async () => ({ data: state.verification }))

  t.mock.method(PaymentAttempt, 'findOne', async (filter) => {
    if (filter.attemptId && filter.attemptId !== state.attempt.attemptId) return null
    if (filter.invoiceId && filter.invoiceId !== state.attempt.invoiceId) return null
    return { ...state.attempt }
  })

  t.mock.method(PaymentAttempt, 'findOneAndUpdate', async (_filter, update) => {
    const allowedStatus = ['pending', 'expired', 'cancelled', 'failed', 'paid_pending_order'].includes(state.attempt.status)
    const staleProcessing = state.attempt.status === 'processing'
      && (!state.attempt.fulfillmentStartedAt
        || Date.now() - new Date(state.attempt.fulfillmentStartedAt).getTime() > 5 * 60 * 1000)
    const invoiceAllows = !state.attempt.invoiceId || state.attempt.invoiceId === update.$set.invoiceId

    if ((!allowedStatus && !staleProcessing) || !invoiceAllows) return null

    Object.assign(state.attempt, update.$set)
    return { ...state.attempt }
  })

  t.mock.method(PaymentAttempt, 'updateOne', async (filter, update) => {
    if (filter.attemptId && filter.attemptId !== state.attempt.attemptId) {
      return { modifiedCount: 0 }
    }
    if (filter.status?.$ne && state.attempt.status === filter.status.$ne) {
      return { modifiedCount: 0 }
    }
    if (filter.status?.$in && !filter.status.$in.includes(state.attempt.status)) {
      return { modifiedCount: 0 }
    }
    Object.assign(state.attempt, update.$set)
    return { modifiedCount: 1 }
  })

  t.mock.method(Order, 'findOne', async (filter) => {
    if (filter.paymentAttemptId) {
      return state.orders.find((order) => order.paymentAttemptId === filter.paymentAttemptId) || null
    }
    if (filter._id) {
      return state.orders.find((order) => String(order._id) === String(filter._id)) || null
    }
    if (filter.orderId) {
      return state.orders.find((order) => order.orderId === filter.orderId) || null
    }
    return null
  })

  t.mock.method(Order, 'create', async (docs) => {
    if (createDelay) await new Promise((resolve) => setTimeout(resolve, createDelay))
    if (state.failNextCreate) {
      state.failNextCreate = false
      throw new Error('Database unavailable while creating order')
    }

    const payload = Array.isArray(docs) ? docs[0] : docs
    const order = {
      _id: `order-${state.orders.length + 1}`,
      stockDeductedAt: null,
      stockProcessingAt: null,
      stockIssues: [],
      stockReconciliationRequired: false,
      couponConsumedAt: null,
      couponConsumptionStartedAt: null,
      couponReconciliationRequired: false,
      receiptStatus: 'pending',
      receiptAttempts: 0,
      receiptSendingAt: null,
      receiptLastAttemptAt: null,
      receiptNextAttemptAt: null,
      receiptLastError: null,
      receiptSentAt: null,
      ...payload,
    }
    state.orders.push(order)
    return Array.isArray(docs) ? [order] : order
  })

  t.mock.method(Order, 'updateOne', async (filter, update) => {
    const order = state.orders.find((candidate) => matchesFilter(candidate, filter))
    if (!order) return { modifiedCount: 0 }

    if (update.$set) Object.assign(order, update.$set)
    if (update.$inc) {
      for (const [field, amount] of Object.entries(update.$inc)) {
        order[field] = (order[field] || 0) + amount
      }
    }
    if (update.$push?.statusHistory) {
      order.statusHistory = [...(order.statusHistory || []), update.$push.statusHistory]
    }
    return { modifiedCount: 1 }
  })

  t.mock.method(Product, 'updateOne', async () => {
    state.stockDeductions += 1
    return { modifiedCount: 1 }
  })

  t.mock.method(Coupon, 'findOne', async () => coupon)

  t.mock.method(Coupon, 'updateOne', async () => {
    if (state.couponLimitReached) return { modifiedCount: 0 }
    state.couponUses += 1
    return { modifiedCount: 1 }
  })

  return state
}

let server
let baseUrl

before(async () => {
  const { default: paymentRouter } = await import('../routes/payment.js')
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use('/api/payment', paymentRouter)
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

const success = () => fetch(`${baseUrl}/api/payment/success`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ invoice_id: 'invoice-test-1' }),
  redirect: 'manual',
})

const ipn = (key = 'test-key') => fetch(`${baseUrl}/api/payment/ipn`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'RT-UDDOKTAPAY-API-KEY': key,
  },
  body: JSON.stringify({
    invoice_id: 'invoice-test-1',
    status: 'COMPLETED',
    amount: '300',
    metadata: { attemptId: 'PA-TEST-1' },
  }),
})

test('success fulfillment stores authoritative totals and completes side effects once', async (t) => {
  const attempt = createAttempt({ couponCode: 'SAVE10', couponId: coupon._id })
  const state = installMocks(t, { attempt, verification: verificationFor(attempt) })

  const response = await success()
  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /\/order\/success\?orderId=FM-/)

  assert.equal(state.orders.length, 1)
  const order = state.orders[0]
  assert.equal(order.subtotal, 2300)
  assert.equal(order.shippingFee, 80)
  assert.equal(order.discount, 230)
  assert.equal(order.total, 2070)
  assert.equal(order.couponCode, 'SAVE10')
  assert.equal(order.couponId, coupon._id)
  assert.equal(order.amountPaid, 300)
  assert.equal(order.remainingAmount, 1770)
  assert.equal(order.paymentStatus, 'partial')
  assert.equal(order.items[0].price, 1150)
  assert.deepEqual(order.items[0].customization, { name: 'TAMIM', number: '10' })
  assert.equal(state.attempt.status, 'completed')
  assert.equal(state.attempt.orderId, order.orderId)
  assert.equal(state.stockDeductions, 1)
  assert.equal(state.couponUses, 1)
})

test('repeated success notifications return the same order without duplicate stock or coupon use', async (t) => {
  const attempt = createAttempt({ couponCode: 'SAVE10', couponId: coupon._id })
  const state = installMocks(t, { attempt, verification: verificationFor(attempt) })

  await success()
  const duplicate = await success()

  assert.equal(duplicate.status, 302)
  assert.match(duplicate.headers.get('location'), /\/order\/success\?orderId=FM-/)
  assert.equal(state.orders.length, 1)
  assert.equal(state.stockDeductions, 1)
  assert.equal(state.couponUses, 1)
})

test('IPN fulfills a payment when the browser success callback is missed', async (t) => {
  const attempt = createAttempt()
  const state = installMocks(t, { attempt, verification: verificationFor(attempt) })

  const response = await ipn()

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.message, 'IPN processed')
  assert.equal(state.orders.length, 1)
  assert.equal(state.attempt.status, 'completed')
})

test('IPN rejects an invalid webhook key without calling the gateway', async (t) => {
  const attempt = createAttempt()
  const state = installMocks(t, { attempt, verification: verificationFor(attempt) })

  const response = await ipn('wrong-key')

  assert.equal(response.status, 403)
  assert.equal(state.orders.length, 0)
  assert.equal(state.attempt.status, 'pending')
})

test('a gateway PENDING verification redirects to pending without creating an order', async (t) => {
  const attempt = createAttempt()
  const state = installMocks(t, {
    attempt,
    verification: verificationFor(attempt, { status: 'PENDING' }),
  })

  const response = await success()

  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /payment=pending/)
  assert.equal(state.orders.length, 0)
  assert.equal(state.attempt.status, 'pending')
  assert.equal(state.stockDeductions, 0)
  assert.equal(state.couponUses, 0)
})

test('a verified delayed payment is fulfilled after checkout expiry', async (t) => {
  const attempt = createAttempt({
    status: 'expired',
    expiresAt: new Date(Date.now() - 60_000),
  })
  const state = installMocks(t, { attempt, verification: verificationFor(attempt) })

  const response = await success()

  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /\/order\/success\?orderId=FM-/)
  assert.equal(state.orders.length, 1)
  assert.equal(state.orders[0].latePayment, true)
  assert.equal(state.attempt.status, 'completed')
})

test('a coupon limit reached does not over-consume the coupon or lose the paid order', async (t) => {
  const attempt = createAttempt({ couponCode: 'SAVE10', couponId: coupon._id })
  const state = installMocks(t, {
    attempt,
    verification: verificationFor(attempt),
    couponLimitReached: true,
  })

  const response = await success()

  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /\/order\/success\?orderId=FM-/)
  assert.equal(state.orders.length, 1)
  assert.equal(state.orders[0].paymentStatus, 'partial')
  assert.equal(state.orders[0].couponConsumptionStatus, 'limit_reached')
  assert.equal(state.couponUses, 0)
  assert.match(state.orders[0].statusHistory.at(-1).note, /COUPON ISSUE/)
})

test('a verified invoice cannot be replayed onto a different attempt invoice', async (t) => {
  const attempt = createAttempt({ invoiceId: 'another-invoice' })
  const state = installMocks(t, { attempt, verification: verificationFor(attempt) })

  const response = await success()

  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /payment=failed/)
  assert.equal(state.orders.length, 0)
  assert.equal(state.attempt.status, 'failed')
})

test('an amount mismatch is rejected and never creates an order', async (t) => {
  const attempt = createAttempt()
  const verification = verificationFor(attempt, { amount: '1.00' })
  const state = installMocks(t, { attempt, verification })

  const response = await success()

  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /payment=failed/)
  assert.equal(state.orders.length, 0)
  assert.equal(state.attempt.status, 'failed')
  assert.match(state.attempt.fulfillmentError, /does not match/)
  assert.equal(state.stockDeductions, 0)
  assert.equal(state.couponUses, 0)
})

test('order creation failure preserves a paid attempt for retry', async (t) => {
  const attempt = createAttempt()
  const state = installMocks(t, { attempt, verification: verificationFor(attempt), failCreate: true })

  const first = await success()
  assert.equal(first.status, 302)
  assert.match(first.headers.get('location'), /payment=pending/)
  assert.equal(state.orders.length, 0)
  assert.equal(state.attempt.status, 'paid_pending_order')
  assert.equal(state.attempt.invoiceId, 'invoice-test-1')
  assert.equal(Boolean(state.attempt.paymentReceivedAt), true)

  const retry = await success()
  assert.equal(retry.status, 302)
  assert.match(retry.headers.get('location'), /\/order\/success\?orderId=FM-/)
  assert.equal(state.orders.length, 1)
  assert.equal(state.attempt.status, 'completed')
})

test('concurrent duplicate notifications create exactly one order', async (t) => {
  const attempt = createAttempt()
  const state = installMocks(t, { attempt, verification: verificationFor(attempt), createDelay: 25 })

  const responses = await Promise.all([success(), success()])
  const locations = responses.map((response) => response.headers.get('location'))

  assert.equal(state.orders.length, 1)
  assert.equal(state.stockDeductions, 1)
  assert.equal(locations.filter((location) => location.includes('/order/success')).length, 1)
  assert.equal(locations.filter((location) => location.includes('payment=pending')).length, 1)
})

test('fulfillment fails safely when MongoDB transactions are unavailable', async (t) => {
  const attempt = createAttempt()
  const state = installMocks(t, {
    attempt,
    verification: verificationFor(attempt),
    transactionFailure: new TransactionsUnsupportedError(),
  })

  const response = await success()

  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /payment=pending/)
  assert.equal(state.orders.length, 0)
  assert.equal(state.stockDeductions, 0)
  assert.equal(state.couponUses, 0)
  assert.equal(state.attempt.status, 'paid_pending_order')
  assert.match(state.attempt.fulfillmentError, /transactions/i)
})

test('receipt failure does not block completion and completed callbacks retry the receipt', async (t) => {
  const attempt = createAttempt({
    guestEmail: 'buyer@example.com',
    customerEmail: 'buyer@example.com',
  })
  let sends = 0
  const state = installMocks(t, {
    attempt,
    verification: verificationFor(attempt),
    sendReceipt: async () => {
      sends += 1
      return sends > 1
    },
  })

  const first = await success()
  assert.equal(first.status, 302)
  assert.match(first.headers.get('location'), /order\/success/)
  assert.equal(state.attempt.status, 'completed')

  const order = state.orders[0]
  assert.equal(order.receiptStatus, 'failed')
  assert.equal(order.receiptAttempts, 1)
  assert.equal(order.receiptSentAt, null)
  assert.match(order.receiptLastError, /Email delivery failed/)

  order.receiptNextAttemptAt = new Date(0)
  const second = await success()

  assert.equal(second.status, 302)
  assert.match(second.headers.get('location'), /order\/success/)
  assert.equal(state.orders.length, 1)
  assert.equal(state.attempt.status, 'completed')
  assert.equal(order.receiptStatus, 'sent')
  assert.equal(order.receiptAttempts, 2)
  assert.ok(order.receiptSentAt)
})

test('legacy in-flight markers are flagged for review instead of being skipped or replayed', async (t) => {
  const attempt = createAttempt({
    status: 'completed',
    invoiceId: 'invoice-test-1',
    orderId: 'FM-LEGACY-1',
    paymentReceivedAt: new Date(),
    couponCode: 'SAVE10',
    couponId: coupon._id,
  })
  const legacyOrder = {
    _id: 'legacy-order-1',
    orderId: 'FM-LEGACY-1',
    paymentAttemptId: attempt.attemptId,
    couponId: coupon._id,
    couponCode: 'SAVE10',
    orderStatus: 'confirmed',
    stockProcessingAt: new Date(Date.now() - 60_000),
    stockDeductedAt: null,
    stockIssues: [],
    stockReconciliationRequired: false,
    couponConsumptionStartedAt: new Date(Date.now() - 60_000),
    couponConsumedAt: null,
    couponReconciliationRequired: false,
    receiptStatus: 'pending',
    receiptAttempts: 0,
    receiptSendingAt: null,
    receiptNextAttemptAt: null,
    receiptLastError: null,
    receiptSentAt: null,
    statusHistory: [],
  }
  const state = installMocks(t, {
    attempt,
    verification: verificationFor(attempt),
    initialOrders: [legacyOrder],
  })

  const response = await success()

  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /order\/success/)
  assert.equal(state.orders.length, 1)
  assert.equal(state.stockDeductions, 0)
  assert.equal(state.couponUses, 0)
  assert.equal(legacyOrder.stockReconciliationRequired, true)
  assert.equal(legacyOrder.stockProcessingAt, null)
  assert.equal(legacyOrder.couponReconciliationRequired, true)
  assert.equal(legacyOrder.couponConsumptionStartedAt, null)

  const notes = legacyOrder.statusHistory.map((entry) => entry.note).join(' ')
  assert.match(notes, /STOCK ISSUE/)
  assert.match(notes, /COUPON ISSUE/)
})

test('payment attempt retention is not tied to a TTL index', () => {
  const indexes = PaymentAttempt.schema.indexes()
  assert.equal(indexes.some(([, options]) => options.expireAfterSeconds !== undefined), false)
  assert.equal(indexes.some(([fields, options]) => (
    fields.invoiceId === 1
    && options.unique === true
    && options.partialFilterExpression?.invoiceId?.$type === 'string'
  )), true)

  const orderIndexes = Order.schema.indexes()
  assert.equal(orderIndexes.some(([fields, options]) => (
    fields.paymentAttemptId === 1
    && options.unique === true
    && options.partialFilterExpression?.paymentAttemptId?.$type === 'string'
  )), true)
})
