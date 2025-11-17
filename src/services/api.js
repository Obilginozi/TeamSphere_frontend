import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      
      // For admin users, add X-Company-Id header if a company is selected
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        if (decoded.role === 'ADMIN') {
          const selectedCompanyId = localStorage.getItem('selectedCompanyId')
          if (selectedCompanyId) {
            config.headers['X-Company-Id'] = selectedCompanyId
          }
        }
      } catch (e) {
        // Ignore JWT decode errors
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
