import axios from 'axios'
import { store } from '../store'
import { logout } from '../features/authSlice'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = store.getState().auth.token
      if (token && !err.config?.url?.includes('/auth/login') && !err.config?.url?.includes('/auth/register')) {
        store.dispatch(logout())
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login'
        } else if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
