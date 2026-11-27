const SEARCH_THRESHOLD = 8

export const MATCH_VERBS = {
  equals: 'é',
  contains_ci: 'contém',
  gte: '≥',
  lte: '≤',
}

const SERVICE_TITLES = {
  '/v1/fuel': 'Combustíveis (DGEG)',
  '/v1/ipma': 'Meteorologia (IPMA)',
  '/v1/base': 'Contratos públicos (BASE)',
  '/v1/ev': 'Carregamento EV',
  '/v1/anpc': 'Proteção Civil (ANPC)',
}

export function inferService(event) {
  if (event?.service) return event.service
  const prefix = String(event?.name || '').split('.')[0]
  return prefix ? `/v1/${prefix}` : 'outros'
}

export function serviceTitle(service) {
  if (!service || service === 'outros') return 'Outros'
  if (SERVICE_TITLES[service]) return SERVICE_TITLES[service]
  const slug = String(service).replace(/^\/v1\//, '').replace(/^\//, '')
  return slug ? slug.toUpperCase() : 'Outros'
}

export function shouldShowEventSearch(events) {
  return (events?.length || 0) >= SEARCH_THRESHOLD
}

export function filterEvents(events, query) {
  const list = Array.isArray(events) ? events : []
  const q = String(query || '').trim().toLowerCase()
  if (!q) return list
  return list.filter(ev => {
    const filterText = (ev.filters || [])
      .map(f => `${f.key} ${f.label_pt || ''} ${f.placeholder_pt || ''}`)
      .join(' ')
    const hay = [
      ev.name,
      ev.label_pt,
      ev.description_pt,
      ev.description,
      ev.service,
      filterText,
    ].join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export function groupEventsByService(events) {
  const groups = new Map()
  for (const ev of events || []) {
    const service = inferService(ev)
    if (!groups.has(service)) groups.set(service, [])
    groups.get(service).push(ev)
  }
  return [...groups.entries()].map(([service, items]) => ({
    service,
    title: serviceTitle(service),
    events: items,
  }))
}

function hasValue(raw) {
  if (raw === undefined || raw === null) return false
  return String(raw).trim() !== ''
}

export function compactFilters(selectedEvents, filterValues, catalog) {
  const byName = new Map((catalog || []).map(ev => [ev.name, ev]))
  const filters = {}

  for (const eventName of selectedEvents || []) {
    const values = filterValues?.[eventName] || {}
    const defs = byName.get(eventName)?.filters || []
    const cleaned = {}

    for (const [key, raw] of Object.entries(values)) {
      if (!hasValue(raw)) continue
      const def = defs.find(f => f.key === key)
      const trimmed = String(raw).trim()
      if (def?.type === 'number') {
        const n = Number(trimmed)
        if (Number.isNaN(n)) continue
        cleaned[key] = n
      } else {
        cleaned[key] = trimmed
      }
    }

    if (Object.keys(cleaned).length > 0) {
      filters[eventName] = cleaned
    }
  }

  return filters
}

export function buildWebhookPayload({ url, events, filterValues, catalog, includeEmptyFilters = false }) {
  const payload = {
    url: String(url || '').trim(),
    events: [...(events || [])],
  }
  const filters = compactFilters(events, filterValues, catalog)
  if (includeEmptyFilters || Object.keys(filters).length > 0) {
    payload.filters = filters
  }
  return payload
}

export function optionLabel(filterDef, value) {
  const opt = (filterDef?.options || []).find(o => String(o.value) === String(value))
  return opt?.label_pt || opt?.value || value
}

export function formatFilterSummary(event, filterDef, value) {
  const eventLabel = event?.label_pt || event?.name || 'Evento'
  const field = String(filterDef?.label_pt || filterDef?.key || '').toLowerCase()
  const verb = MATCH_VERBS[filterDef?.match] || filterDef?.match || 'é'
  const display = filterDef?.type === 'enum' ? optionLabel(filterDef, value) : value
  return `${eventLabel} · ${field} ${verb} ${display}`
}

export function listActiveFilterSummaries(webhook, catalog) {
  const filters = webhook?.filters || {}
  const byName = new Map((catalog || []).map(ev => [ev.name, ev]))
  const summaries = []

  for (const [eventName, kv] of Object.entries(filters)) {
    const event = byName.get(eventName) || { name: eventName, label_pt: eventName, filters: [] }
    for (const [key, value] of Object.entries(kv || {})) {
      if (!hasValue(value)) continue
      const def = (event.filters || []).find(f => f.key === key) || { key, label_pt: key, match: 'equals' }
      summaries.push(formatFilterSummary(event, def, value))
    }
  }

  return summaries
}

export function eventLabel(eventOrName, catalog) {
  if (eventOrName && typeof eventOrName === 'object') {
    return eventOrName.label_pt || eventOrName.name
  }
  const found = (catalog || []).find(e => e.name === eventOrName)
  return found?.label_pt || eventOrName
}

export function normalizeCatalog(payload) {
  const events = payload?.events
  if (!Array.isArray(events)) {
    throw new Error('Resposta inválida do catálogo de eventos.')
  }
  return events
}
