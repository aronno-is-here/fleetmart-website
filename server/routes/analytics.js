import { Router } from 'express'
import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Review from '../models/Review.js'
import Coupon from '../models/Coupon.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()
router.use(protect, adminOnly)

// Helper: parse date range from query
function parseDateRange(query) {
  const now = new Date()
  const range = query.range || '30d'
  let startDate
  if (range === '7d') startDate = new Date(now - 7 * 86400000)
  else if (range === '90d') startDate = new Date(now - 90 * 86400000)
  else if (range === '1y') startDate = new Date(now - 365 * 86400000)
  else startDate = new Date(now - 30 * 86400000)
  return { startDate, endDate: now, range }
}

// GET /api/admin/analytics/sales — Revenue, orders, AOV, trends
router.get('/analytics/sales', async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query)
    const match = { createdAt: { $gte: startDate, $lte: endDate } }

    const [summary, daily, byPayment, byStatus] = await Promise.all([
      // Total revenue, orders, AOV
      Order.aggregate([
        { $match: match },
        { $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalPaid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
          totalDiscount: { $sum: '$discount' },
          totalShipping: { $sum: '$shippingFee' },
        }}
      ]),
      // Daily revenue trend
      Order.aggregate([
        { $match: match },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
      // Revenue by payment method
      Order.aggregate([
        { $match: match },
        { $group: { _id: '$paymentMethod', revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      // Orders by status
      Order.aggregate([
        { $match: match },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
    ])

    res.json({
      summary: summary[0] || { totalRevenue: 0, totalPaid: 0, totalOrders: 0, avgOrderValue: 0, totalDiscount: 0, totalShipping: 0 },
      daily,
      byPayment,
      byStatus,
      range: req.query.range || '30d',
    })
  } catch (err) { next(err) }
})

// GET /api/admin/analytics/products — Top/low performers, category breakdown
router.get('/analytics/products', async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query)
    const match = { createdAt: { $gte: startDate, $lte: endDate } }

    const [topSelling, categoryRevenue, brandRevenue, slowMovers, stockSummary] = await Promise.all([
      // Top selling products by revenue
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          slug: { $first: '$items.slug' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          totalQty: { $sum: '$items.qty' },
          orderCount: { $sum: 1 },
        }},
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),
      // Revenue by category
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        { $group: {
          _id: { $ifNull: ['$productInfo.category', 'Unknown'] },
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          qty: { $sum: '$items.qty' },
        }},
        { $sort: { revenue: -1 } },
      ]),
      // Revenue by brand
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        { $group: {
          _id: { $ifNull: ['$productInfo.brand', 'Unknown'] },
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          qty: { $sum: '$items.qty' },
        }},
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      // Slow movers (products with stock but no recent orders)
      Product.aggregate([
        { $match: { isActive: true } },
        { $project: {
          name: 1, slug: 1, price: 1, category: 1, brand: 1,
          totalStock: { $sum: { $map: { input: { $objectToArray: '$stock' }, as: 's', in: '$$s.v' } } },
        }},
        { $match: { totalStock: { $gt: 0 } } },
        { $lookup: {
          from: 'orders',
          let: { pid: '$_id' },
          pipeline: [
            { $match: { createdAt: { $gte: startDate }, $expr: { $in: ['$$pid', '$items.product'] } } },
            { $limit: 1 },
          ],
          as: 'recentOrders',
        }},
        { $match: { recentOrders: { $size: 0 } } },
        { $sort: { totalStock: -1 } },
        { $limit: 10 },
      ]),
      // Stock summary across all products
      Product.aggregate([
        { $match: { isActive: true } },
        { $project: {
          totalStock: { $sum: { $map: { input: { $objectToArray: '$stock' }, as: 's', in: '$$s.v' } } },
        }},
        { $group: {
          _id: null,
          totalUnits: { $sum: '$totalStock' },
          totalProducts: { $sum: 1 },
          outOfStock: { $sum: { $cond: [{ $eq: ['$totalStock', 0] }, 1, 0] } },
          lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$totalStock', 0] }, { $lt: ['$totalStock', 5] }] }, 1, 0] } },
        }},
      ]),
    ])

    res.json({
      topSelling,
      categoryRevenue,
      brandRevenue,
      slowMovers,
      stockSummary: stockSummary[0] || { totalUnits: 0, totalProducts: 0, outOfStock: 0, lowStock: 0 },
    })
  } catch (err) { next(err) }
})

