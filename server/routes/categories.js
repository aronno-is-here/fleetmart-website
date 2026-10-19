import { Router } from 'express'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'
import {
  buildCategoryIndex,
  buildCategoryProductCounts,
  getDescendants,
  resolveCategoryPath,
  sameStringArray,
} from '../services/taxonomy.js'

const router = Router()

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function generateUniqueSlug(name, excludeId = null) {
  let slug = toSlug(name)
  let existing = await Category.findOne({ id: slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
  let counter = 1
  while (existing) {
    slug = `${toSlug(name)}-${counter}`
    existing = await Category.findOne({ id: slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    counter++
  }
  return slug
}

async function autoGenerateBlurb(categoryId) {
  const children = await Category.find({ parent: categoryId, isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .select('name')
  if (children.length > 0) {
    return children.map(c => c.name).join(' · ')
  }
  return ''
}

async function loadCategoryIndex() {
  const categories = await Category.find()
  return buildCategoryIndex(categories)
}

async function cascadePathUpdate(category) {
  const index = await loadCategoryIndex()
  const current = index.byObjectId.get(String(category._id))
  if (!current) return

  const byId = new Map([[String(current._id), current]])
  const descendants = getDescendants(index, current)
  for (const descendant of descendants) byId.set(String(descendant._id), descendant)

  const ops = []
  for (const descendant of descendants) {
    const parent = byId.get(String(descendant.parent))
    if (!parent) continue

    descendant.path = `${parent.path}${parent._id}/`
    descendant.level = parent.level + 1
    ops.push({
      updateOne: {
        filter: { _id: descendant._id },
        update: { $set: { path: descendant.path, level: descendant.level } },
      },
    })
  }

  if (ops.length) await Category.bulkWrite(ops)
}

async function cascadeProductCategoryPath(category) {
  const index = await loadCategoryIndex()
  const current = index.byObjectId.get(String(category._id))
  if (!current) return

  const family = [current, ...getDescendants(index, current)]
  const references = [...new Set(family.flatMap((item) => [item.id, String(item._id)]))]
  const products = await Product.find({
    $or: [
      { category: { $in: references } },
      { categoryPath: { $in: references } },
    ],
  })

  const ops = []
  for (const product of products) {
    const resolved = resolveCategoryPath(index, product.category)
    if (!resolved.ok) continue

    if (product.category !== resolved.category.id || !sameStringArray(product.categoryPath, resolved.path)) {
      ops.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              category: resolved.category.id,
              categoryPath: resolved.path,
            },
          },
        },
      })
    }
  }

  if (ops.length) await Product.bulkWrite(ops)
}

async function refreshParentBlurb(parentId) {
  if (!parentId) return
  const parent = await Category.findById(parentId)
  if (parent?.autoBlurb) {
    parent.blurb = await autoGenerateBlurb(parent._id)
    await parent.save()
  }
}

function buildTree(categories, parentId = null) {
  return categories
    .filter(c => {
      const cParent = c.parent ? c.parent.toString() : null
      return cParent === (parentId ? parentId.toString() : null)
    })
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
    .map(c => ({
      _id: c._id,
      id: c.id,
      name: c.name,
      blurb: c.blurb,
      autoBlurb: c.autoBlurb,
      image: c.image,
      parent: c.parent,
      path: c.path,
      level: c.level,
      displayOrder: c.displayOrder,
      isActive: c.isActive,
      isHero: c.isHero,
      isKitBuilder: c.isKitBuilder,
      isTurfInstallation: c.isTurfInstallation,
      children: buildTree(categories, c._id),
    }))
}

// GET /api/categories — public, flat active list (backward compatible)
router.get('/', async (_req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 })
    res.json({ categories })
  } catch (err) { next(err) }
})

// GET /api/categories/all — admin, all categories including inactive
router.get('/all', protect, adminOnly, async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 })
    res.json({ categories })
  } catch (err) { next(err) }
})

// GET /api/categories/tree — public, hierarchical tree of active categories
router.get('/tree', async (_req, res, next) => {
  try {
    const all = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 })
    const tree = buildTree(all, null)
    res.json({ categories: tree })
  } catch (err) { next(err) }
})

// GET /api/categories/tree/all — admin, full tree including inactive
router.get('/tree/all', protect, adminOnly, async (_req, res, next) => {
  try {
    const all = await Category.find().sort({ displayOrder: 1, name: 1 })
    const tree = buildTree(all, null)
    res.json({ categories: tree })
  } catch (err) { next(err) }
})

// GET /api/categories/children/:parentId — public, children of a category
router.get('/children/:parentId', async (req, res, next) => {
  try {
    const children = await Category.find({ parent: req.params.parentId, isActive: true })
      .sort({ displayOrder: 1, name: 1 })
    res.json({ categories: children })
  } catch (err) { next(err) }
})

// GET /api/categories/counts — public, descendant-aware active product counts
router.get('/counts', async (_req, res, next) => {
  try {
    const [categories, products] = await Promise.all([
      Category.find().select('_id id parent isActive'),
      Product.find({ isActive: true }).select('category categoryPath isActive'),
    ])
    const counts = buildCategoryProductCounts(categories, products)
    const publicCounts = {}
    for (const category of categories) {
      if (category.isActive) publicCounts[category.id] = counts[category.id] || 0
    }
    res.json({ counts: publicCounts })
  } catch (err) { next(err) }
})

