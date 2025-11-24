import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getMyCompanyFeatureFlags } from '../services/featureFlags'

const FeatureFlagContext = createContext()

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider')
  }
  return context
}

export const FeatureFlagProvider = ({ children }) => {
  const { user, selectedCompanyId } = useAuth()
  const [featureFlags, setFeatureFlags] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeatureFlags = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const flags = await getMyCompanyFeatureFlags()
        setFeatureFlags(flags)
      } catch (error) {
        console.error('Failed to load feature flags:', error)
        // Set default flags (all enabled) on error
        setFeatureFlags({
          pages: {
            dashboard: true,
            hrDashboard: true,
            employeeDashboard: true,
            adminDashboard: true,
            systemMonitoring: true,
            employees: true,
            employeeDetail: true,
            departments: true,
            companyDirectory: true,
            timeLogs: true,
            attendance: true,
            myTimeHistory: true,
            workdayReports: true,
            leaveRequests: true,
            tickets: true,
            adminTickets: true,
            notifications: true,
            announcements: true,
            accessControl: true,
            devices: true,
            reports: true,
            accounting: true,
            profile: true,
            settings: true,
            account: true,
            companyEdit: true,
            companies: true,
            monitoring: true,
            excelImport: true,
            companySelector: true,
            wiki: true,
            companySetup: true,
            bulkImport: true,
          }
        })
      } finally {
        setLoading(false)
      }
    }

    loadFeatureFlags()
  }, [user, selectedCompanyId])

  /**
   * Check if a page/feature is enabled
   * @param {string} pagePath - The route path (e.g., '/accounting', 'accounting', 'accounting')
   */
  const isPageEnabled = (pagePath) => {
    if (!featureFlags || !featureFlags.pages) {
      return true // Default to enabled if flags not loaded
    }

    // Normalize path (remove leading slash, handle dynamic routes)
    const normalizedPath = pagePath.startsWith('/') ? pagePath.substring(1) : pagePath
    const pathWithoutParams = normalizedPath.split('/')[0] // Remove route params like :id
    
    // Map route paths to feature flag properties
    const pageMap = {
      'dashboard': featureFlags.pages.dashboard,
      'hr-dashboard': featureFlags.pages.hrDashboard,
      'employee-dashboard': featureFlags.pages.employeeDashboard,
      'admin-dashboard': featureFlags.pages.adminDashboard,
      'system-monitoring': featureFlags.pages.systemMonitoring,
      'employees': featureFlags.pages.employees,
      'employees/:id': featureFlags.pages.employeeDetail,
      'departments': featureFlags.pages.departments,
      'company-directory': featureFlags.pages.companyDirectory,
      'time-logs': featureFlags.pages.timeLogs,
      'attendance': featureFlags.pages.attendance,
      'my-time-history': featureFlags.pages.myTimeHistory,
      'workday-reports': featureFlags.pages.workdayReports,
      'leave-requests': featureFlags.pages.leaveRequests,
      'tickets': featureFlags.pages.tickets,
      'admin-tickets': featureFlags.pages.adminTickets,
      'notifications': featureFlags.pages.notifications,
      'announcements': featureFlags.pages.announcements,
      'access-control': featureFlags.pages.accessControl,
      'devices': featureFlags.pages.devices,
      'reports': featureFlags.pages.reports,
      'accounting': featureFlags.pages.accounting,
      'profile': featureFlags.pages.profile,
      'settings': featureFlags.pages.settings,
      'account': featureFlags.pages.account,
      'company-edit': featureFlags.pages.companyEdit,
      'companies': featureFlags.pages.companies,
      'monitoring': featureFlags.pages.monitoring,
      'excel-import': featureFlags.pages.excelImport,
      'company-selector': featureFlags.pages.companySelector,
      'wiki': featureFlags.pages.wiki,
      'company-setup': featureFlags.pages.companySetup,
      'bulk-import': featureFlags.pages.bulkImport,
    }

    return pageMap[pathWithoutParams] !== undefined ? pageMap[pathWithoutParams] : true
  }

  return (
    <FeatureFlagContext.Provider value={{ featureFlags, loading, isPageEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

