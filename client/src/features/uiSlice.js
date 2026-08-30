import { createSlice, nanoid } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    cartOpen: false,
    searchOpen: false,
    mobileNavOpen: false,
    quickView: null,
    compare: [],
    recentlyViewed: [],
    toasts: [],
  },
  reducers: {
    setCartOpen(state, action) {
      state.cartOpen = action.payload
    },
    setSearchOpen(state, action) {
      state.searchOpen = action.payload
    },
    setMobileNavOpen(state, action) {
      state.mobileNavOpen = action.payload
    },
    setQuickView(state, action) {
      state.quickView = action.payload
    },
    toggleCompare(state, action) {
      const p = action.payload
      const idx = state.compare.findIndex((i) => i.id === p.id)
      if (idx !== -1) state.compare.splice(idx, 1)
      else if (state.compare.length < 3) state.compare.push(p)
    },
    pushRecentlyViewed(state, action) {
      state.recentlyViewed = [action.payload, ...state.recentlyViewed.filter((p) => p.id !== action.payload.id)].slice(0, 8)
    },
    toast(state, action) {
      state.toasts.push({ id: nanoid(), ...action.payload })
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
  },
})

export const {
  setCartOpen,
  setSearchOpen,
  setMobileNavOpen,
  setQuickView,
  toggleCompare,
  pushRecentlyViewed,
  toast,
  dismissToast,
} = uiSlice.actions

export default uiSlice.reducer
