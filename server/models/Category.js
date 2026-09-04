import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  blurb: { type: String, default: '' },
  autoBlurb: { type: Boolean, default: true },
  image: { type: String, default: '' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  path: { type: String, default: '/' },
  level: { type: Number, default: 0 },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isHero: { type: Boolean, default: false },
  isKitBuilder: { type: Boolean, default: false },
  isTurfInstallation: { type: Boolean, default: false },
}, { timestamps: true })

categorySchema.index({ parent: 1 })
categorySchema.index({ path: 1 })
categorySchema.index({ level: 1 })
categorySchema.index({ displayOrder: 1 })

export default mongoose.model('Category', categorySchema)
