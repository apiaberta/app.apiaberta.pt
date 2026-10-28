export const CAPTURED_AT = '28 de outubro de 2026'

export const NAV = [
  { href: '#comecar', label: 'Começar' },
  { href: '#autenticacao', label: 'Autenticação' },
  { href: '#limites', label: 'Limites de pedidos' },
  { href: '#erros', label: 'Erros' },
  { href: '#fuel', label: 'Combustíveis (DGEG)' },
  { href: '#ipma', label: 'Meteorologia (IPMA)' },
  { href: '#ipma-seismic', label: 'Sismos (IPMA)' },
  { href: '#base', label: 'Contratos públicos (BASE)' },
  { href: '#contracts', label: 'Contratos (alias)' },
  { href: '#ev', label: 'Carregamento EV' },
  { href: '#ine', label: 'Estatísticas (INE/Eurostat)' },
  { href: '#anpc', label: 'Proteção Civil (ANPC)' },
  { href: '#bdp', label: 'Banco de Portugal' },
  { href: '#geo', label: 'Geografia' },
  { href: '#nif', label: 'Validador de NIF' },
  { href: '#prr', label: 'PRR / PT2030' },
  { href: '#pt2030', label: 'Portugal 2030' },
  { href: '#dre', label: 'Legislação (DRE)' },
  { href: '#nasafirms', label: 'Incêndios (NASA FIRMS)' },
  { href: '#carris', label: 'Carris Metropolitana' },
  { href: '#gtfs', label: 'Horários (GTFS)' },
  { href: '#parlamento', label: 'Parlamento' },
  { href: '#sns', label: 'SNS Transparência' },
]

const GET = 'GET'

function ep(path, description, params = []) {
  return { method: GET, path, description, params }
}

function p(name, type, { required = false, in: loc = 'query', example = '', desc = '' } = {}) {
  return { name, type, required, in: loc, example, desc }
}

