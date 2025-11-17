import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Domain as DomainIcon,
  CreditCard as CreditCardIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const CompanySelector = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [success, setSuccess] = useState(false)
  const [switching, setSwitching] = useState(false)
  const { user, switchCompany, selectedCompanyId } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    // Load currently selected company
    if (selectedCompanyId && companies.length > 0) {
      const currentCompany = companies.find(c => c.id === selectedCompanyId)
      if (currentCompany) {
        setSelectedCompany(currentCompany)
      }
    }
  }, [selectedCompanyId, companies])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await api.get('/companies')
      setCompanies(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySelect = (company) => {
    setSelectedCompany(company)
    setSuccess(false)
  }

  const handleSwitchCompany = async () => {
    if (!selectedCompany) return
    
    try {
      setSwitching(true)
      // Switch company context
      switchCompany(selectedCompany.id)
      setSuccess(true)
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard')
        window.location.reload() // Reload to refresh all data with new company context
      }, 1500)
    } catch (error) {
      console.error('Failed to switch company:', error)
      setSwitching(false)
    }
  }

  const getSubscriptionColor = (plan) => {
    switch (plan) {
      case 'UNLIMITED':
        return 'secondary'
      case 'ENTERPRISE_150':
        return 'primary'
      case 'BUSINESS_100':
        return 'info'
      case 'GROWTH_50':
        return 'success'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          Switch Company
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a company to manage and view its data
        </Typography>
      </Box>

      {user?.role === 'ADMIN' && (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>Admin Access:</strong> You can access all companies. Select a company to manage and view its employees, attendance, and other data.
          </Typography>
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon />}
          sx={{ mb: 3 }}
        >
          Company switched successfully! Redirecting to dashboard...
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          {companies.length} {companies.length === 1 ? 'Company' : 'Companies'} Available
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchCompanies}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {companies.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Companies Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                There are no companies available to switch to.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {companies.map((company) => {
            const isSelected = selectedCompany?.id === company.id
            const isCurrentCompany = selectedCompanyId === company.id
            
            return (
              <Grid item xs={12} sm={6} md={4} key={company.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    boxShadow: isSelected ? 4 : 1,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                      borderColor: 'primary.main'
                    },
                    position: 'relative',
                    ...(isCurrentCompany && {
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)'
                    })
                  }}
                  onClick={() => handleCompanySelect(company)}
                >
                  {isCurrentCompany && (
                    <Chip
                      icon={<CheckCircleOutlineIcon />}
                      label="Current Company"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, pt: isCurrentCompany ? 5 : 2 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 56,
                          height: 56,
                          mr: 2
                        }}
                      >
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                          {company.name}
                        </Typography>
                        <Chip
                          label={company.isActive ? 'Active' : 'Inactive'}
                          color={company.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>

                    {company.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {company.description}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Employees
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500}>
                          {company.currentEmployeeCount} / {company.maxEmployees === -1 ? '∞' : company.maxEmployees}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                          <CreditCardIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Plan
                          </Typography>
                        </Box>
                        <Chip
                          label={company.subscriptionPlan?.replace(/_/g, ' ') || 'N/A'}
                          color={getSubscriptionColor(company.subscriptionPlan)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {company.domain && (
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={1}>
                            <DomainIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Domain
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={500} sx={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {company.domain}
                          </Typography>
                        </Box>
                      )}

                      {company.maxEmployees !== -1 && (
                        <Box sx={{ mt: 1 }}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Capacity Usage
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round((company.currentEmployeeCount / company.maxEmployees) * 100)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(company.currentEmployeeCount / company.maxEmployees) * 100}
                            color={
                              (company.currentEmployeeCount / company.maxEmployees) > 0.9 ? 'error' :
                              (company.currentEmployeeCount / company.maxEmployees) > 0.7 ? 'warning' : 'success'
                            }
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  {isSelected && user?.role === 'ADMIN' && (
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        startIcon={switching ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSwitchCompany()
                        }}
                        disabled={switching || isCurrentCompany}
                        sx={{ py: 1.5 }}
                      >
                        {switching ? 'Switching...' : isCurrentCompany ? 'Current Company' : `Switch to ${company.name}`}
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {selectedCompany && !success && user?.role === 'ADMIN' && (
        <Box sx={{ mt: 4 }}>
          <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Selected: {selectedCompany.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCompany.currentEmployeeCount} employees • {selectedCompany.subscriptionPlan?.replace(/_/g, ' ') || 'N/A'} plan
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={switching ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                  onClick={handleSwitchCompany}
                  disabled={switching || selectedCompanyId === selectedCompany.id}
                  sx={{ minWidth: 200 }}
                >
                  {switching ? 'Switching...' : selectedCompanyId === selectedCompany.id ? 'Current Company' : 'Switch Now'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  )
}

export default CompanySelector
