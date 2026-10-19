export const PARTIAL_PAYMENT_AMOUNT = 300
export const CUSTOMIZATION_FEE = 250
export const FREE_SHIPPING_THRESHOLD = 3000
export const STANDARD_SHIPPING_FEE = 80

export class PricingError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'PricingError'
    this.status = status
  }
}

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100

const productIdOf = (product) => String(product?._id ?? product?.id ?? '')

export const normalizeCouponCode = (code) => (
  typeof code === 'string' ? code.trim().toUpperCase() : ''
)

export const effectiveUnitPrice = (product) => {
  const price = toNumber(product?.price)
  if (price === null || price < 0) {
    throw new PricingError('Product price is invalid')
  }

  const discountPrice = toNumber(product?.discountPrice)
  if (discountPrice !== null && discountPrice >= 0 && discountPrice < price) {
    return roundMoney(discountPrice)
  }

  return roundMoney(price)
}

export const normalizeQuantity = (quantity) => {
  const parsed = Math.floor(toNumber(quantity) ?? 1)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

export const normalizeCustomization = (product, customization) => {
  if (!product?.customizable || !customization || typeof customization !== 'object') {
    return null
  }

  const name = typeof customization.name === 'string'
    ? customization.name.trim().toUpperCase()
    : ''
  const number = typeof customization.number === 'string'
    ? customization.number.trim()
    : String(customization.number ?? '').trim()

  if (!name || !number) return null
  if (!/^[A-Z ]{1,12}$/.test(name) || !/^\d{1,2}$/.test(number)) return null

  return { name, number }
}

export const evaluateCoupon = (coupon, subtotal, now = new Date()) => {
  if (!coupon || coupon.isActive === false) {
    return { ok: false, message: 'Invalid coupon code' }
  }

  if (coupon.expiresAt) {
    const expiresAt = new Date(coupon.expiresAt)
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt <= now) {
      return { ok: false, message: 'Coupon expired' }
    }
  }

  const maxUses = toNumber(coupon.maxUses) ?? 0
  const usedCount = toNumber(coupon.usedCount) ?? 0
  if (maxUses > 0 && usedCount >= maxUses) {
    return { ok: false, message: 'Coupon usage limit reached' }
  }

  const minOrder = toNumber(coupon.minOrder) ?? 0
  if (subtotal < minOrder) {
    return { ok: false, message: `Minimum order ৳${minOrder} required` }
  }

  const value = toNumber(coupon.value)
  if (value === null || value < 0) {
    return { ok: false, message: 'Coupon is invalid' }
  }

  const rawDiscount = coupon.discountType === 'flat'
    ? value
    : subtotal * value / 100
  const discount = Math.min(subtotal, Math.max(0, roundMoney(rawDiscount)))

  return { ok: true, discount }
}

export const calculatePaymentTotals = ({
  items,
  products,
  coupon = null,
  couponCode = '',
  paymentType = 'full',
  now = new Date(),
} = {}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new PricingError('Order must contain at least one item')
  }

  const productMap = new Map((products || []).map((product) => [productIdOf(product), product]))
  const validatedItems = []
  let subtotal = 0

  for (const item of items) {
    const product = productMap.get(String(item?.product))
    if (!product) {
      throw new PricingError('One or more products are unavailable')
    }

    const customization = normalizeCustomization(product, item.customization)
    const unitPrice = roundMoney(effectiveUnitPrice(product) + (customization ? CUSTOMIZATION_FEE : 0))
    const quantity = normalizeQuantity(item.qty)

    subtotal = roundMoney(subtotal + unitPrice * quantity)
    validatedItems.push({
      product: productIdOf(product),
      name: product.name || item.name || '',
      slug: product.slug || '',
      size: item.size || null,
      qty: quantity,
      price: unitPrice,
      customization,
    })
  }

  if (subtotal <= 0) {
    throw new PricingError('Order total must be greater than zero')
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
  const normalizedCode = normalizeCouponCode(couponCode)
  let discount = 0
  let appliedCoupon = null

  if (normalizedCode) {
    const couponResult = evaluateCoupon(coupon, subtotal, now)
    if (!couponResult.ok) {
      throw new PricingError(couponResult.message)
    }
    discount = couponResult.discount
    appliedCoupon = coupon
  }

  const total = roundMoney(Math.max(0, subtotal - discount))
  const amountToPay = paymentType === 'partial'
    ? Math.min(PARTIAL_PAYMENT_AMOUNT, total)
    : total

  return {
    validatedItems,
    subtotal,
    shippingFee,
    discount,
    total,
    amountToPay: roundMoney(amountToPay),
    couponId: appliedCoupon?._id || null,
    couponCode: appliedCoupon?.code || normalizedCode || null,
  }
}
