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

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: load('fm_wishlist', []),
  reducers: {
    toggleWishlist(state, action) {
      const idx = state.findIndex((i) => i.id === action.payload.id)
      if (idx !== -1) state.splice(idx, 1)
      else state.push(action.payload)
      save('fm_wishlist', state)
    },
  },
})

export const { toggleWishlist } = wishlistSlice.actions
export const inWishlist = (id) => (state) => state.wishlist.some((i) => i.id === id)

export default wishlistSlice.reducer
