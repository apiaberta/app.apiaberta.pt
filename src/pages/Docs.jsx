import { ExternalLink, Shield, Zap, BookOpen } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'

const CURL_AUTH = `curl -H "X-API-Key: ak_your_key_here" \\
  https://api.apiaberta.pt/v1/fuel/prices`

const NIF_VALID = `curl -H "X-API-Key: ak_your_key_here" \
  https://api.apiaberta.pt/v1/nif/validate/509442013`

const NIF_INVALID = `curl -H "X-API-Key: ak_your_key_here" \
  https://api.apiaberta.pt/v1/nif/validate/123456789`

const NIF_VALID_RESP = `{
  "nif": "509442013",
  "valid": true,
  "type": "Pessoa coletiva (empresa)"
}`

const NIF_INVALID_RESP = `{
  "nif": "123456789",
  "valid": false,
  "reason": "checksum_invalid"
}

`

const JS_FETCH = `const response = await fetch('https://api.apiaberta.pt/v1/fuel/prices', {
  headers: {
    'X-API-Key': 'ak_your_key_here',
  },
})

const data = await response.json()
console.log(data)`

const RATE_LIMIT_RESPONSE = `HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1708345678
Retry-After: 12

{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please retry after 12 seconds."
}`

const ERROR_RESPONSE = `{
  "error": "unauthorized",
  "message": "Missing or invalid X-API-Key header"
}`

