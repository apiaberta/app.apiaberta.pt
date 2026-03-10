import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UsageChart from '../components/UsageChart'
import api from '../api/client'
import {
  Users, BarChart2, Activity, Shield,
  ChevronDown, CheckCircle, XCircle, Loader2
} from 'lucide-react'

/* ── Tier badge ─────────────────────────────────────── */
function TierBadge({ tier }) {
  const styles = {
    free:  { bg: '#F1F5F9', color: '#64748B', label: 'free' },
    pro:   { bg: '#EFF6FF', color: '#2563EB', label: 'pro' },
    admin: { bg: '#F5F3FF', color: '#7C3AED', label: 'admin' },
  }
  const s = styles[tier] ?? styles.free
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

/* ── Status badge ───────────────────────────────────── */
function StatusBadge({ active }) {
  return active ? (
    <span className="flex items-center gap-1 text-xs font-medium text-green-700">
      <CheckCircle size={12} /> activo
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
      <XCircle size={12} /> inactivo
    </span>
  )
}

/* ── Developers tab ─────────────────────────────────── */
function DevelopersTab({ token }) {
  const [devs, setDevs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  const headers = { Authorization: `Bearer ${token}` }

  const fetchDevs = useCallback(() => {
    setLoading(true)
    api.get('/v1/admin/users', { headers })
      .then(r => setDevs(r.data?.developers ?? r.data?.users ?? []))
      .catch(() => setError('Erro a carregar developers. Verifica se o endpoint existe.'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { fetchDevs() }, [fetchDevs])

  async function changeTier(userId, newTier) {
    setActionLoading(p => ({ ...p, [userId + '_tier']: true }))
    try {
      await api.patch(`/v1/admin/users/${userId}`, { tier: newTier }, { headers })
      setDevs(prev => prev.map(d => d.id === userId ? { ...d, tier: newTier } : d))
    } catch {
      alert('Erro ao alterar tier.')
    } finally {
      setActionLoading(p => ({ ...p, [userId + '_tier']: false }))
    }
  }

  async function toggleActive(userId, currentActive) {
    setActionLoading(p => ({ ...p, [userId + '_active']: true }))
    try {
      await api.patch(`/v1/admin/users/${userId}`, { active: !currentActive }, { headers })
      setDevs(prev => prev.map(d => d.id === userId ? { ...d, active: !currentActive } : d))
    } catch {
      alert('Erro ao alterar estado.')
    } finally {
      setActionLoading(p => ({ ...p, [userId + '_active']: false }))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
      <Loader2 size={18} className="animate-spin" /> A carregar developers...
    </div>
  )

  if (error) return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-600 text-sm">{error}</div>
  )

  if (devs.length === 0) return (
    <div className="text-center py-16 text-slate-400 text-sm">Nenhum developer encontrado.</div>
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#F8FAFC' }}>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tier</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Registo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Acções</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {devs.map(dev => (
            <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-800">{dev.name || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{dev.email}</td>
              <td className="px-4 py-3"><TierBadge tier={dev.tier} /></td>
              <td className="px-4 py-3 text-slate-500 text-xs">
                {dev.created_at ? new Date(dev.created_at).toLocaleDateString('pt-PT') : '—'}
              </td>
              <td className="px-4 py-3"><StatusBadge active={dev.active !== false} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {/* Tier selector */}
                  <div className="relative">
                    <select
                      value={dev.tier || 'free'}
                      onChange={e => changeTier(dev.id, e.target.value)}
                      disabled={actionLoading[dev.id + '_tier']}
                      className="appearance-none text-xs border border-slate-200 rounded-lg px-2 py-1 pr-6 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                      <option value="admin">admin</option>
                    </select>
                    <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {/* Toggle active */}
                  <button
                    onClick={() => toggleActive(dev.id, dev.active !== false)}
                    disabled={actionLoading[dev.id + '_active']}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border-0 cursor-pointer disabled:opacity-50 ${
                      dev.active !== false
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {actionLoading[dev.id + '_active'] ? '...' : dev.active !== false ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Usage tab ──────────────────────────────────────── */
function UsageTab({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/v1/admin/usage', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(() => setError('Erro a carregar dados de usage. Verifica se o endpoint /v1/admin/usage existe.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
      <Loader2 size={18} className="animate-spin" /> A carregar usage...
    </div>
  )

  if (error) return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-600 text-sm">{error}</div>
  )

  const byDay = data?.by_day ?? []
  const byEndpoint = data?.by_endpoint ?? []
  const total = data?.total_30d ?? byDay.reduce((s, d) => s + d.count, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Total (30 dias)</div>
          <div className="text-2xl font-bold text-slate-900">{total?.toLocaleString('pt-PT') ?? '—'}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Dias activos</div>
          <div className="text-2xl font-bold text-slate-900">
            {byDay.filter(d => d.count > 0).length}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Média/dia</div>
          <div className="text-2xl font-bold text-slate-900">
            {byDay.length ? Math.round(total / byDay.length).toLocaleString('pt-PT') : '—'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-sm font-semibold text-slate-700 mb-4">Chamadas por dia — últimos 30 dias</div>
        <UsageChart data={byDay} />
      </div>

      {/* Top 10 endpoints */}
      {byEndpoint.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4">Top 10 endpoints</div>
          <div className="flex flex-col gap-2">
            {byEndpoint.slice(0, 10).map((e, i) => {
              const pct = Math.round((e.count / (total || 1)) * 100)
              return (
                <div key={e.endpoint} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <code className="text-xs text-slate-700 w-52 truncate flex-shrink-0">{e.endpoint}</code>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: '#16A34A' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right flex-shrink-0">
                    {e.count.toLocaleString('pt-PT')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Stats tab ──────────────────────────────────────── */
function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/v1/stats')
      .then(r => setStats(r.data))
      .catch(() => setError('Erro a carregar stats.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
      <Loader2 size={18} className="animate-spin" /> A carregar stats...
    </div>
  )

  if (error) return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-600 text-sm">{error}</div>
  )

  const cards = [
    { label: 'Total de chamadas', value: stats?.total_requests ?? stats?.total_calls, color: '#16A34A' },
    { label: 'Developers registados', value: stats?.total_users ?? stats?.developers, color: '#2563EB' },
    { label: 'Conectores activos', value: stats?.total_connectors ?? stats?.connectors, color: '#7C3AED' },
    { label: 'Chamadas hoje', value: stats?.requests_today ?? stats?.calls_today, color: '#D97706' },
  ].filter(c => c.value !== undefined && c.value !== null)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-2">{c.label}</div>
          <div className="text-3xl font-bold" style={{ color: c.color }}>
            {typeof c.value === 'number' ? c.value.toLocaleString('pt-PT') : c.value}
          </div>
        </div>
      ))}
      {cards.length === 0 && (
        <div className="col-span-4 text-center py-12 text-slate-400 text-sm">
          Nenhum stat disponível.
        </div>
      )}
    </div>
  )
}

/* ── Main Admin page ────────────────────────────────── */
const TABS = [
  { id: 'developers', label: 'Developers', icon: Users },
  { id: 'usage',      label: 'Usage',      icon: BarChart2 },
  { id: 'stats',      label: 'Stats',      icon: Activity },
]

export default function Admin() {
  const { token, tier } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('developers')

  useEffect(() => {
    if (!token) { navigate('/', { replace: true }); return }
    if (tier !== 'admin') { navigate('/dashboard', { replace: true }) }
  }, [token, tier, navigate])

  if (!token || tier !== 'admin') return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F5F3FF' }}
          >
            <Shield size={20} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>Administração</h1>
            <p className="text-slate-500 text-sm mt-0.5">Gestão de developers, usage e estatísticas globais.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-0 cursor-pointer -mb-px ${
                  active
                    ? 'text-violet-700 border-b-2 border-violet-600 bg-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-transparent'
                }`}
                style={active ? { borderBottom: '2px solid #7C3AED' } : {}}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'developers' && <DevelopersTab token={token} />}
        {activeTab === 'usage'      && <UsageTab token={token} />}
        {activeTab === 'stats'      && <StatsTab />}

      </div>
    </div>
  )
}
