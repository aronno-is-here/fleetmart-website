import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Zap } from 'lucide-react'
import { toast } from '../features/uiSlice'

export function AuthShell({ title, sub, children }) {
  return (
    <div className="container-fm grid gap-12 py-16 lg:grid-cols-2 lg:items-center">
      <div className="hidden lg:block">
        <p className="eyebrow mb-4">Fleetmart Members</p>
        <h2 className="font-display text-7xl leading-[0.9] tracking-wide text-chalk">
          JOIN THE<br /><span className="text-volt">STARTING XI</span>
        </h2>
        <ul className="mt-8 space-y-3 text-sm text-muted">
          {['Track orders in real time', 'Save kits & customize faster', 'Members-only drops and coupons', 'Free birthday printing voucher'].map((f) => (
            <li key={f} className="flex items-center gap-3"><Zap size={14} className="text-volt" />{f}</li>
          ))}
        </ul>
      </div>
      <div className="mx-auto w-full max-w-md border border-line bg-pitch p-8">
        <h1 className="font-display text-4xl uppercase tracking-wide text-chalk">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{sub}</p>
        {children}
      </div>
    </div>
  )
}

export function AuthInput(props) {
  return <input {...props} className="input-fm" />
}

export function useAuthSubmit({ mode }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      dispatch(toast({ type: 'success', message: mode === 'login' ? 'Welcome back to the squad!' : 'Account created — you are match ready!' }))
      navigate('/account')
    }, 700)
  }

  return { form, setForm, submit, busy }
}

export default function Login() {
  const { form, setForm, submit, busy } = useAuthSubmit({ mode: 'login' })
  return (
    <AuthShell title="Welcome Back" sub="Log in to your Fleetmart squad account.">
      <form onSubmit={submit} className="space-y-4">
        <AuthInput type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <AuthInput type="password" required placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="flex justify-between text-xs">
          <label className="flex items-center gap-2 text-muted"><input type="checkbox" className="accent-[#C6F53F]" /> Remember me</label>
          <a href="#" className="text-volt hover:underline">Forgot password?</a>
        </div>
        <button disabled={busy} className="btn-volt w-full justify-center">{busy ? 'Signing in…' : 'Log In'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to Fleetmart? <Link to="/register" className="font-semibold text-volt hover:underline">Create account</Link>
      </p>
    </AuthShell>
  )
}