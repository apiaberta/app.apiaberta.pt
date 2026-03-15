import { useState } from 'react'
import { Eye, EyeOff, Copy, Check, Key, RefreshCw, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = 'https://api.apiaberta.pt/v1'

export default function ApiKeyCard() {
  const { apiKey, tier, token, updateApiKey } = useAuth()
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [rotateError, setRotateError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  function maskKey(key) {
    if (!key) return ''
    const prefix = key.slice(0, 6)
    const suffix = key.slice(-4)
    const masked = '•'.repeat(Math.max(key.length - 10, 8))
    return `${prefix}${masked}${suffix}`
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = apiKey
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function rotateKey() {
    setRotating(true)
    setRotateError(null)
    setShowConfirm(false)
    try {
      const res = await fetch(`${API_BASE}/auth/rotate-key`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Rotation failed')
      updateApiKey(data.apiKey)
      setRevealed(true) // reveal the new key so user sees it
    } catch (err) {
      setRotateError(err.message)
    } finally {
      setRotating(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key size={16} style={{ color: '#16A34A' }} />
          <span className="font-semibold text-slate-900">Your API Key</span>
        </div>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
        >
          {tier === 'free' ? '🟢 Free tier' : `✨ ${tier}`}
        </span>
      </div>

      {/* Key display */}
      <div className="px-6 py-5">
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 gap-3"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
        >
          <code
            className="text-sm flex-1 overflow-hidden text-ellipsis whitespace-nowrap select-all"
            style={{ color: '#0F172A', letterSpacing: '0.025em' }}
          >
            {revealed ? apiKey : maskKey(apiKey)}
          </code>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setRevealed(r => !r)}
              title={revealed ? 'Hide key' : 'Reveal key'}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors border-0 bg-transparent cursor-pointer"
            >
              {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={copyKey}
              title="Copy to clipboard"
              className="p-2 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
              style={copied
                ? { color: '#16A34A', backgroundColor: '#F0FDF4' }
                : { color: '#64748B', backgroundColor: 'transparent' }
              }
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Tier info */}
        <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            60 req / min
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
            1,000 req / day
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            Free forever
          </div>
        </div>

        {/* Rotate Key section */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors border-0 bg-transparent cursor-pointer px-0"
            >
              <RefreshCw size={14} />
              Rotate API key
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3" style={{ border: '1px solid #FDE68A' }}>
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> Rotating your key will immediately invalidate the current one.
                  Update all your integrations before closing this page.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={rotateKey}
                  disabled={rotating}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl text-white transition-all border-0 cursor-pointer"
                  style={{ backgroundColor: rotating ? '#9CA3AF' : '#DC2626' }}
                >
                  <RefreshCw size={14} className={rotating ? 'animate-spin' : ''} />
                  {rotating ? 'Rotating…' : 'Yes, rotate key'}
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setRotateError(null) }}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              {rotateError && (
                <p className="text-sm text-red-600">{rotateError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
