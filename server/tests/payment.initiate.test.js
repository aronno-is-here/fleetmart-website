import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import axios from 'axios'
import Coupon from '../models/Coupon.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import Product from '../models/Product.js'

process.env.UDDOKTAPAY_API_KEY = 'test-key'
process.env.UDDOKTAPAY_BASE_URL = 'https://gateway.test'
process.env.SITE_URL = 'http://localhost:3000'

const regularProduct = {
  _id: '507f1f77bcf86cd799439031',
  name: 'Regular Jersey',
  slug: 'regular-jersey',
  price: 1000,
  discountPrice: null,
  customizable: false,
}

const discountedProduct = {
  _id: '507f1f77bcf86cd799439032',
  name: 'Discounted Jersey',
  slug: 'discounted-jersey',
  price: 1000,
  discountPrice: 800,
  customizable: false,
}

const customizableProduct = {
  _id: '507f1f77bcf86cd799439033',
  name: 'Custom Jersey',
  slug: 'custom-jersey',
  price: 900,
  discountPrice: null,
  customizable: true,
}

const coupon = {
  _id: '507f1f77bcf86cd799439041',
  code: 'SAVE10',
  discountType: 'percent',
  value: 10,
  minOrder: 0,
  maxUses: 0,
  usedCount: 0,
  expiresAt: null,
  isActive: true,
}

let server
let baseUrl

before(async () => {
  const { default: paymentRouter } = await import('../routes/payment.js')
  const app = express()
  app.use(express.json())
  app.use('/api/payment', paymentRouter)
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

const initiate = async (body) => {
  const response = await fetch(`${baseUrl}/api/payment/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: response.status, data: await response.json() }
}

const mockProducts = (t, products) => {
  t.mock.method(Product, 'find', async () => products)
}

const mockCoupon = (t, value) => {
  t.mock.method(Coupon, 'findOne', async () => value)
}

const mockCouponConsumption = (t) => {
  const calls = []
  t.mock.method(Coupon, 'updateOne', async (filter, update) => {
    calls.push({ filter, update })
    return { modifiedCount: 1 }
  })
  return calls
}

const mockAttemptCreate = (t) => {
  let created = null
  t.mock.method(PaymentAttempt, 'create', async (payload) => {
    created = payload
    return { ...payload, save: async () => {} }
  })
  return () => created
}

const mockGateway = (t) => {
  t.mock.method(axios, 'post', async () => ({
    data: { status: true, payment_url: 'https://gateway.test/pay' },
  }))
}

const guest = {
  guestInfo: { name: 'Test Customer', email: 'guest@example.com', phone: '01700000000' },
  shipping: { name: 'Test Customer', phone: '01700000000', street: '1 Test Road', city: 'Dhaka' },
}

test('initiate prices database values and ignores tampered client prices and totals', async (t) => {
  mockProducts(t, [regularProduct, discountedProduct])
  mockCoupon(t, null)
  mockGateway(t)
  const created = mockAttemptCreate(t)

  const { status, data } = await initiate({
    ...guest,
    items: [
      { product: discountedProduct._id, name: 'Tampered', size: 'M', qty: 2, price: 1, customization: null },
      { product: regularProduct._id, name: 'Tampered', size: 'L', qty: 1, price: 1, customization: null },
    ],
    paymentType: 'full',
    totals: { subtotal: 1, discount: 9999, shipping: 0, grand: 1 },
  })

  assert.equal(status, 200)
  assert.equal(data.gatewayUrl, 'https://gateway.test/pay')

  const attempt = created()
  assert.equal(attempt.subtotal, 2600)
  assert.equal(attempt.discount, 0)
  assert.equal(attempt.total, 2600)
  assert.equal(attempt.amountToPay, 2600)
  assert.deepEqual(attempt.items.map((item) => item.price), [800, 1000])
  assert.deepEqual(attempt.items.map((item) => item.name), ['Discounted Jersey', 'Regular Jersey'])
  assert.equal(attempt.couponCode, null)
})

test('initiate applies a valid customization fee and server-side coupon', async (t) => {
  mockProducts(t, [customizableProduct])
  mockCoupon(t, coupon)
  mockGateway(t)
  const created = mockAttemptCreate(t)
  const couponCalls = mockCouponConsumption(t)

  const { status } = await initiate({
    ...guest,
    items: [{
      product: customizableProduct._id,
      size: 'M',
      qty: 2,
      price: 1,
      customization: { name: ' tamim ', number: ' 10 ' },
    }],
    paymentType: 'full',
    couponCode: 'save10',
    totals: { subtotal: 1, discount: 9999, shipping: 0, grand: 1 },
  })

  assert.equal(status, 200)

  const attempt = created()
  assert.equal(attempt.subtotal, 2300)
  assert.equal(attempt.discount, 230)
  assert.equal(attempt.total, 2070)
  assert.equal(attempt.amountToPay, 2070)
  assert.equal(attempt.couponCode, 'SAVE10')
  assert.equal(attempt.items[0].price, 1150)
  assert.deepEqual(attempt.items[0].customization, { name: 'TAMIM', number: '10' })
  assert.equal(couponCalls.length, 1)
  assert.equal(couponCalls[0].filter._id, coupon._id)
})

test('initiate caps partial payment at the online payable total below 300', async (t) => {
  const cheapProduct = { ...regularProduct, price: 250 }
  mockProducts(t, [cheapProduct])
  mockCoupon(t, null)
  mockGateway(t)
  const created = mockAttemptCreate(t)

  const { status } = await initiate({
    ...guest,
    items: [{ product: cheapProduct._id, size: 'M', qty: 1, customization: null }],
    paymentType: 'partial',
  })

  assert.equal(status, 200)

  const attempt = created()
  assert.equal(attempt.total, 250)
  assert.equal(attempt.amountToPay, 250)
})

test('initiate uses the 300 partial amount when the online total is larger', async (t) => {
  mockProducts(t, [regularProduct])
  mockCoupon(t, null)
  mockGateway(t)
  const created = mockAttemptCreate(t)

  const { status } = await initiate({
    ...guest,
    items: [{ product: regularProduct._id, size: 'M', qty: 1, customization: null }],
    paymentType: 'partial',
  })

  assert.equal(status, 200)
  assert.equal(created().amountToPay, 300)
})

test('initiate rejects an invalid coupon instead of silently charging full price', async (t) => {
  mockProducts(t, [regularProduct])
  mockCoupon(t, null)
  mockGateway(t)
  const created = mockAttemptCreate(t)

  const { status, data } = await initiate({
    ...guest,
    items: [{ product: regularProduct._id, size: 'M', qty: 1, customization: null }],
    paymentType: 'full',
    couponCode: 'MISSING',
  })

  assert.equal(status, 400)
  assert.equal(data.message, 'Invalid coupon code')
  assert.equal(created(), null)
})

test('initiate rejects missing products instead of creating a zero-value order', async (t) => {
  mockProducts(t, [regularProduct])
  mockCoupon(t, null)
  mockGateway(t)
  const created = mockAttemptCreate(t)

  const { status, data } = await initiate({
    ...guest,
    items: [{ product: '507f1f77bcf86cd799439099', size: 'M', qty: 1 }],
    paymentType: 'full',
  })

  assert.equal(status, 400)
  assert.equal(data.message, 'One or more products are unavailable')
  assert.equal(created(), null)
})
