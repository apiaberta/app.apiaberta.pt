export const MOCK_MUNICIPALITIES = [
  { codigoine: '0501', name: 'Belmonte', district: 'Castelo Branco', district_code: '05' },
  { codigoine: '0502', name: 'Castelo Branco', district: 'Castelo Branco', district_code: '05' },
  { codigoine: '0503', name: 'Covilhã', district: 'Castelo Branco', district_code: '05' },
  { codigoine: '0504', name: 'Fundão', district: 'Castelo Branco', district_code: '05' },
  { codigoine: '0511', name: 'Vila Velha de Ródão', district: 'Castelo Branco', district_code: '05' },
  { codigoine: '1106', name: 'Lisboa', district: 'Lisboa', district_code: '11' },
  { codigoine: '1312', name: 'Porto', district: 'Porto', district_code: '13' },
]

export const MOCK_REFS = {
  municipalities: MOCK_MUNICIPALITIES.map(m => ({
    code: m.codigoine,
    name: m.name,
    district_code: m.district_code,
    district: m.district,
  })),
  districts: [
    { code: '05', name: 'Castelo Branco' },
    { code: '11', name: 'Lisboa' },
    { code: '13', name: 'Porto' },
  ],
}

const IPMA_REGION_OPTIONS = [
  { value: 'LSB', label_pt: 'Lisboa' },
  { value: 'PTO', label_pt: 'Porto' },
  { value: 'CBO', label_pt: 'Castelo Branco' },
  { value: 'CBR', label_pt: 'Coimbra' },
]

const IPMA_LEVEL_OPTIONS = [
  { value: 'yellow', label_pt: 'Amarelo' },
  { value: 'orange', label_pt: 'Laranja' },
  { value: 'red', label_pt: 'Vermelho' },
  { value: 'green', label_pt: 'Verde' },
]

export const MOCK_EVENTS = [
  {
    name: 'ipma.warning.new',
    service: '/v1/ipma',
    label_pt: 'Novo aviso meteorológico',
    description_pt: 'Novo aviso meteorológico emitido pelo IPMA',
    description: 'Fired when IPMA issues a new meteorological warning',
    geo_precision: 'district',
    payload_fields: ['id', 'level', 'type', 'text', 'region', 'startTime', 'endTime'],
    filters: [
      {
        key: 'region',
        label_pt: 'Região (código IPMA)',
        type: 'enum',
        match: 'equals',
        multiple: true,
        precision: 'district',
        options: IPMA_REGION_OPTIONS,
      },
      {
        key: 'municipality',
        label_pt: 'Concelho (mapeado à área do distrito)',
        type: 'enum',
        match: 'ipma_area',
        multiple: true,
        precision: 'distrito',
        options_source: '/v1/geo/municipalities',
      },
      {
        key: 'level',
        label_pt: 'Nível',
        type: 'enum',
        match: 'equals',
        multiple: true,
        options: IPMA_LEVEL_OPTIONS,
      },
      {
        key: 'min_level',
        label_pt: 'Nível mínimo',
        type: 'enum',
        match: 'min_level',
        multiple: false,
        options: IPMA_LEVEL_OPTIONS.filter(o => o.value !== 'green'),
      },
    ],
  },
  {
    name: 'fuel.prices.updated',
    service: '/v1/fuel',
    label_pt: 'Preços de combustíveis atualizados',
    description_pt: 'Atualização diária de preços de combustível (DGEG)',
    description: 'Fired when DGEG publishes new fuel price data',
    geo_precision: 'municipality',
    payload_fields: ['date', 'diesel_avg', 'gasoline95_avg', 'lpg_avg', 'records'],
    filters: [],
  },
  {
    name: 'anpc.warning.new',
    service: '/v1/anpc',
    label_pt: 'Novo aviso da Proteção Civil',
    description_pt: 'Aviso rodoviário ou de proteção civil',
    description: 'New ANPC warning',
    geo_precision: 'none',
    payload_fields: ['id', 'text'],
    filters: [
      {
        key: 'text',
        label_pt: 'Texto',
        type: 'string',
        match: 'contains_ci',
        multiple: false,
        free_text: true,
        placeholder_pt: 'A1',
      },
    ],
  },
  {
    name: 'base.contract.new',
    service: '/v1/base',
    label_pt: 'Novo contrato público',
    description_pt: 'Novo contrato publicado em BASE.gov.pt',
    description: 'Fired when a new public contract is published on BASE.gov.pt',
    geo_precision: 'municipality',
    payload_fields: ['id', 'description', 'contractingEntity', 'awarded', 'value', 'date', 'type'],
    filters: [
      {
        key: 'municipality',
        label_pt: 'Concelho',
        type: 'enum',
        match: 'equals',
        multiple: true,
        precision: 'municipality',
        options_source: '/v1/geo/municipalities',
      },
      {
        key: 'valor_min',
        label_pt: 'Valor mínimo (€)',
        type: 'number',
        match: 'gte',
        multiple: false,
        placeholder_pt: '50000',
      },
    ],
  },
  {
    name: 'ev.prices.updated',
    service: '/v1/ev',
    label_pt: 'Preço OMIE atualizado',
    description_pt: 'Atualização de preço da eletricidade no mercado ibérico',
    description: 'Fired when OMIE electricity market prices are updated',
    geo_precision: 'none',
    payload_fields: ['period', 'price_eur_mwh', 'price_eur_kwh', 'source'],
    filters: [
      {
        key: 'min_price_eur_mwh',
        label_pt: 'Preço mínimo (€/MWh)',
        type: 'number',
        match: 'gte',
        multiple: false,
        placeholder_pt: '80',
      },
    ],
  },
  {
    name: 'dre.diploma.new',
    service: '/v1/dre',
    label_pt: 'Novo diploma do DRE',
    description_pt: 'Novo diploma no Diário da República',
    description: 'New DRE diploma',
    geo_precision: 'none',
    payload_fields: ['id', 'title', 'series'],
    filters: [
      {
        key: 'series',
        label_pt: 'Série',
        type: 'enum',
        match: 'equals',
        multiple: true,
        options: [
          { value: 'I', label_pt: 'I Série' },
          { value: 'II', label_pt: 'II Série' },
        ],
      },
    ],
  },
]

export const MANY_EVENTS = [
  ...MOCK_EVENTS,
  {
    name: 'carris.alert.new',
    service: '/v1/carris',
    label_pt: 'Novo alerta da Carris Metropolitana',
    description_pt: 'Novo alerta de serviço',
    description: 'New alert',
    geo_precision: 'none',
    payload_fields: ['alert_id'],
    filters: [],
  },
  {
    name: 'sns.dataset.updated',
    service: '/v1/sns',
    label_pt: 'Dataset do SNS atualizado',
    description_pt: 'Atualização de um dataset',
    description: 'Dataset updated',
    geo_precision: 'none',
    payload_fields: ['key'],
    filters: [],
  },
]
