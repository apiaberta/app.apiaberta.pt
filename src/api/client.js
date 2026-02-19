import axios from 'axios'

const api = axios.create({ baseURL: '/v1' })

// Attach JWT to every request when available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
