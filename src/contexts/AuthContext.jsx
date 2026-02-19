import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEYS = {
  token: 'token',
  apiKey: 'apiKey',
  email: 'email',
  name: 'name',
  tier: 'tier',
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.token) || null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.apiKey) || null)
  const [email, setEmail] = useState(() => localStorage.getItem(STORAGE_KEYS.email) || null)
  const [name, setName] = useState(() => localStorage.getItem(STORAGE_KEYS.name) || null)
  const [tier, setTier] = useState(() => localStorage.getItem(STORAGE_KEYS.tier) || 'free')

  function login(data) {
    const { token: t, apiKey: key, email: e, name: n, tier: tier_ = 'free' } = data
    setToken(t)
    setApiKey(key)
    setEmail(e)
    setName(n)
    setTier(tier_)
    localStorage.setItem(STORAGE_KEYS.token, t)
    localStorage.setItem(STORAGE_KEYS.apiKey, key)
    localStorage.setItem(STORAGE_KEYS.email, e)
    localStorage.setItem(STORAGE_KEYS.name, n)
    localStorage.setItem(STORAGE_KEYS.tier, tier_)
  }

  function logout() {
    setToken(null)
    setApiKey(null)
    setEmail(null)
    setName(null)
    setTier('free')
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
  }

  return (
    <AuthContext.Provider value={{ token, apiKey, email, name, tier, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
