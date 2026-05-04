import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, ArrowDownRight, Loader2 } from 'lucide-react'

const API = 'https://api.apiaberta.pt/v1/bdp/rates'

const CURL = `curl https://api.apiaberta.pt/v1/bdp/rates`

const JS_FETCH = `const res = await fetch('https://api.apiaberta.pt/v1/bdp/rates')
const data = await res.json()
console.log(data.rates)`

export default function Currency() {
  const [rates, setRates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const [converted, setConverted] = useState(null)

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => { setRates(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  function convert() {
    if (!rates || !amount) return
    const fromRate = rates.data?.find(r => r.code === from)
    const toRate = rates.data?.find(r => r.code === to)
    if (!fromRate || !toRate) return
    const inEur = parseFloat(amount) / fromRate.rate
    setConverted((inEur * toRate.rate).toFixed(4))
  }

  useEffect(() => {
    if (rates) convert()
  }, [rates, amount, from, to])

  const codeSnippets = [
    { lang: 'cURL', code: CURL },
    { lang: 'JavaScript', code: JS_FETCH },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: '#DBEAFE' }}>
              <DollarSign size={18} style={{ color: '#1D4ED8' }} />
            </div>
            <span className="text-sm font-medium text-blue-700">Exchange Rates</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#0F172A' }}>
            Câmbios ao Vivo
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Taxas de câmbio do Banco de Portugal actualizadas diariamente.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Fonte:{' '}
            <a href="https://www.bportugal.pt" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
              Banco de Portugal
            </a>
          </p>
        </div>

        {/* Converter */}
        <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownRight size={16} style={{ color: '#16A34A' }} />
            <h2 className="text-base font-semibold m-0" style={{ color: '#0F172A' }}>Conversor Rápido</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3 mb-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">Montante</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0', backgroundColor: '#FAFAFA' }}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">De</label>
              <select
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0', backgroundColor: '#FAFAFA' }}
              >
                {rates?.data?.map(r => (
                  <option key={r.code} value={r.code}>{r.code} — {r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center py-2 text-slate-400">
              <ArrowDownRight size={16} />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">Para</label>
              <select
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: '#E2E8F0', backgroundColor: '#FAFAFA' }}
              >
                {rates?.data?.map(r => (
                  <option key={r.code} value={r.code}>{r.code} — {r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {converted && (
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p className="text-sm text-slate-500 mb-1">{amount} {from} =</p>
              <p className="text-2xl font-bold" style={{ color: '#16A34A' }}>
                {converted} {to}
              </p>
            </div>
          )}
        </div>

        {/* Live Data */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">A carregar...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-sm text-red-600">Erro: {error}</p>
          </div>
        )}

        {rates && (
          <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="px-5 py-3" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <p className="text-xs font-semibold text-slate-500">{rates.data?.length} moedas disponíveis</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Moeda</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Código</th>
                    <th className="text-right px-5 py-3 font-semibold text-slate-700">Taxa (EUR base)</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.data?.map((r, i) => (
                    <tr key={r.code} style={{ borderBottom: i < rates.data.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td className="px-5 py-3 text-slate-700">{r.name}</td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                          {r.code}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">{r.rate.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Code Snippets */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <TrendingUp size={14} style={{ color: '#16A34A' }} />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</span>
          </div>
          <div className="p-0">
            {codeSnippets.map(({ lang, code }) => (
              <div key={lang} className="border-b last:border-0" style={{ borderColor: '#F1F5F9' }}>
                <div className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-50" style={{ borderBottom: '1px solid #E2E8F0' }}>{lang}</div>
                <pre className="p-4 text-xs overflow-x-auto m-0" style={{ backgroundColor: '#0F172A', color: '#E2E8F0', fontFamily: 'ui-monospace, monospace' }}>
                  <code>{code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
