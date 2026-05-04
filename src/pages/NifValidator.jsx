import { useState } from 'react'
import { UserCheck, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'

const CURL_NIF = `curl -H "X-API-Key: YOUR_API_KEY" \\
  https://api.apiaberta.pt/v1/nif/validate/509442013`

const RESP_VALID = `{
  "nif": "509442013",
  "valid": true,
  "type": "Pessoa coletiva (empresa)"
}`

const RESP_INVALID = `{
  "nif": "123456789",
  "valid": false,
  "reason": "checksum_invalid"
}`

const NIF_TYPES = [
  { prefix: '1', type: 'Pessoa singular (residente)' },
  { prefix: '2', type: 'Pessoa singular (não residente)' },
  { prefix: '3', type: 'Entidade pública' },
  { prefix: '4', type: 'Pessoa singular (residente, secundário)' },
  { prefix: '5', type: 'Pessoa coletiva (empresa)' },
  { prefix: '6', type: 'Entidade singular não residente' },
  { prefix: '7/8', type: 'Caso especial' },
  { prefix: '9', type: 'Forças armadas' },
]

export default function NifValidator() {
  const [nif, setNif] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function validate() {
    const cleaned = nif.replace(/\s/g, '')
    if (!/^\d{9}$/.test(cleaned)) {
      setError('O NIF deve ter exatamente 9 dígitos.')
      setResult(null)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`https://api.apiaberta.pt/v1/nif/validate/${cleaned}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') validate()
  }

  function getTypeInfo(nifNumber) {
    if (!nifNumber || nifNumber.length < 9) return null
    const prefix = nifNumber[0]
    return NIF_TYPES.find(t => t.prefix === prefix) || null
  }

  const isValid = result?.valid === true
  const isInvalid = result?.valid === false

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">

        {/* Header */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={20} style={{ color: '#16A34A' }} />
            <span className="text-sm font-medium text-green-700">Explorar</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#0F172A' }}>
            Validador de NIF
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            Valida NIFs portugueses usando o algoritmo MOD 11. Indica se o NIF é válido e qual o tipo de entidade.
          </p>
        </div>

        {/* Live demo */}
        <div
          className="rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-6"
          style={{ backgroundColor: 'white' }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: '#0F172A' }}>
            Experimenta
          </h2>

          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              type="text"
              value={nif}
              onChange={e => setNif(e.target.value.replace(/\D/g, '').slice(0, 9))}
              onKeyDown={handleKey}
              placeholder="9 dígitos, ex: 509442013"
              maxLength={9}
              className="flex-1 min-w-0 text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-green-400 text-slate-800 font-mono"
              style={{ backgroundColor: '#FAFAFA' }}
            />
            <button
              onClick={validate}
              disabled={loading || nif.length !== 9}
              className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-opacity"
              style={{ backgroundColor: '#16A34A', color: 'white', opacity: loading || nif.length !== 9 ? 0.7 : 1 }}
            >
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'A validar...' : 'Validar'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Result */}
          {isValid && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} style={{ color: '#16A34A' }} />
                <span className="font-semibold text-green-700">NIF válido</span>
              </div>
              <p className="text-sm text-slate-700 mb-1">
                <span className="font-mono font-medium">{result.nif}</span>
              </p>
              <p className="text-sm text-slate-600">
                {result.type}
              </p>
              {getTypeInfo(result.nif) && (
                <p className="text-xs text-slate-400 mt-1">
                  Primeiro dígito: {getTypeInfo(result.nif).prefix} → {getTypeInfo(result.nif).type}
                </p>
              )}
            </div>
          )}

          {isInvalid && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} style={{ color: '#EF4444' }} />
                <span className="font-semibold text-red-600">NIF inválido</span>
              </div>
              <p className="text-sm text-slate-700">
                <span className="font-mono font-medium">{result.nif}</span>
              </p>
              <p className="text-sm text-red-500 mt-1">
                {result.reason === 'checksum_invalid' && 'O dígito de controlo não é válido.'}
                {result.reason === 'not_nine_digits' && 'O NIF deve ter exatamente 9 dígitos.'}
                {result.reason !== 'checksum_invalid' && result.reason !== 'not_nine_digits' && result.reason}
              </p>
            </div>
          )}

          {/* Quick examples */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { label: 'Empresa válida', nif: '509442013' },
              { label: 'Pessoa singular', nif: '123456789' },
              { label: 'Inválido', nif: '999999999' },
            ].map(ex => (
              <button
                key={ex.nif}
                onClick={() => {
                  setNif(ex.nif)
                  setResult(null)
                  setError(null)
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                style={{ color: '#475569' }}
              >
                {ex.label}: {ex.nif}
              </button>
            ))}
          </div>
        </div>

        {/* NIF types reference */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: '#0F172A' }}>
            Tipos de NIF
          </h2>
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Prefixo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Tipo de Entidade</th>
                </tr>
              </thead>
              <tbody>
                {NIF_TYPES.map((t, i) => (
                  <tr
                    key={t.prefix}
                    className="border-b border-slate-100"
                    style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F8FAFC' }}
                  >
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-700">{t.prefix}</td>
                    <td className="px-4 py-2.5 text-slate-600">{t.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Code snippets */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: '#0F172A' }}>
            Código
          </h2>
          <p className="text-sm text-slate-500 mb-3">
            Valida um NIF português:
          </p>
          <CodeBlock code={CURL_NIF} language="bash" label="cURL" />
          <div className="mt-3">
            <CodeBlock code={RESP_VALID} language="json" label="Resposta — válido" />
          </div>
          <div className="mt-3">
            <CodeBlock code={RESP_INVALID} language="json" label="Resposta — inválido" />
          </div>
        </div>

        {/* Info box */}
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B' }}
        >
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Sobre o NIF</h3>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              O NIF (Número de Identificação Fiscal) é o identificador fiscal português. A validação usa o algoritmo MOD 11 — confirma o dígito de controlo final.
            </p>
          </div>
          <a
            href="https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Pages/faq_nif.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold no-underline flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#16A34A', color: 'white' }}
          >
            Mais info
            <ExternalLink size={13} />
          </a>
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
