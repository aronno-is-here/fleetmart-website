import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestEmail: { type: String, default: null },
  guestName: { type: String, default: null },
  guestPhone: { type: String, default: null },
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
    name: String,
    phone: String,
    street: String,
    city: String,
    district: { type: String, default: '' },
    zip: String,
    country: String,
  },
  paymentMethod: { type: String, enum: ['uddoktapay'], default: 'uddoktapay' },
  paymentGatewayMethod: { type: String, enum: ['bkash', 'nagad', 'rocket', 'upay', 'bank', 'other'], default: null },
  paymentType: { type: String, enum: ['partial', 'full'], default: 'full' },
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'failed', 'refunded', 'refund_requested', 'refund_failed', 'expired'], default: 'pending' },
  refundAmount: { type: Number, default: null },
  refundTransactionId: { type: String, default: null },
  refundReason: { type: String, default: null },
  refundRequestedAt: { type: Date, default: null },
  refundedAt: { type: Date, default: null },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
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
  transactionId: { type: String, default: null, sparse: true },
  paymentAttemptId: { type: String, default: null, sparse: true },
  paymentVerifiedAt: { type: Date, default: null },
}, { timestamps: true })

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ orderStatus: 1 })
orderSchema.index({ guestEmail: 1 })
orderSchema.index({ transactionId: 1 }, { sparse: true })

export default mongoose.model('Order', orderSchema)
