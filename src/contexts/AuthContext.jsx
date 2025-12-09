import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import jwtDecode from 'jwt-decode'
import api from '../services/api'
import { getErrorMessage } from '../utils/errorHandler'
import rsaEncryption from '../utils/rsaEncryption'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    // Load selected company ID from localStorage (for admin company switching)
    const saved = localStorage.getItem('selectedCompanyId')
    return saved ? parseInt(saved, 10) : null
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = jwtDecode(token)
        if (decoded.exp * 1000 > Date.now()) {
          // decoded contains our custom claims
          const userData = {
            id: decoded.id,
            email: decoded.email,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            role: decoded.role,
          }
          setUser(userData)
          if (decoded.companyId && decoded.companyName) {
            setCompany({ id: decoded.companyId, name: decoded.companyName })
          }
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
          localStorage.removeItem('token')
        }
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      // Encrypt password before sending (if RSA encryption is available)
      let encryptedPassword = password;
      if (rsaEncryption.isSupported()) {
        try {
          encryptedPassword = await rsaEncryption.encrypt(password);
        } catch (error) {
          console.warn('Password encryption failed, sending in plaintext:', error);
          // Continue with plaintext password if encryption fails
        }
      }
      
      const response = await api.post('/auth/login', { email, password: encryptedPassword })
      const { token, ...userData } = response.data.data
      
      localStorage.setItem('token', token)
      // Clear selectedCompanyId on new login (admin needs to select company again)
      localStorage.removeItem('selectedCompanyId')
      setSelectedCompanyId(null)
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
      
      // Set company information if available
      if (userData.companyId && userData.companyName) {
        setCompany({
          id: userData.companyId,
          name: userData.companyName
        })
      }
      
      return { success: true }
    } catch (error) {
      // Handle validation errors and other error types
      let errorMessage = getErrorMessage(error, 'Login failed')
      
      // Check for validation errors array
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors.map(e => e.message || e).join(', ')
        errorMessage = validationErrors || errorMessage
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('selectedCompanyId') // Clear selected company on logout
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setCompany(null)
    setSelectedCompanyId(null) // Clear selected company state
    navigate('/login')
  }

  const hasRole = (role) => {
    if (!user) return false
    return user.role === role
  }

  const hasAnyRole = (roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const switchCompany = (companyId) => {
    if (user?.role === 'ADMIN') {
      if (companyId) {
        setSelectedCompanyId(companyId)
        localStorage.setItem('selectedCompanyId', companyId.toString())
        // Fetch company details
        api.get(`/companies/${companyId}`)
          .then(response => {
            if (response.data?.data) {
              setCompany({
                id: response.data.data.id,
                name: response.data.data.name
              })
            }
          })
          .catch(error => {
            console.error('Failed to fetch company details:', error)
          })
      } else {
        // Clear selected company
        setSelectedCompanyId(null)
        localStorage.removeItem('selectedCompanyId')
        setCompany(null)
      }
    }
  }

  const value = {
    user,
    setUser,
    company,
    selectedCompanyId,
    switchCompany,
    login,
    logout,
    hasRole,
    hasAnyRole,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
