import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PARTIAL_PAYMENT_AMOUNT,
  calculateAmountToPay,
  calculateOnlineTotal,
} from './checkout.js'

test('online total subtracts the coupon discount and never goes below zero', () => {
  assert.equal(calculateOnlineTotal(1000, 250), 750)
  assert.equal(calculateOnlineTotal(200, 500), 0)
  assert.equal(calculateOnlineTotal('1000', '100'), 900)
})

test('partial payment is capped at the online payable total below 300', () => {
  assert.equal(calculateAmountToPay('partial', 250), 250)
  assert.equal(calculateAmountToPay('full', 250), 250)
})

test('partial payment uses the 300 minimum above the threshold', () => {
  assert.equal(calculateAmountToPay('partial', 1000), PARTIAL_PAYMENT_AMOUNT)
  assert.equal(calculateAmountToPay('full', 1000), 1000)
})
