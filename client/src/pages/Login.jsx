import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { toast } from '../features/uiSlice'
import { setCredentials } from '../features/authSlice'
import api from '../lib/api'

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

export function PasswordInput({ value, onChange, placeholder, minLength }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        required
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-fm pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-chalk transition-colors"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

function SocialButtons() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const googleBtnRef = useRef(null)

  const handleGoogleLogin = async (credential) => {
    try {
      const { data } = await api.post('/auth/google', { credential })
      dispatch(setCredentials({ token: data.token, user: data.user }))
      dispatch(toast({ type: 'success', message: 'Welcome to Fleetmart!' }))
      navigate('/shop')
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Google sign-in failed' }))
    }
  }

  const handleAppleLogin = async () => {
    try {
      if (window.AppleID?.auth) {
        window.AppleID.auth.signIn()
      } else {
        dispatch(toast({ type: 'info', message: 'Apple Sign-In is loading. Please try again in a moment.' }))
      }
    } catch {
      dispatch(toast({ type: 'error', message: 'Apple sign-in failed' }))
    }
  }

  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.getElementById('google-signin-script')) return
      const script = document.createElement('script')
      script.id = 'google-signin-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
            callback: (response) => handleGoogleLogin(response.credential),
            auto_select: false,
            cancel_on_tap_outside: true,
          })
          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_black',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'rectangular',
            })
          }
        }
      }
      document.head.appendChild(script)
    }

    const loadAppleScript = () => {
      if (document.getElementById('apple-signin-script')) return
      const script = document.createElement('script')
      script.id = 'apple-signin-script'
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/en_US/.appleid.auth.js'
      script.async = true
      script.onload = () => {
        if (window.AppleID?.auth) {
          window.AppleID.auth.init({
            clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
            scope: 'name email',
            redirectURI: window.location.origin,
            usePopup: true,
          })
        }
      }
      document.head.appendChild(script)
    }

    if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      loadGoogleScript()
    }

    loadAppleScript()
  }, [])

  return (
    <div className="space-y-3">
      {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
        <div ref={googleBtnRef} className="w-full [&>div]:w-full" />
      ) : (
        <div className="flex w-full items-center justify-center gap-3 border border-line bg-pitch2 px-4 py-3 text-sm font-medium text-muted transition-all duration-200">
          <svg className="h-5 w-5 opacity-50" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google Sign-In (Admin: configure VITE_GOOGLE_CLIENT_ID)
        </div>
      )}
      <button type="button" onClick={handleAppleLogin} className="flex w-full items-center justify-center gap-3 border border-line bg-pitch2 px-4 py-3 text-sm font-medium text-chalk transition-all duration-200 hover:border-chalk hover:bg-pitch">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        Continue with Apple
      </button>
    </div>
  )
}

function Divider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-line" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-pitch px-3 text-muted">or</span>
      </div>
    </div>
  )
}

export function useAuthSubmit({ mode }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const { data } = await api.post(endpoint, payload)
      dispatch(setCredentials({ token: data.token, user: data.user }))
      dispatch(toast({
        type: 'success',
        message: mode === 'login' ? 'Login successful — Welcome back!' : 'Account created — you are match ready!'
      }))
      navigate('/shop')
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Try again.'
      if (mode === 'login') {
        setError(msg)
      } else {
        dispatch(toast({ type: 'error', message: msg }))
      }
    } finally {
      setBusy(false)
    }
  }

  return { form, setForm, submit, busy, error, setError }
}

export default function Login() {
  const { form, setForm, submit, busy, error } = useAuthSubmit({ mode: 'login' })
  return (
    <AuthShell title="Welcome Back" sub="Log in to your Fleetmart squad account.">
      <SocialButtons />
      <Divider />
      <form onSubmit={submit} className="space-y-4">
        <AuthInput type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div>
          <PasswordInput placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="mt-1.5 text-xs text-ember">{error}</p>}
        </div>
        <div className="flex justify-between text-xs">
          <label className="flex items-center gap-2 text-muted"><input type="checkbox" className="accent-[#C6F53F]" /> Remember me</label>
          <Link to="/forgot-password" className="text-volt hover:underline">Forgot password?</Link>
        </div>
        <button disabled={busy} className="btn-volt w-full justify-center">{busy ? 'Signing in…' : 'Log In'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to Fleetmart? <Link to="/register" className="font-semibold text-volt hover:underline">Create account</Link>
      </p>
    </AuthShell>
  )
}
