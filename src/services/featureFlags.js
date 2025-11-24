import api from './api'

/**
 * Get feature flags for current user's company
 */
export const getMyCompanyFeatureFlags = async () => {
  try {
    const response = await api.get('/company-features/my-company')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch feature flags:', error)
    throw error
  }
}

/**
 * Get feature flags for a specific company (admin only)
 */
export const getCompanyFeatureFlags = async (companyId) => {
  try {
    const response = await api.get(`/company-features/${companyId}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch feature flags:', error)
    throw error
  }
}

/**
 * Update feature flags for a company (admin only)
 */
export const updateCompanyFeatureFlags = async (companyId, flags) => {
  try {
    const response = await api.put(`/company-features/${companyId}`, flags)
    return response.data.data
  } catch (error) {
    console.error('Failed to update feature flags:', error)
    throw error
  }
}

/**
 * Check if a page is enabled for current user's company
 */
export const checkPageEnabled = async (pagePath) => {
  try {
    const response = await api.get('/company-features/my-company/check-page', {
      params: { pagePath }
    })
    return response.data.data
  } catch (error) {
    console.error('Failed to check page:', error)
    // Default to enabled if check fails
    return true
  }
}

