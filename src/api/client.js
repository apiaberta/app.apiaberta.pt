import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://api.apiaberta.pt' })

// Attach X-API-Key to every request when available
api.interceptors.request.use(config => {
  const apiKey = localStorage.getItem('apiKey')
  if (apiKey) config.headers['X-API-Key'] = apiKey
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('apiKey')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
