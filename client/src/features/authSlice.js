import { createSlice } from '@reduxjs/toolkit'

const stored = (() => {
  try {
    const t = localStorage.getItem('fm_token')
    const u = localStorage.getItem('fm_user')
    if (t && u) {
      const parsed = JSON.parse(u)
      return { token: t, user: parsed }
    }
  } catch {}
  return { token: null, user: null }
})()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: stored.token,
    user: stored.user,
  },
  reducers: {
    setCredentials(state, action) {
      const { token, user } = action.payload
      state.token = token
      state.user = user
      localStorage.setItem('fm_token', token)
      localStorage.setItem('fm_user', JSON.stringify(user))
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('fm_user', JSON.stringify(state.user))
    },
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('fm_token')
      localStorage.removeItem('fm_user')
    },
  },
})

export const { setCredentials, updateUser, logout } = authSlice.actions
export default authSlice.reducer
