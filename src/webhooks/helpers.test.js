import { describe, expect, it } from 'vitest'
import { MOCK_EVENTS, MANY_EVENTS } from './fixtures'
import {
  buildWebhookPayload,
  compactFilters,
  filterEvents,
  formatFilterSummary,
  groupEventsByService,
  listActiveFilterSummaries,
  normalizeCatalog,
  shouldShowEventSearch,
} from './helpers'

describe('compactFilters', () => {
  it('omits empty strings, whitespace and unselected events', () => {
    const filters = compactFilters(
      ['base.contract.new', 'ipma.warning.new'],
      {
        'base.contract.new': { local: '  Fundão  ', value: '' },
        'ipma.warning.new': { level: '   ', region: '' },
        'ev.prices.updated': { price_eur_mwh: '80' },
      },
      MOCK_EVENTS
    )

    expect(filters).toEqual({
      'base.contract.new': { local: 'Fundão' },
    })
  })

  it('coerces number filters to numbers', () => {
    const filters = compactFilters(
      ['base.contract.new'],
      { 'base.contract.new': { local: 'Fundão', value: '10000' } },
      MOCK_EVENTS
    )

    expect(filters).toEqual({
      'base.contract.new': { local: 'Fundão', value: 10000 },
    })
  })
})

describe('buildWebhookPayload', () => {
  it('omits filters on create when none are filled', () => {
    const payload = buildWebhookPayload({
      url: '  https://api.meusite.pt/hook  ',
      events: ['fuel.prices.updated'],
      filterValues: { 'fuel.prices.updated': {} },
      catalog: MOCK_EVENTS,
    })

    expect(payload).toEqual({
      url: 'https://api.meusite.pt/hook',
      events: ['fuel.prices.updated'],
    })
    expect(payload.filters).toBeUndefined()
  })

  it('includes empty filters object when editing so they can be cleared', () => {
    const payload = buildWebhookPayload({
      url: 'https://api.meusite.pt/hook',
      events: ['fuel.prices.updated'],
      filterValues: {},
      catalog: MOCK_EVENTS,
      includeEmptyFilters: true,
    })

    expect(payload.filters).toEqual({})
  })

  it('nests filled filters by event name', () => {
    const payload = buildWebhookPayload({
      url: 'https://api.meusite.pt/hook',
      events: ['base.contract.new', 'ipma.warning.new'],
      filterValues: {
        'base.contract.new': { local: 'Fundão', value: '5000' },
        'ipma.warning.new': { level: 'red' },
      },
      catalog: MOCK_EVENTS,
    })

    expect(payload).toEqual({
      url: 'https://api.meusite.pt/hook',
      events: ['base.contract.new', 'ipma.warning.new'],
      filters: {
        'base.contract.new': { local: 'Fundão', value: 5000 },
        'ipma.warning.new': { level: 'red' },
      },
    })
  })
})

describe('formatFilterSummary', () => {
  it('builds a readable PT-PT summary', () => {
    const event = MOCK_EVENTS.find(e => e.name === 'base.contract.new')
    const filter = event.filters.find(f => f.key === 'local')
    expect(formatFilterSummary(event, filter, 'Fundão')).toBe(
      'Contratos públicos · local contém Fundão'
    )
  })

  it('uses enum option labels', () => {
    const event = MOCK_EVENTS.find(e => e.name === 'ipma.warning.new')
    const filter = event.filters.find(f => f.key === 'level')
    expect(formatFilterSummary(event, filter, 'red')).toBe(
      'Aviso meteorológico · nível é Vermelho'
    )
  })
})

describe('listActiveFilterSummaries', () => {
  it('lists active filters on an existing webhook', () => {
    const lines = listActiveFilterSummaries(
      {
        events: ['base.contract.new'],
        filters: { 'base.contract.new': { local: 'Fundão' } },
      },
      MOCK_EVENTS
    )
    expect(lines).toEqual(['Contratos públicos · local contém Fundão'])
  })
})

describe('groupEventsByService', () => {
  it('groups events by connector', () => {
    const groups = groupEventsByService(MOCK_EVENTS)
    expect(groups.map(g => g.service)).toEqual([
      '/v1/ipma',
      '/v1/fuel',
      '/v1/anpc',
      '/v1/base',
      '/v1/ev',
    ])
    expect(groups.find(g => g.service === '/v1/base').title).toBe('Contratos públicos (BASE)')
  })
})

describe('event search', () => {
  it('shows search only when the catalog is large', () => {
    expect(shouldShowEventSearch(MOCK_EVENTS)).toBe(false)
    expect(shouldShowEventSearch(MANY_EVENTS)).toBe(true)
  })

  it('filters by label, name and connector', () => {
    const hits = filterEvents(MOCK_EVENTS, 'fundão')
    expect(hits.map(e => e.name)).toEqual(['base.contract.new'])
  })
})

describe('normalizeCatalog', () => {
  it('rejects a payload that is not the events contract', () => {
    expect(() => normalizeCatalog({ data: MOCK_EVENTS })).toThrow(/inválida/)
    expect(normalizeCatalog({ events: MOCK_EVENTS })).toEqual(MOCK_EVENTS)
  })
})
