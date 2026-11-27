import { useMemo, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'
import {
  buildWebhookPayload,
  filterEvents,
  formatFilterSummary,
  groupEventsByService,
  shouldShowEventSearch,
} from './helpers'

const inputClass =
  'w-full text-base sm:text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-900 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100'

function FilterField({ eventName, filter, value, onChange }) {
  const id = `filter-${eventName}-${filter.key}`

  if (filter.type === 'enum') {
    return (
      <div>
        <label htmlFor={id} className="text-xs font-medium text-slate-600 block mb-1">
          {filter.label_pt || filter.key}
        </label>
        <select
          id={id}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Qualquer</option>
          {(filter.options || []).map(opt => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label_pt || opt.value}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (filter.type === 'number') {
    return (
      <div>
        <label htmlFor={id} className="text-xs font-medium text-slate-600 block mb-1">
          {filter.label_pt || filter.key}
        </label>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="any"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={filter.placeholder_pt || ''}
          className={inputClass}
        />
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-slate-600 block mb-1">
        {filter.label_pt || filter.key}
      </label>
      <input
        id={id}
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={filter.placeholder_pt || ''}
        spellCheck={false}
        autoComplete="off"
        className={inputClass}
      />
    </div>
  )
}

export default function WebhookForm({
  mode = 'create',
  webhook,
  catalog = [],
  catalogStatus = 'ok',
  catalogError = null,
  onRetryCatalog,
  onSubmitSuccess,
  onCancel,
}) {
  const isEdit = mode === 'edit'
  const { token } = useAuth()
  const [url, setUrl] = useState(webhook?.url || '')
  const [events, setEvents] = useState(webhook?.events || [])
  const [filterValues, setFilterValues] = useState(webhook?.filters || {})
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const errorRef = useRef(null)
  const urlRef = useRef(null)

  const showSearch = shouldShowEventSearch(catalog)
  const visibleEvents = useMemo(() => filterEvents(catalog, query), [catalog, query])
  const groups = useMemo(() => groupEventsByService(visibleEvents), [visibleEvents])
  const catalogByName = useMemo(
    () => new Map(catalog.map(ev => [ev.name, ev])),
    [catalog]
  )

  const summaries = useMemo(() => {
    const payload = buildWebhookPayload({
      url,
      events,
      filterValues,
      catalog,
      includeEmptyFilters: true,
    })
    const lines = []
    for (const eventName of events) {
      const event = catalogByName.get(eventName)
      const kv = payload.filters?.[eventName] || {}
      for (const [key, value] of Object.entries(kv)) {
        const def = (event?.filters || []).find(f => f.key === key) || { key, label_pt: key, match: 'equals' }
        lines.push(formatFilterSummary(event || { name: eventName, label_pt: eventName }, def, value))
      }
    }
    return lines
  }, [url, events, filterValues, catalog, catalogByName])

  function toggleEvent(name) {
    setEvents(current => {
      if (current.includes(name)) {
        setFilterValues(prev => {
          const next = { ...prev }
          delete next[name]
          return next
        })
        return current.filter(e => e !== name)
      }
      return [...current, name]
    })
  }

  function setFilter(eventName, key, value) {
    setFilterValues(prev => ({
      ...prev,
      [eventName]: {
        ...(prev[eventName] || {}),
        [key]: value,
      },
    }))
  }

  function showError(message, focusEl) {
    setError(message)
    requestAnimationFrame(() => {
      if (focusEl) focusEl.focus()
      else errorRef.current?.focus()
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const trimmedUrl = url.trim()
    if (!trimmedUrl.startsWith('https://')) {
      showError('O URL do webhook deve começar com https://', urlRef.current)
      return
    }
    if (events.length === 0) {
      showError('Seleciona pelo menos um evento.')
      return
    }

    const payload = buildWebhookPayload({
      url: trimmedUrl,
      events,
      filterValues,
      catalog,
      includeEmptyFilters: isEdit,
    })

    setLoading(true)
    try {
      const res = isEdit
        ? await api.patch(`/v1/webhooks/${webhook.id}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await api.post('/v1/webhooks', payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
      onSubmitSuccess(res.data)
    } catch (err) {
      setLoading(false)
      showError(err.response?.data?.message || (isEdit ? 'Erro ao guardar webhook.' : 'Erro ao criar webhook.'))
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6">
      <h3 className="font-semibold text-slate-900 mb-4">
        {isEdit ? 'Editar webhook' : 'Novo webhook'}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="webhook-url" className="text-xs font-medium text-slate-600 block mb-1">
            URL de destino (HTTPS)
          </label>
          <input
            id="webhook-url"
            ref={urlRef}
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.meusite.pt/webhook"
            required
            spellCheck={false}
            autoComplete="url"
            aria-invalid={Boolean(error && !url.trim().startsWith('https://'))}
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-2">
            <div className="text-xs font-medium text-slate-600">Eventos a subscrever</div>
          </div>

          {catalogStatus === 'loading' && (
            <div className="text-sm text-slate-400 py-6 text-center">A carregar eventos...</div>
          )}

          {catalogStatus === 'error' && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <p>{catalogError || 'Não foi possível carregar os eventos disponíveis.'}</p>
              {onRetryCatalog && (
                <button
                  type="button"
                  onClick={onRetryCatalog}
                  className="mt-2 text-sm font-semibold text-red-800 underline-offset-2 hover:underline cursor-pointer border-0 bg-transparent p-0"
                >
                  Tentar outra vez
                </button>
              )}
            </div>
          )}

          {catalogStatus === 'ok' && catalog.length === 0 && (
            <div className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
              Não há eventos disponíveis neste momento.
            </div>
          )}

          {catalogStatus === 'ok' && catalog.length > 0 && (
            <>
              {showSearch && (
                <div className="relative mb-3">
                  <label htmlFor="webhook-event-search" className="sr-only">Pesquisar eventos</label>
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="webhook-event-search"
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Pesquisar eventos, conectores…"
                    className={`${inputClass} pl-9 pr-9`}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Limpar pesquisa"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer border-0 bg-transparent"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {groups.length === 0 ? (
                <div className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
                  Nenhum evento corresponde a «{query.trim()}». Tenta outro termo.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {groups.map(group => (
                    <fieldset key={group.service} className="m-0 p-0 border-0">
                      <legend className="text-xs font-semibold text-slate-500 mb-2 px-0">
                        {group.title}
                      </legend>
                      <div className="flex flex-col gap-2">
                        {group.events.map(ev => {
                          const selected = events.includes(ev.name)
                          return (
                            <div
                              key={ev.name}
                              className="rounded-xl border border-slate-100 transition-colors"
                              style={{ backgroundColor: selected ? '#F0FDF4' : '#FAFAFA', borderColor: selected ? '#BBF7D0' : undefined }}
                            >
                              <label className="flex items-start gap-3 p-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleEvent(ev.name)}
                                  className="mt-0.5 accent-green-600"
                                />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-slate-800">{ev.label_pt || ev.name}</div>
                                  <div className="text-xs text-slate-500">
                                    {ev.description_pt || ev.description}
                                  </div>
                                  <code className="text-xs text-slate-400">{ev.name}</code>
                                </div>
                              </label>
                              {selected && (ev.filters || []).length > 0 && (
                                <div className="px-3 pb-3 pt-0 flex flex-col gap-3 border-t border-green-100 mx-3 mb-3 mt-0">
                                  <div className="text-xs font-medium text-slate-500 pt-3">
                                    Filtros (opcional)
                                  </div>
                                  {ev.filters.map(filter => (
                                    <FilterField
                                      key={filter.key}
                                      eventName={ev.name}
                                      filter={filter}
                                      value={filterValues[ev.name]?.[filter.key] ?? ''}
                                      onChange={value => setFilter(ev.name, filter.key, value)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {summaries.length > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <div className="text-xs font-medium text-slate-500 mb-1">Resumo dos filtros</div>
            <ul className="flex flex-col gap-1 m-0 p-0 list-none">
              {summaries.map(line => (
                <li key={line} className="text-sm text-slate-700">{line}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 outline-none"
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || catalogStatus !== 'ok'}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer border-0 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            style={{ backgroundColor: '#16A34A' }}
          >
            {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {loading
              ? (isEdit ? 'A guardar...' : 'A criar...')
              : (isEdit ? 'Guardar alterações' : 'Criar webhook')}
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
