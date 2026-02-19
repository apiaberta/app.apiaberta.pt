import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ApiKeyCard from '../components/ApiKeyCard'
import CodeBlock from '../components/CodeBlock'
import EndpointList from '../components/EndpointList'

const CURL_EXAMPLE = `curl -H "X-API-Key: YOUR_KEY" \\
  https://api.apiaberta.pt/v1/fuel/prices`

export default function Dashboard() {
  const { apiKey, name } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!apiKey) navigate('/', { replace: true })
  }, [apiKey, navigate])

  if (!apiKey) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            {name ? `Welcome back, ${name.split(' ')[0]}. ` : ''}
            Manage your API access below.
          </p>
        </div>

        {/* Main grid */}
        <div className="flex flex-col gap-6">

          {/* API Key card */}
          <ApiKeyCard />

          {/* Quick start */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Quick start</h2>
            <p className="text-sm text-slate-500 mb-4">
              Include your API key in the <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">X-API-Key</code> header with every request.
            </p>
            <CodeBlock
              code={CURL_EXAMPLE}
              language="bash"
              label="cURL"
            />
          </div>

          {/* Endpoints */}
          <EndpointList />

          {/* Links row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://github.com/apiaberta/apiaberta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 no-underline hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <BookOpen size={18} style={{ color: '#16A34A' }} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-green-700 transition-colors">
                  Full Documentation
                </div>
                <div className="text-xs text-slate-500 mt-0.5">GitHub · OpenAPI spec + examples</div>
              </div>
              <ExternalLink size={14} className="ml-auto text-slate-400 group-hover:text-green-600 transition-colors" />
            </a>

            <a
              href="/docs"
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 no-underline hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#EFF6FF' }}
              >
                <ExternalLink size={18} style={{ color: '#2563EB' }} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                  Quick Reference
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Auth · Rate limits · Examples</div>
              </div>
              <ExternalLink size={14} className="ml-auto text-slate-400 group-hover:text-blue-600 transition-colors" />
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
