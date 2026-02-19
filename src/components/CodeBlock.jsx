import { useState } from 'react'
import { Copy, Check, Terminal } from 'lucide-react'

export default function CodeBlock({ code, language = 'bash', label }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #1E293B' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: '#0F172A' }}
      >
        <div className="flex items-center gap-2">
          <Terminal size={13} style={{ color: '#64748B' }} />
          <span className="text-xs font-medium" style={{ color: '#64748B' }}>
            {label || language}
          </span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all border-0 cursor-pointer"
          style={copied
            ? { backgroundColor: '#16A34A20', color: '#4ADE80' }
            : { backgroundColor: '#1E293B', color: '#94A3B8' }
          }
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Code */}
      <div style={{ backgroundColor: '#020617' }} className="px-4 py-4 overflow-x-auto">
        <pre className="text-sm leading-relaxed m-0" style={{ color: '#E2E8F0' }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
