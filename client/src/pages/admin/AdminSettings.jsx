import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { updateUser } from '../../features/authSlice'
import api from '../../lib/api'

export default function AdminSettings() {
  const dispatch = useDispatch()
  const { user: authUser } = useSelector((s) => s.auth)
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    if (authUser) {
      setProfile({ name: authUser.name || '', email: authUser.email || '', phone: authUser.phone || '' })
    }
  }, [authUser])

  const saveProfile = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })
    setLoading(true)
    try {
      const { data } = await api.put('/auth/profile', { name: profile.name, phone: profile.phone })
      dispatch(updateUser(data.user))
      setMsg({ type: 'success', text: 'Profile updated' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update' })
    }
    setLoading(false)
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (passwords.newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setLoading(true)
    try {
      await api.put('/auth/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMsg({ type: 'success', text: 'Password changed successfully' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' })
    }
    setLoading(false)
  }

  const togglePass = (field) => setShowPass(prev => ({ ...prev, [field]: !prev[field] }))

  const PassInput = ({ label, field, value, onChange }) => (
    <div>
      <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPass[field] ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          className="input-fm pr-10"
        />
        <button type="button" onClick={() => togglePass(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-chalk transition-colors" tabIndex={-1}>
          {showPass[field] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display tracking-wider text-chalk">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => { setTab('profile'); setMsg({ type: '', text: '' }) }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-head ${tab === 'profile' ? 'bg-volt text-night' : 'bg-pitch2 text-muted hover:text-chalk'}`}>
          <User size={16} /> Profile
        </button>
        <button onClick={() => { setTab('password'); setMsg({ type: '', text: '' }) }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-head ${tab === 'password' ? 'bg-volt text-night' : 'bg-pitch2 text-muted hover:text-chalk'}`}>
          <Lock size={16} /> Password
        </button>
      </div>

      {msg.text && (
        <div className={`text-sm px-4 py-2 rounded ${msg.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-ember/20 text-ember'}`}>
          {msg.text}
        </div>
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="bg-pitch border border-line p-6 space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1.5">Name</label>
            <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required className="input-fm" />
          </div>
          <div>
            <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1.5">Email</label>
            <input type="email" value={profile.email} disabled className="input-fm opacity-50 cursor-not-allowed" />
            <p className="text-xs text-muted mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1.5">Phone</label>
            <input type="text" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="input-fm" />
          </div>
          <button type="submit" disabled={loading} className="btn-volt flex items-center gap-2">
            <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <form onSubmit={changePassword} className="bg-pitch border border-line p-6 space-y-4 max-w-lg">
          <PassInput label="Current Password" field="current" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} />
          <PassInput label="New Password" field="new" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
          <PassInput label="Confirm New Password" field="confirm" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
          <button type="submit" disabled={loading} className="btn-volt flex items-center gap-2">
            <Lock size={16} /> {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  )
}
