import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveSeedPermission } from '../utils/seedGuard.js'

test('refuses to seed when NODE_ENV is missing', () => {
  const result = resolveSeedPermission({ nodeEnv: undefined, args: ['--reset'] })
  assert.equal(result.ok, false)
  assert.match(result.message, /NODE_ENV/)
})

test('refuses to seed in production even with a reset flag', () => {
  const result = resolveSeedPermission({ nodeEnv: 'production', args: ['--reset'] })
  assert.equal(result.ok, false)
})

test('refuses a destructive reset without explicit confirmation', () => {
  const result = resolveSeedPermission({ nodeEnv: 'development', args: [] })
  assert.equal(result.ok, false)
  assert.match(result.message, /--reset/)

  const envResult = resolveSeedPermission({ nodeEnv: 'development', args: [], resetEnv: '1' })
  assert.equal(envResult.ok, false)
})

test('allows a reset in development with --reset', () => {
  const result = resolveSeedPermission({ nodeEnv: 'development', args: ['--reset'] })
  assert.equal(result.ok, true)
})

test('allows a reset in test with SEED_RESET=true', () => {
  const result = resolveSeedPermission({ nodeEnv: 'test', args: [], resetEnv: 'true' })
  assert.equal(result.ok, true)
})
