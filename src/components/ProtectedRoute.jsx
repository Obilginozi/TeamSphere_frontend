import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'
import { Box, CircularProgress, Typography } from '@mui/material'

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading: authLoading } = useAuth()
  const { isPageEnabled, loading: flagsLoading } = useFeatureFlags()
  const location = useLocation()

  if (authLoading || flagsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // Check if the current page is enabled via feature flags
  const currentPath = location.pathname
  if (!isPageEnabled(currentPath)) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h5" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This feature is not available for your company.
        </Typography>
        <Navigate to="/dashboard" replace />
      </Box>
    )
  }

  return children
}

export default ProtectedRoute
