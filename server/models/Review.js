import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  reviewerName: { type: String, required: true },
  verifiedPurchase: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true },
}, { timestamps: true })

reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true })
reviewSchema.index({ product: 1, isVisible: 1, createdAt: -1 })
reviewSchema.index({ reviewerName: 1 }, { unique: true })

export default mongoose.model('Review', reviewSchema)
