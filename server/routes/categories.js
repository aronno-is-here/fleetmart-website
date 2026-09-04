import { Router } from 'express'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// ── Build tree from flat list ──
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

// POST /api/categories — admin, create category
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { id, name, blurb, image, parent, displayOrder } = req.body

    if (!id || !name) {
      return res.status(400).json({ message: 'id and name are required' })
    }

    const existing = await Category.findOne({ id })
    if (existing) {
      return res.status(400).json({ message: `Category with id "${id}" already exists` })
    }

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

    const category = await Category.create({
      id, name, blurb: blurb || '', image: image || '',
      parent: parent || null, path, level,
      displayOrder: displayOrder || 0,
    })

    res.status(201).json({ category })
  } catch (err) { next(err) }
})

// PUT /api/categories/:id — admin, update category
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })

    const { name, blurb, image, displayOrder, isActive, parent } = req.body

    if (name !== undefined) category.name = name
    if (blurb !== undefined) category.blurb = blurb
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
    res.json({ message: 'Category deleted' })
  } catch (err) { next(err) }
})

// PUT /api/categories/reorder — admin, bulk reorder
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
