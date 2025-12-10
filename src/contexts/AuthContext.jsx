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
      // Always clear RSA cache before login to ensure fresh key
      if (rsaEncryption.isSupported()) {
        rsaEncryption.clearCache();
      }
      
      // Encrypt password before sending (if RSA encryption is available)
      // Force reload public key on each login to handle backend restarts
      let encryptedPassword = password;
      if (rsaEncryption.isSupported()) {
        try {
          // Force reload to get fresh key in case backend restarted
          encryptedPassword = await rsaEncryption.encrypt(password, true);
        } catch (error) {
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
      // Handle decryption errors - clear RSA cache and retry with fresh key
      const errorMessage = (error?.response?.data?.message || error?.message || 'Login failed').toLowerCase();
      const isDecryptionError = errorMessage.includes('failed to decrypt password') || 
                                errorMessage.includes('failed to decrypt') ||
                                errorMessage.includes('key mismatch') ||
                                errorMessage.includes('encryption key mismatch') ||
                                errorMessage.includes('badpadding') ||
                                errorMessage.includes('automatically retry') ||
                                errorMessage.includes('decrypt') ||
                                errorMessage.includes('invalid encrypted password format');
      
      if (isDecryptionError && rsaEncryption.isSupported()) {
        // Suppress error logging for decryption errors - we'll handle them gracefully
        // Clear cache completely to ensure we fetch a fresh key
        rsaEncryption.clearCache();
        
        // Retry login with fresh public key
        try {
          // Longer delay to ensure backend is ready and cache is cleared
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Force reload the public key and encrypt again (clear cache is already done)
          // This will fetch a completely fresh key from the backend
          const encryptedPassword = await rsaEncryption.encrypt(password, true);
          const retryResponse = await api.post('/auth/login', { email, password: encryptedPassword });
          const { token, ...userData } = retryResponse.data.data;
          
          localStorage.setItem('token', token);
          localStorage.removeItem('selectedCompanyId');
          setSelectedCompanyId(null);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(userData);
          
          if (userData.companyId && userData.companyName) {
            setCompany({
              id: userData.companyId,
              name: userData.companyName
            });
          }
          
          // Login succeeded after retry - return success silently
          return { success: true };
        } catch (retryError) {
          // If retry also fails, check if it's still a decryption error
          const retryErrorMessage = (retryError?.response?.data?.message || retryError?.message || '').toLowerCase();
          const isRetryDecryptionError = retryErrorMessage.includes('failed to decrypt') || 
              retryErrorMessage.includes('key mismatch') ||
              retryErrorMessage.includes('badpadding') ||
              retryErrorMessage.includes('encryption key mismatch') ||
              retryErrorMessage.includes('automatically retry');
          
          if (isRetryDecryptionError) {
            // Last resort: try with plaintext password (backend will accept it if not encrypted)
            try {
              // Ensure we're sending plaintext, not encrypted
              const plaintextPassword = password; // Use original password
              const plaintextResponse = await api.post('/auth/login', { email, password: plaintextPassword });
              const { token, ...userData } = plaintextResponse.data.data;
              
              localStorage.setItem('token', token);
              localStorage.removeItem('selectedCompanyId');
              setSelectedCompanyId(null);
              api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              setUser(userData);
              
              if (userData.companyId && userData.companyName) {
                setCompany({
                  id: userData.companyId,
                  name: userData.companyName
                });
              }
              
              // Login succeeded with plaintext fallback - return success silently
              return { success: true };
            } catch (plaintextError) {
              // Only log error if all attempts failed
              const plaintextErrorMsg = plaintextError?.response?.data?.message || plaintextError?.message || 'Login failed';
              return {
                success: false,
                error: plaintextErrorMsg.includes('Invalid credentials') || plaintextErrorMsg.includes('User not found') ? 
                       'Invalid email or password. Please check your credentials and try again.' :
                       'Login failed. Please check your credentials and try again.'
              };
            }
          }
          // If retry fails for a different reason, return the retry error
          const retryErrorMsg = retryError?.response?.data?.message || retryError?.message || 'Login failed';
          return {
            success: false,
            error: retryErrorMsg.includes('Invalid credentials') || retryErrorMsg.includes('User not found') ?
                   'Invalid email or password. Please check your credentials and try again.' :
                   retryErrorMsg
          };
        }
      }
      
      // Handle validation errors and other error types
      // Only show error if it's not a decryption error (those are handled above)
      // Reuse errorMessage variable that was already declared above (line 100)
      const isDecryptionErrorInFinal = errorMessage.includes('failed to decrypt') || 
                                       errorMessage.includes('key mismatch') ||
                                       errorMessage.includes('encryption key mismatch') ||
                                       errorMessage.includes('badpadding') ||
                                       errorMessage.includes('automatically retry');
      
      // If it's a decryption error that wasn't caught above, it means RSA is not supported
      // In that case, try plaintext as fallback
      if (isDecryptionErrorInFinal && !rsaEncryption.isSupported()) {
        try {
          const plaintextResponse = await api.post('/auth/login', { email, password: password });
          const { token, ...userData } = plaintextResponse.data.data;
          
          localStorage.setItem('token', token);
          localStorage.removeItem('selectedCompanyId');
          setSelectedCompanyId(null);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(userData);
          
          if (userData.companyId && userData.companyName) {
            setCompany({
              id: userData.companyId,
              name: userData.companyName
            });
          }
          
          return { success: true };
        } catch (plaintextError) {
          // Fall through to error handling below
        }
      }
      
      // For decryption errors, don't log detailed error info since we handle them gracefully
      // Only log if it's not a handled decryption error
      let finalErrorMessage;
      if (isDecryptionErrorInFinal) {
        // Suppress detailed logging for handled decryption errors
        finalErrorMessage = error?.response?.data?.message || error?.message || 'Login failed';
      } else {
        // Check for validation errors first (from Spring Boot validation)
        if (error?.response?.data?.validationErrors) {
          const validationErrors = Object.entries(error.response.data.validationErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          finalErrorMessage = validationErrors || 'Validation failed';
        } else if (error?.response?.data?.message) {
          finalErrorMessage = error.response.data.message;
        } else {
          // Suppress logging for login errors that might be handled - we'll log only if login truly fails
          finalErrorMessage = getErrorMessage(error, 'Login failed', '', null, true);
        }
      }
      
      // Check for validation errors array (alternative format)
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors.map(e => e.message || e).join(', ');
        finalErrorMessage = validationErrors || finalErrorMessage;
      }
      
      return { 
        success: false, 
        error: finalErrorMessage
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
