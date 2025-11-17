/**
 * Logs detailed error information to console for developers
 * @param {Error} error - The error object from axios or other sources
 * @param {string} context - Context where the error occurred (e.g., 'Failed to load employees')
 */
const logErrorDetails = (error, context = '') => {
  // Only log in development mode to avoid console spam
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  const logPrefix = context ? `[${context}]` : '[Error]'
  
  console.group(`%c${logPrefix} Error Details`, 'color: #ff4444; font-weight: bold; font-size: 14px;')
  
  // Basic error info
  console.error('Error Message:', error?.message || 'Unknown error')
  console.error('Error Type:', error?.name || 'Unknown')
  
  // HTTP Response details
  if (error?.response) {
    console.group('HTTP Response Details')
    console.error('Status:', error.response.status)
    console.error('Status Text:', error.response.statusText)
    console.error('URL:', error.response.config?.url || 'Unknown')
    console.error('Method:', error.response.config?.method?.toUpperCase() || 'Unknown')
    
    // Request data
    if (error.response.config?.data) {
      try {
        const requestData = typeof error.response.config.data === 'string' 
          ? JSON.parse(error.response.config.data) 
          : error.response.config.data
        console.error('Request Data:', requestData)
      } catch (e) {
        console.error('Request Data (raw):', error.response.config.data)
      }
    }
    
    // Response data
    if (error.response.data) {
      console.error('Response Data:', error.response.data)
    }
    
    // Headers
    if (error.response.headers) {
      console.error('Response Headers:', error.response.headers)
    }
    console.groupEnd()
  }
  
  // Network/Connection errors
  if (error?.code) {
    console.error('Error Code:', error.code)
  }
  
  // Stack trace for debugging
  if (error?.stack) {
    console.group('Stack Trace')
    console.error(error.stack)
    console.groupEnd()
  }
  
  // Full error object for deep inspection
  console.group('Full Error Object')
  console.error(error)
  console.groupEnd()
  
  console.groupEnd()
}

/**
 * Converts technical error messages to user-friendly messages
 * @param {Error} error - The error object from axios or other sources
 * @param {string} defaultMessage - Default message to show if error can't be parsed
 * @param {string} context - Context for logging (optional)
 * @param {Function} t - Translation function (optional)
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = 'An unexpected error occurred. Please try again.', context = '', t = null) => {
  // Log detailed error information for developers
  logErrorDetails(error, context || defaultMessage)
  
  // Helper to get translated message or fallback to English
  const getTranslated = (key, fallback) => {
    return t ? t(key, fallback) : fallback
  }
  
  // If error is already a string, return it
  if (typeof error === 'string') {
    return error
  }

  // Check if there's a user-friendly message from the backend
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  // Handle different HTTP status codes with user-friendly messages
  if (error?.response?.status) {
    const status = error.response.status
    switch (status) {
      case 400:
        return getTranslated('errors.invalidRequest', 'Invalid request. Please check your input and try again.')
      case 401:
        return getTranslated('errors.sessionExpired', 'Your session has expired. Please log in again.')
      case 403:
        return getTranslated('errors.noPermission', 'You do not have permission to perform this action.')
      case 404:
        return getTranslated('errors.notFound', 'The requested resource was not found.')
      case 409:
        return getTranslated('errors.conflict', 'This action conflicts with existing data. Please check and try again.')
      case 422:
        return getTranslated('errors.invalidData', 'The provided data is invalid. Please check your input.')
      case 500:
        return getTranslated('errors.serverError', 'A server error occurred. Please try again later or contact support.')
      case 502:
        return getTranslated('errors.serverUnavailable', 'The server is temporarily unavailable. Please try again later.')
      case 503:
        return getTranslated('errors.serviceUnavailable', 'The service is temporarily unavailable. Please try again later.')
      case 504:
        return getTranslated('errors.timeout', 'The request timed out. Please try again.')
      default:
        return getTranslated('errors.errorWithStatus', `An error occurred (${status}). Please try again.`).replace('{{status}}', status)
    }
  }

  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return getTranslated('errors.networkError', 'Unable to connect to the server. Please check your internet connection.')
  }

  // Handle timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return getTranslated('errors.requestTimeout', 'The request took too long. Please try again.')
  }

  // Handle axios-specific errors
  if (error?.message) {
    // Don't show technical axios messages
    if (error.message.includes('Request failed with status code')) {
      return getTranslated('errors.processingError', 'An error occurred while processing your request. Please try again.')
    }
    if (error.message.includes('timeout')) {
      return getTranslated('errors.requestTimeout', 'The request took too long. Please try again.')
    }
    // For other axios messages, try to extract useful info
    if (!error.message.includes('status code') && !error.message.includes('Network Error')) {
      return error.message
    }
  }

  // Fallback to default message
  return defaultMessage
}

/**
 * Extracts error message from various error formats
 * Used for consistent error handling across the app
 */
export const extractErrorMessage = (error, context = '') => {
  const message = getErrorMessage(error, 'An unexpected error occurred. Please try again.', context)
  return context ? `${context}: ${message}` : message
}

/**
 * Logs detailed success information to console for developers
 * @param {Object} response - The axios response object
 * @param {string} context - Context where the success occurred (e.g., 'Employee created')
 * @param {Object} requestData - Optional request data that was sent
 */
export const logSuccessDetails = (response, context = '', requestData = null) => {
  // Only log in development mode to avoid console spam
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  const logPrefix = context ? `[${context}]` : '[Success]'
  
  console.group(`%c${logPrefix} Success Details`, 'color: #44ff44; font-weight: bold; font-size: 14px;')
  
  // Response info
  if (response) {
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('URL:', response.config?.url || 'Unknown')
    console.log('Method:', response.config?.method?.toUpperCase() || 'Unknown')
    
    // Response data
    if (response.data) {
      console.log('Response Data:', response.data)
    }
    
    // Response headers
    if (response.headers) {
      console.log('Response Headers:', response.headers)
    }
  }
  
  // Request data if provided
  if (requestData) {
    console.log('Request Data:', requestData)
  }
  
  console.groupEnd()
}

