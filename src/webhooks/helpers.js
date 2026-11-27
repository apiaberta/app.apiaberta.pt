import { asValueList, padIne, optionFromRow } from './geo'

const SEARCH_THRESHOLD = 8
export const LEGACY_MUNICIPALITY_KEYS = ['local', 'concelho']

export const MATCH_VERBS = {
  equals: 'é',
  contains_ci: 'contém',
  gte: '≥',
  lte: '≤',
  min_level: '≥',
  prefix: 'começa por',
  ipma_area: 'é',
  radius: 'em',
}

const SERVICE_TITLES = {
  '/v1/fuel': 'Combustíveis (DGEG)',
  '/v1/ipma': 'Meteorologia (IPMA)',
  '/v1/base': 'Contratos públicos (BASE)',
  '/v1/ev': 'Carregamento EV',
  '/v1/anpc': 'Proteção Civil (ANPC)',
  '/v1/ine': 'Estatísticas (INE)',
  '/v1/bdp': 'Banco de Portugal',
  '/v1/dre': 'Diário da República',
  '/v1/nasafirms': 'Incêndios (NASA FIRMS)',
  '/v1/carris': 'Carris Metropolitana',
  '/v1/gtfs': 'Horários (GTFS)',
  '/v1/parlamento': 'Parlamento',
  '/v1/sns': 'SNS Transparência',
  '/v1/prr': 'PRR',
  '/v1/pt2030': 'Portugal 2030',
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

export function hasValue(raw) {
  if (raw === undefined || raw === null) return false
  if (Array.isArray(raw)) return raw.some(hasValue)
  if (typeof raw === 'object') {
    return Object.values(raw).some(v => v !== '' && v != null)
  }
  if (typeof raw === 'number') return Number.isFinite(raw)
  return String(raw).trim() !== ''
}

export function canonicalizeFilterKey(key, defs = []) {
  if (defs.some(f => f.key === key)) return key
  if (LEGACY_MUNICIPALITY_KEYS.includes(key) && defs.some(f => f.key === 'municipality')) {
    return 'municipality'
  }
  const aliased = defs.find(f => (f.aliases || []).includes(key))
  return aliased?.key || key
}

function mergeValues(a, b) {
  const list = [...asValueList(a), ...asValueList(b)]
  const unique = []
  for (const item of list) {
    const asString = typeof item === 'object' ? JSON.stringify(item) : String(item)
    if (!unique.some(existing => (typeof existing === 'object' ? JSON.stringify(existing) : String(existing)) === asString)) {
      unique.push(item)
    }
  }
  return unique
}

function compactRadius(raw) {
  let obj = raw
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw) } catch { return undefined }
  }
  if (!obj || typeof obj !== 'object') return undefined
  const lat = Number(obj.lat)
  const lon = Number(obj.lon ?? obj.lng)
  const km = Number(obj.km)
  if (![lat, lon, km].every(Number.isFinite) || km <= 0) return undefined
  return { lat, lon, km }
}

function compactOne(def, raw) {
  if (!hasValue(raw)) return undefined
  if (def?.type === 'radius' || def?.match === 'radius') return compactRadius(raw)
  if (def?.type === 'number') {
    const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
    return Number.isFinite(n) ? n : undefined
  }
  const values = asValueList(raw).map(item => {
    const trimmed = String(item).trim()
    if (!trimmed) return null
    if (def?.key === 'municipality' || def?.options_source?.includes('municipalities')) {
      return /^\d{1,4}$/.test(trimmed) ? padIne(trimmed) : trimmed
    }
    return trimmed
  }).filter(Boolean)
  if (values.length === 0) return undefined
  if (def?.multiple) return values.length === 1 ? values[0] : values
  return values[0]
}

export function normalizeStoredFilters(stored, catalog) {
  const byName = new Map((catalog || []).map(ev => [ev.name, ev]))
  const out = {}
  for (const [eventName, kv] of Object.entries(stored || {})) {
    const defs = byName.get(eventName)?.filters || []
    const next = {}
    for (const [rawKey, raw] of Object.entries(kv || {})) {
      const key = canonicalizeFilterKey(rawKey, defs)
      if (next[key] != null) next[key] = mergeValues(next[key], raw)
      else next[key] = raw
    }
    out[eventName] = next
  }
  return out
}

