import { ExternalLink, Shield, Zap, BookOpen } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'

const CURL_AUTH = `curl -H "X-API-Key: ak_your_key_here" \\
  https://api.apiaberta.pt/v1/fuel/prices`

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
