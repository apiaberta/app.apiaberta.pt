import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MOCK_MUNICIPALITIES, MOCK_REFS } from './fixtures'
import {
  fetchAllFromSource,
  IPMA_AREA_TO_DISTRICT,
  loadOptionsSource,
  optionFromRow,
  resetOptionsSourceCache,
  restrictOptionsByDistricts,
  siblingDistrictCodes,
} from './geo'

beforeEach(() => {
  resetOptionsSourceCache()
})

describe('optionFromRow', () => {
  it('stores the INE code and shows the name', () => {
    expect(optionFromRow(MOCK_MUNICIPALITIES.find(m => m.name === 'Fundão'), 'municipality')).toEqual({
      value: '0504',
      label: 'Fundão',
      district: 'Castelo Branco',
      district_code: '05',
    })
  })
})

describe('restrictOptionsByDistricts', () => {
  it('keeps Castelo Branco concelhos when the IPMA region is CBO', () => {
    const options = MOCK_MUNICIPALITIES.map(row => optionFromRow(row, 'municipality'))
    const restricted = restrictOptionsByDistricts(options, siblingDistrictCodes({ region: 'CBO' }))
    expect(restricted.map(o => o.label)).toEqual([
      'Belmonte',
      'Castelo Branco',
      'Covilhã',
      'Fundão',
      'Vila Velha de Ródão',
    ])
    expect(IPMA_AREA_TO_DISTRICT.CBO).toBe('05')
  })
})

describe('fetchAllFromSource', () => {
  it('asks for the full list in one request when the API allows it', async () => {
    const getJson = vi.fn(async () => ({
      total: MOCK_MUNICIPALITIES.length,
      page: 1,
      limit: 400,
      pages: 1,
      data: MOCK_MUNICIPALITIES,
    }))
    const rows = await fetchAllFromSource('/v1/geo/municipalities', getJson)
    expect(rows).toHaveLength(MOCK_MUNICIPALITIES.length)
    expect(getJson).toHaveBeenCalledTimes(1)
    expect(getJson).toHaveBeenCalledWith('/v1/geo/municipalities', { limit: 400, page: 1 })
  })

  it('pages when the API caps the page size at 50', async () => {
    const all = Array.from({ length: 120 }, (_, i) => ({
      codigoine: String(i + 1).padStart(4, '0'),
      name: `C${i + 1}`,
      district: 'X',
    }))
    const getJson = vi.fn(async (_path, params) => {
      const page = params.page
      const limit = params.limit === 400 ? 50 : params.limit
      const start = (page - 1) * 50
      return {
        total: 120,
        page,
        limit,
        pages: 3,
        data: all.slice(start, start + 50),
      }
    })
    const rows = await fetchAllFromSource('/v1/geo/municipalities', getJson)
    expect(rows).toHaveLength(120)
    expect(getJson.mock.calls.map(call => call[1].page)).toEqual([1, 2, 3])
  })
})

describe('loadOptionsSource', () => {
  it('reuses an in-flight fetch for the same path', async () => {
    const getJson = vi.fn(async () => ({
      total: MOCK_REFS.municipalities.length,
      data: MOCK_REFS.municipalities,
    }))
    const a = loadOptionsSource('/v1/geo/municipalities', getJson)
    const b = loadOptionsSource('/v1/geo/municipalities', getJson)
    await Promise.all([a, b])
    expect(getJson).toHaveBeenCalledTimes(1)
  })
})
