import { describe, expect, it } from 'vitest'
import { MOCK_EVENTS, MOCK_REFS, MANY_EVENTS } from './fixtures'
import {
  buildWebhookPayload,
  compactFilters,
  extractWebhookSecret,
  filterEvents,
  formatFilterSummary,
  geoPrecisionLabel,
  groupEventsByService,
  listActiveFilterSummaries,
  normalizeCatalog,
  normalizeStoredFilters,
  parseCatalog,
  shouldShowEventSearch,
  webhookRecordFromResponse,
} from './helpers'

describe('compactFilters', () => {
  it('omits empty strings, whitespace and unselected events', () => {
    const filters = compactFilters(
      ['base.contract.new', 'ipma.warning.new'],
      {
        'base.contract.new': { municipality: '  0504  ', valor_min: '' },
        'ipma.warning.new': { min_level: '   ', region: '' },
        'ev.prices.updated': { min_price_eur_mwh: '80' },
      },
      MOCK_EVENTS
    )

    expect(filters).toEqual({
      'base.contract.new': { municipality: '0504' },
    })
  })

  it('coerces number filters to numbers', () => {
    const filters = compactFilters(
      ['base.contract.new'],
      { 'base.contract.new': { municipality: '0504', valor_min: '10000' } },
      MOCK_EVENTS
    )

    expect(filters).toEqual({
      'base.contract.new': { municipality: '0504', valor_min: 10000 },
    })
  })

  it('writes municipality and drops legacy local/concelho keys', () => {
    const filters = compactFilters(
      ['base.contract.new'],
      { 'base.contract.new': { local: '0504', concelho: '1106' } },
      MOCK_EVENTS
    )

    expect(filters).toEqual({
      'base.contract.new': { municipality: ['0504', '1106'] },
    })
    expect(filters['base.contract.new'].local).toBeUndefined()
    expect(filters['base.contract.new'].concelho).toBeUndefined()
  })

  it('keeps a single multi value as a scalar', () => {
    const filters = compactFilters(
      ['dre.diploma.new'],
      { 'dre.diploma.new': { series: ['I'] } },
      MOCK_EVENTS
    )
    expect(filters).toEqual({
      'dre.diploma.new': { series: 'I' },
    })
  })
})

describe('normalizeStoredFilters', () => {
  it('maps local and concelho to municipality when editing old webhooks', () => {
    expect(
      normalizeStoredFilters(
        { 'base.contract.new': { local: 'Fundão', valor_min: 5000 } },
        MOCK_EVENTS
      )
    ).toEqual({
      'base.contract.new': { municipality: 'Fundão', valor_min: 5000 },
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
        'base.contract.new': { municipality: '0504', valor_min: '5000' },
        'ipma.warning.new': { min_level: 'orange' },
      },
      catalog: MOCK_EVENTS,
    })

    expect(payload).toEqual({
      url: 'https://api.meusite.pt/hook',
      events: ['base.contract.new', 'ipma.warning.new'],
      filters: {
        'base.contract.new': { municipality: '0504', valor_min: 5000 },
        'ipma.warning.new': { min_level: 'orange' },
      },
    })
  })
})

describe('formatFilterSummary', () => {
  it('shows the municipality name from refs, not the INE code', () => {
    const event = MOCK_EVENTS.find(e => e.name === 'base.contract.new')
    const filter = event.filters.find(f => f.key === 'municipality')
    expect(formatFilterSummary(event, filter, '0504', MOCK_REFS)).toBe(
      'Novo contrato público · concelho é Fundão'
    )
  })

  it('uses enum option labels', () => {
    const event = MOCK_EVENTS.find(e => e.name === 'ipma.warning.new')
    const filter = event.filters.find(f => f.key === 'min_level')
    expect(formatFilterSummary(event, filter, 'red')).toBe(
      'Novo aviso meteorológico · nível mínimo ≥ Vermelho'
    )
  })
})

describe('listActiveFilterSummaries', () => {
  it('lists active filters and remaps legacy local keys', () => {
    const lines = listActiveFilterSummaries(
      {
        events: ['base.contract.new'],
        filters: { 'base.contract.new': { local: '0504' } },
      },
      MOCK_EVENTS,
      MOCK_REFS
    )
    expect(lines).toEqual(['Novo contrato público · concelho é Fundão'])
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
      '/v1/dre',
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
    const hits = filterEvents(MOCK_EVENTS, 'contrato')
    expect(hits.map(e => e.name)).toEqual(['base.contract.new'])
  })
})

describe('normalizeCatalog', () => {
  it('rejects a payload that is not the events contract', () => {
    expect(() => normalizeCatalog({ data: MOCK_EVENTS })).toThrow(/inválida/)
    expect(normalizeCatalog({ events: MOCK_EVENTS })).toEqual(MOCK_EVENTS)
  })
})

describe('parseCatalog', () => {
  it('keeps geo refs for comboboxes', () => {
    const parsed = parseCatalog({ events: MOCK_EVENTS, refs: MOCK_REFS })
    expect(parsed.events).toEqual(MOCK_EVENTS)
    expect(parsed.refs.municipalities).toHaveLength(MOCK_REFS.municipalities.length)
  })
})

describe('geoPrecisionLabel', () => {
  it('labels country-wide events', () => {
    expect(geoPrecisionLabel('none')).toBe('Nacional — sem filtro de localização')
    expect(geoPrecisionLabel('district')).toBeNull()
  })
})

describe('extractWebhookSecret', () => {
  it('reads body.secret from the create 201 payload', () => {
    expect(extractWebhookSecret({
      id: 'wh_1',
      url: 'https://api.meusite.pt/hook',
      events: ['fuel.prices.updated'],
      filters: {},
      active: true,
      createdAt: '2026-11-27T08:00:00.000Z',
      updatedAt: '2026-11-27T08:00:00.000Z',
      secret: 'whsec_abc123',
      note: 'Store the secret securely',
    })).toBe('whsec_abc123')
  })

  it('reads body.secret from the rotate 200 payload', () => {
    expect(extractWebhookSecret({
      id: 'wh_1',
      secret: 'whsec_rotated',
      note: 'Store the secret securely',
    })).toBe('whsec_rotated')
  })

  it('does not read a nested data.secret', () => {
    expect(extractWebhookSecret({ data: { secret: 'whsec_nested' } })).toBeNull()
    expect(extractWebhookSecret({ webhook: { secret: 'whsec_wrapped' } })).toBeNull()
  })

  it('returns null when the secret is missing', () => {
    expect(extractWebhookSecret({ id: 'wh_1' })).toBeNull()
    expect(extractWebhookSecret(null)).toBeNull()
  })
})

describe('webhookRecordFromResponse', () => {
  it('strips secret and note so a list refresh cannot keep them', () => {
    expect(webhookRecordFromResponse({
      id: 'wh_1',
      url: 'https://api.meusite.pt/hook',
      events: ['fuel.prices.updated'],
      filters: {},
      active: true,
      createdAt: '2026-11-27T08:00:00.000Z',
      updatedAt: '2026-11-27T08:00:00.000Z',
      secret: 'whsec_abc123',
      note: 'Store the secret securely',
    })).toEqual({
      id: 'wh_1',
      url: 'https://api.meusite.pt/hook',
      events: ['fuel.prices.updated'],
      filters: {},
      active: true,
      createdAt: '2026-11-27T08:00:00.000Z',
      updatedAt: '2026-11-27T08:00:00.000Z',
    })
  })
})
