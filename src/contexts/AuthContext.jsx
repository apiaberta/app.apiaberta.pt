import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEYS = {
  apiKey: 'apiaberta_apiKey',
  email: 'apiaberta_email',
  name: 'apiaberta_name',
  tier: 'apiaberta_tier',
}

export function AuthProvider({ children }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.apiKey) || null)
  const [email, setEmail] = useState(() => localStorage.getItem(STORAGE_KEYS.email) || null)
  const [name, setName] = useState(() => localStorage.getItem(STORAGE_KEYS.name) || null)
  const [tier, setTier] = useState(() => localStorage.getItem(STORAGE_KEYS.tier) || 'free')

  function login(data) {
    const { apiKey: key, email: e, name: n, tier: t = 'free' } = data
    setApiKey(key)
    setEmail(e)
    setName(n)
    setTier(t)
    localStorage.setItem(STORAGE_KEYS.apiKey, key)
    localStorage.setItem(STORAGE_KEYS.email, e)
    localStorage.setItem(STORAGE_KEYS.name, n)
    localStorage.setItem(STORAGE_KEYS.tier, t)
  }

  function logout() {
    setApiKey(null)
    setEmail(null)
    setName(null)
    setTier('free')
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
  }

  return (
    <AuthContext.Provider value={{ apiKey, email, name, tier, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
