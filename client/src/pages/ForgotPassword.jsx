import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Mail, Smartphone, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { toast } from '../features/uiSlice'
import api from '../lib/api'

export default function ForgotPassword() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [method, setMethod] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)

  const requestCode = async (e) => {
    e.preventDefault()
    if (!email) return
    setBusy(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email, method })
      dispatch(toast({ type: 'success', message: data.message }))
      setStep(1)
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Failed to send code' }))
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async (e) => {
    e.preventDefault()
    if (!code || code.length !== 6) return
    setBusy(true)
    try {
      const { data } = await api.post('/auth/verify-code', { email, code })
      dispatch(toast({ type: 'success', message: 'Code verified!' }))
      setResetToken(data.resetToken)
      setStep(2)
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Invalid code' }))
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      dispatch(toast({ type: 'error', message: 'Passwords do not match' }))
      return
    }
    if (newPassword.length < 6) {
      dispatch(toast({ type: 'error', message: 'Password must be at least 6 characters' }))
      return
    }
    setBusy(true)
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword })
      dispatch(toast({ type: 'success', message: 'Password reset successful! Logging you in…' }))
      navigate('/login')
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Reset failed' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-fm grid gap-12 py-16 lg:grid-cols-2 lg:items-center">
      <div className="hidden lg:block">
        <p className="eyebrow mb-4">Account Recovery</p>
        <h2 className="font-display text-7xl leading-[0.9] tracking-wide text-chalk">
          FORGOT YOUR<br /><span className="text-volt">PASSWORD?</span>
        </h2>
        <p className="mt-6 text-muted text-sm leading-relaxed">
          No worries — we'll get you back on the pitch. Choose how you'd like to verify your identity.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md border border-line bg-pitch p-8">
        {/* Step 0: Enter email + choose method */}
        {step === 0 && (
          <>
            <h1 className="font-display text-4xl uppercase tracking-wide text-chalk">Reset Password</h1>
            <p className="mt-1 mb-6 text-sm text-muted">Enter your email and choose a verification method.</p>
            <form onSubmit={requestCode} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-fm"
              />
              <p className="text-xs uppercase tracking-widest text-muted">Verify via</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`flex flex-col items-center gap-2 border p-4 transition-all ${method === 'email' ? 'border-volt bg-volt/10 text-volt' : 'border-line text-muted hover:border-volt/50'}`}
                >
                  <Mail size={24} />
                  <span className="text-xs font-semibold uppercase tracking-widest">Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('sms')}
                  className={`flex flex-col items-center gap-2 border p-4 transition-all ${method === 'sms' ? 'border-volt bg-volt/10 text-volt' : 'border-line text-muted hover:border-volt/50'}`}
                >
                  <Smartphone size={24} />
                  <span className="text-xs font-semibold uppercase tracking-widest">SMS</span>
                </button>
              </div>
              <button
                type="submit"
                disabled={!method || busy}
                className="btn-volt w-full justify-center"
              >
                {busy ? 'Sending…' : 'Send Verification Code'} <ArrowRight size={15} />
              </button>
            </form>
          </>
        )}

        {/* Step 1: Enter code */}
        {step === 1 && (
          <>
            <button onClick={() => setStep(0)} className="mb-4 flex items-center gap-1 text-xs text-muted hover:text-chalk">
              <ArrowLeft size={14} /> Back
            </button>
            <h1 className="font-display text-4xl uppercase tracking-wide text-chalk">Verify Code</h1>
            <p className="mt-1 mb-6 text-sm text-muted">
              Enter the 6-digit code sent to <span className="text-chalk">{email}</span> via {method === 'email' ? 'email' : 'SMS'}.
            </p>
            <form onSubmit={verifyCode} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="input-fm text-center text-2xl tracking-[0.5em] font-mono"
              />
              <button type="submit" disabled={code.length !== 6 || busy} className="btn-volt w-full justify-center">
                {busy ? 'Verifying…' : 'Verify Code'} <ArrowRight size={15} />
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-muted">
              Didn't receive it?{' '}
              <button onClick={requestCode} className="text-volt hover:underline" disabled={busy}>
                Resend code
              </button>
            </p>
          </>
        )}

        {/* Step 2: New password */}
        {step === 2 && (
          <>
            <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1 text-xs text-muted hover:text-chalk">
              <ArrowLeft size={14} /> Back
            </button>
            <h1 className="font-display text-4xl uppercase tracking-wide text-chalk">New Password</h1>
            <p className="mt-1 mb-6 text-sm text-muted">Create a strong new password for your account.</p>
            <form onSubmit={resetPassword} className="space-y-4">
              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-fm pr-11"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-chalk transition-colors"
                  tabIndex={-1}
                >
                  {passwordVisible ? '🙈' : '👁'}
                </button>
              </div>
              <input
                type={passwordVisible ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-fm"
              />
              <button type="submit" disabled={busy} className="btn-volt w-full justify-center">
                {busy ? 'Resetting…' : 'Reset Password'} <Check size={15} />
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Remember your password? <Link to="/login" className="font-semibold text-volt hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
