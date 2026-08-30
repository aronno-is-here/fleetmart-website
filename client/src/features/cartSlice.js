import { createSlice } from '@reduxjs/toolkit'

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const save = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* noop */
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: load('fm_cart', []),
  reducers: {
    addToCart(state, action) {
      const { id, slug, name, price, art, size, qty = 1, customization = null } = action.payload
      const key = `${id}-${size}-${customization ? customization.name + customization.number : 'std'}`
      const existing = state.find((i) => i.key === key)
      if (existing) {
        existing.qty += qty
      } else {
        state.push({ key, id, slug, name, price, art, size, qty, customization })
      }
      save('fm_cart', state)
    },
    removeFromCart(state, action) {
      const idx = state.findIndex((i) => i.key === action.payload)
      if (idx !== -1) state.splice(idx, 1)
      save('fm_cart', state)
    },
    setQty(state, action) {
      const { key, qty } = action.payload
      const item = state.find((i) => i.key === key)
      if (item) item.qty = Math.max(1, qty)
      save('fm_cart', state)
    },
    clearCart(state) {
      save('fm_cart', [])
      return []
    },
  },
})

export const { addToCart, removeFromCart, setQty, clearCart } = cartSlice.actions

export const cartCount = (state) => state.cart.reduce((a, i) => a + i.qty, 0)
export const cartTotal = (state) => state.cart.reduce((a, i) => a + i.qty * i.price, 0)

export default cartSlice.reducer
