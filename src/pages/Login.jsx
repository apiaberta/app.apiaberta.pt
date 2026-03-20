import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Loader2, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

export default function Login() {
  const { token, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Already authenticated → go to dashboard
  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/v1/auth/login', { email, password })
      const data = res.data
      login({
        token: data.token,
        apiKey: data.apiKey,
        email: data.email,
        name: data.name,
        tier: data.tier || 'free',
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message
      setError(msg || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

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
            Welcome back
          </h1>
          <p className="text-slate-500 mt-2">
            Sign in to your API Aberta developer account.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #E2E8F0' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                style={{
                  border: '1.5px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                }}
                onFocus={e => (e.target.style.borderColor = '#16A34A')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all"
                  style={{
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                  }}
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

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm no-underline transition-colors"
                style={{ color: '#64748B' }}
              >
                Esqueceste a password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer border-0 mt-1"
              style={{ backgroundColor: loading ? '#86EFAC' : '#16A34A' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Log in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold no-underline transition-colors"
            style={{ color: '#16A34A' }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
