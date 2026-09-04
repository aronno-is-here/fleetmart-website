import mongoose from 'mongoose'

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  primary: { type: String, default: '#000000' },
  secondary: { type: String, default: '#FFFFFF' },
  number: { type: String, default: '#FFFFFF' },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true })

teamSchema.index({ displayOrder: 1 })
teamSchema.index({ isActive: 1 })

export default mongoose.model('Team', teamSchema)
