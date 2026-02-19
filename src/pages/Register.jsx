import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Copy, Check, AlertCircle, Loader2, Zap, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const { apiKey, login } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newKey, setNewKey] = useState(null)
  const [copied, setCopied] = useState(false)

  // If already has a key, redirect
  useEffect(() => {
    if (apiKey) navigate('/dashboard', { replace: true })
  }, [apiKey, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await axios.post('/v1/auth/register', { name, email })
      const data = res.data
      const key = data.apiKey || data.api_key || data.key

      login({
        apiKey: key,
        email,
        name,
        tier: data.tier || 'free',
      })

      setNewKey(key)
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

  // Show the "key revealed once" view after registration
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
              <strong>This is the only time your full API key will be displayed.</strong> Copy it and store it somewhere safe — a password manager or .env file.
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

  // Registration form
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
            Get your free API key
          </h1>
          <p className="text-slate-500 mt-2">
            Access Portuguese public data — fuel prices, contracts, statistics and more.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #E2E8F0' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dev@exemplo.pt"
                required
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
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer border-0 mt-1"
              style={{ backgroundColor: loading ? '#86EFAC' : '#16A34A' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating your key…
                </>
              ) : (
                <>
                  Get my free API key
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          No credit card required. Free tier: 60 req/min, 1,000 req/day.
        </p>
      </div>
    </div>
  )
}
