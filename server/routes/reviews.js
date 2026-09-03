import { Router } from 'express'
import Review from '../models/Review.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

const generateReviewerName = async () => {
  let name
  let exists = true
  while (exists) {
    const num = Math.floor(1000000 + Math.random() * 9000000)
    name = `User_${num}`
    exists = await Review.findOne({ reviewerName: name })
  }
  return name
}

// GET /api/reviews/product/:productId — public, visible reviews
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.productId, isVisible: true })
        .sort({ rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ product: req.params.productId, isVisible: true }),
    ])
    res.json({ reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (err) { next(err) }
})

// GET /api/reviews/:productId — backward compatible
router.get('/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isVisible: true })
      .sort({ rating: -1, createdAt: -1 })
      .limit(50)
    res.json({ reviews })
  } catch (err) { next(err) }
})

// GET /api/reviews/featured — public, top reviews for homepage
router.get('/featured', async (_req, res, next) => {
  try {
    const reviews = await Review.find({ isVisible: true, rating: { $gte: 4 } })
      .sort({ rating: -1, createdAt: -1 })
      .limit(10)
      .populate('product', 'name slug')
    res.json({ reviews })
  } catch (err) { next(err) }
})

// GET /api/reviews — admin: all reviews
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('user', 'name email')
        .populate('product', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(),
    ])
    res.json({ reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (err) { next(err) }
})

// POST /api/reviews — create review (auth required, eligibility checked)
router.post('/', protect, async (req, res, next) => {
  try {
    const { product, rating, comment, orderId } = req.body

    if (!product || !rating) {
      return res.status(400).json({ message: 'Product and rating are required' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }

    let verifiedPurchase = false
    let orderDoc = null

    if (orderId) {
      orderDoc = await Order.findOne({ _id: orderId, user: req.user._id })
      if (!orderDoc) {
        return res.status(403).json({ message: 'Order not found or access denied' })
      }
      if (orderDoc.orderStatus !== 'delivered') {
        return res.status(403).json({ message: 'You can only review products from delivered orders' })
      }
      const hasProduct = orderDoc.items.some(i => i.product?.toString() === product)
      if (!hasProduct) {
        return res.status(403).json({ message: 'This product was not in your order' })
      }
      verifiedPurchase = true
    } else {
      const deliveredOrders = await Order.find({
        user: req.user._id,
        orderStatus: 'delivered',
        'items.product': product,
      })
      verifiedPurchase = deliveredOrders.length > 0
      if (deliveredOrders.length > 0) {
        orderDoc = deliveredOrders[0]
      }
    }

    const reviewerName = await generateReviewerName()

    const review = await Review.create({
      product,
      user: req.user._id,
      order: orderDoc?._id || null,
      rating,
      comment,
      reviewerName,
      verifiedPurchase,
    })

    const reviews = await Review.find({ product, isVisible: true })
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    await Product.findByIdAndUpdate(product, { rating: Math.round(avg * 10) / 10, numReviews: reviews.length })

    res.status(201).json({ review })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this product for this order' })
    }
    next(err)
  }
})

// DELETE /api/reviews/:id — admin
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id)
    if (!review) return res.status(404).json({ message: 'Review not found' })

    const reviews = await Review.find({ product: review.product, isVisible: true })
    const avg = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
    await Product.findByIdAndUpdate(review.product, { rating: Math.round(avg * 10) / 10, numReviews: reviews.length })

    res.json({ message: 'Review deleted' })
  } catch (err) { next(err) }
})

// PUT /api/reviews/:id/visibility — admin
router.put('/:id/visibility', protect, adminOnly, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isVisible: req.body.isVisible }, { new: true })
    if (!review) return res.status(404).json({ message: 'Review not found' })

    const reviews = await Review.find({ product: review.product, isVisible: true })
    const avg = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
    await Product.findByIdAndUpdate(review.product, { rating: Math.round(avg * 10) / 10, numReviews: reviews.length })

    res.json({ review })
  } catch (err) { next(err) }
})

export default router
