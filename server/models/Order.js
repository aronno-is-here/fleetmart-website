import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    slug: String,
    size: String,
    qty: { type: Number, default: 1 },
    price: Number,
    customization: { name: String, number: String },
  }],
  shippingAddress: {
    label: String,
    street: String,
    city: String,
    zip: String,
    country: String,
  },
  paymentMethod: { type: String, enum: ['cod', 'bkash', 'card'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  orderStatus: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'processing',
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  couponCode: { type: String, default: null },
  note: { type: String, default: '' },
}, { timestamps: true })

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ orderStatus: 1 })

export default mongoose.model('Order', orderSchema)
