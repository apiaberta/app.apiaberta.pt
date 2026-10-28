import { useEffect, useState } from 'react'
import { BookOpen, ExternalLink, Shield, Zap, AlertTriangle, Database } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'
import { APIS, CAPTURED_AT, NAV } from '../docs/catalog'

const CURL_OPTIONAL_KEY = `curl "https://api.apiaberta.pt/v1/fuel/prices"
curl -H "X-API-Key: ak_a_sua_chave" "https://api.apiaberta.pt/v1/fuel/prices"`

const JS_FETCH = `const res = await fetch('https://api.apiaberta.pt/v1/fuel/prices')
const data = await res.json()
console.log(data)`

const RATE_LIMIT_429 = `{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Upgrade your plan at apiaberta.pt",
  "statusCode": 429
}`

const RATE_LIMIT_HEADERS = `HTTP/1.1 200 OK
x-ratelimit-limit: 30
x-ratelimit-remaining: 24
x-ratelimit-reset: 11`

function MethodBadge() {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}
    >
      GET
    </span>
  )
}

function RequiredBadge({ required }) {
  return required ? (
    <span className="text-xs font-medium" style={{ color: '#B45309' }}>obrigatório</span>
  ) : (
    <span className="text-xs text-slate-400">opcional</span>
  )
}

