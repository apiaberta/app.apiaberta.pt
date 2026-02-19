import { useState } from 'react'
import { ArrowRight, Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.apiaberta.pt'

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/v1/fuel/prices',
    description: 'Fuel prices across all Portuguese stations',
    status: 'live',
  },
  {
    method: 'GET',
    path: '/v1/contracts',
    description: 'Public procurement contracts (BASE)',
    status: 'coming_soon',
  },
  {
    method: 'GET',
    path: '/v1/statistics',
    description: 'National statistics (INE)',
    status: 'coming_soon',
  },
]

const StatusBadge = ({ status }) => {
  if (status === 'live') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
        Live
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
      Coming soon
    </span>
  )
}

const MethodBadge = ({ method }) => (
  <span
    className="text-xs font-bold px-2 py-0.5 rounded font-mono"
    style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
  >
    {method}
  </span>
)

function syntaxHighlight(json) {
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
  return str.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    match => {
      let cls = 'color:#a3e635' // number - lime
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'color:#93c5fd' // key - blue
        } else {
          cls = 'color:#fde68a' // string - yellow
        }
      } else if (/true|false/.test(match)) {
        cls = 'color:#86efac' // bool - green
      } else if (/null/.test(match)) {
        cls = 'color:#f9a8d4' // null - pink
      }
      return `<span style="${cls}">${match}</span>`
    }
  )
}

function TryItPanel({ ep }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { status, ms, body }

  const run = async () => {
    setLoading(true)
    setResult(null)
    const apiKey = localStorage.getItem('apiKey') || ''
    const t0 = performance.now()
    try {
      const res = await fetch(`${API_BASE}${ep.path}`, {
        headers: apiKey ? { 'X-API-Key': apiKey } : {},
      })
      const ms = Math.round(performance.now() - t0)
      let body
      try { body = await res.json() } catch { body = null }
      setResult({ status: res.status, ms, body })
    } catch (err) {
      const ms = Math.round(performance.now() - t0)
      setResult({ status: 'ERR', ms, body: { error: err.message } })
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = result && typeof result.status === 'number' && result.status < 400

  return (
    <div>
      <button
        onClick={() => { setOpen(o => !o); if (!open && !result) run() }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        style={{
          backgroundColor: open ? '#DCFCE7' : '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0',
        }}
      >
        {open ? <ChevronUp size={13} /> : <Play size={13} />}
        Try it
        {open && <ChevronDown size={13} />}
      </button>

      {open && (
        <div
          className="mt-3 rounded-xl overflow-hidden"
          style={{ border: '1px solid #1e293b' }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ backgroundColor: '#0f172a' }}
          >
            <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>
              <span style={{ color: '#60a5fa' }}>GET</span>{' '}
              <span style={{ color: '#e2e8f0' }}>{API_BASE}{ep.path}</span>
            </span>
            <div className="flex items-center gap-2">
              {result && (
                <>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: isSuccess ? '#14532d' : '#450a0a',
                      color: isSuccess ? '#86efac' : '#fca5a5',
                    }}
                  >
                    {result.status}
                  </span>
                  <span className="text-xs" style={{ color: '#64748b' }}>
                    {result.ms}ms
                  </span>
                </>
              )}
              <button
                onClick={run}
                disabled={loading}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: loading ? '#1e293b' : '#16a34a',
                  color: loading ? '#475569' : '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                {loading ? 'Running…' : 'Run'}
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            className="px-4 py-3 overflow-auto"
            style={{ backgroundColor: '#0f172a', maxHeight: '320px' }}
          >
            {loading && (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Loader2 size={18} className="animate-spin" style={{ color: '#16a34a' }} />
                <span className="text-sm" style={{ color: '#64748b' }}>Fetching data…</span>
              </div>
            )}
            {!loading && result && (
              <pre
                className="text-xs font-mono leading-relaxed"
                style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(result.body),
                }}
              />
            )}
            {!loading && !result && (
              <p className="text-xs text-center py-4" style={{ color: '#475569' }}>
                Press Run to execute the request
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EndpointList() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Available Endpoints</h3>
        <p className="text-sm text-slate-500 mt-0.5">All requests require an X-API-Key header</p>
      </div>
      <div className="divide-y divide-slate-100">
        {ENDPOINTS.map(ep => (
          <div key={ep.path} className="px-6 py-4 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <MethodBadge method={ep.method} />
                <code className="text-sm font-mono text-slate-700 truncate">{ep.path}</code>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm text-slate-500 hidden sm:block">{ep.description}</span>
                <StatusBadge status={ep.status} />
              </div>
            </div>
            {ep.status === 'live' && (
              <div className="mt-3">
                <TryItPanel ep={ep} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
        <a
          href="https://github.com/apiaberta/apiaberta"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium no-underline hover:underline"
          style={{ color: '#16A34A' }}
        >
          View full API reference
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  )
}
