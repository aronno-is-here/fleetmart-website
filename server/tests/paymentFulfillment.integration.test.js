import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import mongoose from 'mongoose'
import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'
import PaymentAttempt from '../models/PaymentAttempt.js'
import Product from '../models/Product.js'
import { fulfillVerifiedPayment } from '../services/paymentFulfillment.js'
import { resetTransactionSupportCache } from '../services/mongoTransactions.js'

const findMongod = () => {
  const command = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(command, ['mongod'], { encoding: 'utf8' })
  if (result.status !== 0) return null
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || null
}

const mongodPath = findMongod()
const skip = mongodPath ? false : 'mongod is not available on PATH'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer()
  server.unref()
  server.on('error', reject)
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address()
    server.close(() => resolve(port))
  })
})

const connectMongoose = async (uri, attempts = 40) => {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1000 })
      return
    } catch (err) {
      lastError = err
      await mongoose.disconnect().catch(() => {})
      await wait(250)
    }
  }
  throw lastError
}

describe('payment fulfillment against an isolated replica set', { skip }, () => {
  let mongod
  let dbPath
  let stderr = ''
  let port
  let sequence = 0

  const unique = (prefix) => `${prefix}-${Date.now().toString(36)}-${sequence++}`

  const createProduct = async (stock, overrides = {}) => Product.create({
    name: 'Test Jersey',
    slug: unique('test-jersey'),
    category: 'jersey',
    price: 1000,
    stock,
    ...overrides,
  })

  const lineItem = (product, size, qty, price = 1000) => ({
    product: product._id,
    name: product.name,
    slug: product.slug,
    size,
    qty,
    price,
  })

  const createAttempt = async (items, overrides = {}) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
    return PaymentAttempt.create({
      attemptId: unique('PA'),
      user: null,
      guestEmail: 'buyer@example.com',
      customerEmail: 'buyer@example.com',
      items,
      shippingAddress: { name: 'Test Buyer', phone: '01700000000', street: '1 Test Road', city: 'Dhaka' },
      paymentType: 'full',
      subtotal,
      shippingFee: 0,
      discount: 0,
      total: subtotal,
      amountToPay: subtotal,
      couponCode: null,
      couponId: null,
      note: '',
      expiresAt: new Date(Date.now() + 60_000),
      ...overrides,
    })
  }

  const verificationFor = (attempt, invoiceId) => ({
    status: 'COMPLETED',
    amount: String(attempt.amountToPay),
    invoice_id: invoiceId,
    metadata: { attemptId: attempt.attemptId },
    transaction_id: unique('txn'),
    payment_method: 'bkash',
  })

  const run = (attempt, invoiceId, deps = {}) => fulfillVerifiedPayment(
    { invoiceId, verification: verificationFor(attempt, invoiceId) },
    { sendReceiptEmail: async () => true, ...deps },
  )

  before(async () => {
    dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fleetmart-rs-'))
    port = await getFreePort()

    mongod = spawn(mongodPath, [
      '--dbpath', dbPath,
      '--port', String(port),
      '--replSet', 'rs0',
      '--bind_ip', '127.0.0.1',
      '--wiredTigerCacheSizeGB', '0.25',
      '--quiet',
    ], { stdio: ['ignore', 'ignore', 'pipe'] })

    mongod.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
      if (stderr.length > 20_000) stderr = stderr.slice(-20_000)
    })

    const adminUri = `mongodb://127.0.0.1:${port}/admin?directConnection=true`
    const client = new mongoose.mongo.MongoClient(adminUri, { serverSelectionTimeoutMS: 1000 })

    let connectError
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        await client.connect()
        connectError = null
        break
      } catch (err) {
        connectError = err
        await wait(250)
      }
    }
    if (connectError) throw new Error(`Could not connect to isolated mongod: ${connectError.message}\n${stderr}`)

    try {
      await client.db('admin').command({
        replSetInitiate: {
          _id: 'rs0',
          members: [{ _id: 0, host: `127.0.0.1:${port}` }],
        },
      })
    } catch (err) {
      if (err?.codeName !== 'AlreadyInitialized') throw err
    }

    let primary = false
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const hello = await client.db('admin').command({ hello: 1 }).catch(() => null)
      if (hello?.isWritablePrimary) {
        primary = true
        break
      }
      await wait(250)
    }
    await client.close()
    if (!primary) throw new Error(`Replica set did not elect a primary.\n${stderr}`)

    await connectMongoose(`mongodb://127.0.0.1:${port}/fleetmart_payment_test?replicaSet=rs0`)
    resetTransactionSupportCache()
    await Promise.all([Order.init(), PaymentAttempt.init(), Product.init(), Coupon.init()])
  })

  after(async () => {
    await mongoose.connection.dropDatabase().catch(() => {})
    await mongoose.disconnect().catch(() => {})
    if (mongod) {
      mongod.kill()
      await wait(500)
    }
    if (dbPath) {
      try { fs.rmSync(dbPath, { recursive: true, force: true }) } catch { /* mongod may still hold files briefly */ }
    }
  })

  beforeEach(async () => {
    await Promise.all([
      Order.deleteMany({}),
      PaymentAttempt.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
    ])
  })

  it('deduplicates order, stock and coupon across concurrent notifications', async () => {
    const product = await createProduct({ M: 10 })
    const coupon = await Coupon.create({
      code: unique('SAVE').toUpperCase(),
      discountType: 'percent',
      value: 10,
      maxUses: 5,
      usedCount: 0,
    })
    const attempt = await createAttempt(
      [lineItem(product, 'M', 2)],
      { couponCode: coupon.code, couponId: coupon._id, discount: 200, total: 1800, amountToPay: 1800 },
    )
    const invoiceId = unique('invoice')

    const results = await Promise.all([
      run(attempt, invoiceId),
      run(attempt, invoiceId),
    ])

    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
    assert.equal((await Product.findById(product._id)).stock.get('M'), 8)
    assert.equal((await Coupon.findById(coupon._id)).usedCount, 1)
    assert.equal((await PaymentAttempt.findById(attempt._id)).status, 'completed')
    assert.equal(results.every((result) => ['completed', 'already_completed', 'pending'].includes(result.status)), true)
  })

  it('enforces the real unique indexes used for deduplication', async () => {
    const sharedAttemptId = unique('PA-shared')

    await Order.create([{
      orderId: unique('FM'),
      subtotal: 1,
      total: 1,
      paymentAttemptId: sharedAttemptId,
      paymentStatus: 'paid',
    }])

    await assert.rejects(
      () => Order.create([{
        orderId: unique('FM'),
        subtotal: 1,
        total: 1,
        paymentAttemptId: sharedAttemptId,
        paymentStatus: 'paid',
      }]),
      (err) => err.code === 11000,
    )

    const sharedInvoice = unique('invoice-shared')
    const attemptPayload = {
      subtotal: 1,
      total: 1,
      amountToPay: 1,
      expiresAt: new Date(Date.now() + 60_000),
      invoiceId: sharedInvoice,
    }

    await PaymentAttempt.create([{ attemptId: unique('PA'), ...attemptPayload }])
    await assert.rejects(
      () => PaymentAttempt.create([{ attemptId: unique('PA'), ...attemptPayload }]),
      (err) => err.code === 11000,
    )

    await Order.create([
      { orderId: unique('FM'), subtotal: 1, total: 1, paymentStatus: 'paid' },
      { orderId: unique('FM'), subtotal: 1, total: 1, paymentStatus: 'paid' },
    ])
    assert.equal(await Order.countDocuments({ paymentAttemptId: null }), 2)
  })

  it('recovers a claimed attempt when the process dies before the order transaction', async () => {
    const product = await createProduct({ M: 5 })
    const attempt = await createAttempt([lineItem(product, 'M', 2)])
    const invoiceId = unique('invoice')

    await assert.rejects(
      () => run(attempt, invoiceId, {
        hooks: { afterClaim: () => { throw new Error('simulated death after attempt claim') } },
      }),
      /simulated death/,
    )

    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 0)
    assert.equal((await Product.findById(product._id)).stock.get('M'), 5)
    assert.equal((await PaymentAttempt.findById(attempt._id)).status, 'paid_pending_order')

    const retry = await run(attempt, invoiceId)
    assert.equal(retry.status, 'completed')
    assert.equal((await Product.findById(product._id)).stock.get('M'), 3)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
  })

  it('rolls back the order when the process dies immediately after creating it', async () => {
    const product = await createProduct({ M: 5 })
    const attempt = await createAttempt([lineItem(product, 'M', 2)])
    const invoiceId = unique('invoice')

    await assert.rejects(
      () => run(attempt, invoiceId, {
        hooks: { afterOrderCreated: () => { throw new Error('simulated death after order creation') } },
      }),
      /simulated death/,
    )

    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 0)
    assert.equal((await Product.findById(product._id)).stock.get('M'), 5)
    assert.equal((await PaymentAttempt.findById(attempt._id)).status, 'paid_pending_order')

    const retry = await run(attempt, invoiceId)
    assert.equal(retry.status, 'completed')
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
    assert.equal((await Product.findById(product._id)).stock.get('M'), 3)
  })

  it('rolls back stock when the process dies after the stock completion marker', async () => {
    const product = await createProduct({ M: 5 })
    const attempt = await createAttempt([lineItem(product, 'M', 2)])
    const invoiceId = unique('invoice')

    await assert.rejects(
      () => run(attempt, invoiceId, {
        hooks: { afterStockDeducted: () => { throw new Error('simulated death after stock marker') } },
      }),
      /simulated death/,
    )

    assert.equal((await Product.findById(product._id)).stock.get('M'), 5)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 0)

    const retry = await run(attempt, invoiceId)
    assert.equal(retry.status, 'completed')
    assert.equal((await Product.findById(product._id)).stock.get('M'), 3)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
  })

  it('rolls back a partial multi-item stock update and retries without double deduction', async () => {
    const first = await createProduct({ M: 5 })
    const second = await createProduct({ M: 5 })
    const attempt = await createAttempt([lineItem(first, 'M', 2), lineItem(second, 'M', 2)])
    const invoiceId = unique('invoice')

    await assert.rejects(
      () => run(attempt, invoiceId, {
        hooks: {
          afterStockItem: ({ index }) => {
            if (index === 0) throw new Error('simulated crash after first stock mutation')
          },
        },
      }),
      /simulated crash/,
    )

    assert.equal((await Product.findById(first._id)).stock.get('M'), 5)
    assert.equal((await Product.findById(second._id)).stock.get('M'), 5)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 0)
    assert.equal((await PaymentAttempt.findById(attempt._id)).status, 'paid_pending_order')

    const retry = await run(attempt, invoiceId)

    assert.equal(retry.status, 'completed')
    assert.equal((await Product.findById(first._id)).stock.get('M'), 3)
    assert.equal((await Product.findById(second._id)).stock.get('M'), 3)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
    assert.equal((await Order.findOne({ paymentAttemptId: attempt.attemptId })).stockIssues.length, 0)
  })

  it('rolls back stock and coupon together when the coupon boundary fails', async () => {
    const product = await createProduct({ M: 5 })
    const coupon = await Coupon.create({
      code: unique('SAVE').toUpperCase(),
      discountType: 'percent',
      value: 10,
      maxUses: 5,
      usedCount: 0,
    })
    const attempt = await createAttempt(
      [lineItem(product, 'M', 2)],
      { couponCode: coupon.code, couponId: coupon._id, discount: 200, total: 1800, amountToPay: 1800 },
    )
    const invoiceId = unique('invoice')

    await assert.rejects(
      () => run(attempt, invoiceId, {
        hooks: {
          afterCouponConsumed: () => { throw new Error('simulated crash after coupon mutation') },
        },
      }),
      /simulated crash/,
    )

    assert.equal((await Product.findById(product._id)).stock.get('M'), 5)
    assert.equal((await Coupon.findById(coupon._id)).usedCount, 0)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 0)
    assert.equal((await PaymentAttempt.findById(attempt._id)).status, 'paid_pending_order')

    const retry = await run(attempt, invoiceId)

    assert.equal(retry.status, 'completed')
    assert.equal((await Product.findById(product._id)).stock.get('M'), 3)
    assert.equal((await Coupon.findById(coupon._id)).usedCount, 1)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
  })

  it('does not repeat committed side effects when completion fails after commit', async () => {
    const product = await createProduct({ M: 5 })
    const coupon = await Coupon.create({
      code: unique('SAVE').toUpperCase(),
      discountType: 'percent',
      value: 10,
      maxUses: 5,
      usedCount: 0,
    })
    const attempt = await createAttempt(
      [lineItem(product, 'M', 2)],
      { couponCode: coupon.code, couponId: coupon._id, discount: 200, total: 1800, amountToPay: 1800 },
    )
    const invoiceId = unique('invoice')

    await assert.rejects(
      () => run(attempt, invoiceId, {
        hooks: {
          beforeAttemptCompleted: () => { throw new Error('simulated crash before completion marker') },
        },
      }),
      /simulated crash/,
    )

    assert.equal((await Product.findById(product._id)).stock.get('M'), 3)
    assert.equal((await Coupon.findById(coupon._id)).usedCount, 1)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
    assert.equal((await PaymentAttempt.findById(attempt._id)).status, 'paid_pending_order')

    const retry = await run(attempt, invoiceId)

    assert.equal(retry.status, 'completed')
    assert.equal((await Product.findById(product._id)).stock.get('M'), 3)
    assert.equal((await Coupon.findById(coupon._id)).usedCount, 1)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
  })

  it('finalizes a committed order when the process died before marking the attempt completed', async () => {
    const product = await createProduct({ M: 5 })
    const attempt = await createAttempt([lineItem(product, 'M', 2)])
    const invoiceId = unique('invoice')

    await assert.rejects(
      () => run(attempt, invoiceId, {
        hooks: {
          beforeAttemptCompleted: () => { throw new Error('simulated process death after commit') },
        },
      }),
      /simulated process death/,
    )

    await PaymentAttempt.updateOne(
      { _id: attempt._id },
      { $set: { status: 'processing', fulfillmentStartedAt: new Date(), fulfillmentError: null } },
    )

    const retry = await run(attempt, invoiceId)

    assert.equal(retry.status, 'completed')
    assert.equal((await Product.findById(product._id)).stock.get('M'), 3)
    assert.equal(await Order.countDocuments({ paymentAttemptId: attempt.attemptId }), 1)
    assert.equal((await PaymentAttempt.findById(attempt._id)).status, 'completed')
  })

  it('records issues for unavailable items while deducting available items exactly once', async () => {
    const available = await createProduct({ M: 5 })
    const unavailable = await createProduct({ M: 1 })
    const attempt = await createAttempt([lineItem(available, 'M', 2), lineItem(unavailable, 'M', 2)])
    const invoiceId = unique('invoice')

    const result = await run(attempt, invoiceId)
    assert.equal(result.status, 'completed')

    const order = await Order.findOne({ paymentAttemptId: attempt.attemptId })
    assert.equal(order.stockIssues.length, 1)
    assert.match(order.stockIssues[0], /Test Jersey \(M\)/)
    assert.equal((await Product.findById(available._id)).stock.get('M'), 3)
    assert.equal((await Product.findById(unavailable._id)).stock.get('M'), 1)

    const retry = await run(attempt, invoiceId)
    assert.equal(retry.status, 'already_completed')
    assert.equal((await Product.findById(available._id)).stock.get('M'), 3)
    assert.equal((await Product.findById(unavailable._id)).stock.get('M'), 1)
  })

  it('flags ambiguous legacy in-flight markers without mutating stock or coupons', async () => {
    const product = await createProduct({ M: 5 })
    const coupon = await Coupon.create({
      code: unique('SAVE').toUpperCase(),
      discountType: 'percent',
      value: 10,
      maxUses: 5,
      usedCount: 0,
    })
    const attempt = await createAttempt(
      [lineItem(product, 'M', 2)],
      { couponCode: coupon.code, couponId: coupon._id, discount: 200, total: 1800, amountToPay: 1800 },
    )
    const invoiceId = unique('invoice')
    const orderId = unique('FM-LEGACY')

    await Order.create([{
      orderId,
      paymentAttemptId: attempt.attemptId,
      couponId: coupon._id,
      couponCode: coupon.code,
      subtotal: 2000,
      total: 1800,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      stockProcessingAt: new Date(Date.now() - 60_000),
      stockDeductedAt: null,
      couponConsumptionStartedAt: new Date(Date.now() - 60_000),
      couponConsumedAt: null,
      statusHistory: [],
    }])

    await PaymentAttempt.updateOne(
      { _id: attempt._id },
      { $set: { status: 'completed', orderId, invoiceId } },
    )

    const result = await run(attempt, invoiceId)
    assert.equal(result.status, 'already_completed')

    const order = await Order.findOne({ orderId })
    assert.equal(order.stockReconciliationRequired, true)
    assert.equal(order.stockProcessingAt, null)
    assert.equal(order.couponReconciliationRequired, true)
    assert.equal(order.couponConsumptionStartedAt, null)
    assert.equal((await Product.findById(product._id)).stock.get('M'), 5)
    assert.equal((await Coupon.findById(coupon._id)).usedCount, 0)
  })

  it('treats receipt delivery as at-least-once when the marker write is interrupted', async () => {
    const product = await createProduct({ M: 5 })
    const attempt = await createAttempt([lineItem(product, 'M', 1)])
    const invoiceId = unique('invoice')
    let sends = 0

    const first = await run(attempt, invoiceId, {
      sendReceiptEmail: async () => {
        sends += 1
        return true
      },
      hooks: {
        afterReceiptSent: () => { throw new Error('simulated crash before receipt marker') },
      },
    })

    assert.equal(first.status, 'completed')
    assert.equal(sends, 1)

    let order = await Order.findOne({ paymentAttemptId: attempt.attemptId })
    assert.equal(order.receiptStatus, 'failed')
    assert.equal(order.receiptSentAt, null)

    await Order.updateOne({ _id: order._id }, { $set: { receiptNextAttemptAt: new Date(0) } })

    await run(attempt, invoiceId, {
      sendReceiptEmail: async () => {
        sends += 1
        return true
      },
    })

    order = await Order.findOne({ paymentAttemptId: attempt.attemptId })
    assert.equal(sends, 2)
    assert.equal(order.receiptStatus, 'sent')
    assert.ok(order.receiptSentAt)
  })

  it('keeps receipt retry state separate from payment completion and retries on later callbacks', async () => {
    const product = await createProduct({ M: 5 })
    const attempt = await createAttempt([lineItem(product, 'M', 1)])
    const invoiceId = unique('invoice')
    let sends = 0

    const first = await run(attempt, invoiceId, {
      sendReceiptEmail: async () => {
        sends += 1
        return false
      },
    })

    assert.equal(first.status, 'completed')
    assert.equal(first.receipt, 'failed')
    assert.equal((await PaymentAttempt.findById(attempt._id)).status, 'completed')

    let order = await Order.findOne({ paymentAttemptId: attempt.attemptId })
    assert.equal(order.receiptStatus, 'failed')
    assert.equal(order.receiptAttempts, 1)
    assert.equal(order.receiptSentAt, null)
    assert.match(order.receiptLastError, /Email delivery failed/)

    await Order.updateOne({ _id: order._id }, { $set: { receiptNextAttemptAt: new Date(0) } })

    const second = await run(attempt, invoiceId, {
      sendReceiptEmail: async () => {
        sends += 1
        return true
      },
    })

    order = await Order.findOne({ paymentAttemptId: attempt.attemptId })
    assert.equal(second.status, 'already_completed')
    assert.equal(second.receipt, 'sent')
    assert.equal(sends, 2)
    assert.equal(order.receiptStatus, 'sent')
    assert.equal(order.receiptAttempts, 2)
    assert.ok(order.receiptSentAt)
    assert.equal((await Product.findById(product._id)).stock.get('M'), 4)
  })
})