function ParamTable({ params }) {
  if (!params?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 mt-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[40rem]">
        <caption className="sr-only">Parâmetros do endpoint</caption>
        <thead>
          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Parâmetro</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Onde</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Tipo</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Obrigatório</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Exemplo</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Descrição</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr key={`${param.in}-${param.name}`} className="border-b border-slate-100 last:border-0 align-top">
              <td className="px-4 py-2">
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{param.name}</code>
              </td>
              <td className="px-4 py-2 text-slate-500 text-xs">{param.in}</td>
              <td className="px-4 py-2 text-slate-600 text-xs">{param.type}</td>
              <td className="px-4 py-2"><RequiredBadge required={param.required} /></td>
              <td className="px-4 py-2">
                {param.example ? (
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs break-all">{param.example}</code>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-slate-600 text-xs leading-relaxed">{param.desc || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EndpointBlock({ endpoint }) {
  return (
    <div className="border-b border-slate-100 last:border-0 px-4 py-4">
      <div className="flex items-start gap-3 flex-wrap">
        <MethodBadge />
        <code className="text-xs sm:text-sm font-mono text-slate-800 break-all">{endpoint.path}</code>
      </div>
      <p className="text-sm text-slate-600 mt-2 mb-0 leading-relaxed">{endpoint.description}</p>
      <ParamTable params={endpoint.params} />
    </div>
  )
}

function Limitations({ items }) {
  if (!items?.length) return null
  return (
    <div
      className="rounded-xl p-4 mt-6"
      style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} style={{ color: '#B45309' }} aria-hidden="true" />
        <p className="text-sm font-semibold m-0" style={{ color: '#92400E' }}>Limitações conhecidas</p>
      </div>
      <ul className="m-0 pl-5 text-sm leading-relaxed" style={{ color: '#78350F' }}>
        {items.map((item) => (
          <li key={item} className="mb-1 last:mb-0">{item}</li>
        ))}
      </ul>
    </div>
  )
}

function RateNote() {
  return (
    <p className="text-xs text-slate-500 mt-4 mb-0">
      Limites deste prefixo: 30 pedidos/min por IP sem chave; 300/min com cabeçalho{' '}
      <code className="bg-slate-100 px-1 py-0.5 rounded">X-API-Key</code>.
    </p>
  )
}

function ApiBody({ api }) {
  return (
    <>
      <p className="text-slate-600 text-sm leading-relaxed mb-4">{api.description}</p>
      <p className="text-sm text-slate-600 mb-5">
        <span className="font-medium text-slate-700">Fonte dos dados: </span>
        <a
          href={api.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium no-underline hover:underline"
          style={{ color: '#15803D' }}
        >
          {api.source.entity}
        </a>
        <span className="text-slate-400"> · </span>
        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{api.prefix}</code>
        {api.version ? (
          <>
            <span className="text-slate-400"> · </span>
            <span className="text-slate-500">v{api.version}</span>
          </>
        ) : null}
      </p>

      <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6">
        {api.endpoints.map((endpoint) => (
          <EndpointBlock key={endpoint.path} endpoint={endpoint} />
        ))}
      </div>

      <p className="text-sm font-medium text-slate-700 mb-2">Exemplo de pedido</p>
      <CodeBlock code={api.curl} language="bash" label="cURL" />
      <p className="text-sm font-medium text-slate-700 mb-2 mt-5">
        Resposta real ({CAPTURED_AT})
      </p>
      <CodeBlock code={api.response} language="json" label={api.responseLabel || '200 OK'} />
      <RateNote />
      <Limitations items={api.limitations} />
    </>
  )
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon ? <Icon size={18} style={{ color: '#16A34A' }} aria-hidden="true" /> : null}
      <h2 className="text-xl font-bold m-0" style={{ color: '#0F172A' }}>{children}</h2>
    </div>
  )
}

export default function Docs() {
  const [activeId, setActiveId] = useState('comecar')

  useEffect(() => {
    const ids = NAV.map((item) => item.href.slice(1))
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -55% 0px', threshold: [0, 0.15, 0.4] }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-12">

        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} style={{ color: '#16A34A' }} aria-hidden="true" />
            <span className="text-sm font-medium text-green-700">Documentação</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#0F172A' }}>
            Referência da API Aberta
          </h1>
          <p className="text-slate-500 mt-2 text-lg max-w-3xl">
            As 18 APIs do gateway{' '}
            <a
              href="https://api.apiaberta.pt"
              className="font-medium no-underline hover:underline"
              style={{ color: '#15803D' }}
            >
              api.apiaberta.pt
            </a>
            , com endpoints, parâmetros e respostas obtidas na API pública em {CAPTURED_AT}.
          </p>
        </div>

        <div className="lg:hidden mb-8">
          <nav
            aria-label="Índice desta página"
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#16A34A' }}>
              Nesta página
            </p>
            <ol className="list-none p-0 m-0 columns-1 sm:columns-2 gap-x-6">
              {NAV.map((item) => (
                <li key={item.href} className="break-inside-avoid mb-1">
                  <a
                    href={item.href}
                    className="text-sm font-medium no-underline hover:underline"
                    style={{ color: '#15803D' }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="flex gap-10 items-start">
          <nav
            aria-label="Índice da documentação"
            className="hidden lg:block w-56 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2"
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400">Índice</p>
            <ol className="list-none p-0 m-0 flex flex-col gap-0.5">
              {NAV.map((item) => {
                const id = item.href.slice(1)
                const current = activeId === id
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={current ? 'location' : undefined}
                      className={`block text-sm no-underline rounded-lg px-3 py-1.5 ${current ? '' : 'hover:bg-slate-100'}`}
                      style={{
                        color: current ? '#15803D' : '#475569',
                        fontWeight: current ? 600 : 500,
                        backgroundColor: current ? '#F0FDF4' : 'transparent',
                        boxShadow: current ? 'inset 2px 0 0 0 #16A34A' : 'none',
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                )
              })}
            </ol>
          </nav>

          <div className="flex-1 min-w-0 flex flex-col gap-14">

            <section id="comecar" className="scroll-mt-24">
              <SectionHeading icon={Zap}>Começar</SectionHeading>
              <div className="flex flex-col gap-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  A API Aberta agrega dados públicos portugueses num único host REST.
                  A URL base é{' '}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">https://api.apiaberta.pt</code>.
                  A lista viva dos 18 serviços está em{' '}
                  <a
                    href="https://api.apiaberta.pt/v1/status"
                    className="font-medium no-underline hover:underline"
                    style={{ color: '#15803D' }}
                  >
                    GET /v1/status
                  </a>
                  .
                </p>
                <ol className="list-decimal list-inside flex flex-col gap-2 pl-1">
                  <li>
                    Os endpoints de dados são públicos: pode chamá-los sem chave.
                  </li>
                  <li>
                    <a href="/" className="font-medium no-underline hover:underline" style={{ color: '#16A34A' }}>
                      Crie uma conta
                    </a>{' '}
                    se quiser uma chave <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">ak_…</code> e o limite de 300 pedidos/min.
                  </li>
                  <li>
                    Envie a chave no cabeçalho <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">X-API-Key</code>.
                  </li>
                </ol>
                <CodeBlock code={JS_FETCH} language="javascript" label="JavaScript" />
              </div>
            </section>

            <section id="autenticacao" className="scroll-mt-24">
              <SectionHeading icon={Shield}>Autenticação</SectionHeading>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                A chave é opcional nos 18 prefixos de dados. Sem{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> o pedido
                conta para o limite por IP. Com chave, conta para o limite da chave.
                Rotas de conta, administração e webhooks continuam a exigir JWT ou chave.
              </p>
              <CodeBlock code={CURL_OPTIONAL_KEY} language="bash" label="cURL" />
            </section>

            <section id="limites" className="scroll-mt-24">
              <SectionHeading>Limites de pedidos</SectionHeading>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                O gateway aplica um limite global de 1 minuto, por IP se não houver chave e por chave se o cabeçalho existir.
                Não há outros escalões publicados neste momento.
              </p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Identidade</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Pedidos / min</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-5 py-3 text-slate-700">Sem chave (por IP)</td>
                      <td className="px-5 py-3 text-slate-600">30</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-slate-700">Com X-API-Key</td>
                      <td className="px-5 py-3 text-slate-600">300</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Cada resposta inclui cabeçalhos de quota (valores observados sem chave):
              </p>
              <CodeBlock code={RATE_LIMIT_HEADERS} language="http" label="Cabeçalhos" />
              <p className="text-sm text-slate-500 mb-3 mt-5">
                Acima do limite o gateway responde 429:
              </p>
              <CodeBlock code={RATE_LIMIT_429} language="json" label="429 Too Many Requests" />
            </section>

            <section id="erros" className="scroll-mt-24">
              <SectionHeading>Erros</SectionHeading>
              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Código</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Quando</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-5 py-3 font-mono text-xs">400</td>
                      <td className="px-5 py-3 text-slate-600">Parâmetro inválido ou em falta (ex.: pesquisa DRE sem q).</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-5 py-3 font-mono text-xs">404</td>
                      <td className="px-5 py-3 text-slate-600">Recurso inexistente (sismo, paragem, iniciativa, rota).</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-5 py-3 font-mono text-xs">429</td>
                      <td className="px-5 py-3 text-slate-600">Limite de 30/min (IP) ou 300/min (chave) excedido.</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-xs">502</td>
                      <td className="px-5 py-3 text-slate-600">Serviço a montante indisponível (observado em /v1/anpc/hotspots).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {APIS.map((api) => (
              <section key={api.id} id={api.id} className="scroll-mt-24">
                <SectionHeading icon={Database}>{api.title}</SectionHeading>
                <ApiBody api={api} />
                {api.extraSections?.map((extra) => (
                  <div key={extra.id} id={extra.id} className="scroll-mt-24 mt-10">
                    <h3 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>{extra.title}</h3>
                    <ApiBody api={extra} />
                  </div>
                ))}
              </section>
            ))}

            <div
              className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B' }}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Código-fonte dos connectors</h3>
                <p className="text-sm m-0" style={{ color: '#94A3B8' }}>
                  Rotas e parâmetros desta página vêm dos repositórios em github.com/apiaberta. Respostas capturadas em {CAPTURED_AT}.
                </p>
              </div>
              <a
                href="https://github.com/apiaberta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold no-underline flex-shrink-0 transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#16A34A', color: 'white' }}
              >
                Ver no GitHub
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
