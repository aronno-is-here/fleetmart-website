import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      if (data.user.role !== 'admin') {
        setError('Not an admin account')
        setLoading(false)
        return
      }
      localStorage.setItem('fm_token', data.token)
      localStorage.setItem('fm_user', JSON.stringify(data.user))
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-night px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display tracking-wider">
            <span className="text-volt">FLEET</span>MART
          </h1>
          <p className="mt-2 text-sm font-head text-muted uppercase tracking-widest">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-pitch border border-line p-6 space-y-4">
          {error && <div className="text-sm text-ember bg-ember/10 px-4 py-2 rounded">{error}</div>}

          <div>
            <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-fm" />
          </div>

          <div>
            <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-fm" />
          </div>

          <button type="submit" disabled={loading} className="btn-volt w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
