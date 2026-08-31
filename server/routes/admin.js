import { Router } from 'express'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import Review from '../models/Review.js'
import Coupon from '../models/Coupon.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// All admin routes require auth + admin role
router.use(protect, adminOnly)

// GET /api/admin/dashboard
router.get('/dashboard', async (_req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalReviews, totalCoupons] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Review.countDocuments(),
      Coupon.countDocuments(),
    ])

    const revenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)

    const lowStock = await Product.find({ isActive: true })
      .then(products =>
        products
          .map(p => {
            const stocks = Object.entries(p.stock || {})
            const totalStock = stocks.reduce((sum, [, v]) => sum + v, 0)
            const lowSizes = stocks.filter(([, v]) => v > 0 && v < 5).map(([k, v]) => ({ size: k, qty: v }))
            return { ...p.toObject(), totalStock, lowSizes }
          })
          .filter(p => p.totalStock < 20 || p.lowSizes.length > 0)
          .slice(0, 10)
      )

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ])

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalReviews,
        totalCoupons,
        totalRevenue: revenue[0]?.total || 0,
      },
      recentOrders,
      lowStock,
      ordersByStatus,
    })
  } catch (err) { next(err) }
})

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(),
    ])
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (err) { next(err) }
})

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, isActive } = req.body
    const update = {}
    if (role) update.role = role
    if (isActive !== undefined) update.isActive = isActive
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (err) { next(err) }
})

// GET /api/admin/reviews
router.get('/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ reviews })
  } catch (err) { next(err) }
})

export default router
