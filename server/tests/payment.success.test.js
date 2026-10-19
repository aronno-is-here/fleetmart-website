import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import axios from 'axios'
import Order from '../models/Order.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import Product from '../models/Product.js'

process.env.UDDOKTAPAY_API_KEY = 'test-key'
process.env.UDDOKTAPAY_BASE_URL = 'https://gateway.test'
process.env.SITE_URL = 'http://localhost:3000'

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

test('success callback stores the server-priced attempt totals on the order', async (t) => {
  const attempt = {
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
    couponCode: 'SAVE10',
    note: '',
    expiresAt: new Date(Date.now() + 60_000),
    status: 'pending',
    save: async () => {},
  }

  t.mock.method(PaymentAttempt, 'findOne', async () => attempt)
  t.mock.method(axios, 'post', async () => ({
    data: {
      status: 'COMPLETED',
      amount: '300',
      metadata: JSON.stringify({ attemptId: attempt.attemptId }),
      transaction_id: 'txn-test-1',
      payment_method: 'bkash',
    },
  }))
  t.mock.method(Product, 'updateOne', async () => ({ modifiedCount: 1 }))

  let createdOrder = null
  t.mock.method(Order, 'create', async (payload) => {
    createdOrder = payload
    return payload
  })

  const response = await fetch(`${baseUrl}/api/payment/success`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: 'invoice-test-1' }),
    redirect: 'manual',
  })

  assert.equal(response.status, 302)
  assert.match(response.headers.get('location'), /\/order\/success\?orderId=FM-/)

  assert.equal(createdOrder.subtotal, 2300)
  assert.equal(createdOrder.shippingFee, 80)
  assert.equal(createdOrder.discount, 230)
  assert.equal(createdOrder.total, 2070)
  assert.equal(createdOrder.couponCode, 'SAVE10')
  assert.equal(createdOrder.amountPaid, 300)
  assert.equal(createdOrder.remainingAmount, 1770)
  assert.equal(createdOrder.paymentStatus, 'partial')
  assert.equal(createdOrder.items[0].price, 1150)
  assert.deepEqual(createdOrder.items[0].customization, { name: 'TAMIM', number: '10' })
})
