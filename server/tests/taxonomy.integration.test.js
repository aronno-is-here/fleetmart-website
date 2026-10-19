process.env.JWT_SECRET = 'taxonomy-test-secret'

import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Brand from '../models/Brand.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Team from '../models/Team.js'
import User from '../models/User.js'
import brandRoutes from '../routes/brands.js'
import categoryRoutes from '../routes/categories.js'
import productRoutes from '../routes/products.js'
import teamRoutes from '../routes/teams.js'
import { runTaxonomyBackfill } from '../services/taxonomyBackfill.js'

const findMongod = () => {
  const command = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(command, ['mongod'], { encoding: 'utf8' })
  if (result.status !== 0) return null
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || null
}

const mongodPath = findMongod()
const skip = mongodPath ? false : 'mongod is not available on PATH'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer()
  server.unref()
  server.on('error', reject)
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address()
    server.close(() => resolve(port))
  })
})

const connectMongoose = async (uri, attempts = 40) => {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1000 })
      return
    } catch (err) {
      lastError = err
      await mongoose.disconnect().catch(() => {})
      await wait(250)
    }
  }
  throw lastError
}

describe('taxonomy integrity against an isolated database', { skip }, () => {
  let mongod
  let dbPath
  let stderr = ''
  let server
  let baseUrl
  let token
  let sequence = 0

  const unique = (prefix) => `${prefix}-${Date.now().toString(36)}-${sequence++}`

  const api = async (method, route, body) => {
    const response = await fetch(`${baseUrl}${route}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await response.text()
    let data = text
    try { data = JSON.parse(text) } catch { /* plain text */ }
    return { status: response.status, data }
  }

  const createCategory = async (name, parent = null) => {
    const result = await api('POST', '/api/categories', { name, parent })
    assert.equal(result.status, 201, JSON.stringify(result.data))
    return result.data.category
  }

  const createProduct = async (overrides = {}) => {
    const result = await api('POST', '/api/products', {
      name: 'Test Product',
      slug: unique('test-product'),
      price: 1000,
      stock: { M: 5 },
      ...overrides,
    })
    return result
  }

  before(async () => {
    dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fleetmart-taxonomy-'))
    const port = await getFreePort()

    mongod = spawn(mongodPath, [
      '--dbpath', dbPath,
      '--port', String(port),
      '--bind_ip', '127.0.0.1',
      '--wiredTigerCacheSizeGB', '0.25',
      '--quiet',
    ], { stdio: ['ignore', 'ignore', 'pipe'] })

    mongod.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
      if (stderr.length > 20_000) stderr = stderr.slice(-20_000)
    })

    await connectMongoose(`mongodb://127.0.0.1:${port}/fleetmart_taxonomy_test`)
    await Promise.all([
      Category.init(),
      Product.init(),
      Brand.init(),
      Team.init(),
      User.init(),
    ])

    const app = express()
    app.use(express.json())
    app.use('/api/categories', categoryRoutes)
    app.use('/api/products', productRoutes)
    app.use('/api/brands', brandRoutes)
    app.use('/api/teams', teamRoutes)
    app.use((err, _req, res, _next) => {
      res.status(err.status || 500).json({ message: err.message })
    })

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve)
    })
    baseUrl = `http://127.0.0.1:${server.address().port}`
  })

  after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await mongoose.connection.dropDatabase().catch(() => {})
    await mongoose.disconnect().catch(() => {})
    if (mongod) {
      mongod.kill()
      await wait(500)
    }
    if (dbPath) {
      try { fs.rmSync(dbPath, { recursive: true, force: true }) } catch { /* mongod may still hold files */ }
    }
  })

  beforeEach(async () => {
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Brand.deleteMany({}),
      Team.deleteMany({}),
      User.deleteMany({}),
    ])
    const admin = await User.create({
      name: 'Taxonomy Admin',
      email: 'taxonomy-admin@example.com',
      password: 'password123',
      role: 'admin',
    })
    token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
    sequence = 0
  })

  it('derives the full category path on create and update instead of trusting the client', async () => {
    const root = await createCategory('Jerseys')
    const child = await createCategory('Club', root._id)
    const leaf = await createCategory('Premier', child._id)
    const boots = await createCategory('Boots')

    const created = await createProduct({
      category: leaf.id,
      categoryPath: ['client-supplied'],
    })
    assert.equal(created.status, 201, JSON.stringify(created.data))
    assert.equal(created.data.product.category, leaf.id)
    assert.deepEqual(created.data.product.categoryPath, [root.id, child.id, leaf.id])

    const updated = await api('PUT', `/api/products/${created.data.product._id}`, {
      category: boots.id,
      categoryPath: [leaf.id],
    })
    assert.equal(updated.status, 200, JSON.stringify(updated.data))
    assert.equal(updated.data.product.category, boots.id)
    assert.deepEqual(updated.data.product.categoryPath, [boots.id])

    await Product.findByIdAndUpdate(created.data.product._id, {
      category: leaf.id,
      categoryPath: [],
    })
    const repaired = await api('PUT', `/api/products/${created.data.product._id}`, { name: 'Renamed Kit' })
    assert.equal(repaired.status, 200, JSON.stringify(repaired.data))
    assert.equal(repaired.data.product.category, leaf.id)
    assert.deepEqual(repaired.data.product.categoryPath, [root.id, child.id, leaf.id])
  })

  it('rejects missing, unknown and cyclic category references', async () => {
    const root = await createCategory('Jerseys')
    const child = await createCategory('Club', root._id)

    const missing = await createProduct({ category: '' })
    assert.equal(missing.status, 400)

    const unknown = await createProduct({ category: 'does-not-exist' })
    assert.equal(unknown.status, 400)
    assert.match(unknown.data.message, /not found/i)

    await Category.findByIdAndUpdate(root._id, { parent: child._id })
    const cyclic = await createProduct({ category: child.id })
    assert.equal(cyclic.status, 400)
    assert.match(cyclic.data.message, /cycle/i)
  })

  it('filters a parent category across descendants and legacy category-only products', async () => {
    const root = await createCategory('Jerseys')
    const child = await createCategory('Club', root._id)
    const otherRoot = await createCategory('Boots')

    const modern = await createProduct({ category: child.id, name: 'Modern Kit' })
    assert.equal(modern.status, 201, JSON.stringify(modern.data))

    await Product.create({
      name: 'Legacy Kit',
      slug: unique('legacy-kit'),
      category: child.id,
      categoryPath: [],
      price: 900,
      stock: { M: 2 },
    })
    await Product.create({
      name: 'Boot Product',
      slug: unique('boot-product'),
      category: otherRoot.id,
      categoryPath: [otherRoot.id],
      price: 800,
      stock: { M: 2 },
    })

    const byParent = await api('GET', `/api/products?category=${root.id}`)
    assert.equal(byParent.status, 200)
    assert.equal(byParent.data.total, 2)
    assert.deepEqual(
      byParent.data.products.map((product) => product.name).sort(),
      ['Legacy Kit', 'Modern Kit'],
    )

    const searched = await api('GET', `/api/products?category=${root.id}&search=Legacy`)
    assert.equal(searched.status, 200)
    assert.equal(searched.data.total, 1)
    assert.equal(searched.data.products[0].name, 'Legacy Kit')
  })

  it('blocks deletion when descendants or legacy product references exist', async () => {
    const root = await createCategory('Jerseys')
    const child = await createCategory('Club', root._id)
    const created = await createProduct({ category: child.id })
    assert.equal(created.status, 201, JSON.stringify(created.data))

    const blockedChild = await api('DELETE', `/api/categories/${child._id}`)
    assert.equal(blockedChild.status, 400)
    assert.match(blockedChild.data.message, /product/i)

    const blockedRoot = await api('DELETE', `/api/categories/${root._id}`)
    assert.equal(blockedRoot.status, 400)
    assert.match(blockedRoot.data.message, /subcategor/i)

    await api('DELETE', `/api/products/${created.data.product._id}`)
    await Product.create({
      name: 'Legacy Reference',
      slug: unique('legacy-reference'),
      category: child.id,
      categoryPath: [],
      price: 500,
    })

    const blockedLegacy = await api('DELETE', `/api/categories/${child._id}`)
    assert.equal(blockedLegacy.status, 400)
    assert.match(blockedLegacy.data.message, /product/i)
  })

  it('keeps category ids stable on rename and repairs descendant and product paths on reparent', async () => {
    const firstRoot = await createCategory('Jerseys')
    const secondRoot = await createCategory('Boots')
    const child = await createCategory('Club', firstRoot._id)
    const leaf = await createCategory('Premier', child._id)
    const created = await createProduct({ category: leaf.id })
    assert.equal(created.status, 201, JSON.stringify(created.data))

    const renamed = await api('PUT', `/api/categories/${child._id}`, { name: 'Club Kits' })
    assert.equal(renamed.status, 200, JSON.stringify(renamed.data))
    assert.equal(renamed.data.category.name, 'Club Kits')
    assert.equal(renamed.data.category.id, child.id)

    const moved = await api('PUT', `/api/categories/${child._id}`, { parent: secondRoot._id })
    assert.equal(moved.status, 200, JSON.stringify(moved.data))
    assert.equal(moved.data.category.path, `/${secondRoot._id}/`)
    assert.equal(moved.data.category.level, 1)

    const movedLeaf = await Category.findById(leaf._id)
    assert.equal(movedLeaf.path, `/${secondRoot._id}/${child._id}/`)
    assert.equal(movedLeaf.level, 2)

    const product = await Product.findById(created.data.product._id)
    assert.deepEqual(product.categoryPath, [secondRoot.id, child.id, leaf.id])

    const oldParent = await Category.findById(firstRoot._id)
    const newParent = await Category.findById(secondRoot._id)
    assert.equal(oldParent.blurb, '')
    assert.equal(newParent.blurb, 'Club Kits')
  })

  it('rejects self and descendant parents', async () => {
    const root = await createCategory('Jerseys')
    const child = await createCategory('Club', root._id)
    const leaf = await createCategory('Premier', child._id)

    const self = await api('PUT', `/api/categories/${root._id}`, { parent: root._id })
    assert.equal(self.status, 400)

    const descendant = await api('PUT', `/api/categories/${root._id}`, { parent: leaf._id })
    assert.equal(descendant.status, 400)
    assert.match(descendant.data.message, /descendant/i)
  })

  it('keeps brand and team slugs stable across renames and blocks referenced deletion', async () => {
    const brand = await api('POST', '/api/brands', { name: 'Fleetmart Pro' })
    assert.equal(brand.status, 201, JSON.stringify(brand.data))
    const team = await api('POST', '/api/teams', { name: 'Omega FC' })
    assert.equal(team.status, 201, JSON.stringify(team.data))

    const root = await createCategory('Jerseys')
    const created = await createProduct({
      category: root.id,
      brand: brand.data.brand.slug,
      team: team.data.team.slug,
    })
    assert.equal(created.status, 201, JSON.stringify(created.data))

    const legacy = await Product.create({
      name: 'Legacy Brand Product',
      slug: unique('legacy-brand-product'),
      category: root.id,
      categoryPath: [root.id],
      brand: 'Fleetmart Pro',
      team: 'Omega FC',
      price: 1000,
    })

    const renamedBrand = await api('PUT', `/api/brands/${brand.data.brand._id}`, { name: 'Fleetmart Elite' })
    assert.equal(renamedBrand.status, 200)
    assert.equal(renamedBrand.data.brand.slug, brand.data.brand.slug)

    const renamedTeam = await api('PUT', `/api/teams/${team.data.team._id}`, { name: 'Omega United' })
    assert.equal(renamedTeam.status, 200)
    assert.equal(renamedTeam.data.team.slug, team.data.team.slug)

    const byBrand = await api('GET', `/api/products?brand=${brand.data.brand.slug}`)
    assert.equal(byBrand.data.total, 2)

    const byTeam = await api('GET', `/api/products?team=${team.data.team.slug}`)
    assert.equal(byTeam.data.total, 2)

    const product = await Product.findById(created.data.product._id)
    assert.equal(product.brand, brand.data.brand.slug)
    assert.equal(product.team, team.data.team.slug)

    const migratedLegacy = await Product.findById(legacy._id)
    assert.equal(migratedLegacy.brand, brand.data.brand.slug)
    assert.equal(migratedLegacy.team, team.data.team.slug)

    const brandDelete = await api('DELETE', `/api/brands/${brand.data.brand._id}`)
    assert.equal(brandDelete.status, 400)
    const teamDelete = await api('DELETE', `/api/teams/${team.data.team._id}`)
    assert.equal(teamDelete.status, 400)
  })

  it('generates non-empty unique ids for non-Latin category names', async () => {
    const first = await createCategory('জার্সি')
    const second = await createCategory('জার্সি')

    assert.equal(first.id, 'category')
    assert.equal(second.id, 'category-1')
    assert.notEqual(first._id, second._id)

    const ascii = await createCategory('Club Jerseys')
    assert.equal(ascii.id, 'club-jerseys')
  })

  it('refreshes auto blurbs when enabled and after bulk reorder', async () => {
    const rootResult = await api('POST', '/api/categories', {
      name: 'Jerseys',
      blurb: 'Manual blurb',
      autoBlurb: false,
    })
    assert.equal(rootResult.status, 201, JSON.stringify(rootResult.data))
    const root = rootResult.data.category

    const club = await createCategory('Club', root._id)
    let stored = await Category.findById(root._id)
    assert.equal(stored.blurb, 'Manual blurb')

    const enabled = await api('PUT', `/api/categories/${root._id}`, { autoBlurb: true })
    assert.equal(enabled.status, 200, JSON.stringify(enabled.data))
    assert.equal(enabled.data.category.blurb, 'Club')

    const national = await createCategory('National', root._id)
    stored = await Category.findById(root._id)
    assert.equal(stored.blurb, 'Club · National')

    const reordered = await api('PUT', '/api/categories/reorder/bulk', {
      items: [
        { id: national._id, displayOrder: 0 },
        { id: club._id, displayOrder: 1 },
      ],
    })
    assert.equal(reordered.status, 200, JSON.stringify(reordered.data))

    stored = await Category.findById(root._id)
    assert.equal(stored.blurb, 'National · Club')
  })

  it('backfills legacy taxonomy data only when applied and is idempotent', async () => {
    const root = await createCategory('Jerseys')
    const child = await createCategory('Club', root._id)
    await Category.findByIdAndUpdate(child._id, { path: '/wrong/', level: 7 })

    const brand = await api('POST', '/api/brands', { name: 'Fleetmart Pro' })
    assert.equal(brand.status, 201, JSON.stringify(brand.data))
    await Team.create({ name: 'Omega FC', slug: 'omega' })

    const product = await Product.create({
      name: 'Legacy Product',
      slug: unique('legacy-product'),
      category: child.id,
      categoryPath: [],
      brand: 'Fleetmart Pro',
      team: 'Omega FC',
      price: 1000,
      stock: { M: 1 },
    })
    await Product.create({
      name: 'Unknown Brand Product',
      slug: unique('unknown-brand-product'),
      category: child.id,
      categoryPath: [root.id, child.id],
      brand: 'Unknown Brand',
      team: 'Unknown Team',
      price: 1000,
      stock: { M: 1 },
    })
    await Brand.create([
      { name: 'Twin Brand', slug: 'twin-a' },
      { name: 'Twin Brand', slug: 'twin-b' },
    ])
    await Product.create({
      name: 'Ambiguous Brand Product',
      slug: unique('ambiguous-brand-product'),
      category: child.id,
      categoryPath: [root.id, child.id],
      brand: 'Twin Brand',
      price: 1000,
      stock: { M: 1 },
    })

    const dryRun = await runTaxonomyBackfill({ apply: false })
    assert.equal(dryRun.apply, false)
    assert.ok(dryRun.fixes.categories >= 1)
    assert.ok(dryRun.fixes.productCategoryPaths >= 1)
    assert.ok(dryRun.fixes.productBrands >= 1)
    assert.ok(dryRun.fixes.productTeams >= 1)
    assert.equal(dryRun.applied.categories, 0)
    assert.equal(dryRun.applied.products, 0)
    assert.ok(dryRun.unresolved.some((issue) => issue.type === 'product-brand-unresolved'))
    assert.ok(dryRun.unresolved.some((issue) => issue.type === 'product-team-unresolved'))
    assert.ok(dryRun.ambiguous.some((issue) => issue.type === 'product-brand-ambiguous'))

    const untouchedCategory = await Category.findById(child._id)
    const untouchedProduct = await Product.findById(product._id)
    assert.equal(untouchedCategory.path, '/wrong/')
    assert.deepEqual(untouchedProduct.categoryPath, [])
    assert.equal(untouchedProduct.brand, 'Fleetmart Pro')

    const applied = await runTaxonomyBackfill({ apply: true })
    assert.equal(applied.applied.categories, 1)
    assert.equal(applied.applied.products, 1)

    const fixedCategory = await Category.findById(child._id)
    const fixedProduct = await Product.findById(product._id)
    assert.equal(fixedCategory.path, `/${root._id}/`)
    assert.equal(fixedCategory.level, 1)
    assert.deepEqual(fixedProduct.categoryPath, [root.id, child.id])
    assert.equal(fixedProduct.brand, brand.data.brand.slug)
    assert.equal(fixedProduct.team, 'omega')

    const secondRun = await runTaxonomyBackfill({ apply: false })
    assert.equal(secondRun.fixes.categories, 0)
    assert.equal(secondRun.fixes.products, 0)
    assert.equal(secondRun.fixes.categoryPaths, 0)
    assert.equal(secondRun.fixes.productCategoryPaths, 0)
    assert.equal(secondRun.fixes.productBrands, 0)
    assert.equal(secondRun.fixes.productTeams, 0)
  })
})
