import { ArrowRight } from 'lucide-react'

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/v1/fuel/prices',
    description: 'Fuel prices across all Portuguese stations',
    status: 'live',
  },
  {
    method: 'GET',
    path: '/v1/contracts',
    description: 'Public procurement contracts (BASE)',
    status: 'coming_soon',
  },
  {
    method: 'GET',
    path: '/v1/statistics',
    description: 'National statistics (INE)',
    status: 'coming_soon',
  },
]

const StatusBadge = ({ status }) => {
  if (status === 'live') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
        Live
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
      Coming soon
    </span>
  )
}

const MethodBadge = ({ method }) => (
  <span
    className="text-xs font-bold px-2 py-0.5 rounded font-mono"
    style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
  >
    {method}
  </span>
)

export default function EndpointList() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Available Endpoints</h3>
        <p className="text-sm text-slate-500 mt-0.5">All requests require an X-API-Key header</p>
      </div>
      <div className="divide-y divide-slate-100">
        {ENDPOINTS.map(ep => (
          <div
            key={ep.path}
            className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <MethodBadge method={ep.method} />
              <code
                className="text-sm font-mono text-slate-700 truncate"
              >
                {ep.path}
              </code>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-slate-500 hidden sm:block">{ep.description}</span>
              <StatusBadge status={ep.status} />
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
        <a
          href="https://github.com/apiaberta/apiaberta"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium no-underline hover:underline"
          style={{ color: '#16A34A' }}
        >
          View full API reference
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  )
}
