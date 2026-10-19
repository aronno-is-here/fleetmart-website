import mongoose from 'mongoose'

export class TransactionsUnsupportedError extends Error {
  constructor(message = 'MongoDB transactions are unavailable. A replica set or sharded cluster is required.') {
    super(message)
    this.name = 'TransactionsUnsupportedError'
    this.code = 'transactions_unsupported'
  }
}

let cachedSupport = null

export const resetTransactionSupportCache = () => {
  cachedSupport = null
}

export const transactionsSupported = async () => {
  if (cachedSupport === true) return true

  const db = mongoose.connection?.db
  if (!db) return false

  try {
    const hello = await db.admin().command({ hello: 1 })
    cachedSupport = Boolean(hello?.setName) || hello?.msg === 'isdbgrid'
  } catch {
    cachedSupport = false
  }

  return cachedSupport
}

export const transactionRunner = {
  async run(callback) {
    if (!(await transactionsSupported())) {
      throw new TransactionsUnsupportedError()
    }

    const session = await mongoose.startSession()
    try {
      let result
      await session.withTransaction(async () => {
        result = await callback(session)
      })
      return result
    } finally {
      await session.endSession()
    }
  },
}
