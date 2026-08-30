import { configureStore } from '@reduxjs/toolkit'
import cart from './cartSlice'
import wishlist from './wishlistSlice'
import ui from './uiSlice'

export const store = configureStore({
  reducer: { cart, wishlist, ui },
})
