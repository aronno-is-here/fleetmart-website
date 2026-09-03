import { configureStore } from '@reduxjs/toolkit'
import cart from '../features/cartSlice'
import wishlist from '../features/wishlistSlice'
import ui from '../features/uiSlice'
import auth from '../features/authSlice'

export const store = configureStore({
  reducer: { cart, wishlist, ui, auth },
})
