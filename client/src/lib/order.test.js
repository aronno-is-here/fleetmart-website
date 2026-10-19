import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldClearPurchasedCart } from './order.js'
import { removePurchasedItemsFromCart } from './cart.js'

test('does not clear the cart for pending, failed or cancelled orders', () => {
  assert.equal(shouldClearPurchasedCart(null), false)
  assert.equal(shouldClearPurchasedCart({ paymentStatus: 'pending', orderStatus: 'confirmed' }), false)
  assert.equal(shouldClearPurchasedCart({ paymentStatus: 'failed', orderStatus: 'confirmed' }), false)
  assert.equal(shouldClearPurchasedCart({ paymentStatus: 'paid', orderStatus: 'cancelled' }), false)
})

test('clears only purchased lines after a confirmed paid or partial order', () => {
  const cart = [
    { key: 'prod-1-M-std', id: 'prod-1', size: 'M', qty: 1, customization: null },
    { key: 'prod-2-L-std', id: 'prod-2', size: 'L', qty: 1, customization: null },
  ]
  const order = {
    paymentStatus: 'partial',
    orderStatus: 'confirmed',
    items: [{ product: 'prod-1', size: 'M', qty: 1, customization: null }],
  }

  assert.equal(shouldClearPurchasedCart(order), true)
  assert.deepEqual(removePurchasedItemsFromCart(cart, order.items), [cart[1]])
})
