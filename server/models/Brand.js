import mongoose from 'mongoose'

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true })

brandSchema.index({ displayOrder: 1 })
brandSchema.index({ isActive: 1 })

export default mongoose.model('Brand', brandSchema)
