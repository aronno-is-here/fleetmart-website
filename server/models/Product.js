import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  subCategory: { type: String, default: '' },
  categoryPath: { type: [String], default: [] },
  brand: { type: String, default: '' },
  team: { type: String, default: null },
  league: { type: String, default: null },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: null },
  stock: { type: Map, of: Number, default: {} },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  images: [{ url: String, alt: { type: String, default: '' } }],
  featured: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  customizable: { type: Boolean, default: false },
  artColors: {
    primary: { type: String, default: '#C6F53F' },
    secondary: { type: String, default: '#0A0E13' },
    accent: { type: String, default: '#3FA9F5' },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1, brand: 1, team: 1 })

export default mongoose.model('Product', productSchema)
