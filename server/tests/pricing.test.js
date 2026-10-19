import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CUSTOMIZATION_FEE,
  PARTIAL_PAYMENT_AMOUNT,
  STANDARD_SHIPPING_FEE,
  PricingError,
  calculatePaymentTotals,
  effectiveUnitPrice,
  evaluateCoupon,
  normalizeCustomization,
} from '../services/pricing.js'

const regularProduct = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Regular Jersey',
  slug: 'regular-jersey',
  price: 1000,
  discountPrice: null,
  customizable: false,
}

const discountedProduct = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Discounted Jersey',
  slug: 'discounted-jersey',
  price: 1000,
  discountPrice: 800,
  customizable: false,
}

const customizableProduct = {
  _id: '507f1f77bcf86cd799439013',
  name: 'Custom Jersey',
  slug: 'custom-jersey',
  price: 900,
  discountPrice: null,
  customizable: true,
}

const baseCoupon = {
  _id: 'coupon-1',
  code: 'GEARUP10',
  discountType: 'percent',
  value: 10,
  minOrder: 0,
  maxUses: 0,
  usedCount: 0,
  expiresAt: null,
  isActive: true,
}

test('effectiveUnitPrice uses regular price for invalid or non-discounted values', () => {
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: null }), 1000)
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: 1000 }), 1000)
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: 1200 }), 1000)
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: -50 }), 1000)
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: 'invalid' }), 1000)
})

test('effectiveUnitPrice accepts a valid discount price including zero', () => {
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: 750 }), 750)
  assert.equal(effectiveUnitPrice({ price: 1000, discountPrice: 0 }), 0)
})

test('effectiveUnitPrice rejects invalid product prices', () => {
  assert.throws(() => effectiveUnitPrice({ price: -1 }), PricingError)
  assert.throws(() => effectiveUnitPrice({ price: 'invalid' }), PricingError)
})

test('normalizeCustomization only accepts explicitly valid name and number on customizable products', () => {
  assert.deepEqual(
    normalizeCustomization(customizableProduct, { name: ' tamim ', number: ' 10 ' }),
    { name: 'TAMIM', number: '10' },
  )
  assert.equal(normalizeCustomization(customizableProduct, { name: 'TAMIM' }), null)
  assert.equal(normalizeCustomization(customizableProduct, { number: '10' }), null)
  assert.equal(normalizeCustomization(customizableProduct, { name: 'TAMIM', number: '999' }), null)
  assert.equal(normalizeCustomization(regularProduct, { name: 'TAMIM', number: '10' }), null)
})

test('quantity is floored, invalid values fall back to one', () => {
  const result = calculatePaymentTotals({
    items: [{ product: regularProduct._id, qty: 2.9 }],
    products: [regularProduct],
  })
  assert.equal(result.validatedItems[0].qty, 2)
  assert.equal(result.subtotal, 2000)

  const invalid = calculatePaymentTotals({
    items: [{ product: regularProduct._id, qty: -5 }],
    products: [regularProduct],
  })
  assert.equal(invalid.validatedItems[0].qty, 1)
})

test('regular and discounted products are priced from the database values, not client prices', () => {
  const result = calculatePaymentTotals({
    items: [
      { product: regularProduct._id, qty: 2, price: 1 },
      { product: discountedProduct._id, qty: 1, price: 1 },
    ],
    products: [regularProduct, discountedProduct],
    paymentType: 'full',
  })

  assert.equal(result.subtotal, 2800)
  assert.equal(result.shippingFee, STANDARD_SHIPPING_FEE)
  assert.equal(result.total, 2800)
  assert.equal(result.amountToPay, 2800)
  assert.deepEqual(result.validatedItems.map((item) => item.price), [1000, 800])
})

test('customization fee applies per unit only to valid customization', () => {
  const result = calculatePaymentTotals({
    items: [{
      product: customizableProduct._id,
      qty: 2,
      customization: { name: 'Tamim', number: '10' },
    }],
    products: [customizableProduct],
  })

  assert.equal(result.subtotal, (900 + CUSTOMIZATION_FEE) * 2)
  assert.equal(result.validatedItems[0].customization.name, 'TAMIM')
  assert.equal(result.validatedItems[0].price, 1150)
})

