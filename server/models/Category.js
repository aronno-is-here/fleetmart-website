import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  blurb: { type: String, default: '' },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Category', categorySchema)