// GET /api/admin/analytics/customers — Customer metrics
router.get('/analytics/customers', async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query)
    const match = { createdAt: { $gte: startDate, $lte: endDate } }

    const [summary, topCustomers, repeatRate, newVsReturning] = await Promise.all([
      // Summary
      Order.aggregate([
        { $match: match },
        { $group: {
          _id: null,
          totalCustomers: { $addToSet: { $ifNull: ['$user', '$guestEmail'] } },
          totalGuestOrders: { $sum: { $cond: [{ $eq: ['$user', null] }, 1, 0] } },
          totalRegisteredOrders: { $sum: { $cond: [{ $ne: ['$user', null] }, 1, 0] } },
        }},
        { $project: {
          _id: 0,
          uniqueCustomers: { $size: '$totalCustomers' },
          totalGuestOrders: 1,
          totalRegisteredOrders: 1,
        }},
      ]),
      // Top customers by spend
      Order.aggregate([
        { $match: { ...match, user: { $ne: null } } },
        { $group: {
          _id: '$user',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
        }},
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', email: '$user.email', totalSpent: 1, orderCount: 1 } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]),
      // Repeat purchase rate
      Order.aggregate([
        { $match: { user: { $ne: null } } },
        { $group: { _id: '$user', orders: { $sum: 1 } } },
        { $group: {
          _id: null,
          totalRepeat: { $sum: { $cond: [{ $gte: ['$orders', 2] }, 1, 0] } },
          totalSingle: { $sum: { $cond: [{ $eq: ['$orders', 1] }, 1, 0] } },
          totalCustomers: { $sum: 1 },
        }},
        { $project: {
          _id: 0,
          repeatRate: { $cond: [{ $gt: ['$totalCustomers', 0] }, { $multiply: [{ $divide: ['$totalRepeat', '$totalCustomers'] }, 100] }, 0] },
          singlePurchase: '$totalSingle',
          repeatPurchase: '$totalRepeat',
          totalCustomers: 1,
        }},
      ]),
      // New vs returning (by registration date)
      User.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newUsers: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
    ])

    res.json({
      summary: summary[0] || { uniqueCustomers: 0, totalGuestOrders: 0, totalRegisteredOrders: 0 },
      topCustomers,
      repeatRate: repeatRate[0] || { repeatRate: 0, singlePurchase: 0, repeatPurchase: 0, totalCustomers: 0 },
      newUsers: newVsReturning,
    })
  } catch (err) { next(err) }
})

