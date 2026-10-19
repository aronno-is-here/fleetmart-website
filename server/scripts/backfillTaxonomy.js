import 'dotenv/config'
import mongoose from 'mongoose'
import { runTaxonomyBackfill } from '../services/taxonomyBackfill.js'

const apply = process.argv.includes('--apply')

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI)

try {
  const result = await runTaxonomyBackfill({ apply })
  console.log(JSON.stringify(result, null, 2))
} finally {
  await mongoose.disconnect()
}
