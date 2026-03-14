import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Copy, Check, Terminal, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const BASE = 'https://api.apiaberta.pt'

const GROUPS = [
  {
    group: 'Combustíveis',
    color: '#F59E0B',
    endpoints: [
      { label: 'Preços de combustíveis', path: '/v1/fuel/prices', params: [{ name: 'district', placeholder: 'Lisboa', description: 'Filtrar por distrito' }] },
      { label: 'Estações de serviço',    path: '/v1/fuel/stations', params: [] },
      { label: 'Combustível mais barato', path: '/v1/fuel/cheapest', params: [] },
      { label: 'Metadata',               path: '/v1/fuel/meta', params: [] },
    ]
  },
  {
    group: 'Meteorologia',
    color: '#3B82F6',
    endpoints: [
      { label: 'Previsões',              path: '/v1/ipma/forecasts', params: [] },
      { label: 'Avisos meteorológicos',  path: '/v1/ipma/warnings', params: [] },
      { label: 'Metadata',               path: '/v1/ipma/meta', params: [] },
    ]
  },
  {
    group: 'Electricidade (EV)',
    color: '#8B5CF6',
    endpoints: [
      { label: 'Tarifas EV',             path: '/v1/ev/tariffs', params: [] },
      { label: 'Tarifa mais barata',     path: '/v1/ev/tariffs/cheapest', params: [] },
      { label: 'Preço OMIE actual',      path: '/v1/ev/omie/current', params: [] },
      { label: 'Preço OMIE hoje',        path: '/v1/ev/omie/today', params: [] },
      { label: 'Metadata',               path: '/v1/ev/meta', params: [] },
    ]
  },
  {
    group: 'Contratos Públicos',
    color: '#06B6D4',
    endpoints: [
      { label: 'Listar contratos',       path: '/v1/base/contracts', params: [{ name: 'page', placeholder: '1', description: 'Página' }, { name: 'limit', placeholder: '20', description: 'Por página' }] },
      { label: 'Pesquisar contratos',    path: '/v1/base/contracts/search', params: [{ name: 'q', placeholder: 'construção', description: 'Termo de pesquisa', required: true }] },
      { label: 'Metadata',               path: '/v1/base/meta', params: [] },
    ]
  },
  {
    group: 'Estatísticas (INE)',
    color: '#EC4899',
    endpoints: [
      { label: 'Indicadores disponíveis', path: '/v1/ine/indicators', params: [] },
      { label: 'Estatísticas',            path: '/v1/ine/stats', params: [{ name: 'indicator', placeholder: 'population', description: 'Código do indicador' }] },
      { label: 'Dados mais recentes',     path: '/v1/ine/latest', params: [] },
    ]
  },
  {
    group: 'Protecção Civil',
    color: '#EF4444',
    endpoints: [
      { label: 'Ocorrências',             path: '/v1/anpc/incidents', params: [{ name: 'limit', placeholder: '10', description: 'Limite de resultados' }] },
      { label: 'Ocorrências activas',     path: '/v1/anpc/incidents/active', params: [] },
      { label: 'Resumo',                  path: '/v1/anpc/summary', params: [] },
    ]
  },
  {
    group: 'Banco de Portugal',
    color: '#10B981',
    endpoints: [
      { label: 'Taxas BCE / BdP',         path: '/v1/bdp/rates', params: [] },
      { label: 'Taxas de crédito',        path: '/v1/bdp/lending-rates', params: [] },
      { label: 'Metadata',                path: '/v1/bdp/meta', params: [] },
    ]
  },
  {
    group: 'Geografia',
    color: '#F97316',
    endpoints: [
      { label: 'Distritos',               path: '/v1/geo/districts', params: [] },
      { label: 'Municípios',              path: '/v1/geo/municipalities', params: [{ name: 'district', placeholder: 'lisboa', description: 'Filtrar por distrito' }] },
      { label: 'Freguesias',              path: '/v1/geo/parishes', params: [{ name: 'municipality', placeholder: 'lisboa', description: 'Filtrar por município' }] },
      { label: 'Código postal',           path: '/v1/geo/postal/:code', params: [{ name: 'code', placeholder: '1000-001', description: 'Código postal', isPath: true, required: true }] },
    ]
  },
]

function buildUrl(path, paramValues) {
  let url = BASE + path
  const qs = []
  for (const [k, v] of Object.entries(paramValues)) {
    if (!v) continue
    const placeholder = ':' + k
    if (url.includes(placeholder)) {
      url = url.replace(placeholder, encodeURIComponent(v))
    } else {
      qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    }
  }
  if (qs.length) url += '?' + qs.join('&')
  return url
}

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
      let cls = 'color:#A78BFA' // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = 'color:#60A5FA' // key
        else cls = 'color:#86EFAC' // string
      } else if (/true|false/.test(match)) cls = 'color:#F9A8D4'
      else if (/null/.test(match)) cls = 'color:#94A3B8'
      return `<span style="${cls}">${match}</span>`
    })
}

