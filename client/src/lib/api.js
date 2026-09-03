import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('fm_token')
      if (token && !err.config?.url?.includes('/auth/login') && !err.config?.url?.includes('/auth/register')) {
        localStorage.removeItem('fm_token')
        localStorage.removeItem('fm_user')
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
