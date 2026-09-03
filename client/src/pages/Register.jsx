import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell, AuthInput, PasswordInput, useAuthSubmit } from './Login'

export default function Register() {
  const { form, setForm, submit, busy, error, setError } = useAuthSubmit({ mode: 'register' })
  const [confirm, setConfirm] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== confirm) {
      setError('Passwords do not match')
      return
    }
    submit(e)
  }

  return (
    <AuthShell title="Get In The Game" sub="Create your squad account — takes 30 seconds.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <AuthInput type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordInput placeholder="Password (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} />
        <div>
          <PasswordInput placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} />
          {error && <p className="mt-1.5 text-xs text-ember">{error}</p>}
        </div>
        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" required className="mt-0.5 accent-[#C6F53F]" />
          I agree to the Terms of Service and Privacy Policy
        </label>
        <button disabled={busy} className="btn-volt w-full justify-center">{busy ? 'Creating…' : 'Create Account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already on the squad? <Link to="/login" className="font-semibold text-volt hover:underline">Log in</Link>
      </p>
    </AuthShell>
  )
}
