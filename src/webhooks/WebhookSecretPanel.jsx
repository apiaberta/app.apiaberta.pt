import { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, Check, Copy } from 'lucide-react'

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value)
    return
  } catch {
    const el = document.createElement('textarea')
    el.value = value
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

export default function WebhookSecretPanel({ secret, reason = 'create', onDismiss }) {
  const titleId = useId()
  const descId = useId()
  const dialogRef = useRef(null)
  const copyRef = useRef(null)
  const onDismissRef = useRef(onDismiss)
  const [copiedSecret, setCopiedSecret] = useState(null)
  const copied = copiedSecret === secret
  const rotated = reason === 'rotate'

  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    const previous = document.activeElement
    copyRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onDismissRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll('button')]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      if (previous && typeof previous.focus === 'function') previous.focus()
    }
  }, [secret])

  async function handleCopy() {
    await copyText(secret)
    setCopiedSecret(secret)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {rotated ? 'Novo segredo de assinatura' : 'Guarda o segredo de assinatura'}
        </h2>

        <div
          id={descId}
          className="flex items-start gap-3 rounded-xl p-4 mt-4"
          style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#B45309' }} aria-hidden="true" />
          <p className="text-sm m-0" style={{ color: '#92400E' }}>
            Este segredo só é mostrado agora. Copia-o e guarda-o — não voltamos a mostrá-lo.
          </p>
        </div>

        <div
          className="rounded-xl p-4 mt-4 overflow-x-auto"
          style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B' }}
        >
          <p className="text-xs font-medium mb-2 m-0" style={{ color: '#94A3B8' }}>
            Segredo
          </p>
          <code className="text-sm break-all select-all" style={{ color: '#4ADE80', letterSpacing: '0.03em' }}>
            {secret}
          </code>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-5">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 min-h-11 py-2.5 rounded-xl text-sm font-medium text-slate-700 cursor-pointer border border-slate-200 bg-white hover:bg-slate-50"
          >
            Já guardei
          </button>
          <button
            ref={copyRef}
            type="button"
            onClick={handleCopy}
            className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer border-0"
            style={{ backgroundColor: copied ? '#166534' : '#16A34A' }}
          >
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