// POST /api/categories — admin, create category (auto-generate slug from name)
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, blurb, autoBlurb, image, parent, displayOrder, isHero, isKitBuilder, isTurfInstallation } = req.body

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const id = await generateUniqueSlug(name.trim())

    let level = 0
    let path = '/'
    if (parent) {
      const parentCat = await Category.findById(parent).catch(() => null)
      if (!parentCat) {
        return res.status(400).json({ message: 'Parent category not found' })
      }
      const index = await loadCategoryIndex()
      const parentResolved = resolveCategoryPath(index, parentCat)
      if (!parentResolved.ok) {
        return res.status(400).json({ message: 'Parent category hierarchy is invalid or cyclic' })
      }
      level = parentResolved.level + 1
      path = `${parentResolved.storedPath}${parentResolved.category._id}/`
    }

    const useAutoBlurb = autoBlurb !== false
    let finalBlurb = blurb || ''
    if (useAutoBlurb && !blurb) {
      finalBlurb = ''
    }

    const category = await Category.create({
      id,
      name: name.trim(),
      blurb: finalBlurb,
      autoBlurb: useAutoBlurb,
      image: image || '',
      parent: parent || null,
      path, level,
      displayOrder: displayOrder || 0,
      isHero: isHero || false,
      isKitBuilder: isKitBuilder || false,
      isTurfInstallation: isTurfInstallation || false,
    })

    if (useAutoBlurb && !blurb) {
      category.blurb = await autoGenerateBlurb(category._id)
      await category.save()
    }
    await refreshParentBlurb(category.parent)

    res.status(201).json({ category })
  } catch (err) { next(err) }
})

// PUT /api/categories/:id — admin, update category
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })

    const { name, blurb, autoBlurb, image, displayOrder, isActive, parent, isHero, isKitBuilder, isTurfInstallation } = req.body
    const oldParent = category.parent ? String(category.parent) : null

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Name is required' })
      }
      category.name = name.trim()
    }
    if (blurb !== undefined) category.blurb = blurb
    if (autoBlurb !== undefined) category.autoBlurb = autoBlurb
    if (image !== undefined) category.image = image
    if (displayOrder !== undefined) category.displayOrder = displayOrder
    if (isActive !== undefined) category.isActive = isActive
    if (isHero !== undefined) category.isHero = isHero
    if (isKitBuilder !== undefined) category.isKitBuilder = isKitBuilder
    if (isTurfInstallation !== undefined) category.isTurfInstallation = isTurfInstallation

    if (parent !== undefined) {
      if (parent === null) {
        category.parent = null
        category.level = 0
        category.path = '/'
      } else {
        const parentCat = await Category.findById(parent).catch(() => null)
        if (!parentCat) {
          return res.status(400).json({ message: 'Parent category not found' })
        }
        if (parentCat._id.toString() === category._id.toString()) {
          return res.status(400).json({ message: 'Category cannot be its own parent' })
        }

        const index = await loadCategoryIndex()
        const parentResolved = resolveCategoryPath(index, parentCat)
        if (!parentResolved.ok) {
          return res.status(400).json({ message: 'Parent category hierarchy is invalid or cyclic' })
        }
        if (parentResolved.ancestors.some((ancestor) => ancestor._id.toString() === category._id.toString())) {
          return res.status(400).json({ message: 'Cannot set a descendant as parent' })
        }
        category.parent = parentCat._id
        category.level = parentResolved.level + 1
        category.path = `${parentResolved.storedPath}${parentResolved.category._id}/`
      }
    }

    await category.save()
    await cascadePathUpdate(category)
    await cascadeProductCategoryPath(category)

    const newParent = category.parent ? String(category.parent) : null
    await refreshParentBlurb(oldParent)
    if (newParent !== oldParent) await refreshParentBlurb(newParent)

    res.json({ category })
  } catch (err) { next(err) }
})

// DELETE /api/categories/:id — admin, safe delete
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })

    const index = await loadCategoryIndex()
    const descendants = getDescendants(index, category)
    if (descendants.length > 0) {
      return res.status(400).json({
        message: `Cannot delete category with ${descendants.length} subcategor${descendants.length === 1 ? 'y' : 'ies'}. Remove or reassign them first.`,
      })
    }

    const references = [...new Set([category.id, String(category._id)])]
    const productCount = await Product.countDocuments({
      $or: [
        { category: { $in: references } },
        { categoryPath: { $in: references } },
      ],
    })
    if (productCount > 0) {
      return res.status(400).json({ message: `Cannot delete category used by ${productCount} product(s). Deactivate instead.` })
    }

    const parentId = category.parent ? String(category.parent) : null
    await Category.findByIdAndDelete(category._id)
    await refreshParentBlurb(parentId)

    res.json({ message: 'Category deleted' })
  } catch (err) { next(err) }
})

// PUT /api/categories/reorder/bulk — admin, bulk reorder
router.put('/reorder/bulk', protect, adminOnly, async (req, res, next) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items array is required' })
    }

    const ops = items.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder } },
      },
    }))

    await Category.bulkWrite(ops)
    res.json({ message: 'Reorder saved' })
  } catch (err) { next(err) }
})

export default router
