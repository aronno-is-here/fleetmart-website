import test from 'node:test'
import assert from 'node:assert/strict'
import { gatewayUrl } from '../services/uddoktapay.js'

test('gateway URL follows the documented /api base path', () => {
  process.env.UDDOKTAPAY_BASE_URL = 'https://sandbox.uddoktapay.com'
  assert.equal(gatewayUrl('/verify-payment'), 'https://sandbox.uddoktapay.com/api/verify-payment')
  assert.equal(gatewayUrl('checkout-v2'), 'https://sandbox.uddoktapay.com/api/checkout-v2')
})

test('gateway URL does not duplicate an existing /api suffix or trailing slash', () => {
  process.env.UDDOKTAPAY_BASE_URL = 'https://pay.example.com/api/'
  assert.equal(gatewayUrl('/verify-payment'), 'https://pay.example.com/api/verify-payment')
})
