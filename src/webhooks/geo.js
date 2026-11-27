const FETCH_ALL_LIMIT = 400
const PAGE_SIZE = 50
const MAX_PAGES = 20

const inflight = new Map()

/** IPMA warning area code → distrito INE (01–18, RAA, RAM). */
export const IPMA_AREA_TO_DISTRICT = {
  AVR: '01',
  BJA: '02',
  BRG: '03',
  BGC: '04',
  CBO: '05',
  CBR: '06',
  EVR: '07',
  FAR: '08',
  GDA: '09',
  LRA: '10',
  LSB: '11',
  PTG: '12',
  PTO: '13',
  STM: '14',
  STB: '15',
  VCT: '16',
  VRL: '17',
  VIS: '18',
  ACE: 'RAA',
  AOC: 'RAA',
  AOR: 'RAA',
  MCN: 'RAM',
  MCS: 'RAM',
  MPS: 'RAM',
  MRM: 'RAM',
}

export function padIne(value) {
  const s = String(value ?? '').trim()
  if (/^\d{1,4}$/.test(s)) return s.padStart(4, '0')
  return s
}

export function padDistrict(value) {
  const s = String(value ?? '').trim()
  if (/^\d{1,2}$/.test(s)) return s.padStart(2, '0')
  return s.toUpperCase()
}

export function districtCodeFromIne(codigoine) {
  const code = padIne(codigoine)
  const prefix = code.slice(0, 2)
  if (prefix === '31' || prefix === '32') return 'RAM'
  if (prefix >= '41' && prefix <= '49') return 'RAA'
  return prefix
}

export function foldText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function sourceKind(path) {
  const p = String(path || '')
  if (p.includes('municipalities')) return 'municipality'
  if (p.includes('districts')) return 'district'
  return 'generic'
}

export function optionFromRow(row, kind = 'generic') {
  if (!row || typeof row !== 'object') return null
  if (row.value != null && (row.label_pt || row.label || row.name)) {
    const value = kind === 'municipality' ? padIne(row.value) : String(row.value)
    return {
      value,
      label: row.label_pt || row.label || row.name,
      district: row.district || null,
      district_code: row.district_code ? padDistrict(row.district_code) : null,
    }
  }
  const raw = row.codigoine || row.code
  if (raw == null || raw === '') return null
  const value = kind === 'district' ? padDistrict(raw) : padIne(raw)
  const district_code = row.district_code
    ? padDistrict(row.district_code)
    : (kind === 'municipality' ? districtCodeFromIne(value) : null)
  return {
    value,
    label: row.name || row.label_pt || row.label || value,
    district: row.district || null,
    district_code,
  }
}

export function optionsFromRefs(filter, refs) {
  const source = filter?.options_source
  const kind = sourceKind(source)
  if (kind === 'municipality') {
    return (refs?.municipalities || []).map(row => optionFromRow(row, 'municipality')).filter(Boolean)
  }
  if (kind === 'district') {
    return (refs?.districts || []).map(row => optionFromRow(row, 'district')).filter(Boolean)
  }
  return []
}

export function inlineOptions(filter) {
  return (filter?.options || []).map(row => optionFromRow(row, sourceKind(filter?.options_source))).filter(Boolean)
}

export function restrictOptionsByDistricts(options, districtCodes) {
  const wanted = new Set((districtCodes || []).map(padDistrict).filter(Boolean))
  if (wanted.size === 0) return options
  return (options || []).filter(opt => wanted.has(padDistrict(opt.district_code)))
}

export function siblingDistrictCodes(eventFilters = {}) {
  const codes = new Set()
  for (const value of asValueList(eventFilters.district)) {
    const code = padDistrict(value)
    if (code) codes.add(code)
  }
  for (const value of asValueList(eventFilters.region)) {
    const mapped = IPMA_AREA_TO_DISTRICT[String(value).trim().toUpperCase()]
    if (mapped) codes.add(mapped)
  }
  return [...codes]
}

export function asValueList(raw) {
  if (raw === undefined || raw === null || raw === '') return []
  if (Array.isArray(raw)) return raw.flatMap(asValueList)
  return [raw]
}

export function searchOptions(options, query) {
  const q = foldText(query)
  if (!q) return options
  return (options || []).filter(opt => {
    const hay = [opt.label, opt.value, opt.district, opt.district_code].map(foldText).join(' ')
    return hay.includes(q)
  })
}

export function resolveToOptionValues(raw, options) {
  const list = options || []
  return asValueList(raw).map(value => {
    const s = String(value).trim()
    if (!s) return null
    const padded = padIne(s)
    const byValue = list.find(opt => opt.value === s || opt.value === padded)
    if (byValue) return byValue.value
    const folded = foldText(s)
    const byLabel = list.find(opt => foldText(opt.label) === folded)
    if (byLabel) return byLabel.value
    return /^\d{3,4}$/.test(s) ? padded : s
  }).filter(Boolean)
}

export function extractRows(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.municipalities)) return payload.municipalities
  if (Array.isArray(payload?.districts)) return payload.districts
  return []
}

export async function fetchAllFromSource(path, getJson) {
  const first = await getJson(path, { limit: FETCH_ALL_LIMIT, page: 1 })
  const rows = extractRows(first)
  const total = Number(first?.total)
  if (Number.isFinite(total) && rows.length >= total) return rows
  if (!Number.isFinite(total) && rows.length > PAGE_SIZE) return rows

  const pageSize = Number(first?.limit) || PAGE_SIZE
  const pageCount = Number(first?.pages)
    || (Number.isFinite(total) ? Math.ceil(total / pageSize) : 1)
  const all = [...rows]
  for (let page = 2; page <= pageCount && page <= MAX_PAGES; page += 1) {
    const data = await getJson(path, { limit: pageSize, page })
    all.push(...extractRows(data))
    if (Number.isFinite(total) && all.length >= total) break
  }
  return all
}

export async function searchOptionsSource(path, q, getJson) {
  const data = await getJson(path, { q, limit: PAGE_SIZE, page: 1 })
  return extractRows(data)
}

function normalizeSourcePath(path) {
  return String(path || '').split('?')[0]
}

export function resetOptionsSourceCache() {
  inflight.clear()
}

export function loadOptionsSource(path, getJson, { fallback = [] } = {}) {
  const key = normalizeSourcePath(path)
  if (!inflight.has(key)) {
    inflight.set(key, fetchAllFromSource(key, getJson).catch(err => {
      inflight.delete(key)
      if (fallback.length) return fallback
      throw err
    }))
  }
  return inflight.get(key)
}