// GET /api/admin/analytics/forecasts — EOQ, break-even, demand forecast
router.get('/analytics/forecasts', async (req, res, next) => {
  try {
    const now = new Date()
    const day30 = new Date(now - 30 * 86400000)
    const day60 = new Date(now - 60 * 86400000)

    const [demandHistory, productCosts, orderPatterns] = await Promise.all([
      // Daily order volume (last 60 days) for demand forecasting
      Order.aggregate([
        { $match: { createdAt: { $gte: day60 }, orderStatus: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalQty: { $sum: '$items.qty' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          uniqueProducts: { $addToSet: '$items.product' },
        }},
        { $project: {
          _id: 1, totalQty: 1, totalRevenue: 1,
          uniqueCount: { $size: '$uniqueProducts' },
        }},
        { $sort: { _id: 1 } },
      ]),
      // Product-level data for EOQ (need price as proxy for cost)
      Product.aggregate([
        { $match: { isActive: true } },
        { $project: {
          name: 1, slug: 1, price: 1, category: 1, brand: 1,
          totalStock: { $sum: { $map: { input: { $objectToArray: '$stock' }, as: 's', in: '$$s.v' } } },
        }},
        { $match: { totalStock: { $gt: 0 } } },
      ]),
      // Order frequency per product (last 30 days) for demand
      Order.aggregate([
        { $match: { createdAt: { $gte: day30 }, orderStatus: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQty: { $sum: '$items.qty' },
          avgPrice: { $avg: '$items.price' },
          orderDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
        }},
        { $project: {
          name: 1, totalQty: 1, avgPrice: 1,
          activeDays: { $size: '$orderDays' },
        }},
        { $sort: { totalQty: -1 } },
        { $limit: 20 },
      ]),
    ])

    // Calculate demand forecast (simple moving average)
    const forecastWindow = 7
    const recentDays = demandHistory.slice(-forecastWindow)
    const avgDailyDemand = recentDays.length > 0
      ? recentDays.reduce((s, d) => s + d.totalQty, 0) / recentDays.length
      : 0
    const forecast7d = Math.round(avgDailyDemand * 7)
    const forecast30d = Math.round(avgDailyDemand * 30)

    // EOQ calculation: EOQ = sqrt((2 * D * S) / H)
    // D = annual demand, S = ordering cost (estimated ৳500 per order), H = holding cost (estimated 20% of avg price)
    const ORDERING_COST = 500
    const HOLDING_RATE = 0.20
    const eoqProducts = orderPatterns.slice(0, 10).map(p => {
      const annualDemand = p.totalQty * 12
      const avgPrice = p.avgPrice
      const holdingCost = avgPrice * HOLDING_RATE
      const eoq = holdingCost > 0 ? Math.round(Math.sqrt((2 * annualDemand * ORDERING_COST) / holdingCost)) : 0
      const reorderPoint = Math.round((annualDemand / 365) * 7) // 7-day safety stock
      return {
        name: p.name,
        productId: p._id,
        monthlyDemand: p.totalQty,
        annualDemand,
        avgPrice: Math.round(avgPrice),
        eoq,
        reorderPoint,
        currentStock: productCosts.find(pc => String(pc._id) === String(p._id))?.totalStock || 0,
      }
    })

    // Break-even analysis: Fixed costs / (Avg revenue per order - Variable cost per order)
    const FIXED_COSTS = 50000 // Estimated monthly fixed costs
    const VARIABLE_COST_RATIO = 0.60 // 60% of revenue is variable cost
    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: day30 }, paymentStatus: 'paid' } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalOrders: { $sum: 1 },
      }},
    ])
    const monthlyRevenue = salesData[0]?.totalRevenue || 0
    const monthlyOrders = salesData[0]?.totalOrders || 0
    const avgRevenuePerOrder = monthlyOrders > 0 ? monthlyRevenue / monthlyOrders : 0
    const contributionMargin = avgRevenuePerOrder * (1 - VARIABLE_COST_RATIO)
    const breakEvenOrders = contributionMargin > 0 ? Math.ceil(FIXED_COSTS / contributionMargin) : 0
    const breakEvenRevenue = Math.round(breakEvenOrders * avgRevenuePerOrder)

    res.json({
      demand: {
        avgDailyDemand: Math.round(avgDailyDemand * 10) / 10,
        forecast7d,
        forecast30d,
        trend: demandHistory.slice(-30),
      },
      eoq: eoqProducts,
      breakEven: {
        fixedCosts: FIXED_COSTS,
        variableCostRatio: VARIABLE_COST_RATIO,
        avgRevenuePerOrder: Math.round(avgRevenuePerOrder),
        contributionMargin: Math.round(contributionMargin),
        breakEvenOrders,
        breakEvenRevenue,
        currentMonthlyOrders: monthlyOrders,
        currentMonthlyRevenue: monthlyRevenue,
        isProfitable: monthlyRevenue > FIXED_COSTS,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/admin/analytics/coupons — Coupon performance
router.get('/analytics/coupons', async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query)
    const match = { createdAt: { $gte: startDate, $lte: endDate }, couponCode: { $ne: null } }

    const [couponUsage, topCoupons] = await Promise.all([
      // Coupon usage summary
      Order.aggregate([
        { $match: match },
        { $group: {
          _id: '$couponCode',
          totalOrders: { $sum: 1 },
          totalDiscount: { $sum: '$discount' },
          totalRevenue: { $sum: '$total' },
        }},
        { $sort: { totalDiscount: -1 } },
        { $limit: 10 },
      ]),
      // Coupon effectiveness (discount vs revenue uplift)
      Coupon.find({}).sort({ usedCount: -1 }).limit(10),
    ])

    res.json({ couponUsage, topCoupons })
  } catch (err) { next(err) }
})

export default router
