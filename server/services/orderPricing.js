import mongoose from 'mongoose'
import Coupon from '../models/Coupon.js'
import Product from '../models/Product.js'
import { calculatePaymentTotals, normalizeCouponCode } from './pricing.js'

export const priceOrder = async ({ items, couponCode = '', paymentType = 'full' }) => {
  const productIds = items
    .map((item) => item?.product)
    .filter((id) => mongoose.isValidObjectId(id))
  const normalizedCode = normalizeCouponCode(couponCode)

  const [products, coupon] = await Promise.all([
    Product.find({ _id: { $in: productIds } }),
    normalizedCode
      ? Coupon.findOne({ code: normalizedCode, isActive: true })
      : Promise.resolve(null),
  ])

  return calculatePaymentTotals({
    items,
    products,
    coupon,
    couponCode: normalizedCode,
    paymentType,
  })
}
