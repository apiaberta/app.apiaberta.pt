import { useState } from 'react'
import { Eye, EyeOff, Copy, Check, Key } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ApiKeyCard() {
  const { apiKey, tier } = useAuth()
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  function maskKey(key) {
    if (!key) return ''
    // Show prefix + last 4 chars, mask the middle
    const prefix = key.slice(0, 6) // e.g. "ak_liv"
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
      // fallback
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
      </div>
    </div>
  )
}