export const APIS = [
  {
    id: 'fuel',
    title: 'Preços de combustíveis (DGEG)',
    prefix: '/v1/fuel',
    version: '1.0.0',
    description:
      'Médias nacionais e preços por posto de abastecimento em Portugal, sincronizados diariamente a partir da DGEG.',
    source: {
      entity: 'DGEG — Direção-Geral de Energia e Geologia',
      url: 'https://precoscombustiveis.dgeg.gov.pt',
    },
    endpoints: [
      ep('/v1/fuel/prices', 'Médias nacionais por tipo de combustível', [
        p('date', 'string', { example: '2026-10-28', desc: 'YYYY-MM-DD. Sem valor, usa o dia mais recente disponível.' }),
      ]),
      ep('/v1/fuel/stations', 'Postos com preço, com filtros e paginação', [
        p('fuel', 'string', { example: 'gasoline_95', desc: 'Slug do combustível. Predefinição: gasoline_95.' }),
        p('district', 'string', { example: 'Lisboa', desc: 'Filtro por distrito (não distingue maiúsculas).' }),
        p('brand', 'string', { example: 'GALP', desc: 'Filtro por marca.' }),
        p('sort', 'string', { example: 'price_asc', desc: 'price_asc ou price_desc.' }),
        p('page', 'integer', { example: '1', desc: 'Página (mínimo 1).' }),
        p('limit', 'integer', { example: '20', desc: 'Resultados por página (máximo 100).' }),
      ]),
      ep('/v1/fuel/cheapest', 'Postos mais baratos do país para um combustível', [
        p('fuel', 'string', { example: 'gasoline_95', desc: 'Slug do combustível. Predefinição: gasoline_95.' }),
        p('limit', 'integer', { example: '10', desc: 'Máximo 50.' }),
      ]),
      ep('/v1/fuel/meta', 'Metadados, origem e última sincronização'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/fuel/prices"`,
    responseLabel: '200 OK — /v1/fuel/prices (array truncado)',
    response: `{
  "data": [
    {
      "fuel_slug": "biodiesel_b15",
      "fuel_name": "Biodiesel B15",
      "road_vehicle": false,
      "avg_price_eur": 2.172,
      "min_price_eur": 2.104,
      "max_price_eur": 2.407,
      "station_count": 219,
      "date": "2026-10-28",
      "updated_at": "2026-10-28T07:30:30.780Z"
    }
  ]
}`,
    limitations: [
      'A sincronização corre às 07:30 Europe/Lisbon; antes dessa hora o connector devolve a última data disponível.',
      'Alguns postos em /stations e /cheapest podem ter updated_at antigo em relação às médias diárias (observado um posto com updated_at de fevereiro de 2026).',
      'Não existe GET /v1/fuel/stations/:id nem histórico, apesar de o README do connector os mencionar.',
    ],
  },
  {
    id: 'ipma',
    title: 'Meteorologia (IPMA)',
    prefix: '/v1/ipma',
    version: '1.1.0',
    description:
      'Previsões meteorológicas, avisos e catálogo sísmico do Instituto Português do Mar e da Atmosfera. As previsões cobrem distritos e ilhas (35 localizações). Os sismos estão na secção seguinte.',
    source: {
      entity: 'IPMA — Instituto Português do Mar e da Atmosfera',
      url: 'https://api.ipma.pt',
    },
    endpoints: [
      ep('/v1/ipma/locations', 'Localizações disponíveis (35)', [
        p('island', 'boolean', { example: 'true', desc: 'true = só ilhas (globalIdLocal > 900000); false = continente.' }),
      ]),
      ep('/v1/ipma/forecasts', 'Previsões agrupadas por cidade (hoje em diante)', [
        p('days', 'integer', { example: '5', desc: 'Declarado no esquema (1–10); o filtro efectivo é date ≥ hoje.' }),
      ]),
      ep('/v1/ipma/forecasts/:cityId', 'Previsão de uma localidade', [
        p('cityId', 'integer', { required: true, in: 'path', example: '1110600', desc: 'globalIdLocal do IPMA (Lisboa = 1110600).' }),
      ]),
      ep('/v1/ipma/warnings', 'Avisos meteorológicos ainda activos (endTime ≥ agora)', [
        p('level', 'string', { example: 'yellow', desc: 'Filtro por nível (yellow, orange, red).' }),
        p('region', 'string', { example: 'LSB', desc: 'Filtro por código de região.' }),
      ]),
      ep('/v1/ipma/meta', 'Metadados e contagens'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/ipma/forecasts/1110600"`,
    responseLabel: '200 OK — /v1/ipma/forecasts/1110600 (array truncado)',
    response: `{
  "cityId": 1110600,
  "cityName": "Lisboa",
  "latitude": "38.7660",
  "longitude": "-9.1286",
  "forecasts": [
    {
      "date": "2026-10-28",
      "tMin": 14,
      "tMax": 25,
      "description": "Pouco nublado",
      "precipProb": 0,
      "windDir": "N",
      "windSpeed": "1",
      "synced_at": "2026-10-28T12:00:00.881Z"
    }
  ]
}`,
    limitations: [
      '/forecasts devolveu 27 cidades (não as 35 localizações); as ilhas podem não ter previsão diária no mesmo feed.',
      'Alguns avisos vêm com text vazio (observados 173 avisos activos, muitos do tipo Nevoeiro).',
      'Previsões sincronizadas a cada 6 h; avisos a cada 30 min.',
    ],
    extraSections: [
      {
        id: 'ipma-seismic',
        title: 'Sismos (IPMA)',
        prefix: '/v1/ipma/seismic',
        version: '1.1.0',
        source: {
          entity: 'IPMA — Instituto Português do Mar e da Atmosfera',
          url: 'https://api.ipma.pt',
        },
        description:
          'Catálogo de sismos do Continente, Madeira e Açores. O IPMA só publica cerca de 30 dias; o connector guarda histórico e actualiza a cada 10 minutos (idArea=3 Açores, idArea=7 Continente + Madeira).',
        endpoints: [
          ep('/v1/ipma/seismic', 'Catálogo filtrável (predefinição: últimos 30 dias)', [
            p('region', 'string', { example: 'continente-madeira', desc: 'acores ou continente-madeira.' }),
            p('min_magnitude', 'number', { example: '2.5', desc: 'Magnitude mínima.' }),
            p('desde', 'string', { example: '2026-10-01T00:00:00Z', desc: 'Início da janela (ISO 8601).' }),
            p('ate', 'string', { example: '2026-10-28T23:59:59Z', desc: 'Fim da janela (ISO 8601).' }),
            p('sensed', 'boolean', { example: 'true', desc: 'Só eventos sentidos pela população.' }),
            p('near', 'string', { example: '38.72,-9.14', desc: 'Centro da pesquisa lat,lon.' }),
            p('radius_km', 'number', { example: '50', desc: 'Raio em km (máximo 500). Exige near.' }),
            p('limit', 'integer', { example: '1', desc: 'Predefinição 100, máximo 1000.' }),
            p('offset', 'integer', { example: '0', desc: 'Deslocamento para paginação.' }),
          ]),
          ep('/v1/ipma/seismic/latest', 'Último sismo por região', [
            p('region', 'string', { example: 'acores', desc: 'Opcional; sem valor devolve as duas regiões.' }),
          ]),
          ep('/v1/ipma/seismic/:id', 'Um sismo pelo identificador interno', [
            p('id', 'string', { required: true, in: 'path', example: 'ad90cacee5ddfde335f9b2a3e9ce89e1f6639f27', desc: 'event_key gerada pelo connector.' }),
          ]),
        ],
        curl: `curl "https://api.apiaberta.pt/v1/ipma/seismic?limit=1"`,
        responseLabel: '200 OK — /v1/ipma/seismic?limit=1',
        response: `{
  "count": 1,
  "total": 421,
  "data": [
    {
      "id": "ad90cacee5ddfde335f9b2a3e9ce89e1f6639f27",
      "time": "2026-10-28T04:30:18.000Z",
      "lat": 37.338,
      "lon": -1.52,
      "depth_km": 34,
      "magnitude": 2.5,
      "mag_type": "L",
      "intensity": null,
      "sensed": null,
      "region": "continente-madeira",
      "obs_region": "SE Lorca (ESP)",
      "map_url": null,
      "shakemap_url": null
    }
  ]
}`,
        limitations: [
          'map_url e shakemap_url vieram null no evento consultado.',
          'O campo intensity também pode ser null quando o IPMA não publica intensidade.',
        ],
      },
    ],
  },
  {
    id: 'base',
    title: 'Contratos públicos (BASE)',
    prefix: '/v1/base',
    version: '1.0.0',
    description:
      'Contratos públicos portugueses. A listagem vem de ficheiros XLSX públicos do dados.gov.pt; o detalhe pode enriquecer-se com a API oficial do IMPIC quando a chave BASE_API_KEY está configurada.',
    source: {
      entity: 'IMPIC / BASE.gov.pt',
      url: 'https://www.base.gov.pt',
    },
    endpoints: [
      ep('/v1/base', 'Atalho da listagem paginada (igual a /contracts)', [
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '1', desc: 'Predefinição 25, máximo 100.' }),
        p('type', 'string', { example: 'ajuste', desc: 'Tipo de procedimento.' }),
        p('year', 'integer', { example: '2026', desc: 'Filtra a data por prefixo YYYY-.' }),
      ]),
      ep('/v1/base/contracts', 'Listagem paginada de contratos', [
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '1', desc: 'Predefinição 25, máximo 100.' }),
        p('type', 'string', { example: 'concurso' }),
        p('year', 'integer', { example: '2026' }),
      ]),
      ep('/v1/base/contracts/search', 'Pesquisa de texto (índice MongoDB ou regex)', [
        p('q', 'string', { required: true, example: 'construcao', desc: 'Termo de pesquisa.' }),
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '1', desc: 'Máximo 100.' }),
      ]),
      ep('/v1/base/contracts/lookup/:id', 'Detalhe (API oficial se disponível; senão cache)', [
        p('id', 'string', { required: true, in: 'path', example: '15088663', desc: 'idContrato.' }),
      ]),
      ep('/v1/base/meta', 'Metadados e última sincronização'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/base/contracts?limit=1"`,
    responseLabel: '200 OK — /v1/base/contracts?limit=1',
    response: `{
  "total": 2177319,
  "page": 1,
  "limit": 1,
  "pages": 2177319,
  "data": [
    {
      "id": "15088663",
      "description": "Aquisição de viagens referente à deslocação de uma delegação da DGPDN a Timor para participação na XXV Reunião de MDNs da CPLP e XXIII Reunião de DPDNs da CPLP a decorrerem em Díli, Timor-Leste, nos dias 1 e 2 de junho de 2026",
      "contractingEntity": "",
      "awarded": "500297177 - Viagens Abreu, S.A.",
      "value": 15280.04,
      "date": "2026-06-08",
      "type": "Ao abrigo de acordo-quadro (art.º 259.º)",
      "synced_at": "2026-07-08T02:00:57.756Z"
    }
  ]
}`,
    limitations: [
      'A listagem estava desactualizada: last_sync / synced_at de 8 de julho de 2026, com contractingEntity vazio em vários registos.',
      'GET /v1/base/contracts/lookup/15088663 devolveu source: "official" com campos extra (CPV, local de execução, regime). O detalhe pode estar mais fresco do que a listagem.',
      'Sem BASE_API_KEY no connector, o lookup cai para a cache MongoDB/XLSX.',
    ],
  },
  {
    id: 'contracts',
    title: 'Contratos públicos (alias /v1/contracts)',
    prefix: '/v1/contracts',
    version: '1.0.0',
    description:
      'Alias do connector BASE. O gateway encaminha /v1/contracts para o mesmo serviço que /v1/base. Os caminhos abaixo correspondem a /v1/base/contracts…',
    source: {
      entity: 'IMPIC / BASE.gov.pt',
      url: 'https://www.base.gov.pt',
    },
    endpoints: [
      ep('/v1/contracts', 'Igual a GET /v1/base/contracts', [
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '1' }),
        p('type', 'string', { example: 'ajuste' }),
        p('year', 'integer', { example: '2026' }),
      ]),
      ep('/v1/contracts/search', 'Igual a GET /v1/base/contracts/search', [
        p('q', 'string', { required: true, example: 'construcao' }),
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '1' }),
      ]),
      ep('/v1/contracts/lookup/:id', 'Igual a GET /v1/base/contracts/lookup/:id', [
        p('id', 'string', { required: true, in: 'path', example: '15088663' }),
      ]),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/contracts?limit=1"`,
    responseLabel: '200 OK — /v1/contracts?limit=1 (mesmo payload que /v1/base/contracts)',
    response: `{
  "total": 2177319,
  "page": 1,
  "limit": 1,
  "pages": 2177319,
  "data": [
    {
      "id": "15088663",
      "description": "Aquisição de viagens referente à deslocação de uma delegação da DGPDN a Timor…",
      "contractingEntity": "",
      "awarded": "500297177 - Viagens Abreu, S.A.",
      "value": 15280.04,
      "date": "2026-06-08",
      "type": "Ao abrigo de acordo-quadro (art.º 259.º)",
      "synced_at": "2026-07-08T02:00:57.756Z"
    }
  ]
}`,
    limitations: [
      'É o mesmo conjunto de dados e as mesmas limitações de frescura que /v1/base.',
      'Não há um conjunto de endpoints distinto: só muda o prefixo.',
    ],
  },
  {
    id: 'ev',
    title: 'Preços de carregamento EV',
    prefix: '/v1/ev',
    version: '1.0.0',
    description:
      'Tarifas CEME de carregamento de veículos eléctricos e preços spot OMIE (mercado ibérico) para Portugal.',
    source: {
      entity: 'ERSE (tarifas CEME) e OMIE (preços spot)',
      url: 'https://www.omie.es',
    },
    endpoints: [
      ep('/v1/ev/tariffs', 'Tarifas CEME com preço actual', [
        p('type', 'string', { example: 'fixed', desc: 'fixed ou indexed.' }),
      ]),
      ep('/v1/ev/tariffs/cheapest', 'Ranking do custo total para um carregamento', [
        p('kwh', 'number', { example: '40', desc: 'kWh a carregar. O esquema marca-o como obrigatório; o código usa 40 se faltar.' }),
      ]),
      ep('/v1/ev/omie/current', 'Preço OMIE do quarto de hora actual'),
      ep('/v1/ev/omie/today', '96 intervalos de 15 min do dia (hora de Portugal no cálculo interno)'),
      ep('/v1/ev/meta', 'Metadados'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/ev/omie/current"`,
    responseLabel: '200 OK — /v1/ev/omie/current',
    response: `{
  "data": {
    "date": "2026-10-28",
    "hour": 15,
    "quarter": 3,
    "price_eur_mwh": 68.49,
    "price_eur_kwh": 0.07,
    "timestamp": "2026-10-28T14:38:06.905Z"
  }
}`,
    limitations: [
      'As tarifas CEME são entrada manual; o updated_at observado era 20 de fevereiro de 2026.',
      'Tarifas indexadas (OMIE) são excluídas de /tariffs/cheapest.',
      'O período «vazio» é uma simplificação (22:00–08:00 e fins-de-semana), não o calendário oficial ERSE.',
      'Se não houver OMIE para o quarto de hora actual, /omie/current devolve um objecto com error, não 404.',
    ],
  },
  {
    id: 'ine',
    title: 'Estatísticas de Portugal (INE / Eurostat)',
    prefix: '/v1/ine',
    version: '1.0.0',
    description:
      'Série curada de indicadores de Portugal (população, PIB, desemprego, inflação, demografia) obtida via Eurostat, não via o portal do INE.',
    source: {
      entity: 'Eurostat (dados de Portugal); INE como instituto nacional de referência',
      url: 'https://ec.europa.eu/eurostat',
    },
    endpoints: [
      ep('/v1/ine/indicators', 'Indicadores disponíveis (7 no momento da captura)'),
      ep('/v1/ine/stats', 'Valores anuais de um ou mais indicadores', [
        p('indicator', 'string', { example: 'population', desc: 'Slugs separados por vírgula.' }),
        p('from', 'integer', { example: '2000', desc: 'Ano inicial (predefinição 2000).' }),
        p('to', 'integer', { example: '2025', desc: 'Ano final.' }),
      ]),
      ep('/v1/ine/latest', 'Último valor de cada indicador'),
      ep('/v1/ine/meta', 'Metadados (também em /ine/meta via gateway)'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/ine/stats?indicator=population"`,
    responseLabel: '200 OK — /v1/ine/stats?indicator=population (anos truncados)',
    response: `{
  "data": [
    {
      "indicator": "population",
      "label": "Resident population (1 January)",
      "unit": "NR",
      "source": "Eurostat",
      "source_dataset": "demo_pjan",
      "data": [
        { "year": 2000, "value": 10249022 }
      ]
    }
  ]
}`,
    limitations: [
      'Não consulta a API do INE: a origem efectiva é o Eurostat.',
      'Só há um conjunto pequeno de indicadores (7 na captura: birth_rate e outros).',
      'Sem dados para os parâmetros pedidos, /stats responde 404.',
    ],
  },
  {
    id: 'anpc',
    title: 'Proteção Civil (ANPC / ANEPC)',
    prefix: '/v1/anpc',
    version: '1.1.0',
    description:
      'Ocorrências de proteção civil, índice de risco de incêndio e avisos rodoviários, via fogos.pt (ANEPC / ICNF).',
    source: {
      entity: 'ANEPC — Autoridade Nacional de Emergência e Proteção Civil (via fogos.pt)',
      url: 'https://api.fogos.pt',
    },
    endpoints: [
      ep('/v1/anpc/incidents', 'Ocorrências (predefinição: só activas)', [
        p('active', 'boolean', { example: 'false', desc: 'Predefinição true. Use false para histórico.' }),
        p('district', 'string', { example: 'Lisboa' }),
        p('natureza', 'string', { example: 'Mato' }),
        p('from', 'string', { example: '2026-10-01', desc: 'Início (ISO).' }),
        p('to', 'string', { example: '2026-10-28', desc: 'Fim (ISO).' }),
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '1', desc: 'Máximo 100.' }),
      ]),
      ep('/v1/anpc/incidents/active', 'Atalho: só ocorrências activas'),
      ep('/v1/anpc/summary', 'Contagens de activas por distrito e tipo'),
      ep('/v1/anpc/risk', 'Risco de incêndio por concelho', [
        p('date', 'string', { example: 'today', desc: 'today ou tomorrow.' }),
        p('district', 'string', { example: 'Lisboa' }),
      ]),
      ep('/v1/anpc/risk/:district', 'Risco de um distrito', [
        p('district', 'string', { required: true, in: 'path', example: 'Lisboa' }),
        p('date', 'string', { example: 'today' }),
      ]),
      ep('/v1/anpc/warnings', 'Avisos rodoviários / de tráfego', [
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '1', desc: 'Predefinição 50, máximo 200.' }),
      ]),
      ep('/v1/anpc/hotspots', 'Proxy de hotspots satélite fogos.pt — falhou na captura (502)'),
      ep('/v1/anpc/meta', 'Metadados'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/anpc/incidents?active=false&limit=1"`,
    responseLabel: '200 OK — /v1/anpc/incidents?active=false&limit=1',
    response: `{
  "meta": { "page": 1, "limit": 1, "total": 13040, "pages": 13040 },
  "data": [
    {
      "id": "20261527171",
      "date": "27-10-2026",
      "datetime": "2026-10-27T22:18:00.000Z",
      "type": "Mato",
      "type_code": "3103",
      "status": "Em Resolução",
      "active": false,
      "location": {
        "district": "Lisboa",
        "freguesia": "Algueirão-mem Martins",
        "address": "Lisboa, Sintra, Algueirão-mem Martins",
        "region": "Lisboa e Vale do Tejo",
        "subregion": "Grande Lisboa",
        "lat": 38.80372,
        "lng": -9.323937
      },
      "resources": { "ground": 0, "aerial": 0, "water": 0 }
    }
  ]
}`,
    limitations: [
      'GET /v1/anpc/hotspots falhou com HTTP 502 (resposta Cloudflare de bad gateway). O connector tenta proxiar https://api.fogos.pt/v1/hotspots, que está protegido.',
      'Sem o filtro active=false, /incidents e /incidents/active devolveram listas vazias (0 ocorrências activas às 14:38 UTC de 28-10-2026).',
      '/warnings inclui avisos muito antigos (ex.: texto de janeiro de 2022).',
    ],
  },
  {
    id: 'bdp',
    title: 'Banco de Portugal',
    prefix: '/v1/bdp',
    version: '1.0.0',
    description:
      'Taxas de juro de referência do BCE / €STR e taxas de novos empréstimos e depósitos em Portugal, via BPstat.',
    source: {
      entity: 'Banco de Portugal (BPstat) / Banco Central Europeu',
      url: 'https://bpstat.bportugal.pt',
    },
    endpoints: [
      ep('/v1/bdp/rates', 'Taxas BCE (MRO, facilidades) e €STR'),
      ep('/v1/bdp/lending-rates', 'Taxas de novos empréstimos e depósitos em Portugal'),
      ep('/v1/bdp/meta', 'Metadados e catálogo de séries'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/bdp/rates"`,
    responseLabel: '200 OK — /v1/bdp/rates (array truncado)',
    response: `{
  "source": "Banco de Portugal BPstat / European Central Bank",
  "source_url": "https://bpstat.bportugal.pt",
  "count": 5,
  "synced_at": "2026-10-28T08:00:01.332Z",
  "data": [
    {
      "key": "ecb_mro",
      "label": "ECB Main Refinancing Operations (MRO)",
      "label_pt": "Taxa BCE - Operações principais de refinanciamento (MRO)",
      "value": 2.65,
      "unit": "%",
      "ref_date": "2026-10-21",
      "frequency": "daily",
      "synced_at": "2026-10-28T08:00:01.332Z"
    }
  ]
}`,
    limitations: [
      'lending-rates usa dados mensais de novas operações (taxa anualizada acordada); a ref_date observada era 31-08-2026.',
      'Não há séries de câmbio USD/EUR neste connector — /v1/bdp/rates são taxas de juro, não cotações de moeda.',
    ],
  },
  {
    id: 'geo',
    title: 'Dados geográficos (geoapi.pt)',
    prefix: '/v1/geo',
    version: '1.0.1',
    description:
      'Distritos, municípios, freguesias e pesquisa de código postal. Hierarquia administrativa com dados CAOP via geoapi.pt; CTT para códigos postais.',
    source: {
      entity: 'geoapi.pt (CAOP / CTT)',
      url: 'https://geoapi.pt',
    },
    endpoints: [
      ep('/v1/geo/districts', 'Lista de distritos', [
        p('geojson', 'string', { example: 'true', desc: 'Se true, inclui o GeoJSON (resposta muito grande).' }),
      ]),
      ep('/v1/geo/districts/:id', 'Distrito por código INE', [
        p('id', 'string', { required: true, in: 'path', example: '01', desc: 'codigoine, ex. 01 = Aveiro. Inclui GeoJSON.' }),
      ]),
      ep('/v1/geo/municipalities', 'Municípios paginados', [
        p('district', 'string', { example: 'lisboa', desc: 'Filtro por nome de distrito.' }),
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '2', desc: 'Predefinição 50.' }),
      ]),
      ep('/v1/geo/municipalities/:slug', 'Município pelo slug', [
        p('slug', 'string', { required: true, in: 'path', example: 'alenquer' }),
      ]),
      ep('/v1/geo/municipalities/:slug/parishes', 'Freguesias de um município', [
        p('slug', 'string', { required: true, in: 'path', example: 'alenquer' }),
      ]),
      ep('/v1/geo/parishes', 'Freguesias (filtro por município)', [
        p('municipality', 'string', { example: 'Alenquer', desc: 'Nome do município. Lisboa devolveu 0 resultados.' }),
      ]),
      ep('/v1/geo/postal/:code', 'Pesquisa de código postal (proxy geoapi.pt)', [
        p('code', 'string', { required: true, in: 'path', example: '1000-001', desc: 'Formato XXXX-XXX.' }),
      ]),
      ep('/v1/geo/meta', 'Contagens e last_sync'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/geo/postal/1000-001"`,
    responseLabel: '200 OK — /v1/geo/postal/1000-001 (arrays truncados)',
    response: `{
  "CP": "1000-001",
  "CP4": "1000",
  "CP3": "001",
  "Distrito": "Lisboa",
  "Concelho": "Lisboa",
  "Localidade": "Lisboa",
  "Designação Postal": "LISBOA",
  "ruas": ["R AÇORES"],
  "municipio": "Lisboa",
  "codigoineDistrito": "11",
  "codigoineMunicipio": "1106"
}`,
    limitations: [
      'GET /v1/geo/parishes?municipality=lisboa e GET /v1/geo/municipalities/lisboa/parishes devolveram count: 0. As freguesias de Lisboa não estão indexadas com esse nome.',
      'GET /v1/geo/districts/:id inclui GeoJSON com milhares de pontos — pesado para clientes.',
      'As respostas de distritos/municípios incluem campos internos MongoDB (_id, __v).',
      'Não existem /geocode nem /reverse, apesar de o README do connector os listar.',
    ],
  },
  {
    id: 'nif',
    title: 'Validador de NIF',
    prefix: '/v1/nif',
    version: '1.0.0',
    description:
      'Validação puramente algorítmica de NIF português (módulo 11). Não consulta a Autoridade Tributária nem confirma se o número está atribuído.',
    source: {
      entity: 'Algoritmo MOD 11 (sem fonte externa)',
      url: 'https://github.com/apiaberta/connector-nif',
    },
    endpoints: [
      ep('/v1/nif/validate/:nif', 'Valida checksum e devolve o tipo pelo primeiro dígito', [
        p('nif', 'string', { required: true, in: 'path', example: '509442013', desc: 'Exactamente 9 dígitos.' }),
      ]),
      ep('/v1/nif/meta', 'Metadados'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/nif/validate/509442013"`,
    responseLabel: '200 OK — NIF válido e NIF com checksum inválido',
    response: `{
  "nif": "509442013",
  "valid": true,
  "type": "Pessoa coletiva (empresa)"
}

{
  "nif": "111111111",
  "valid": false,
  "reason": "checksum_invalid"
}`,
    limitations: [
      'Um checksum válido não prova que o NIF existe ou está activo na AT.',
      '123456789 passa o checksum (é um NIF algorítmicamente válido). Use 111111111 para um exemplo inválido.',
      'Tipos pelo primeiro dígito: 1 pessoa singular residente; 2 não residente; 3 entidade pública; 5 pessoa coletiva; 6 entidade singular não residente; 7/8/9 casos especiais.',
    ],
  },
  {
    id: 'prr',
    title: 'PRR / PT2030',
    prefix: '/v1/prr',
    version: '1.0.0',
    description:
      'Componentes e investimentos do Plano de Recuperação e Resiliência. O connector serve uma lista estática (C01–C09), não uma base viva de projectos contratualizados.',
    source: {
      entity: 'transparencia.gov.pt (atribuído; dados no connector estão hardcoded)',
      url: 'https://transparencia.gov.pt',
    },
    endpoints: [
      ep('/v1/prr/components', 'Componentes e investimentos', [
        p('section', 'string', { example: 'component', desc: 'component ou investment.' }),
      ]),
      ep('/v1/prr/projects', 'Investimentos filtráveis (mesma lista estática)', [
        p('q', 'string', { example: 'saude', desc: 'Pesquisa no nome ou id.' }),
        p('component', 'string', { example: 'C01' }),
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '2', desc: 'Máximo 100.' }),
      ]),
      ep('/v1/prr/summary', 'Totais (9 componentes, 61 investimentos)'),
      ep('/v1/prr/meta', 'Metadados'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/prr/projects?limit=2"`,
    responseLabel: '200 OK — /v1/prr/projects?limit=2',
    response: `{
  "query": null,
  "component": null,
  "page": 1,
  "limit": 2,
  "total": 61,
  "source": "https://transparencia.gov.pt",
  "data": [
    {
      "id": "C01",
      "name": "Cuidados de saude primarios com mais respostas",
      "section": "investment",
      "parent_id": "C01"
    }
  ]
}`,
    limitations: [
      'GET /v1/prr/projects/C01 devolveu 404 — não existe detalhe por id (Route GET:/prr/projects/C01 not found).',
      'Os nomes estão sem acentos (ex.: "Servico Nacional de Saude") e não incluem montantes.',
      'Não é um extracto vivo de transparencia.gov.pt: é um array fixo no código do connector.',
    ],
  },
  {
    id: 'pt2030',
    title: 'Portugal 2030',
    prefix: '/v1/pt2030',
    version: '1.0.0',
    description:
      'Prefixo separado no gateway para o mesmo connector PRR. Só expõe um resumo estático do programa Portugal 2030.',
    source: {
      entity: 'Portugal 2030 / AICEP',
      url: 'https://portugalglobal.pt/PT2030',
    },
    endpoints: [
      ep('/v1/pt2030/summary', 'Resumo estático (orçamento e ligações)'),
      ep('/v1/pt2030/meta', 'Metadados (iguais aos do connector-prr)'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/pt2030/summary"`,
    responseLabel: '200 OK — /v1/pt2030/summary',
    response: `{
  "plan": "PT2030 - Portugal 2030",
  "description": "Next generation EU funding programme for Portugal",
  "execution_period": "2021-2027",
  "total_budget": "EUR 23.4 billion",
  "source": "https://portugalglobal.pt/PT2030",
  "note": "PT2030 data available at https://prr2030.pt and https://portugalglobal.pt/PT2030"
}`,
    limitations: [
      'Não há listagem de operações, avisos ou beneficiários — só este objecto de resumo.',
      'O próprio campo note remete para sites externos.',
    ],
  },
  {
    id: 'dre',
    title: 'Legislação (DRE)',
    prefix: '/v1/dre',
    version: '1.0.0',
    description:
      'Pesquisa no Diário da República. A API oficial da DRE exige sessão; este connector faz proxy HTML e não devolve diplomas em JSON.',
    source: {
      entity: 'INCM / Diário da República',
      url: 'https://dre.pt',
    },
    endpoints: [
      ep('/v1/dre/search', 'Pesquisa (não devolve lista de diplomas)', [
        p('q', 'string', { required: true, example: 'protecao de dados' }),
        p('series', 'string', { example: '1', desc: '1, 2, 3 ou 1-A. Predefinição 1.' }),
        p('year', 'string', { example: '2026' }),
        p('page', 'integer', { example: '1' }),
      ]),
      ep('/v1/dre/legislation', 'Stub: pede a API screenservice da DRE', [
        p('series', 'string', { example: '1' }),
        p('year', 'string', { example: '2026' }),
        p('page', 'integer', { example: '1' }),
        p('limit', 'integer', { example: '20' }),
      ]),
      ep('/v1/dre/latest', 'Stub: últimas publicações'),
      ep('/v1/dre/series', 'Lista estática de séries'),
      ep('/v1/dre/types', 'Lista estática de tipos de diploma'),
      ep('/v1/dre/meta', 'Metadados'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/dre/search?q=protecao%20de%20dados"`,
    responseLabel: '200 OK — /v1/dre/search (sem diplomas JSON)',
    response: `{
  "query": "protecao de dados",
  "series": "1",
  "year": null,
  "page": 1,
  "search_url": "https://dre.pt/pesquisa/?texto=protecao+de+dados&serie=1&pagina=1",
  "results_html_available": false,
  "note": "Full JSON results require DRE session/API. This endpoint returns HTML that needs parsing.",
  "raw_content_length": 2346
}`,
    limitations: [
      'A pesquisa não devolve legislação: só metadados e um URL para dre.pt. results_html_available foi false.',
      '/legislation e /latest respondem 200 com uma mensagem a dizer que falta a API screenservice — não listam diplomas.',
      '/series e /types são listas estáticas no código, úteis como referência mas não extraídas da DRE em tempo real.',
    ],
  },
  {
    id: 'nasafirms',
    title: 'Incêndios satélite (NASA FIRMS)',
    prefix: '/v1/nasafirms',
    version: '1.0.0',
    description:
      'Hotspots de fogo detectados por satélite sobre Portugal (caixa west=-9.5, south=36.9, east=-6.2, north=42.2), sensores VIIRS S-NPP (375 m) e MODIS (1 km).',
    source: {
      entity: 'NASA FIRMS (EOSDIS)',
      url: 'https://firms.modaps.eosdis.nasa.gov',
    },
    endpoints: [
      ep('/v1/nasafirms/hotspots', 'Hotspots dos últimos N dias', [
        p('days', 'integer', { example: '7', desc: '1 a 7, predefinição 7.' }),
        p('source', 'string', { example: 'VIIRS_SNPP', desc: 'VIIRS_SNPP ou MODIS.' }),
        p('daynight', 'string', { example: 'D', desc: 'D ou N.' }),
        p('limit', 'integer', { example: '2', desc: 'Predefinição 100, máximo 1000.' }),
        p('page', 'integer', { example: '1' }),
      ]),
      ep('/v1/nasafirms/hotspots/count', 'Contagem', [
        p('days', 'integer', { example: '7' }),
        p('source', 'string', { example: 'MODIS' }),
      ]),
      ep('/v1/nasafirms/sources', 'Fontes e contagens na base'),
      ep('/v1/nasafirms/meta', 'Metadados'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/nasafirms/hotspots?limit=2"`,
    responseLabel: '200 OK — /v1/nasafirms/hotspots?limit=2 (1 de 107)',
    response: `{
  "meta": {
    "service": "connector-nasafirms",
    "days": 7,
    "source": "all",
    "page": 1,
    "limit": 2,
    "total": 107,
    "pages": 54
  },
  "data": [
    {
      "latitude": 39.07833,
      "longitude": -9.35303,
      "brightness": 306.95,
      "acq_date": "2026-10-27",
      "acq_time": "1605",
      "satellite": "Aqua",
      "instrument": "MODIS",
      "confidence": 63,
      "frp": 6.15,
      "daynight": "D",
      "source": "MODIS",
      "location": { "lat": 39.07833, "lng": -9.35303 }
    }
  ]
}`,
    limitations: [
      'Não existe /v1/nasafirms/stats (o parâmetro correcto da fonte é source, não satellite).',
      'A caixa geográfica corta o mar e parte de Espanha junto à fronteira; não cobre os Açores.',
      'Hotspots são detecção térmica, não confirmação de incêndio.',
    ],
  },
  {
    id: 'carris',
    title: 'Carris Metropolitana (tempo real)',
    prefix: '/v1/carris',
    version: '1.0.0',
    description:
      'Veículos em tempo real (GTFS-RT), alertas, linhas, paragens e chegadas da Carris Metropolitana / TML.',
    source: {
      entity: 'Carris Metropolitana / TML',
      url: 'https://api.carrismetropolitana.pt',
    },
    endpoints: [
      ep('/v1/carris/vehicles', 'Veículos em circulação', [
        p('line_id', 'string', { example: '4901' }),
        p('route_id', 'string', { example: '[A2L1N]4901_0' }),
        p('bbox', 'string', { example: '-9.5,38.4,-8.6,39.0', desc: 'minLon,minLat,maxLon,maxLat.' }),
        p('limit', 'integer', { example: '1', desc: 'Sem filtro, o connector limita a 3000 veículos.' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/carris/vehicles/:id', 'Um veículo', [
        p('id', 'string', { required: true, in: 'path', example: '[A2L1N]13987' }),
      ]),
      ep('/v1/carris/alerts', 'Alertas de serviço', [
        p('active', 'boolean', { example: 'true', desc: 'Predefinição true.' }),
        p('line_id', 'string', { example: '2539' }),
        p('stop_id', 'string', { example: '130634' }),
        p('limit', 'integer', { example: '1' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/carris/stops', 'Paragens', [
        p('q', 'string', { example: 'Oriente' }),
        p('municipality_id', 'string', { example: '1106', desc: 'Código INE do município.' }),
        p('near', 'string', { example: '38.77,-9.10', desc: 'lat,lon.' }),
        p('radius', 'number', { example: '500', desc: 'Metros, máximo 5000.' }),
        p('limit', 'integer', { example: '1' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/carris/stops/:id', 'Paragem e linhas', [
        p('id', 'string', { required: true, in: 'path', example: '130634' }),
      ]),
      ep('/v1/carris/stops/:id/arrivals', 'Chegadas (cache 20 s, timeout 8 s)', [
        p('id', 'string', { required: true, in: 'path', example: '130634' }),
        p('limit', 'integer', { example: '2', desc: 'Predefinição 20, máximo 100.' }),
      ]),
      ep('/v1/carris/lines', 'Linhas', [
        p('q', 'string', { example: '1001' }),
        p('municipality_id', 'string', { example: '1115' }),
        p('limit', 'integer', { example: '1' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/carris/lines/:id', 'Linha e veículos actuais', [
        p('id', 'string', { required: true, in: 'path', example: '1001' }),
      ]),
      ep('/v1/carris/meta', 'Metadados e contagens'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/carris/vehicles?limit=1"`,
    responseLabel: '200 OK — /v1/carris/vehicles?limit=1',
    response: `{
  "count": 1,
  "updated_at": "2026-10-28T14:39:30.829Z",
  "stale": false,
  "data": [
    {
      "id": "[A2L1N]13987",
      "line_id": "4901",
      "route_id": "[A2L1N]4901_0",
      "pattern_id": "[ZLLEW][A2L1N]4901_0_2",
      "trip_id": "[ZLLEW][A2L1N]4901_0_2|2800|1415",
      "stop_id": "130634",
      "lat": 38.575928,
      "lon": -8.745512,
      "bearing": 47,
      "current_status": "IN_TRANSIT_TO",
      "occupancy_status": "NO_DATA_AVAILABLE",
      "timestamp": "2026-10-28T14:39:15.000Z"
    }
  ]
}`,
    limitations: [
      'A API a montante (alertas e chegadas) é instável: o connector pode devolver stale: true em vez de falhar.',
      'GET /v1/carris/stops/130634/arrivals demorou ~3,9 s e veio com realtime_available: false (só horários previstos, estimated/vehicle_id a null).',
      'municipality_name e locality nas paragens vieram null na captura.',
    ],
  },
  {
    id: 'gtfs',
    title: 'Horários de transportes (GTFS)',
    prefix: '/v1/gtfs',
    version: '1.0.0',
    description:
      'Horários planeados unificados de Carris Metropolitana, Metro de Lisboa, CP, Fertagus, Metro do Porto e STCP. Ingestão diária às 03:30 Europe/Lisbon; janela de partidas de 2 dias. Sem shapes nem tarifas na v1.',
    source: {
      entity: 'Operadores (feeds GTFS oficiais / dados.gov.pt / CKAN Porto)',
      url: 'https://github.com/apiaberta/connector-gtfs',
    },
    endpoints: [
      ep('/v1/gtfs/feeds', 'Feeds e validade (campo expired)'),
      ep('/v1/gtfs/feeds/:feed_id', 'Um feed e os últimos 5 diffs', [
        p('feed_id', 'string', { required: true, in: 'path', example: 'metro-porto', desc: 'carris-metropolitana, metro-lisboa, cp, fertagus, metro-porto, stcp.' }),
      ]),
      ep('/v1/gtfs/changes', 'Alterações detectadas', [
        p('feed_id', 'string', { example: 'cp' }),
        p('since', 'string', { example: '2026-10-01' }),
        p('limit', 'integer', { example: '1' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/gtfs/routes', 'Rotas', [
        p('feed_id', 'string', { example: 'metro-lisboa' }),
        p('q', 'string', { example: 'Verde' }),
        p('route_type', 'integer', { example: '1', desc: 'Tipo GTFS (1 = metro, 3 = autocarro, …).' }),
        p('limit', 'integer', { example: '1' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/gtfs/routes/:feed_id/:route_id', 'Rota, paragens e trips_today', [
        p('feed_id', 'string', { required: true, in: 'path', example: 'metro-lisboa' }),
        p('route_id', 'string', { required: true, in: 'path', example: 'C' }),
      ]),
      ep('/v1/gtfs/stops', 'Paragens (texto ou geo)', [
        p('feed_id', 'string', { example: 'metro-lisboa' }),
        p('q', 'string', { example: 'Areeiro' }),
        p('near', 'string', { example: '38.7078,-9.1366', desc: 'lat,lon. Sem feed_id pesquisa todos os operadores.' }),
        p('radius', 'number', { example: '800', desc: 'Metros, predefinição 300, máximo 3000.' }),
        p('limit', 'integer', { example: '2' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/gtfs/stops/:feed_id/:stop_id', 'Paragem e rotas', [
        p('feed_id', 'string', { required: true, in: 'path', example: 'metro-lisboa' }),
        p('stop_id', 'string', { required: true, in: 'path', example: 'AE' }),
      ]),
      ep('/v1/gtfs/stops/:feed_id/:stop_id/departures', 'Partidas na janela (hoje/amanhã)', [
        p('feed_id', 'string', { required: true, in: 'path', example: 'metro-lisboa' }),
        p('stop_id', 'string', { required: true, in: 'path', example: 'AE' }),
        p('date', 'string', { example: '2026-10-28', desc: 'YYYY-MM-DD dentro da janela.' }),
        p('from', 'string', { example: '14:40', desc: 'Hora HH:MM; hoje, predefinição = agora em Lisboa.' }),
        p('limit', 'integer', { example: '2', desc: 'Predefinição 20, máximo 200.' }),
        p('route_id', 'string', { example: 'C' }),
      ]),
      ep('/v1/gtfs/departures/near', 'Próximas partidas à volta de um ponto', [
        p('lat', 'number', { required: true, example: '38.7078' }),
        p('lon', 'number', { required: true, example: '-9.1366' }),
        p('radius', 'number', { example: '800', desc: 'Metros, predefinição 300, máximo 1000.' }),
        p('limit', 'integer', { example: '2', desc: 'Predefinição 30, máximo 30.' }),
      ]),
      ep('/v1/gtfs/meta', 'Janela, feeds e endpoints'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/gtfs/stops/metro-lisboa/AE/departures?limit=2"`,
    responseLabel: '200 OK — partidas em Areeiro (Metro de Lisboa)',
    response: `{
  "feed_id": "metro-lisboa",
  "stop_id": "AE",
  "date": "2026-10-28",
  "feed_expired": false,
  "data": [
    {
      "time": "14:40",
      "ts": "2026-10-28T14:40:46.000Z",
      "route_id": "C",
      "route_short_name": "Vd",
      "headsign": "Telheiras",
      "trip_id": "I2_21092026_C_C39_CS_I2-CS-tTE_19_27.C21"
    }
  ]
}`,
    limitations: [
      'Metro do Porto: valid_to 2026-10-25, expired: true, trips: 0 — horários indisponíveis.',
      'STCP: valid_to 2026-09-23, expired: true, trips: 0 — horários indisponíveis.',
      'near com raio predefinido (300 m) em 38.7223,-9.1393 devolveu 0 paragens; com 800 m junto ao Terreiro do Paço já houve resultados.',
      'Não há shapes nem tarifas. A janela de partidas é só 2 dias.',
    ],
  },
  {
    id: 'parlamento',
    title: 'Parlamento (Assembleia da República)',
    prefix: '/v1/parlamento',
    version: '1.0.0',
    description:
      'Iniciativas, votações com sentido de voto por grupo, deputados, grupos parlamentares e petições. Legislatura corrente na captura: XVII (ingerida diariamente às 05:00).',
    source: {
      entity: 'Assembleia da República — Dados Abertos',
      url: 'https://www.parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx',
    },
    endpoints: [
      ep('/v1/parlamento/legislaturas', 'Legislaturas conhecidas e estado de sync'),
      ep('/v1/parlamento/iniciativas', 'Iniciativas (sem eventos na lista)', [
        p('leg', 'string', { example: 'XVII', desc: 'Numeração romana ou Constituinte.' }),
        p('tipo', 'string', { example: 'R' }),
        p('gp', 'string', { example: 'PS' }),
        p('deputado', 'integer', { example: '9324', desc: 'id_cadastro.' }),
        p('estado', 'string', { example: 'Entrada' }),
        p('q', 'string', { example: 'bombeiros', desc: 'Pesquisa de texto.' }),
        p('desde', 'string', { example: '2026-01-01' }),
        p('ate', 'string', { example: '2026-10-28' }),
        p('sort', 'string', { example: '-data_entrada', desc: '-data_entrada ou data_entrada.' }),
        p('limit', 'integer', { example: '1', desc: 'Máximo 200.' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/parlamento/iniciativas/:ini_id', 'Iniciativa completa com eventos e votações', [
        p('ini_id', 'string', { required: true, in: 'path', example: '377381' }),
      ]),
      ep('/v1/parlamento/votacoes', 'Votações e sentido de voto', [
        p('leg', 'string', { example: 'XVII' }),
        p('ini_id', 'string', { example: '377314' }),
        p('resultado', 'string', { example: 'Rejeitado' }),
        p('gp', 'string', { example: 'PSD' }),
        p('sentido', 'string', { example: 'contra', desc: 'a_favor, contra ou abstencao (exige gp).' }),
        p('desde', 'string', { example: '2026-10-01' }),
        p('ate', 'string', { example: '2026-10-28' }),
        p('limit', 'integer', { example: '1', desc: 'Máximo 200.' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/parlamento/votacoes/:vot_id', 'Uma votação (inclui detalhe_raw)', [
        p('vot_id', 'string', { required: true, in: 'path', example: '193219' }),
      ]),
      ep('/v1/parlamento/deputados', 'Deputados (predefinição: legislatura corrente)', [
        p('leg', 'string', { example: 'XVII' }),
        p('gp', 'string', { example: 'PCP' }),
        p('circulo', 'string', { example: 'Lisboa' }),
        p('q', 'string', { example: 'Trindade' }),
        p('em_funcoes', 'boolean', { example: 'true' }),
        p('limit', 'integer', { example: '1', desc: 'Máximo 1000.' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/parlamento/deputados/:dep_id', 'Deputado, biografia e n_iniciativas', [
        p('dep_id', 'string', { required: true, in: 'path', example: '16477' }),
        p('leg', 'string', { example: 'XVII' }),
      ]),
      ep('/v1/parlamento/grupos', 'Grupos e deputados em funções', [
        p('leg', 'string', { example: 'XVII' }),
      ]),
      ep('/v1/parlamento/peticoes', 'Petições', [
        p('leg', 'string', { example: 'XVII' }),
        p('situacao', 'string', { example: 'Em apreciação' }),
        p('q', 'string', { example: 'violência' }),
        p('min_assinaturas', 'integer', { example: '1000' }),
        p('desde', 'string', { example: '2026-01-01' }),
        p('sort', 'string', { example: '-assinaturas' }),
        p('limit', 'integer', { example: '1' }),
        p('offset', 'integer', { example: '0' }),
      ]),
      ep('/v1/parlamento/peticoes/:pet_id', 'Uma petição', [
        p('pet_id', 'string', { required: true, in: 'path', example: '44368' }),
      ]),
      ep('/v1/parlamento/meta', 'Contagens e origens'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/parlamento/votacoes?limit=1"`,
    responseLabel: '200 OK — /v1/parlamento/votacoes?limit=1',
    response: `{
  "count": 1,
  "total": 2285,
  "data": [
    {
      "vot_id": "193219",
      "data": "2026-10-21T00:00:00.000Z",
      "resultado": "Rejeitado",
      "unanime": false,
      "fase": "Votação na generalidade",
      "ini_id": "377314",
      "ini_titulo": "Recomenda ao Governo que seja estabelecido um modelo nacional de financiamento dos corpos de bombeiros municipais e detidos por associações humanitárias de bombeiros",
      "a_favor": ["IL", "L", "PCP", "BE", "PAN", "JPP"],
      "contra": ["PSD", "CDS-PP"],
      "abstencao": ["CH", "PS"]
    }
  ]
}`,
    limitations: [
      '/deputados sem em_funcoes=true inclui suplentes e histórico (total 1446 na captura, muito acima dos 230 lugares).',
      'A lista de iniciativas omite eventos; só /iniciativas/:id os inclui.',
    ],
  },
  {
    id: 'sns',
    title: 'SNS Transparência',
    prefix: '/v1/sns',
    version: '1.0.0',
    description:
      'Datasets mensais do Portal da Transparência do SNS: urgências, triagem de Manchester, cirurgias (TMRG), consultas hospitalares e CSP, recursos humanos. Tempos de espera em tempo real (tempos.min-saude.pt) estão fora de âmbito.',
    source: {
      entity: 'Portal da Transparência SNS (DE-SNS)',
      url: 'https://transparencia.sns.gov.pt',
    },
    endpoints: [
      ep('/v1/sns/datasets', 'Datasets curados e estado de sync'),
      ep('/v1/sns/:dataset', 'Registos mensais por instituição. dataset = urgencias | urgencias_triagem | cirurgia_tmrg | cirurgia_tmrg_onco | consultas_hospitalares | consultas_tmrg | consultas_csp | rh', [
        p('dataset', 'string', { required: true, in: 'path', example: 'urgencias' }),
        p('entidade', 'string', { example: 'unidade-local-de-saude-da-cova-da-beira-epe', desc: 'Slug da entidade.' }),
        p('regiao', 'string', { example: 'Região de Saúde do Centro' }),
        p('desde', 'string', { example: '2026-01', desc: 'YYYY-MM.' }),
        p('ate', 'string', { example: '2026-07', desc: 'YYYY-MM.' }),
        p('limit', 'integer', { example: '1', desc: 'Predefinição 100, máximo 1000.' }),
        p('offset', 'integer', { example: '0' }),
        p('sort', 'string', { example: '-period', desc: 'period ou -period.' }),
      ]),
      ep('/v1/sns/:dataset/latest', 'Último período por entidade', [
        p('dataset', 'string', { required: true, in: 'path', example: 'urgencias' }),
        p('regiao', 'string', { example: 'Região de Saúde LVT' }),
      ]),
      ep('/v1/sns/:dataset/national', 'Totais nacionais mensais (percentagens recalculadas, nunca médias)', [
        p('dataset', 'string', { required: true, in: 'path', example: 'urgencias' }),
        p('desde', 'string', { example: '2026-01' }),
        p('ate', 'string', { example: '2026-07' }),
      ]),
      ep('/v1/sns/entidades', 'Hospitais, ULS e ACES', [
        p('q', 'string', { example: 'santa maria' }),
        p('regiao', 'string', { example: 'Região de Saúde Norte' }),
        p('near', 'string', { example: '38.72,-9.14', desc: 'lat,lon.' }),
        p('radius', 'number', { example: '50', desc: 'km, predefinição 50, máximo 500.' }),
      ]),
      ep('/v1/sns/entidades/:slug', 'Entidade e último mês de cada dataset', [
        p('slug', 'string', { required: true, in: 'path', example: 'unidade-local-de-saude-da-cova-da-beira-epe' }),
      ]),
      ep('/v1/sns/meta', 'Metadados'),
    ],
    curl: `curl "https://api.apiaberta.pt/v1/sns/urgencias/national"`,
    responseLabel: '200 OK — /v1/sns/urgencias/national (163 meses; 1 mostrado)',
    response: `{
  "count": 163,
  "data": [
    {
      "period": "2013-01",
      "geral": 373010,
      "pediatrica": 126433,
      "obstetricia": 31611,
      "psiquiatrica": 566,
      "total": 531620
    }
  ]
}`,
    limitations: [
      'Os dados nacionais de urgências vão de 2013-01 a 2026-07 — não há meses mais recentes do que julho de 2026.',
      '/urgencias/latest declara period 2026-07 mas inclui entidades cujo último mês é 2023-12 (instituições encerradas ou deixadas de reportar).',
      'Tempos de espera em urgência em tempo real não fazem parte deste connector.',
      'A metadado license veio null.',
    ],
  },
]
