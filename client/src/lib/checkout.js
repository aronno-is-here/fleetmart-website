export const PARTIAL_PAYMENT_AMOUNT = 300
export const FREE_SHIPPING_THRESHOLD = 3000
export const STANDARD_SHIPPING_FEE = 80

export const calculateOnlineTotal = (subtotal, discount = 0) => {
  const base = Number(subtotal) || 0
  const off = Number(discount) || 0
  return Math.max(0, base - off)
}

export const calculateShippingFee = (subtotal) => {
  const base = Number(subtotal) || 0
  return base >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
}

export const readCouponDiscount = (payload) => {
  const value = payload?.coupon?.discount ?? payload?.discount
  const discount = Number(value)
  return Number.isFinite(discount) && discount > 0 ? discount : 0
}

export const calculateAmountToPay = (paymentType, onlineTotal) => {
  const total = Math.max(0, Number(onlineTotal) || 0)
  if (paymentType === 'partial') {
    return Math.min(PARTIAL_PAYMENT_AMOUNT, total)
  }
  return total
}
