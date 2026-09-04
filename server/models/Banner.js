import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  targetUrl: { type: String, default: '/shop' },
  title: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true })

bannerSchema.index({ displayOrder: 1 })
bannerSchema.index({ isActive: 1 })

export default mongoose.model('Banner', bannerSchema)
