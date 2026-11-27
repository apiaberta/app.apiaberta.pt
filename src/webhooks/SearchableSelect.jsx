import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Loader2, X } from 'lucide-react'
import { asValueList, searchOptions } from './geo'

const fieldClass =
  'w-full text-base sm:text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-900 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100'

export default function SearchableSelect({
  id,
  label,
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Pesquisar…',
  loading = false,
  emptyText = 'Nenhuma opção.',
  helperText,
  onQueryChange,
}) {
  const autoId = useId()
  const inputId = id || autoId
  const listId = `${inputId}-list`
  const statusId = `${inputId}-status`
  const helperId = `${inputId}-help`
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const selectedValues = asValueList(value).map(String)
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues])
  const selectedOptions = useMemo(
    () => selectedValues.map(v => options.find(o => o.value === v) || { value: v, label: v }),
    [selectedValues, options]
  )
  const visible = useMemo(() => {
    const matches = searchOptions(options, query).filter(opt => !selectedSet.has(opt.value) || !multiple)
    return matches
  }, [options, query, selectedSet, multiple])

  useEffect(() => {
    function onPointer(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  useEffect(() => {
    if (!onQueryChange) return undefined
    const timer = setTimeout(() => onQueryChange(query), 250)
    return () => clearTimeout(timer)
  }, [query, onQueryChange])

  function emit(nextValues) {
    if (multiple) onChange(nextValues)
    else onChange(nextValues[0] ?? '')
  }

  function choose(opt) {
    if (!opt) return
    if (multiple) {
      if (selectedSet.has(opt.value)) emit(selectedValues.filter(v => v !== opt.value))
      else emit([...selectedValues, opt.value])
      setQuery('')
      inputRef.current?.focus()
    } else {
      emit([opt.value])
      setQuery('')
      setOpen(false)
    }
  }

  function remove(optValue) {
    emit(selectedValues.filter(v => v !== optValue))
    inputRef.current?.focus()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive(i => Math.min(i + 1, Math.max(visible.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && visible[active]) {
        e.preventDefault()
        choose(visible[active])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Backspace' && !query && selectedValues.length) {
      emit(selectedValues.slice(0, -1))
    }
  }

  const describedBy = [loading ? statusId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className="text-xs font-medium text-slate-600 block mb-1">
        {label}
      </label>
      <div
        className={`${fieldClass} flex flex-wrap items-center gap-1.5 min-h-11 py-1.5 pr-9 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100`}
        style={{ borderColor: open ? '#4ADE80' : undefined }}
      >
        {multiple && selectedOptions.map(opt => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 max-w-full text-xs font-medium px-2 py-1 rounded-lg bg-green-50 text-green-800"
          >
            <span className="truncate">{opt.label}</span>
            <button
              type="button"
              onClick={() => remove(opt.value)}
              aria-label={`Remover ${opt.label}`}
              className="inline-flex items-center justify-center min-w-8 min-h-8 -mr-1 text-green-700 hover:text-green-950 cursor-pointer border-0 bg-transparent"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && visible[active] ? `${inputId}-opt-${visible[active].value}` : undefined}
          aria-describedby={describedBy}
          value={multiple || open || query ? query : (selectedOptions[0]?.label || '')}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(0)
            if (!multiple && !e.target.value) emit([])
          }}
          onFocus={() => {
            setOpen(true)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder={selectedValues.length && multiple ? 'Acrescentar…' : placeholder}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-[8rem] border-0 bg-transparent p-0 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </span>
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg p-1 m-0 list-none"
        >
          {loading && options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">A carregar…</li>
          ) : visible.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">{emptyText}</li>
          ) : (
            visible.map((opt, index) => {
              const isActive = index === active
              const isSelected = selectedSet.has(opt.value)
              return (
                <li
                  key={opt.value}
                  id={`${inputId}-opt-${opt.value}`}
                  role="option"
                  aria-selected={isSelected}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm min-h-11"
                  style={{
                    backgroundColor: isActive ? '#F0FDF4' : 'transparent',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={e => {
                    e.preventDefault()
                    choose(opt)
                  }}
                >
                  <div className="text-slate-800">{opt.label}</div>
                  {(opt.district || opt.value) && (
                    <div className="text-xs text-slate-500">
                      {opt.district ? `${opt.district} · ` : ''}
                      {opt.value}
                    </div>
                  )}
                </li>
              )
            })
          )}
        </ul>
      )}
      {loading && (
        <p id={statusId} className="sr-only" role="status">A carregar opções</p>
      )}
      {helperText && (
        <p id={helperId} className="text-xs text-slate-500 mt-1 m-0">{helperText}</p>
      )}
    </div>
  )
}