export default function Docs() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} style={{ color: '#16A34A' }} />
            <span className="text-sm font-medium text-green-700">Documentation</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#0F172A' }}>
            API Reference
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Everything you need to start building with the API Aberta.
          </p>
        </div>

        {/* TOC */}
        <nav
          className="rounded-2xl p-5 mb-10"
          style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#16A34A' }}>
            On this page
          </p>
          <ol className="list-none p-0 m-0 flex flex-col gap-1">
            {[
              ['#getting-started', 'Getting started'],
              ['#authentication', 'Authentication'],
              ['#rate-limits', 'Rate limits'],
              ['#examples', 'Example requests'],
              ['#errors', 'Error codes'],
              ['#nif', 'NIF Validator'],
              ['#prr', 'PRR / PT2030'],
              ['#nasafirms', 'NASA FIRMS'],
              ['#dre', 'DRE Legislation'],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-sm font-medium no-underline hover:underline"
                  style={{ color: '#15803D' }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-12">

          {/* Getting started */}
          <section id="getting-started">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} style={{ color: '#16A34A' }} />
              <h2 className="text-xl font-bold m-0" style={{ color: '#0F172A' }}>Getting started</h2>
            </div>
            <div className="prose-like flex flex-col gap-4 text-slate-600 text-sm leading-relaxed">
              <p>
                The API Aberta provides free, open access to Portuguese public data. To use it:
              </p>
              <ol className="list-decimal list-inside flex flex-col gap-2 pl-1">
                <li>
                  <a href="/" className="font-medium no-underline hover:underline" style={{ color: '#16A34A' }}>
                    Register for a free account
                  </a>{' '}
                  — takes 10 seconds, no credit card needed.
                </li>
                <li>Copy your API key from the dashboard.</li>
                <li>Include it as an <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> header in your requests.</li>
              </ol>
              <p>
                The base URL for all endpoints is:{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">https://api.apiaberta.pt</code>
              </p>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} style={{ color: '#16A34A' }} />
              <h2 className="text-xl font-bold m-0" style={{ color: '#0F172A' }}>Authentication</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              All API requests must include your API key in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> HTTP header.
              API keys start with <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">ak_</code>.
            </p>
            <CodeBlock code={CURL_AUTH} language="bash" label="cURL" />
            <p className="text-sm text-slate-500 mt-3">
              Requests without a valid API key will receive a <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">401 Unauthorized</code> response.
            </p>
            <div className="mt-4">
              <CodeBlock code={ERROR_RESPONSE} language="json" label="401 Response" />
            </div>
          </section>

          {/* Rate limits */}
          <section id="rate-limits">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#0F172A' }}>Rate limits</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Rate limits are applied per API key. When you exceed a limit, you'll receive a{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">429 Too Many Requests</code> response.
            </p>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Plan</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Requests / min</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Requests / day</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-5 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}
                      >
                        Free
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">60</td>
                    <td className="px-5 py-3 text-slate-600">1,000</td>
                    <td className="px-5 py-3 text-slate-600">Free forever</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#FFFBEB', color: '#B45309' }}
                      >
                        Pro
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">600</td>
                    <td className="px-5 py-3 text-slate-600">100,000</td>
                    <td className="px-5 py-3 text-slate-600">Coming soon</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Rate limit headers are returned with every response:
            </p>
            <CodeBlock code={RATE_LIMIT_RESPONSE} language="http" label="429 Too Many Requests" />
          </section>

          {/* Examples */}
          <section id="examples">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#0F172A' }}>Example requests</h2>

            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">cURL</p>
                <CodeBlock code={CURL_AUTH} language="bash" label="cURL" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">JavaScript (fetch)</p>
                <CodeBlock code={JS_FETCH} language="javascript" label="JavaScript" />
              </div>
            </div>
          </section>


          {/* NIF Validator */}
          <section id="nif">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} style={{ color: '#16A34A' }} />
              <h2 className="text-xl font-bold m-0" style={{ color: '#0F172A' }}>NIF Validator</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Valida NIFs portugueses usando o algoritmo MOD 11. Retorna o tipo de entidade (pessoa singular, coletiva, etc.).
            </p>

            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Method</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Endpoint</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>GET</span></td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">/v1/nif/validate/:nif</td>
                    <td className="px-5 py-3 text-slate-600">Valida um NIF português</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm font-medium text-slate-700 mb-2">Valid NIF (empresa)</p>
            <CodeBlock code={NIF_VALID} language="bash" label="cURL" />
            <div className="mt-3">
              <CodeBlock code={NIF_VALID_RESP} language="json" label="200 OK" />
            </div>

            <p className="text-sm font-medium text-slate-700 mb-2 mt-6">Invalid NIF (checksum)</p>
            <CodeBlock code={NIF_INVALID} language="bash" label="cURL" />
            <div className="mt-3">
              <CodeBlock code={NIF_INVALID_RESP} language="json" label="200 OK" />
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700 mb-1">Parâmetros</p>
              <ul className="list-disc list-inside flex flex-col gap-1">
                <li><code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">nif</code> (path) — NIF a validar, 9 dígitos</li>
              </ul>
              <p className="font-semibold text-slate-700 mt-3 mb-1">Tipos de NIF</p>
              <ul className="list-disc list-inside flex flex-col gap-1 text-xs">
                <li><code className="bg-slate-100 px-1 py-0.5 rounded">1</code> — Pessoa singular (residente)</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded">2</code> — Pessoa singular (não residente)</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded">5</code> — Pessoa coletiva (empresa)</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded">3</code> — Entidade pública</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded">6</code> — Entidade singular não residente</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded">7/8/9</code> — Caso especial / Forças armadas</li>
              </ul>
            </div>
          </section>

          {/* PRR / PT2030 */}
          <section id="prr">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} style={{ color: '#16A34A' }} />
              <h2 className="text-xl font-bold m-0" style={{ color: '#0F172A' }}>PRR / PT2030</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Fundos europeus do Plano de Recuperação e Resiliência (PRR) e PT2030. Dados agregados de transparencia.gov.pt e dados.gov.pt.
            </p>

            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Method</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Endpoint</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>GET</span></td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">/v1/prr/projects</td>
                    <td className="px-5 py-3 text-slate-600">Lista de projetos PRR/PT2030</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>GET</span></td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">/v1/prr/projects/:id</td>
                    <td className="px-5 py-3 text-slate-600">Detalhes de um projeto</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CodeBlock code={`curl -H "X-API-Key: ak_your_key_here" \\\n  https://api.apiaberta.pt/v1/prr/projects?limit=3`} language="bash" label="cURL" />
            <div className="mt-3">
              <CodeBlock code={`{\n  "data": [\n    {\n      "id": "C01",\n      "name": "Cuidados de saude primarios",\n      "section": "investment",\n      "component": "C01 - Housing First",\n      "total": 61379442\n    }\n  ],\n  "total": 61,\n  "source": "https://transparencia.gov.pt"\n}`} language="json" label="200 OK" />
            </div>
          </section>

          {/* NASA FIRMS */}
          <section id="nasafirms">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} style={{ color: '#16A34A' }} />
              <h2 className="text-xl font-bold m-0" style={{ color: '#0F172A' }}>NASA FIRMS</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Deteção de incêndios via satélite pelos sensores VIIRS e MODIS. Hotspots ativos com coordenadas, luminosidade e data/hora de aquisição.
            </p>

            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Method</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Endpoint</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>GET</span></td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">/v1/nasafirms/hotspots</td>
                    <td className="px-5 py-3 text-slate-600">Hotspots de fogo detectados</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>GET</span></td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">/v1/nasafirms/stats</td>
                    <td className="px-5 py-3 text-slate-600">Estatísticas agregadas</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CodeBlock code={`curl -H "X-API-Key: ak_your_key_here" \\\n  https://api.apiaberta.pt/v1/nasafirms/hotspots?satellite=VIIRS&limit=2`} language="bash" label="cURL" />
            <div className="mt-3">
              <CodeBlock code={`{\n  "data": [\n    {\n      "latitude": 37.8856,\n      "longitude": -7.8523,\n      "brightness": 310.2,\n      "satellite": "VIIRS",\n      "acq_date": "2026-04-09",\n      "acq_time": "0342",\n      "frp": 5.6,\n      "confidence": "nominal"\n    }\n  ],\n  "meta": { "source": "NASA FIRMS", "count": 12 }\n}`} language="json" label="200 OK" />
            </div>
          </section>

          {/* DRE Legislation */}
          <section id="dre">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} style={{ color: '#16A34A' }} />
              <h2 className="text-xl font-bold m-0" style={{ color: '#0F172A' }}>DRE Legislation</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Legislação publicada no Diário da República. Permite procurar documentos por série, ano e termo de pesquisa.
            </p>

            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Method</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Endpoint</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>GET</span></td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">/v1/dre/legislation</td>
                    <td className="px-5 py-3 text-slate-600">Lista de legislação recente</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>GET</span></td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">/v1/dre/search?q=termo</td>
                    <td className="px-5 py-3 text-slate-600">Pesquisa por termo</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CodeBlock code={`curl -H "X-API-Key: ak_your_key_here" \\\n  "https://api.apiaberta.pt/v1/dre/search?q=prote%C3%A7%C3%A3o+de+dados"`} language="bash" label="cURL" />
          </section>

          {/* Full docs CTA */}
          <div
            className="rounded-2xl p-6 flex items-center gap-4"
            style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B' }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Full API Reference</h3>
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                OpenAPI spec, detailed endpoint docs, and more examples on GitHub.
              </p>
            </div>
            <a
              href="https://github.com/apiaberta/apiaberta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold no-underline flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#16A34A', color: 'white' }}
            >
              View on GitHub
              <ExternalLink size={14} />
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
