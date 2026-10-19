import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Brand from '../models/Brand.js'
import Team from '../models/Team.js'
import {
  buildCategoryIndex,
  resolveCategoryPath,
  sameStringArray,
} from './taxonomy.js'

function nameLookup(items) {
  const lookup = new Map()
  for (const item of items) {
    const key = item.name?.trim().toLowerCase()
    if (!key) continue
    if (!lookup.has(key)) lookup.set(key, [])
    lookup.get(key).push(item)
  }
  return lookup
}

function resolveNamedReference(value, bySlug, byName) {
  if (bySlug.has(value)) return { ok: true, slug: value }
  const matches = byName.get(value.trim().toLowerCase()) || []
  if (matches.length === 1) return { ok: true, slug: matches[0].slug, legacy: true }
  if (matches.length > 1) return { ok: false, reason: 'ambiguous', matches: matches.map((item) => item.slug) }
  return { ok: false, reason: 'not-found' }
}

export async function runTaxonomyBackfill({ apply = false } = {}) {
  const [categories, products, brands, teams] = await Promise.all([
    Category.find().lean(),
    Product.find().lean(),
    Brand.find().lean(),
    Team.find().lean(),
  ])

  const index = buildCategoryIndex(categories)
  const categoryUpdates = new Map()
  const productUpdates = new Map()
  const issues = []
  const unresolved = []
  const ambiguous = []
  const fixes = {
    categoryPaths: 0,
    productCategoryPaths: 0,
    productBrands: 0,
    productTeams: 0,
  }
  let categoryFixes = 0
  let productFixes = 0

  const queueCategory = (category, set) => {
    const key = String(category._id)
    const existing = categoryUpdates.get(key) || { id: category._id, set: {} }
    Object.assign(existing.set, set)
    categoryUpdates.set(key, existing)
  }

  const queueProduct = (product, set) => {
    const key = String(product._id)
    const existing = productUpdates.get(key) || { id: product._id, set: {} }
    Object.assign(existing.set, set)
    productUpdates.set(key, existing)
  }

  for (const duplicate of index.duplicateSlugs) {
    const issue = { type: 'duplicate-category-id', id: duplicate }
    issues.push(issue)
    ambiguous.push(issue)
  }

  for (const category of categories) {
    const resolved = resolveCategoryPath(index, category)
    if (!resolved.ok) {
      const issue = {
        type: resolved.reason === 'cycle' ? 'category-cycle' : 'category-missing-parent',
        category: category.id,
        objectId: String(category._id),
      }
      if (resolved.missingParentId) issue.missingParentId = resolved.missingParentId
      issues.push(issue)
      unresolved.push(issue)
      continue
    }

    if (category.path !== resolved.storedPath || category.level !== resolved.level) {
      queueCategory(category, { path: resolved.storedPath, level: resolved.level })
      fixes.categoryPaths++
    }
  }

  const brandsBySlug = new Map(brands.map((brand) => [brand.slug, brand]))
  const teamsBySlug = new Map(teams.map((team) => [team.slug, team]))
  const brandsByName = nameLookup(brands)
  const teamsByName = nameLookup(teams)

  for (const product of products) {
    const reference = typeof product.category === 'string' ? product.category.trim() : ''
    if (!reference) {
      const issue = { type: 'product-category-missing', product: product.slug }
      issues.push(issue)
      unresolved.push(issue)
    } else {
      const resolved = resolveCategoryPath(index, reference)
      if (!resolved.ok) {
        const issue = {
          type: `product-category-${resolved.reason}`,
          product: product.slug,
          category: reference,
        }
        if (resolved.missingParentId) issue.missingParentId = resolved.missingParentId
        issues.push(issue)
        unresolved.push(issue)
      } else {
        const categoryId = resolved.category.id
        const categoryPath = resolved.path
        if (product.category !== categoryId) {
          queueProduct(product, { category: categoryId })
        }
        if (!sameStringArray(product.categoryPath, categoryPath)) {
          queueProduct(product, { categoryPath })
          fixes.productCategoryPaths++
        }
      }
    }

    if (product.brand) {
      const resolved = resolveNamedReference(product.brand, brandsBySlug, brandsByName)
      if (resolved.ok) {
        if (product.brand !== resolved.slug) {
          queueProduct(product, { brand: resolved.slug })
          fixes.productBrands++
        }
      } else {
        const issue = {
          type: resolved.reason === 'ambiguous' ? 'product-brand-ambiguous' : 'product-brand-unresolved',
          product: product.slug,
          brand: product.brand,
        }
        if (resolved.matches) issue.matches = resolved.matches
        issues.push(issue)
        if (resolved.reason === 'ambiguous') ambiguous.push(issue)
        else unresolved.push(issue)
      }
    }

    if (product.team) {
      const resolved = resolveNamedReference(product.team, teamsBySlug, teamsByName)
      if (resolved.ok) {
        if (product.team !== resolved.slug) {
          queueProduct(product, { team: resolved.slug })
          fixes.productTeams++
        }
      } else {
        const issue = {
          type: resolved.reason === 'ambiguous' ? 'product-team-ambiguous' : 'product-team-unresolved',
          product: product.slug,
          team: product.team,
        }
        if (resolved.matches) issue.matches = resolved.matches
        issues.push(issue)
        if (resolved.reason === 'ambiguous') ambiguous.push(issue)
        else unresolved.push(issue)
      }
    }
  }

  categoryFixes = categoryUpdates.size
  productFixes = productUpdates.size

  const categoryOps = [...categoryUpdates.values()].map((entry) => ({
    updateOne: {
      filter: { _id: entry.id },
      update: { $set: entry.set },
    },
  }))
  const productOps = [...productUpdates.values()].map((entry) => ({
    updateOne: {
      filter: { _id: entry.id },
      update: { $set: entry.set },
    },
  }))

  if (apply) {
    if (categoryOps.length) await Category.bulkWrite(categoryOps)
    if (productOps.length) await Product.bulkWrite(productOps)
  }

  return {
    apply,
    scanned: {
      categories: categories.length,
      products: products.length,
      brands: brands.length,
      teams: teams.length,
    },
    fixes: {
      ...fixes,
      categories: categoryFixes,
      products: productFixes,
    },
    applied: {
      categories: apply ? categoryOps.length : 0,
      products: apply ? productOps.length : 0,
    },
    issues,
    unresolved,
    ambiguous,
  }
}
