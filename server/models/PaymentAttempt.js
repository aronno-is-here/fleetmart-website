import mongoose from 'mongoose'

const paymentAttemptSchema = new mongoose.Schema({
  attemptId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, default: null, sparse: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestEmail: { type: String, default: null },
  customerEmail: { type: String, default: null },
  items: [{ type: mongoose.Schema.Types.Mixed }],
  shippingAddress: { type: mongoose.Schema.Types.Mixed },
  paymentMethod: { type: String, enum: ['uddoktapay'] },
  paymentType: { type: String, enum: ['partial', 'full'], default: 'full' },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  amountToPay: { type: Number, required: true },
  couponCode: { type: String, default: null },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  note: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'processing', 'paid_pending_order', 'completed', 'failed', 'cancelled', 'expired'], default: 'pending' },
  invoiceId: { type: String, default: null },
  uddoktapayPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  paymentReceivedAt: { type: Date, default: null },
  verifiedAt: { type: Date, default: null },
  latePayment: { type: Boolean, default: false },
  fulfillmentStartedAt: { type: Date, default: null },
  fulfillmentError: { type: String, default: null },
  expiresAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
}, { timestamps: true })

paymentAttemptSchema.index({ invoiceId: 1 }, { unique: true, partialFilterExpression: { invoiceId: { $type: 'string' } } })
paymentAttemptSchema.index({ expiresAt: 1 })
paymentAttemptSchema.index({ status: 1, expiresAt: 1 })

export default mongoose.model('PaymentAttempt', paymentAttemptSchema)
