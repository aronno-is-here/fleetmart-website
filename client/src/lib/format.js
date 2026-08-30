export const fmt = (n) => `৳${Number(n).toLocaleString('en-US')}`

export const discounted = (p) => (p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price)

export const discountPct = (p) =>
  p.discountPrice != null && p.discountPrice < p.price ? Math.round((1 - p.discountPrice / p.price) * 100) : 0

export const totalStock = (p) => Object.values(p.stock || {}).reduce((a, b) => a + b, 0)
