import { Router } from 'express'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

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

async function cascadePathUpdate(categoryId, newPath, newLevel) {
  const children = await Category.find({ parent: categoryId })
  for (const child of children) {
    child.path = `${newPath}${categoryId}/`
    child.level = newLevel + 1
    await child.save()
    await cascadePathUpdate(child._id, child.path, child.level)
  }
}

async function cascadeProductCategoryPath(categoryId) {
  const descendant = await Category.find({ parent: categoryId }).select('_id id')
  const ids = [categoryId, ...descendant.map(c => c._id)]
  const products = await Product.find({ categoryPath: { $in: ids } })
  for (const p of products) {
    const newPath = []
    let current = await Category.findOne({ id: p.category })
    while (current) {
      newPath.unshift(current.id)
      current = current.parent ? await Category.findById(current.parent) : null
    }
    p.categoryPath = newPath
    await p.save()
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

// POST /api/categories — admin, create category (auto-generate slug from name)
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, blurb, autoBlurb, image, parent, displayOrder } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const id = await generateUniqueSlug(name)

    let level = 0
    let path = '/'
    if (parent) {
      const parentCat = await Category.findById(parent)
      if (!parentCat) {
        return res.status(400).json({ message: 'Parent category not found' })
      }
      level = parentCat.level + 1
      path = `${parentCat.path}${parentCat._id}/`
    }

    const useAutoBlurb = autoBlurb !== false
    let finalBlurb = blurb || ''
    if (useAutoBlurb && !blurb) {
      finalBlurb = ''
    }

    const category = await Category.create({
      id, name,
      blurb: finalBlurb,
      autoBlurb: useAutoBlurb,
      image: image || '',
      parent: parent || null,
      path, level,
      displayOrder: displayOrder || 0,
    })

    if (useAutoBlurb && !blurb) {
      category.blurb = await autoGenerateBlurb(category._id)
      await category.save()
    }

    res.status(201).json({ category })
  } catch (err) { next(err) }
})

// PUT /api/categories/:id — admin, update category
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })

    const { name, blurb, autoBlurb, image, displayOrder, isActive, parent } = req.body

    if (name !== undefined) {
      category.name = name
      if (!category.id || category.id === toSlug(name)) {
        category.id = await generateUniqueSlug(name, category._id)
      }
    }
    if (blurb !== undefined) category.blurb = blurb
    if (autoBlurb !== undefined) category.autoBlurb = autoBlurb
    if (image !== undefined) category.image = image
    if (displayOrder !== undefined) category.displayOrder = displayOrder
    if (isActive !== undefined) category.isActive = isActive

    if (parent !== undefined) {
      if (parent === null) {
        category.parent = null
        category.level = 0
        category.path = '/'
      } else {
        const parentCat = await Category.findById(parent)
        if (!parentCat) {
          return res.status(400).json({ message: 'Parent category not found' })
        }
        if (parentCat._id.toString() === category._id.toString()) {
          return res.status(400).json({ message: 'Category cannot be its own parent' })
        }
        if (parentCat.path.includes(category._id.toString())) {
          return res.status(400).json({ message: 'Cannot set a descendant as parent' })
        }
        category.parent = parent
        category.level = parentCat.level + 1
        category.path = `${parentCat.path}${parentCat._id}/`
      }
    }

    await category.save()

    // Cascade path updates to all descendants
    await cascadePathUpdate(category._id, category.path, category.level)

    // Cascade categoryPath updates to affected products
    await cascadeProductCategoryPath(category._id)

    // Update parent's blurb if it uses autoBlurb
    if (category.parent) {
      const parentCat = await Category.findById(category.parent)
      if (parentCat && parentCat.autoBlurb) {
        parentCat.blurb = await autoGenerateBlurb(parentCat._id)
        await parentCat.save()
      }
    }

    res.json({ category })
  } catch (err) { next(err) }
})

// DELETE /api/categories/:id — admin, safe delete
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })

    const childCount = await Category.countDocuments({ parent: category._id })
    if (childCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories. Remove or reassign them first.' })
    }

    const productCount = await Product.countDocuments({ categoryPath: category.id })
    if (productCount > 0) {
      return res.status(400).json({ message: `Cannot delete category used by ${productCount} product(s). Deactivate instead.` })
    }

    await Category.findByIdAndDelete(category._id)

    // Update parent's blurb if it uses autoBlurb
    if (category.parent) {
      const parentCat = await Category.findById(category.parent)
      if (parentCat && parentCat.autoBlurb) {
        parentCat.blurb = await autoGenerateBlurb(parentCat._id)
        await parentCat.save()
      }
    }

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
