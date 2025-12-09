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

// Response interceptor with retry logic for rate limiting
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 429 (Too Many Requests) - Don't retry immediately to avoid making it worse
    // Rate limiting is per-endpoint, so retrying immediately will just hit the limit again
    if (error.response?.status === 429) {
      const retryCount = originalRequest._retryCount || 0
      const maxRetries = 1 // Only 1 retry with long delay
      
      if (retryCount < maxRetries && !originalRequest._skipRetry) {
        originalRequest._retryCount = retryCount + 1
        
        // Long delay to allow rate limit bucket to refill
        // Get retry-after header if available, otherwise use 5 seconds
        const retryAfter = error.response?.headers?.['retry-after']
        const delay = retryAfter ? Math.max(parseInt(retryAfter) * 1000, 5000) : 5000
        
        console.warn(`Rate limit exceeded, retrying once after ${delay}ms...`)
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Retry the request
        return api(originalRequest)
      } else {
        console.error('Rate limit exceeded. Please wait a moment and refresh the page.')
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
