import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SearchableSelect from './SearchableSelect'
import {
  asValueList,
  inlineOptions,
  loadOptionsSource,
  optionFromRow,
  optionsFromRefs,
  resolveToOptionValues,
  restrictOptionsByDistricts,
  searchOptionsSource,
  siblingDistrictCodes,
  sourceKind,
} from './geo'

const inputClass =
  'w-full text-base sm:text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-900 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100'

const SEARCHABLE_THRESHOLD = 8

function emitValue(multiple, list) {
  if (multiple) return list
  return list[0] ?? ''
}

function precisionNote(filter) {
  const precision = String(filter?.precision || '').toLowerCase()
  if (precision === 'distrito' || (precision === 'district' && filter.key === 'municipality')) {
    return 'O filtro aplica-se ao distrito (ex.: Fundão → Castelo Branco).'
  }
  if (precision === 'heuristic') {
    return 'O município do emitente é uma heurística — pode falhar.'
  }
  if (precision === 'coordinates') {
    return 'Usa as coordenadas do evento (latitude e longitude).'
  }
  return null
}

export default function FilterField({
  eventName,
  filter,
  value,
  onChange,
  eventFilters,
  refs,
  getJson,
}) {
  const id = `filter-${eventName}-${filter.key}`
  const kind = sourceKind(filter.options_source)
  const multiple = Boolean(filter.multiple)
  const districtCodes = useMemo(() => siblingDistrictCodes(eventFilters), [eventFilters])
  const seeded = useMemo(() => {
    const inline = inlineOptions(filter)
    if (inline.length) return inline
    return optionsFromRefs(filter, refs)
  }, [filter, refs])

  const [remote, setRemote] = useState([])
  const [fetchFailed, setFetchFailed] = useState(false)
  const [remoteQueryHits, setRemoteQueryHits] = useState([])
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!filter.options_source || inlineOptions(filter).length) return undefined
    let cancelled = false
    loadOptionsSource(filter.options_source, getJson, { fallback: seeded })
      .then(rows => {
        if (cancelled) return
        const mapped = (rows || []).map(row => optionFromRow(row, kind)).filter(Boolean)
        setRemote(mapped)
        setFetchFailed(false)
      })
      .catch(() => {
        if (cancelled) return
        setFetchFailed(true)
      })
    return () => { cancelled = true }
  }, [filter, getJson, kind, seeded])

  const allOptions = inlineOptions(filter).length ? inlineOptions(filter) : (remote.length ? remote : seeded)
  const options = restrictOptionsByDistricts(allOptions, districtCodes)
  const status = allOptions.length
    ? 'ready'
    : (fetchFailed ? 'error' : (filter.options_source ? 'loading' : 'ready'))

  useEffect(() => {
    if (!allOptions.length || value == null || value === '') return
    const resolved = resolveToOptionValues(value, allOptions)
    const current = asValueList(value).map(String)
    if (resolved.join('\0') === current.join('\0')) return
    const looksUnresolved = current.some(item => !allOptions.some(opt => opt.value === String(item)))
    if (looksUnresolved) onChangeRef.current(emitValue(multiple, resolved))
  }, [allOptions, value, multiple])

  useEffect(() => {
    if (!options.length || value == null || value === '') return
    if (!districtCodes.length) return
    const allowed = new Set(options.map(opt => opt.value))
    const current = asValueList(value).map(String)
    const next = current.filter(item => allowed.has(item))
    if (next.length !== current.length) onChangeRef.current(emitValue(multiple, next))
  }, [districtCodes, options, value, multiple])

  const handleSearchFallback = useCallback((query) => {
    if (!filter.options_source || allOptions.length >= 300 || !query.trim()) {
      setRemoteQueryHits(current => (current.length ? [] : current))
      return
    }
    searchOptionsSource(filter.options_source, query.trim(), getJson)
      .then(rows => {
        const mapped = (rows || []).map(row => optionFromRow(row, kind)).filter(Boolean)
        setRemoteQueryHits(restrictOptionsByDistricts(mapped, districtCodes))
      })
      .catch(() => setRemoteQueryHits(current => (current.length ? [] : current)))
  }, [filter.options_source, allOptions.length, getJson, kind, districtCodes])

  const helper = precisionNote(filter)
  const emptyText = districtCodes.length
    ? 'Nenhum concelho neste distrito.'
    : 'Nenhuma opção.'

  if (filter.options_source || (filter.type === 'enum' && (filter.options || []).length >= SEARCHABLE_THRESHOLD && multiple)) {
    const merged = remoteQueryHits.length
      ? [...options, ...remoteQueryHits.filter(hit => !options.some(opt => opt.value === hit.value))]
      : options
    return (
      <SearchableSelect
        id={id}
        label={filter.label_pt || filter.key}
        options={merged}
        value={value}
        multiple={multiple}
        loading={status === 'loading'}
        placeholder={kind === 'municipality' ? 'Pesquisar concelho…' : 'Pesquisar…'}
        emptyText={status === 'error' ? 'Não foi possível carregar as opções.' : emptyText}
        helperText={helper}
        onChange={next => {
          onChange(next)
        }}
        onQueryChange={handleSearchFallback}
      />
    )
  }

  if (filter.type === 'enum' && multiple) {
    const selected = new Set(asValueList(value).map(String))
    return (
      <fieldset className="m-0 p-0 border-0">
        <legend className="text-xs font-medium text-slate-600 mb-1 px-0">{filter.label_pt || filter.key}</legend>
        <div className="flex flex-col gap-1.5">
          {(filter.options || []).map(opt => {
            const checked = selected.has(String(opt.value))
            return (
              <label key={String(opt.value)} className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? asValueList(value).filter(v => String(v) !== String(opt.value))
                      : [...asValueList(value), opt.value]
                    onChange(next)
                  }}
                  className="accent-green-600"
                />
                {opt.label_pt || opt.value}
              </label>
            )
          })}
        </div>
        {helper && <p className="text-xs text-slate-500 mt-1 m-0">{helper}</p>}
      </fieldset>
    )
  }

  if (filter.type === 'enum') {
    const emptyLabel = filter.key === 'min_level'
      ? 'Amarelo e acima (predefinição)'
      : 'Qualquer'
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
          <option value="">{emptyLabel}</option>
          {(filter.options || []).map(opt => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label_pt || opt.value}
            </option>
          ))}
        </select>
        {helper && <p className="text-xs text-slate-500 mt-1 m-0">{helper}</p>}
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

  if (filter.type === 'radius') {
    const radius = value && typeof value === 'object' ? value : {}
    function setPart(key, part) {
      onChange({
        lat: radius.lat ?? '',
        lon: radius.lon ?? '',
        km: radius.km ?? '',
        [key]: part,
      })
    }
    return (
      <div>
        <div className="text-xs font-medium text-slate-600 mb-1">{filter.label_pt || filter.key}</div>
        <div className="grid grid-cols-3 gap-2">
          {[['lat', 'Latitude'], ['lon', 'Longitude'], ['km', 'Raio (km)']].map(([key, partLabel]) => (
            <div key={key}>
              <label htmlFor={`${id}-${key}`} className="sr-only">{partLabel}</label>
              <input
                id={`${id}-${key}`}
                type="number"
                inputMode="decimal"
                step="any"
                value={radius[key] ?? ''}
                onChange={e => setPart(key, e.target.value)}
                placeholder={partLabel}
                className={inputClass}
              />
            </div>
          ))}
        </div>
        {helper && <p className="text-xs text-slate-500 mt-1 m-0">{helper}</p>}
      </div>
    )
  }

  if (filter.free_text) {
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
          spellCheck={true}
          autoComplete="off"
          className={inputClass}
        />
        <p className="text-xs text-amber-700 mt-1 m-0">Pesquisa em texto livre — pode falhar.</p>
      </div>
    )
  }

  if (filter.type === 'string' || filter.pattern) {
    const numeric = filter.pattern && String(filter.pattern).includes('\\d')
    return (
      <div>
        <label htmlFor={id} className="text-xs font-medium text-slate-600 block mb-1">
          {filter.label_pt || filter.key}
        </label>
        <input
          id={id}
          type="text"
          inputMode={numeric ? 'numeric' : 'text'}
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

  return null
}
