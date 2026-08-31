import { Router } from 'express'
import Review from '../models/Review.js'
import Product from '../models/Product.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// GET /api/reviews/:productId
router.get('/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isVisible: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
    res.json({ reviews })
  } catch (err) { next(err) }
})

// POST /api/reviews
router.post('/', protect, async (req, res, next) => {
  try {
    const { product, rating, comment } = req.body
    const review = await Review.create({
      product,
      user: req.user._id,
      rating,
      comment,
      verifiedPurchase: true,
    })

    // Update product rating
    const reviews = await Review.find({ product })
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    await Product.findByIdAndUpdate(product, { rating: Math.round(avg * 10) / 10, numReviews: reviews.length })

    res.status(201).json({ review })
  } catch (err) { next(err) }
})

// DELETE /api/reviews/:id — admin
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id)
    res.json({ message: 'Review deleted' })
  } catch (err) { next(err) }
})

// PUT /api/reviews/:id/visibility — admin
router.put('/:id/visibility', protect, adminOnly, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isVisible: req.body.isVisible }, { new: true })
    res.json({ review })
  } catch (err) { next(err) }
})

export default router
