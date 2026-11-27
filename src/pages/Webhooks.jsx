import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Webhook,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  KeyRound,
  Pencil,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'
import WebhookForm from '../webhooks/WebhookForm'
import WebhookSecretPanel from '../webhooks/WebhookSecretPanel'
import {
  eventLabel,
  extractWebhookSecret,
  listActiveFilterSummaries,
  parseCatalog,
  webhookRecordFromResponse,
} from '../webhooks/helpers'

function StatusBadge({ status }) {
  const map = {
    delivered: { icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4', label: 'Entregue' },
    failed:    { icon: XCircle,     color: '#DC2626', bg: '#FEF2F2', label: 'Falhou' },
    pending:   { icon: Clock,       color: '#D97706', bg: '#FFFBEB', label: 'Pendente' },
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

function WebhookCard({ wh, catalog, refs, onDelete, onUpdate, onEdit, onRevealSecret }) {
  const [deliveries, setDeliveries] = useState(null)
  const [expanded, setExpanded]     = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [testing, setTesting]       = useState(false)
  const [toggling, setToggling]     = useState(false)
  const [rotating, setRotating]     = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [rotateError, setRotateError] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const { token } = useAuth()
  const summaries = listActiveFilterSummaries(wh, catalog, refs)

  function toggleDeliveries() {
    if (!expanded && !deliveries) {
      api.get(`/v1/webhooks/${wh.id}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      })
      setTestResult({ status: res.data.status, responseCode: res.data.responseCode })
      setDeliveries(null)
    } catch (err) {
      setTestResult({ status: 'failed', error: err.response?.data?.message || 'Erro de rede' })
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 4000)
    }
  }

  async function handleToggleActive() {
    setToggling(true)
    try {
      const res = await api.patch(`/v1/webhooks/${wh.id}`, { active: !wh.active }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      onUpdate(res.data)
    } catch {
      alert('Erro ao atualizar o estado do webhook.')
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover webhook para ${wh.url}?`)) return
    setDeleting(true)
    try {
      await api.delete(`/v1/webhooks/${wh.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      onDelete(wh.id)
    } catch {
      alert('Erro ao remover webhook.')
      setDeleting(false)
    }
  }

  async function handleRotateSecret() {
    setRotating(true)
    setRotateError(null)
    try {
      const res = await api.post(`/v1/webhooks/${wh.id}/rotate-secret`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const secret = extractWebhookSecret(res.data)
      if (!secret) {
        setRotateError('Não foi possível gerar o novo segredo.')
        return
      }
      setConfirmRotate(false)
      onRevealSecret(secret, 'rotate')
    } catch (err) {
      setRotateError(
        err.response?.status === 404
          ? 'Este webhook já não existe.'
          : 'Não foi possível gerar o novo segredo.'
      )
    } finally {
      setRotating(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: wh.active ? '#16A34A' : '#94A3B8' }}
                aria-hidden="true"
              />
              <code className="text-sm font-semibold text-slate-800 truncate">{wh.url}</code>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(wh.events || []).map(ev => (
                <span
                  key={ev}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}
                >
                  {eventLabel(ev, catalog)}
                </span>
              ))}
            </div>
            {summaries.length > 0 && (
              <ul className="mt-2 flex flex-col gap-0.5 m-0 p-0 list-none">
                {summaries.map(line => (
                  <li key={line} className="text-xs text-slate-500">{line}</li>
                ))}
              </ul>
            )}
            <div className="text-xs text-slate-400 mt-2">
              Criado em {new Date(wh.createdAt).toLocaleDateString('pt-PT')}
              {wh.lastDelivery && (
                <> · Última entrega: {new Date(wh.lastDelivery).toLocaleString('pt-PT')}</>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 sm:justify-end">
            {testResult && (
              <span
                className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{
                  color: testResult.status === 'delivered' ? '#16A34A' : '#DC2626',
                  backgroundColor: testResult.status === 'delivered' ? '#F0FDF4' : '#FEF2F2',
                }}
              >
                {testResult.status === 'delivered'
                  ? `✓ HTTP ${testResult.responseCode}`
                  : `✗ ${testResult.error || 'Falhou'}`}
              </span>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(wh.active)}
              onClick={handleToggleActive}
              disabled={toggling}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg cursor-pointer border-0 disabled:opacity-40"
              style={{
                color: wh.active ? '#15803D' : '#64748B',
                backgroundColor: wh.active ? '#F0FDF4' : '#F1F5F9',
              }}
            >
              {wh.active ? 'Ativo' : 'Pausado'}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !wh.active}
              title="Enviar entrega de teste"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer border-0 bg-transparent px-2 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FlaskConical size={13} />
              {testing ? 'A testar...' : 'Testar'}
            </button>
            {!confirmRotate && (
              <button
                type="button"
                onClick={() => { setRotateError(null); setConfirmRotate(true) }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                <KeyRound size={13} />
                Gerar novo segredo
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              <Pencil size={13} />
              Editar definições
            </button>
            <button
              type="button"
              onClick={toggleDeliveries}
              aria-expanded={expanded}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Entregas
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={`Remover webhook ${wh.url}`}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {confirmRotate && (
          <div
            className="mt-4 rounded-xl px-4 py-3"
            style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
          >
            <p className="text-sm m-0" style={{ color: '#92400E' }}>
              O segredo antigo deixa de funcionar imediatamente.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => { setConfirmRotate(false); setRotateError(null) }}
                className="min-h-11 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 cursor-pointer border border-slate-200 bg-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRotateSecret}
                disabled={rotating}
                className="min-h-11 px-3 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer border-0 disabled:opacity-50"
                style={{ backgroundColor: '#DC2626' }}
              >
                {rotating ? 'A gerar...' : 'Sim, gerar novo'}
              </button>
            </div>
            {rotateError && (
              <p role="alert" className="text-sm text-red-600 mt-2 mb-0">{rotateError}</p>
            )}
          </div>
        )}
        {!confirmRotate && rotateError && (
          <p role="alert" className="text-sm text-red-600 mt-3 mb-0">{rotateError}</p>
        )}
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

export default function Webhooks() {
  const { token } = useAuth()
  const navigate  = useNavigate()
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [refs, setRefs] = useState({ municipalities: [], districts: [] })
  const [catalogStatus, setCatalogStatus] = useState('loading')
  const [catalogError, setCatalogError] = useState(null)
  const [revealedSecret, setRevealedSecret] = useState(null)
  const listFetchId = useRef(0)

  function catalogErrorMessage(err) {
    return err.response?.data?.message
      || 'Não foi possível carregar os eventos disponíveis. Tenta outra vez — a lista antiga não é usada.'
  }

  function applyCatalog(parsed) {
    setCatalog(parsed.events)
    setRefs(parsed.refs)
    setCatalogStatus('ok')
    setCatalogError(null)
  }

  function applyCatalogError(err) {
    setCatalog([])
    setRefs({ municipalities: [], districts: [] })
    setCatalogStatus('error')
    setCatalogError(catalogErrorMessage(err))
  }

  function fetchCatalog() {
    return api.get('/v1/webhooks/events', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => parseCatalog(r.data))
  }

  function retryCatalog() {
    setCatalogStatus('loading')
    setCatalogError(null)
    fetchCatalog().then(applyCatalog).catch(applyCatalogError)
  }

  useEffect(() => {
    if (!token) { navigate('/', { replace: true }); return }
    const fetchId = ++listFetchId.current
    api.get('/v1/webhooks', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (fetchId !== listFetchId.current) return
        setWebhooks(r.data.data || [])
      })
      .catch(() => {
        if (fetchId !== listFetchId.current) return
        setWebhooks([])
      })
      .finally(() => {
        if (fetchId !== listFetchId.current) return
        setLoading(false)
      })
    api.get('/v1/webhooks/events', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const parsed = parseCatalog(r.data)
        setCatalog(parsed.events)
        setRefs(parsed.refs)
        setCatalogStatus('ok')
        setCatalogError(null)
      })
      .catch(err => {
        setCatalog([])
        setRefs({ municipalities: [], districts: [] })
        setCatalogStatus('error')
        setCatalogError(catalogErrorMessage(err))
      })
  }, [token, navigate])

  function revealSecret(secret, reason) {
    if (!secret) return
    setRevealedSecret({ secret, reason })
  }

  function handleCreated(payload) {
    listFetchId.current += 1
    const secret = extractWebhookSecret(payload)
    const webhook = webhookRecordFromResponse(payload)
    setWebhooks(prev => [webhook, ...prev])
    setCreating(false)
    setLoading(false)
    revealSecret(secret, 'create')
  }

  function handleUpdated(wh) {
    setWebhooks(prev => prev.map(w => (w.id === wh.id ? { ...w, ...wh } : w)))
    setEditingId(null)
  }

  function handleDeleted(id) {
    setWebhooks(prev => prev.filter(w => w.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function openCreate() {
    setEditingId(null)
    setCreating(true)
  }

  function openEdit(id) {
    setCreating(false)
    setEditingId(id)
  }

  if (!token) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Webhook size={22} className="text-green-600" />
              Webhooks
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Recebe notificações em tempo real quando eventos ocorrem na API.
            </p>
          </div>
          {!creating && !editingId && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer border-0 transition-opacity hover:opacity-90 self-start"
              style={{ backgroundColor: '#16A34A' }}
            >
              <Plus size={15} />
              Novo webhook
            </button>
          )}
        </div>

        {catalogStatus === 'error' && !creating && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-700">
            <p className="font-medium mb-1">Não foi possível carregar os eventos</p>
            <p>{catalogError}</p>
            <button
              type="button"
              onClick={retryCatalog}
              className="mt-2 text-sm font-semibold text-red-800 underline-offset-2 hover:underline cursor-pointer border-0 bg-transparent p-0"
            >
              Tentar outra vez
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {creating && (
            <WebhookForm
              mode="create"
              catalog={catalog}
              refs={refs}
              catalogStatus={catalogStatus}
              catalogError={catalogError}
              onRetryCatalog={retryCatalog}
              onSubmitSuccess={handleCreated}
              onCancel={() => setCreating(false)}
            />
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
                type="button"
                onClick={openCreate}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer border-0"
                style={{ backgroundColor: '#16A34A' }}
              >
                <Plus size={14} className="inline mr-1.5" />
                Criar primeiro webhook
              </button>
            </div>
          ) : (
            webhooks.map(wh => (
              editingId === wh.id ? (
                <WebhookForm
                  key={wh.id}
                  mode="edit"
                  webhook={wh}
                  catalog={catalog}
                  refs={refs}
                  catalogStatus={catalogStatus}
                  catalogError={catalogError}
                  onRetryCatalog={retryCatalog}
                  onSubmitSuccess={handleUpdated}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <WebhookCard
                  key={wh.id}
                  wh={wh}
                  catalog={catalog}
                  refs={refs}
                  onDelete={handleDeleted}
                  onUpdate={updated => setWebhooks(prev => prev.map(w => (w.id === updated.id ? { ...w, ...updated } : w)))}
                  onEdit={() => openEdit(wh.id)}
                  onRevealSecret={revealSecret}
                />
              )
            ))
          )}
        </div>

        {revealedSecret && (
          <WebhookSecretPanel
            secret={revealedSecret.secret}
            reason={revealedSecret.reason}
            onDismiss={() => setRevealedSecret(null)}
          />
        )}

        <details className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <summary className="text-sm font-semibold text-blue-800 cursor-pointer py-2">
            Como funcionam os webhooks?
          </summary>
          <div className="text-xs text-blue-700 leading-relaxed mt-2">
            Quando um evento ocorre, enviamos um pedido HTTPS para o teu URL com um JSON assinado via HMAC-SHA256.
            Verifica a assinatura no cabeçalho <code className="bg-blue-100 px-1 rounded">X-ApiAberta-Signature</code>.
            Se a entrega falhar, tentamos mais 2 vezes (30s e 120s de intervalo).
            Podes limitar as entregas com filtros por evento — por exemplo, só contratos do concelho do Fundão (código INE 0504).
            Os filtros vazios são ignorados; só os valores preenchidos entram na subscrição.
            Usa o botão <strong>Testar</strong> para verificar que o teu URL está a receber corretamente.
          </div>
        </details>
      </div>
    </div>
  )
}
