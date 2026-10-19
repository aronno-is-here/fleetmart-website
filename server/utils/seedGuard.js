const ALLOWED_ENVIRONMENTS = ['development', 'test']

/**
 * The seed script deletes users, products, categories, and coupons before it
 * inserts demo data. Require an explicit environment and reset confirmation.
 */
export function resolveSeedPermission({
  nodeEnv = process.env.NODE_ENV,
  args = process.argv.slice(2),
  resetEnv = process.env.SEED_RESET,
} = {}) {
  if (!ALLOWED_ENVIRONMENTS.includes(nodeEnv)) {
    return {
      ok: false,
      message:
        'Refusing to seed: NODE_ENV must be explicitly set to "development" or "test" (set NODE_ENV=development).',
    }
  }

  const resetRequested = args.includes('--reset') || resetEnv === 'true'
  if (!resetRequested) {
    return {
      ok: false,
      message:
        'Refusing to seed: this permanently deletes all users, products, categories, and coupons. Re-run with --reset or SEED_RESET=true to confirm.',
    }
  }

  return { ok: true, message: 'Seed reset confirmed.' }
}
