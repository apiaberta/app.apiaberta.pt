import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, BookOpen, BarChart2, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ApiKeyCard from '../components/ApiKeyCard'
import CodeBlock from '../components/CodeBlock'
import EndpointList from '../components/EndpointList'
import UsageChart from '../components/UsageChart'
import api from '../api/client'

const CURL_EXAMPLE = `curl -H "X-API-Key: YOUR_KEY" \\
  https://api.apiaberta.pt/v1/fuel/prices`

export default function Dashboard() {
  const { token, name } = useAuth()
  const navigate = useNavigate()

  const [usage, setUsage]   = useState(null)
  const [loadingU, setLoadingU] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) navigate('/', { replace: true })
  }, [token, navigate])

  // Fetch usage stats
  useEffect(() => {
    if (!token) return
    api.get('/v1/auth/usage', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => setUsage(r.data))
      .catch(() => setUsage(null))
      .finally(() => setLoadingU(false))
  }, [token])

  if (!token) return null

  const topEndpoint = usage?.by_endpoint?.[0]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            {name ? `Bem-vindo, ${name.split(' ')[0]}. ` : ''}
            Gere o teu acesso à API abaixo.
          </p>
        </div>

        {/* Main grid */}
        <div className="flex flex-col gap-6">

          {/* API Key card */}
          <ApiKeyCard />

          {/* Usage stats */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-green-600" />
              <h2 className="font-semibold text-slate-900">Utilização — últimos 30 dias</h2>
            </div>

            {loadingU ? (
              <div className="h-28 flex items-center justify-center text-sm text-slate-400">
                A carregar dados...
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500 mb-1">Total de pedidos</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {usage?.total_30d?.toLocaleString('pt-PT') ?? '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500 mb-1">Endpoint mais usado</div>
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {topEndpoint ? topEndpoint.endpoint.replace('/v1/', '') : '—'}
                    </div>
                    {topEndpoint && (
                      <div className="text-xs text-slate-400">{topEndpoint.count} pedidos</div>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500 mb-1">Dias activos</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {usage?.by_day?.filter(d => d.count > 0).length ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Bar chart */}
                <UsageChart data={usage?.by_day ?? []} />

                {/* Top endpoints table */}
                {usage?.by_endpoint?.length > 0 && (
                  <div className="mt-5">
                    <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                      Top endpoints
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {usage.by_endpoint.slice(0, 5).map(e => {
                        const pct = Math.round((e.count / (usage.total_30d || 1)) * 100)
                        return (
                          <div key={e.endpoint} className="flex items-center gap-3">
                            <code className="text-xs text-slate-600 w-48 truncate flex-shrink-0">
                              {e.endpoint}
                            </code>
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: '#16A34A' }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-12 text-right flex-shrink-0">
                              {e.count}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick start */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-amber-500" />
              <h2 className="font-semibold text-slate-900">Quick start</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Inclui a tua API key no header{' '}
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">X-API-Key</code> em cada pedido.
            </p>
            <CodeBlock
              code={CURL_EXAMPLE}
              language="bash"
              label="cURL"
            />
          </div>

          {/* Endpoints */}
          <EndpointList />

          {/* Links row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://github.com/apiaberta/apiaberta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 no-underline hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <BookOpen size={18} style={{ color: '#16A34A' }} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-green-700 transition-colors">
                  Documentação completa
                </div>
                <div className="text-xs text-slate-500 mt-0.5">GitHub · OpenAPI spec + exemplos</div>
              </div>
              <ExternalLink size={14} className="ml-auto text-slate-400 group-hover:text-green-600 transition-colors" />
            </a>

            <a
              href="https://api.apiaberta.pt/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 no-underline hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#EFF6FF' }}
              >
                <ExternalLink size={18} style={{ color: '#2563EB' }} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                  API Reference (Swagger)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Experimenta os endpoints directamente</div>
              </div>
              <ExternalLink size={14} className="ml-auto text-slate-400 group-hover:text-blue-600 transition-colors" />
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