test('invalid or partial customization does not add a hidden fee', () => {
  const partial = calculatePaymentTotals({
    items: [{ product: customizableProduct._id, qty: 1, customization: { name: 'Tamim' } }],
    products: [customizableProduct],
  })
  const onNonCustomizable = calculatePaymentTotals({
    items: [{ product: regularProduct._id, qty: 1, customization: { name: 'Tamim', number: '10' } }],
    products: [regularProduct],
  })

  assert.equal(partial.validatedItems[0].price, 900)
  assert.equal(onNonCustomizable.validatedItems[0].price, 1000)
})

test('coupon evaluation clamps flat and percent discounts to the subtotal', () => {
  assert.deepEqual(
    evaluateCoupon({ ...baseCoupon, discountType: 'flat', value: 5000 }, 2000),
    { ok: true, discount: 2000 },
  )
  assert.deepEqual(evaluateCoupon(baseCoupon, 1000), { ok: true, discount: 100 })
})

test('coupon evaluation enforces expiry, usage limit and minimum order', () => {
  assert.deepEqual(
    evaluateCoupon({ ...baseCoupon, expiresAt: new Date('2020-01-01') }, 1000),
    { ok: false, message: 'Coupon expired' },
  )
  assert.deepEqual(
    evaluateCoupon({ ...baseCoupon, maxUses: 5, usedCount: 5 }, 1000),
    { ok: false, message: 'Coupon usage limit reached' },
  )
  assert.deepEqual(
    evaluateCoupon({ ...baseCoupon, minOrder: 2000 }, 1000),
    { ok: false, message: 'Minimum order ৳2000 required' },
  )
})

test('calculatePaymentTotals rejects an invalid coupon instead of silently charging full price', () => {
  assert.throws(
    () => calculatePaymentTotals({
      items: [{ product: regularProduct._id, qty: 1 }],
      products: [regularProduct],
      couponCode: 'MISSING',
      coupon: null,
    }),
    (err) => err instanceof PricingError && err.message === 'Invalid coupon code',
  )
})

test('calculatePaymentTotals applies coupon after customization and stores server totals', () => {
  const result = calculatePaymentTotals({
    items: [{
      product: customizableProduct._id,
      qty: 2,
      customization: { name: 'Tamim', number: '10' },
    }],
    products: [customizableProduct],
    couponCode: 'GEARUP10',
    coupon: baseCoupon,
  })

  assert.equal(result.subtotal, 2300)
  assert.equal(result.discount, 230)
  assert.equal(result.total, 2070)
  assert.equal(result.couponCode, 'GEARUP10')
  assert.equal(result.couponId, 'coupon-1')
})

test('partial payment is capped at the online payable total below 300', () => {
  const result = calculatePaymentTotals({
    items: [{ product: regularProduct._id, qty: 1, price: 1 }],
    products: [{ ...regularProduct, price: 250 }],
    paymentType: 'partial',
  })

  assert.equal(result.total, 250)
  assert.equal(result.amountToPay, 250)
})

test('partial payment uses the 300 minimum when the total is larger', () => {
  const result = calculatePaymentTotals({
    items: [{ product: regularProduct._id, qty: 1 }],
    products: [regularProduct],
    paymentType: 'partial',
  })

  assert.equal(result.total, 1000)
  assert.equal(result.amountToPay, PARTIAL_PAYMENT_AMOUNT)
})

test('delivery is recorded but excluded from the online payable total', () => {
  const result = calculatePaymentTotals({
    items: [{ product: regularProduct._id, qty: 1 }],
    products: [regularProduct],
  })

  assert.equal(result.shippingFee, STANDARD_SHIPPING_FEE)
  assert.equal(result.total, 1000)
  assert.equal(result.amountToPay, 1000)
})

test('missing products are rejected rather than producing a zero-value order', () => {
  assert.throws(
    () => calculatePaymentTotals({
      items: [{ product: '507f1f77bcf86cd799439099', qty: 1 }],
      products: [regularProduct],
    }),
    (err) => err instanceof PricingError && err.message === 'One or more products are unavailable',
  )
})
