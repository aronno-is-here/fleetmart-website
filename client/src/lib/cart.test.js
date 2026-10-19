import test from 'node:test'
import assert from 'node:assert/strict'
import { removePurchasedItemsFromCart } from './cart.js'

const jersey = {
  key: 'prod-1-M-std',
  id: 'prod-1',
  name: 'Home Jersey',
  size: 'M',
  qty: 2,
  customization: null,
}

test('removes only the purchased quantity from the matching cart line', () => {
  const cart = [
    jersey,
    { ...jersey, key: 'prod-1-L-std', size: 'L', qty: 2 },
  ]

  const remaining = removePurchasedItemsFromCart(cart, [
    { product: 'prod-1', size: 'M', qty: 1 },
  ])

  assert.equal(remaining.length, 2)
  assert.equal(remaining[0].qty, 1)
  assert.equal(remaining[1].qty, 2)
})

test('removes a fully purchased line and preserves items added later', () => {
  const cart = [
    jersey,
    { key: 'prod-2-M-std', id: 'prod-2', name: 'Away Jersey', size: 'M', qty: 1, customization: null },
  ]

  const remaining = removePurchasedItemsFromCart(cart, [
    { product: 'prod-1', size: 'M', qty: 2 },
    { product: 'prod-2', size: 'M', qty: 1 },
  ])

  assert.deepEqual(remaining, [])
})

test('matches customized and non-customized lines separately', () => {
  const customized = {
    key: 'prod-3-M-TAMIM10',
    id: 'prod-3',
    name: 'Custom Jersey',
    size: 'M',
    qty: 1,
    customization: { name: 'TAMIM', number: '10' },
  }
  const standard = { ...customized, key: 'prod-3-M-std', customization: null, qty: 1 }

  const remaining = removePurchasedItemsFromCart([customized, standard], [
    { product: 'prod-3', size: 'M', qty: 1, customization: { name: 'TAMIM', number: '10' } },
  ])

  assert.equal(remaining.length, 1)
  assert.equal(remaining[0].customization, null)
})
