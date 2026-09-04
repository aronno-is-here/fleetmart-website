import Category from '../models/Category.js'
import Brand from '../models/Brand.js'
import Team from '../models/Team.js'
import seedTaxonomy from '../utils/seedTaxonomy.js'

let seeded = false

export default async function ensureTaxonomy() {
  if (seeded) return

  try {
    const [catCount, brandCount, teamCount] = await Promise.all([
      Category.countDocuments(),
      Brand.countDocuments(),
      Team.countDocuments(),
    ])

    if (catCount === 0 || brandCount === 0 || teamCount === 0) {
      await seedTaxonomy()
      seeded = true
    } else {
      seeded = true
    }
  } catch (err) {
    console.error('ensureTaxonomy error:', err.message)
  }
}
