import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.apiaberta.pt'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Token em falta. Por favor, usa o link do email.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As passwords não coincidem')
      return
    }

    if (password.length < 8) {
      setError('A password deve ter pelo menos 8 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.message || 'Erro ao redefinir password')
      }
    } catch {
      setError('Erro de ligação. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900">Password redefinida!</h2>
          <p className="text-gray-600">
            A tua password foi alterada com sucesso.
          </p>
          <p className="text-sm text-gray-500">
            A redirecionar para o login...
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
          >
            Ir para login
          </Link>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Link inválido</h2>
          <p className="text-gray-600">
            O link de reset é inválido ou expirou.
          </p>
          <Link 
            to="/forgot-password" 
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Pedir novo link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Redefinir password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Escolhe uma nova password para a tua conta.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">Nova password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Nova password (mín. 8 caracteres)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirmar password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Confirmar password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'A processar...' : 'Redefinir password'}
            </button>
          </div>

          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Voltar ao login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
