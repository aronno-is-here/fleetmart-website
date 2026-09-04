import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 8, select: false },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  googleId: { type: String, default: null },
  appleId: { type: String, default: null },
  addresses: [{
    label: { type: String, default: 'Home' },
    street: String,
    city: String,
    zip: String,
    country: { type: String, default: 'Bangladesh' },
    phone: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  }],
  billing: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    taxId: { type: String, default: '' },
  },
  passwordResetToken: { type: String, default: null },
  passwordResetExpiry: { type: Date, default: null },
  verificationCode: { type: String, default: null },
  verificationExpiry: { type: Date, default: null },
  verificationMethod: { type: String, enum: ['email', 'sms', null], default: null },
  forgotPasswordAttempts: { type: Number, default: 0 },
  forgotPasswordLastAttempt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.passwordResetToken
  delete obj.passwordResetExpiry
  delete obj.verificationCode
  delete obj.verificationExpiry
  delete obj.verificationMethod
  delete obj.__v
  return obj
}

export default mongoose.model('User', userSchema)
