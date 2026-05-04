import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Webhook, Plus, Trash2, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const ALL_EVENTS = [
  { id: 'ipma.warning.new',    label: 'Aviso IPMA', desc: 'Novo aviso meteorológico emitido pelo IPMA' },
  { id: 'fuel.prices.updated', label: 'Preços combustível', desc: 'Actualização diária de preços de combustível (DGEG)' },
  { id: 'anpc.incident.new',   label: 'Ocorrência ANPC', desc: 'Nova ocorrência de protecção civil registada' },
  { id: 'base.contract.new',   label: 'Contrato público', desc: 'Novo contrato publicado em BASE.gov.pt' },
  { id: 'ev.prices.updated',   label: 'Preços EV (OMIE)', desc: 'Actualização de preço da electricidade no mercado ibérico' }
]

function StatusBadge({ status }) {
  const map = {
    delivered: { icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4', label: 'Entregue' },
    failed:    { icon: XCircle,     color: '#DC2626', bg: '#FEF2F2', label: 'Falhou' },
    pending:   { icon: Clock,       color: '#D97706', bg: '#FFFBEB', label: 'Pendente' }
  }
  const s = map[status] || map.pending
  const Icon = s.icon
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      <Icon size={11} />
      {s.label}
    </span>
  )
}

function WebhookCard({ wh, onDelete }) {
  const [deliveries, setDeliveries] = useState(null)
  const [expanded, setExpanded]     = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [testing, setTesting]       = useState(false)
  const [testResult, setTestResult] = useState(null) // { status, responseCode, error }
  const { token } = useAuth()

  function toggleDeliveries() {
    if (!expanded && !deliveries) {
      api.get(`/v1/webhooks/${wh.id}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => setDeliveries(r.data.data || []))
        .catch(() => setDeliveries([]))
    }
    setExpanded(e => !e)
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await api.post(`/v1/webhooks/${wh.id}/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTestResult({ status: res.data.status, responseCode: res.data.responseCode })
      // Reset deliveries cache so next expand shows updated list
      setDeliveries(null)
    } catch (err) {
      setTestResult({ status: 'failed', error: err.response?.data?.message || 'Erro de rede' })
    } finally {
      setTesting(false)
      // Clear result after 4s
      setTimeout(() => setTestResult(null), 4000)
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover webhook para ${wh.url}?`)) return
    setDeleting(true)
    try {
      await api.delete(`/v1/webhooks/${wh.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      onDelete(wh.id)
    } catch {
      alert('Erro ao remover webhook.')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: wh.active ? '#16A34A' : '#94A3B8' }}
              />
              <code className="text-sm font-semibold text-slate-800 truncate">{wh.url}</code>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {wh.events.map(ev => {
                const info = ALL_EVENTS.find(e => e.id === ev)
                return (
                  <span
                    key={ev}
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}
                  >
                    {info?.label || ev}
                  </span>
                )
              })}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Criado em {new Date(wh.createdAt).toLocaleDateString('pt-PT')}
              {wh.lastDelivery && (
                <> · Última entrega: {new Date(wh.lastDelivery).toLocaleString('pt-PT')}</>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {testResult && (
              <span
                className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{
                  color: testResult.status === 'delivered' ? '#16A34A' : '#DC2626',
                  backgroundColor: testResult.status === 'delivered' ? '#F0FDF4' : '#FEF2F2'
                }}
              >
                {testResult.status === 'delivered'
                  ? `✓ HTTP ${testResult.responseCode}`
                  : `✗ ${testResult.error || 'Falhou'}`}
              </span>
            )}
            <button
              onClick={handleTest}
              disabled={testing || !wh.active}
              title="Enviar entrega de teste"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer border-0 bg-transparent px-2 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FlaskConical size={13} />
              {testing ? 'A testar...' : 'Testar'}
            </button>
            <button
              onClick={toggleDeliveries}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Entregas
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
          <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
            Últimas entregas
          </div>
          {!deliveries ? (
            <div className="text-xs text-slate-400">A carregar...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-xs text-slate-400">Nenhuma entrega ainda.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {deliveries.slice(0, 5).map(d => (
                <div key={d._id || d.id} className="flex items-center gap-3 text-xs">
                  <StatusBadge status={d.status} />
                  <code className="text-slate-600 flex-1 truncate">{d.event}</code>
                  <span className="text-slate-400 flex-shrink-0">
                    {d.lastAttempt ? new Date(d.lastAttempt).toLocaleString('pt-PT') : '—'}
                  </span>
                  {d.responseCode > 0 && (
                    <span className="text-slate-400 flex-shrink-0">HTTP {d.responseCode}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CreateForm({ onCreate, onCancel }) {
  const [url, setUrl]       = useState('')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const { token } = useAuth()

  function toggleEvent(id) {
    setEvents(ev => ev.includes(id) ? ev.filter(e => e !== id) : [...ev, id])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!url.startsWith('https://')) {
      setError('O URL do webhook deve começar com https://')
      return
    }
    if (events.length === 0) {
      setError('Selecciona pelo menos um evento.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/v1/webhooks', { url, events }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      onCreate(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar webhook.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Novo webhook</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">URL de destino (HTTPS)</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.meusite.pt/webhook"
            required
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-2">Eventos a subscrever</label>
          <div className="flex flex-col gap-2">
            {ALL_EVENTS.map(ev => (
              <label
                key={ev.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-green-200 cursor-pointer transition-colors"
                style={{ backgroundColor: events.includes(ev.id) ? '#F0FDF4' : '#FAFAFA' }}
              >
                <input
                  type="checkbox"
                  checked={events.includes(ev.id)}
                  onChange={() => toggleEvent(ev.id)}
                  className="mt-0.5 accent-green-600"
                />
                <div>
                  <div className="text-sm font-medium text-slate-800">{ev.label}</div>
                  <div className="text-xs text-slate-500">{ev.desc}</div>
                  <code className="text-xs text-slate-400">{ev.id}</code>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer border-0 disabled:opacity-50"
            style={{ backgroundColor: '#16A34A' }}
          >
            {loading ? 'A criar...' : 'Criar webhook'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 bg-white"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Webhooks() {
  const { token } = useAuth()
  const navigate  = useNavigate()
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!token) { navigate('/', { replace: true }); return }
    api.get('/v1/webhooks', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setWebhooks(r.data.data || []))
      .catch(() => setWebhooks([]))
      .finally(() => setLoading(false))
  }, [token, navigate])

  function handleCreated(wh) {
    setWebhooks(prev => [wh, ...prev])
    setCreating(false)
  }

  function handleDeleted(id) {
    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  if (!token) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Webhook size={22} className="text-green-600" />
              Webhooks
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Recebe notificações em tempo real quando eventos ocorrem na API.
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer border-0 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#16A34A' }}
            >
              <Plus size={15} />
              Novo webhook
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {creating && (
            <CreateForm onCreate={handleCreated} onCancel={() => setCreating(false)} />
          )}

          {loading ? (
            <div className="text-center py-10 text-sm text-slate-400">A carregar webhooks...</div>
          ) : webhooks.length === 0 && !creating ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <Webhook size={36} className="mx-auto mb-3 text-slate-300" />
              <div className="text-slate-600 font-medium mb-1">Nenhum webhook configurado</div>
              <div className="text-sm text-slate-400 mb-4">
                Cria um webhook para receber eventos em tempo real.
              </div>
              <button
                onClick={() => setCreating(true)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer border-0"
                style={{ backgroundColor: '#16A34A' }}
              >
                <Plus size={14} className="inline mr-1.5" />
                Criar primeiro webhook
              </button>
            </div>
          ) : (
            webhooks.map(wh => (
              <WebhookCard key={wh.id} wh={wh} onDelete={handleDeleted} />
            ))
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="text-sm font-semibold text-blue-800 mb-1">Como funcionam os webhooks?</div>
          <div className="text-xs text-blue-700 leading-relaxed">
            Quando um evento ocorre, fazemos um POST HTTPS para o teu URL com um JSON assinado via HMAC-SHA256.
            Verifica a assinatura no header <code className="bg-blue-100 px-1 rounded">X-ApiAberta-Signature</code>.
            Se a entrega falhar, tentamos mais 2 vezes (30s e 120s de intervalo).
            Usa o botão <strong>Testar</strong> para verificar que o teu endpoint está a receber correctamente.
          </div>
        </div>
      </div>
    </div>
  )
}
