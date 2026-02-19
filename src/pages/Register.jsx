import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Copy, Check, AlertCircle, Loader2, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

function passwordStrength(pw) {
  if (!pw) return { label: '', color: '', width: '0%' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', color: '#EF4444', width: '25%' }
  if (score === 2) return { label: 'Fair', color: '#F59E0B', width: '50%' }
  if (score === 3) return { label: 'Good', color: '#3B82F6', width: '75%' }
  return { label: 'Strong', color: '#16A34A', width: '100%' }
}

export default function Register() {
  const { token, login } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newKey, setNewKey] = useState(null)
  const [copied, setCopied] = useState(false)

  // Already authenticated → go to dashboard
  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const strength = passwordStrength(password)
  const pwMismatch = confirmPw.length > 0 && password !== confirmPw

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPw) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/v1/auth/register', { name, email, password })
      const data = res.data

      login({
        token: data.token,
        apiKey: data.apiKey,
        email: data.email || email,
        name: data.name || name,
        tier: data.tier || 'free',
      })

      setNewKey(data.apiKey)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message
      setError(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(newKey)
    } catch {
      const el = document.createElement('textarea')
      el.value = newKey
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // ── Show API key reveal view after successful registration ──
  if (newKey) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="w-full max-w-lg">
          {/* Success header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: '#16A34A' }}
            >
              <Zap size={28} color="white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
              You're all set, {name}!
            </h1>
            <p className="text-slate-500 mt-2">Your API key is ready. Save it now — it won't be shown again.</p>
          </div>

          {/* Warning banner */}
          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-4"
            style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
          >
            <AlertCircle size={18} style={{ color: '#B45309', flexShrink: 0, marginTop: '1px' }} />
            <p className="text-sm" style={{ color: '#92400E' }}>
              <strong>This is the only time your full API key will be displayed.</strong>{' '}
              Copy it and store it somewhere safe — a password manager or .env file.
            </p>
          </div>

          {/* Key box */}
          <div
            className="rounded-2xl p-6 mb-6 shadow-sm"
            style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B' }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: '#64748B' }}>YOUR API KEY</p>
            <div
              className="rounded-xl p-4 mb-4 overflow-x-auto"
              style={{ backgroundColor: '#020617', border: '1px solid #1E293B' }}
            >
              <code className="text-sm break-all select-all" style={{ color: '#4ADE80', letterSpacing: '0.03em' }}>
                {newKey}
              </code>
            </div>
            <button
              onClick={copyKey}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer border-0"
              style={copied
                ? { backgroundColor: '#166534', color: '#4ADE80' }
                : { backgroundColor: '#16A34A', color: 'white' }
              }
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied to clipboard!' : 'Copy API key'}
            </button>
          </div>

          {/* Go to dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all cursor-pointer bg-transparent hover:bg-slate-50"
            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
          >
            Continue to Dashboard
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Registration form ──
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: '#16A34A' }}
          >
            <Zap size={28} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
            Create your account
          </h1>
          <p className="text-slate-500 mt-2">
            Access Portuguese public data — fuel prices, contracts, statistics and more.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #E2E8F0' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="João Silva"
                required
                autoComplete="name"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A' }}
                onFocus={e => (e.target.style.borderColor = '#16A34A')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dev@exemplo.pt"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A' }}
                onFocus={e => (e.target.style.borderColor = '#16A34A')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A' }}
                  onFocus={e => (e.target.style.borderColor = '#16A34A')}
                  onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: strength.width, backgroundColor: strength.color }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: strength.color }}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all"
                  style={{
                    border: `1.5px solid ${pwMismatch ? '#FECACA' : '#E2E8F0'}`,
                    backgroundColor: pwMismatch ? '#FFF5F5' : '#F8FAFC',
                    color: '#0F172A',
                  }}
                  onFocus={e => (e.target.style.borderColor = pwMismatch ? '#EF4444' : '#16A34A')}
                  onBlur={e => (e.target.style.borderColor = pwMismatch ? '#FECACA' : '#E2E8F0')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwMismatch && (
                <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Passwords do not match</p>
              )}
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pwMismatch}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer border-0 mt-1"
              style={{ backgroundColor: (loading || pwMismatch) ? '#86EFAC' : '#16A34A' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating your account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link
            to="/"
            className="font-semibold no-underline transition-colors"
            style={{ color: '#16A34A' }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