export default function Playground() {
  const { token, apiKey } = useAuth()
  const navigate = useNavigate()

  const [selectedGroup, setSelectedGroup] = useState(0)
  const [selectedEndpoint, setSelectedEndpoint] = useState(0)
  const [paramValues, setParamValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null) // { status, body, latency }
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) navigate('/', { replace: true })
  }, [token, navigate])

  // Reset params when endpoint changes
  useEffect(() => {
    setParamValues({})
    setResponse(null)
  }, [selectedGroup, selectedEndpoint])

  if (!token) return null

  const group = GROUPS[selectedGroup]
  const endpoint = group.endpoints[selectedEndpoint]

  const builtUrl = buildUrl(endpoint.path, paramValues)

  const curlCmd = `curl -s \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}" \\
  "${builtUrl}"`

  async function run() {
    setLoading(true)
    setResponse(null)
    const t0 = Date.now()
    try {
      const res = await fetch(builtUrl, {
        headers: { 'X-API-Key': apiKey || '' }
      })
      const latency = Date.now() - t0
      let body
      try { body = await res.json() } catch { body = await res.text() }
      setResponse({ status: res.status, body, latency })
    } catch (err) {
      setResponse({ status: 0, body: { error: err.message }, latency: Date.now() - t0 })
    } finally {
      setLoading(false)
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(curlCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const statusColor = response
    ? response.status >= 200 && response.status < 300
      ? '#22C55E'
      : response.status >= 400
      ? '#EF4444'
      : '#F59E0B'
    : '#64748B'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={18} style={{ color: '#16A34A' }} />
            <span className="text-sm font-medium" style={{ color: '#16A34A' }}>API Playground</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
            Experimenta a API
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Selecciona um endpoint, preenche os parâmetros e executa directamente no browser.
          </p>
        </div>

        <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>

          {/* Sidebar — endpoint picker */}
          <div className="flex-shrink-0 w-56">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {GROUPS.map((g, gi) => (
                <div key={g.group}>
                  <div
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: '#F8FAFC', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}
                  >
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: g.color, marginRight: 6 }} />
                    {g.group}
                  </div>
                  {g.endpoints.map((ep, ei) => {
                    const active = gi === selectedGroup && ei === selectedEndpoint
                    return (
                      <button
                        key={ep.path}
                        onClick={() => { setSelectedGroup(gi); setSelectedEndpoint(ei) }}
                        className="w-full text-left px-4 py-2.5 text-xs border-0 cursor-pointer flex items-center gap-1.5 transition-colors"
                        style={{
                          backgroundColor: active ? '#F0FDF4' : 'transparent',
                          color: active ? '#15803D' : '#475569',
                          fontWeight: active ? 600 : 400,
                          borderBottom: '1px solid #F8FAFC',
                        }}
                      >
                        {active && <ChevronRight size={11} style={{ color: '#16A34A', flexShrink: 0 }} />}
                        <span className="truncate">{ep.label}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Main panel */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Endpoint + params */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}
                >
                  GET
                </span>
                <code className="text-sm font-mono text-slate-700 break-all">
                  {endpoint.path}
                </code>
              </div>

              {/* Params */}
              {endpoint.params.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Parâmetros
                  </div>
                  {endpoint.params.map(p => (
                    <div key={p.name} className="flex items-center gap-3">
                      <div className="w-32 flex-shrink-0">
                        <code className="text-xs text-slate-700 font-mono">{p.name}</code>
                        {p.required && <span className="ml-1 text-red-400 text-xs">*</span>}
                        {p.isPath && <span className="ml-1 text-xs text-orange-500">path</span>}
                      </div>
                      <input
                        type="text"
                        value={paramValues[p.name] || ''}
                        onChange={e => setParamValues(v => ({ ...v, [p.name]: e.target.value }))}
                        placeholder={p.placeholder}
                        className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-green-400 text-slate-800 font-mono"
                        style={{ backgroundColor: '#FAFAFA' }}
                      />
                      <span className="text-xs text-slate-400 w-40 flex-shrink-0">{p.description}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Built URL preview */}
              <div
                className="rounded-xl px-4 py-3 mb-4 font-mono text-xs break-all"
                style={{ backgroundColor: '#0F172A', color: '#94A3B8' }}
              >
                <span style={{ color: '#4ADE80' }}>GET </span>
                <span style={{ color: '#E2E8F0' }}>{builtUrl}</span>
              </div>

              {/* Run button */}
              <button
                onClick={run}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-opacity"
                style={{ backgroundColor: '#16A34A', color: 'white', opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Play size={15} />
                }
                {loading ? 'A executar...' : 'Executar'}
              </button>
            </div>

            {/* cURL command */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">cURL</span>
                <button
                  onClick={copyUrl}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  style={{ color: '#475569' }}
                >
                  {copied ? <Check size={12} style={{ color: '#16A34A' }} /> : <Copy size={12} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <pre
                className="text-xs font-mono m-0 p-0 whitespace-pre-wrap break-all"
                style={{ color: '#334155', lineHeight: '1.6' }}
              >
                {curlCmd}
              </pre>
            </div>

            {/* Response */}
            {response && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: response.status >= 200 && response.status < 300 ? '#DCFCE7' : '#FEE2E2', color: statusColor }}
                  >
                    {response.status || 'ERR'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {response.latency}ms
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">Response</span>
                </div>
                <div
                  className="p-5 overflow-auto"
                  style={{ backgroundColor: '#0F172A', maxHeight: 420 }}
                >
                  <pre
                    className="m-0 text-xs font-mono leading-relaxed"
                    style={{ color: '#E2E8F0' }}
                    dangerouslySetInnerHTML={{
                      __html: syntaxHighlight(JSON.stringify(response.body, null, 2))
                    }}
                  />
                </div>
              </div>
            )}

            {/* Empty state */}
            {!response && !loading && (
              <div
                className="rounded-2xl border-2 border-dashed border-slate-200 p-10 flex flex-col items-center justify-center text-center"
                style={{ color: '#94A3B8' }}
              >
                <Terminal size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p className="text-sm">Clica em <strong>Executar</strong> para ver a resposta aqui</p>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