export function compactFilters(selectedEvents, filterValues, catalog) {
  const byName = new Map((catalog || []).map(ev => [ev.name, ev]))
  const filters = {}

  for (const eventName of selectedEvents || []) {
    const values = filterValues?.[eventName] || {}
    const defs = byName.get(eventName)?.filters || []
    const cleaned = {}

    for (const [rawKey, raw] of Object.entries(values)) {
      const key = canonicalizeFilterKey(rawKey, defs)
      const def = defs.find(f => f.key === key)
      const compacted = compactOne(def, raw)
      if (compacted === undefined) continue
      if (cleaned[key] != null) cleaned[key] = compactOne(def, mergeValues(cleaned[key], compacted))
      else cleaned[key] = compacted
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

export function optionLabel(filterDef, value, refs) {
  const raw = String(value ?? '')
  const opt = (filterDef?.options || []).find(o => String(o.value) === raw)
  if (opt) return opt.label_pt || opt.value
  const munis = refs?.municipalities || []
  const muni = munis.find(row => padIne(row.code || row.codigoine) === padIne(raw) || row.name === raw)
  if (muni) return muni.name
  const districts = refs?.districts || []
  const district = districts.find(row => String(row.code || row.value) === raw)
  if (district) return district.name || district.label_pt
  const fromFilter = optionFromRow({ value: raw, label_pt: null })
  return fromFilter?.label || raw
}

function displayValues(filterDef, value, refs) {
  return asValueList(value).map(item => {
    if (item && typeof item === 'object' && item.km != null) {
      return `${item.lat}, ${item.lon} (${item.km} km)`
    }
    if (filterDef?.type === 'enum' || filterDef?.options_source) {
      return optionLabel(filterDef, item, refs)
    }
    return item
  }).join(' ou ')
}

export function formatFilterSummary(event, filterDef, value, refs) {
  const eventTitle = event?.label_pt || event?.name || 'Evento'
  const field = String(filterDef?.label_pt || filterDef?.key || '').toLowerCase()
  const verb = MATCH_VERBS[filterDef?.match] || filterDef?.match || 'é'
  const display = displayValues(filterDef, value, refs)
  return `${eventTitle} · ${field} ${verb} ${display}`
}

export function listActiveFilterSummaries(webhook, catalog, refs) {
  const stored = normalizeStoredFilters(webhook?.filters, catalog)
  const byName = new Map((catalog || []).map(ev => [ev.name, ev]))
  const summaries = []

  for (const [eventName, kv] of Object.entries(stored)) {
    const event = byName.get(eventName) || { name: eventName, label_pt: eventName, filters: [] }
    for (const [key, value] of Object.entries(kv || {})) {
      if (!hasValue(value)) continue
      const def = (event.filters || []).find(f => f.key === key) || { key, label_pt: key, match: 'equals' }
      summaries.push(formatFilterSummary(event, def, value, refs))
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

export function geoPrecisionLabel(precision) {
  if (precision === 'none') return 'Nacional — sem filtro de localização'
  return null
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

/**
 * Gateway contract (create 201 / rotate 200): signing secret is the top-level
 * JSON field `secret` — axios `res.data.secret`. Never `data.secret`.
 * GET list/detail never include it.
 */
export function extractWebhookSecret(payload) {
  const body = asObject(payload)
  const secret = body?.secret
  return typeof secret === 'string' && secret.trim() ? secret.trim() : null
}

export function webhookRecordFromResponse(payload) {
  const body = asObject(payload)
  if (!body) return payload
  const record = { ...body }
  delete record.secret
  delete record.note
  return record
}

export function normalizeCatalog(payload) {
  const events = payload?.events
  if (!Array.isArray(events)) {
    throw new Error('Resposta inválida do catálogo de eventos.')
  }
  return events
}

export function parseCatalog(payload) {
  const events = normalizeCatalog(payload)
  return {
    events,
    refs: {
      municipalities: payload?.refs?.municipalities || [],
      districts: payload?.refs?.districts || [],
    },
    lookup_only: payload?.lookup_only || [],
  }
}
