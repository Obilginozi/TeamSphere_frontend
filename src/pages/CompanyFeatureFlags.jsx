import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  Autocomplete,
  IconButton,
  Tooltip,
  Collapse,
  Avatar,
  Grow
} from '@mui/material'
import { 
  Save, 
  Refresh, 
  Search, 
  ExpandMore, 
  ExpandLess,
  CheckCircle,
  Cancel,
  SelectAll,
  ClearAll,
  Business
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { getCompanyFeatureFlags, updateCompanyFeatureFlags } from '../services/featureFlags'
import api from '../services/api'

// Define page groups outside component for use in initialization
const pageGroups = [
  {
    title: 'Dashboards',
    icon: '📊',
    description: 'Dashboard pages for different user roles',
    pages: [
      { key: 'dashboard', label: 'Dashboard', description: 'Main dashboard page' },
      { key: 'hrDashboard', label: 'HR Dashboard', description: 'HR management dashboard' },
      { key: 'employeeDashboard', label: 'Employee Dashboard', description: 'Employee self-service dashboard' },
      { key: 'adminDashboard', label: 'Admin Dashboard', description: 'Administrator dashboard' },
      { key: 'systemMonitoring', label: 'System Monitoring', description: 'System health and monitoring' }
    ]
  },
  {
    title: 'Employee Management',
    icon: '👥',
    description: 'Employee and department management features',
    pages: [
      { key: 'employees', label: 'Employees', description: 'Employee list and management' },
      { key: 'employeeDetail', label: 'Employee Detail', description: 'Individual employee details' },
      { key: 'departments', label: 'Departments', description: 'Department management' },
      { key: 'companyDirectory', label: 'Company Directory', description: 'Company-wide employee directory' }
    ]
  },
  {
    title: 'Time & Attendance',
    icon: '⏰',
    description: 'Time tracking and attendance features',
    pages: [
      { key: 'timeLogs', label: 'Time Logs', description: 'Time log management' },
      { key: 'attendance', label: 'Attendance Management', description: 'Attendance tracking and management' },
      { key: 'myTimeHistory', label: 'My Time History', description: 'Personal time history view' },
      { key: 'workdayReports', label: 'Workday Reports', description: 'Workday-based reports' }
    ]
  },
  {
    title: 'Leave Management',
    icon: '📅',
    description: 'Leave request and approval features',
    pages: [
      { key: 'leaveRequests', label: 'Leave Requests', description: 'Leave request management' }
    ]
  },
  {
    title: 'Support & Communication',
    icon: '💬',
    description: 'Tickets, notifications, and announcements',
    pages: [
      { key: 'tickets', label: 'Tickets', description: 'Support ticket system' },
      { key: 'adminTickets', label: 'Admin Tickets', description: 'Admin ticket management' },
      { key: 'notifications', label: 'Notifications', description: 'Notification system' },
      { key: 'announcements', label: 'Announcements', description: 'Company announcements' }
    ]
  },
  {
    title: 'Access & Security',
    icon: '🔒',
    description: 'Access control and device management',
    pages: [
      { key: 'accessControl', label: 'Access Control', description: 'Access control management' },
      { key: 'devices', label: 'Device Management', description: 'Device registration and management' }
    ]
  },
  {
    title: 'Reports & Analytics',
    icon: '📈',
    description: 'Reporting and accounting features',
    pages: [
      { key: 'reports', label: 'Reports & Analytics', description: 'Analytics and reporting' },
      { key: 'accounting', label: 'Accounting', description: 'Accounting integration' }
    ]
  },
  {
    title: 'Settings & Profile',
    icon: '⚙️',
    description: 'User and company settings',
    pages: [
      { key: 'profile', label: 'Profile', description: 'User profile management' },
      { key: 'settings', label: 'Settings', description: 'Application settings' },
      { key: 'account', label: 'Account Details', description: 'Account information' },
      { key: 'companyEdit', label: 'Company Edit', description: 'Company information editing' }
    ]
  },
  {
    title: 'Admin & System',
    icon: '🛠️',
    description: 'Administrative and system features',
    pages: [
      { key: 'companies', label: 'Company Management', description: 'Multi-company management' },
      { key: 'monitoring', label: 'Monitoring', description: 'System monitoring' },
      { key: 'excelImport', label: 'Excel Import', description: 'Excel data import' },
      { key: 'companySelector', label: 'Company Selector', description: 'Company switching' },
      { key: 'wiki', label: 'Wiki', description: 'Documentation wiki' },
      { key: 'companySetup', label: 'Company Setup', description: 'Company initial setup' },
      { key: 'bulkImport', label: 'Bulk Import', description: 'Bulk data import' }
    ]
  }
]

const CompanyFeatureFlags = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [featureFlags, setFeatureFlags] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState('')
  // Initialize all groups as expanded by default
  const [expandedGroups, setExpandedGroups] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  // Only ADMIN can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          {t('companyFeatureFlags.accessDenied')}
        </Alert>
      </Box>
    )
  }

  useEffect(() => {
    fetchCompanies()
  }, [user])

  useEffect(() => {
    if (selectedCompanyId) {
      loadFeatureFlags(selectedCompanyId)
      setHasChanges(false)
    }
  }, [selectedCompanyId])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await api.get('/companies')
      const companiesList = response.data.data || []
      setCompanies(companiesList)
      if (companiesList.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(companiesList[0].id)
        setSelectedCompany(companiesList[0])
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error)
      setMessage({ type: 'error', text: 'Failed to load companies' })
    } finally {
      setLoading(false)
    }
  }


  const loadFeatureFlags = async (companyId) => {
    try {
      setLoading(true)
      const flags = await getCompanyFeatureFlags(companyId)
      setFeatureFlags(flags)
    } catch (error) {
      console.error('Failed to load feature flags:', error)
      setMessage({ type: 'error', text: 'Failed to load feature flags' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (pageKey) => {
    if (!featureFlags || !featureFlags.pages) return

    setFeatureFlags({
      ...featureFlags,
      pages: {
        ...featureFlags.pages,
        [pageKey]: !featureFlags.pages[pageKey]
      }
    })
    setHasChanges(true)
  }

  const handleBulkToggle = (groupPages, enabled) => {
    if (!featureFlags || !featureFlags.pages) return

    const updatedPages = { ...featureFlags.pages }
    groupPages.forEach(page => {
      updatedPages[page.key] = enabled
    })

    setFeatureFlags({
      ...featureFlags,
      pages: updatedPages
    })
    setHasChanges(true)
  }

  const toggleGroup = (groupTitle) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  const handleCompanyChange = (event, newValue) => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        setHasChanges(false)
        setSelectedCompany(newValue)
        setSelectedCompanyId(newValue?.id || null)
      }
    } else {
      setSelectedCompany(newValue)
      setSelectedCompanyId(newValue?.id || null)
    }
  }

  const handleSave = async () => {
    if (!selectedCompanyId && user?.role === 'ADMIN') {
      setMessage({ type: 'error', text: 'Please select a company' })
      return
    }

    const companyId = selectedCompanyId || user?.companyId
    if (!companyId) {
      setMessage({ type: 'error', text: 'Company ID not found' })
      return
    }

    try {
      setSaving(true)
      await updateCompanyFeatureFlags(companyId, featureFlags)
      setMessage({ type: 'success', text: 'Feature flags updated successfully and saved to XML file' })
      setHasChanges(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } catch (error) {
      console.error('Failed to update feature flags:', error)
      setMessage({ type: 'error', text: 'Failed to update feature flags: ' + (error.response?.data?.message || error.message) })
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = () => {
    if (selectedCompanyId) {
      loadFeatureFlags(selectedCompanyId)
    } else if (companies.length > 0) {
      // If no company selected but companies exist, select first one
      setSelectedCompanyId(companies[0].id)
      setSelectedCompany(companies[0])
    }
  }

  if (loading && !featureFlags) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!featureFlags) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No feature flags found</Alert>
      </Box>
    )
  }

  // Filter page groups and pages based on search term
  const filteredPageGroups = pageGroups.map(group => ({
    ...group,
    pages: group.pages.filter(page => 
      page.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.key.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.pages.length > 0)

  // Count enabled/disabled features
  const getFeatureStats = () => {
    if (!featureFlags || !featureFlags.pages) return { enabled: 0, disabled: 0, total: 0 }
    const allPages = pageGroups.flatMap(g => g.pages)
    const enabled = allPages.filter(p => featureFlags.pages[p.key]).length
    const total = allPages.length
    return { enabled, disabled: total - enabled, total }
  }

  const stats = getFeatureStats()

  const StatCard = ({ title, value, icon, color, subtitle, index = 0 }) => (
    <Grow in timeout={600 + (index * 100)}>
      <Card 
        sx={{ 
          height: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
            opacity: 0.8
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
            '&::before': {
              opacity: 1
            }
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box flex={1}>
              <Typography 
                color="textSecondary" 
                gutterBottom 
                variant="body2"
                sx={{ fontWeight: 500, mb: 1 }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                component="div"
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: subtitle ? 0.5 : 0
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar 
              sx={{ 
                bgcolor: color, 
                width: 64, 
                height: 64,
                boxShadow: `0 4px 20px ${color}40`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)'
                }
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  )

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        position: 'relative',
        margin: -3,
        padding: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
            {t('pageTitles.companyFeatureFlags')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('companyFeatureFlags.managePagesFeatures')}
        </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading || saving}
            sx={{
              borderRadius: 2,
              borderColor: '#667eea',
              color: '#667eea',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              textTransform: 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#764ba2',
                background: 'rgba(102, 126, 234, 0.1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
              },
              '&:disabled': {
                opacity: 0.5
              }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color={hasChanges ? 'warning' : 'primary'}
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving || !featureFlags || !selectedCompanyId}
              sx={{
                borderRadius: 2,
                background: hasChanges 
                  ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: hasChanges
                    ? 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)'
                    : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)'
                }
              }}
          >
            {saving ? t('companyFeatureFlags.savingToXML') : hasChanges ? t('companyFeatureFlags.saveChanges') : t('companyFeatureFlags.save')}
          </Button>
        </Box>
      </Box>

      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }} 
          onClose={() => setMessage({ type: '', text: '' })}
          action={
            message.type === 'success' && (
              <Chip 
                icon={<CheckCircle />} 
                label="Saved to XML" 
                color="success" 
                size="small" 
              />
            )
          }
        >
          {message.text}
        </Alert>
      )}

      {hasChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes. Don't forget to save your changes to update the XML file.
        </Alert>
      )}

      {user?.role === 'ADMIN' && (
        <Card sx={{ 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Business color="primary" />
              <Typography variant="h6">{t('companyFeatureFlags.selectCompany')}</Typography>
            </Box>
            <Autocomplete
              options={companies}
              getOptionLabel={(option) => `${option.name} (ID: ${option.id})`}
              value={selectedCompany}
              onChange={handleCompanyChange}
              loading={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('companyFeatureFlags.chooseCompany')}
                  placeholder={t('companyFeatureFlags.searchAndSelectCompany')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)'
                      },
                      '&.Mui-focused': {
                        background: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                      }
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props
                return (
                  <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {option.id} • {option.contactEmail || 'No email'}
                      </Typography>
                    </Box>
                  </Box>
                )
              }}
            />
            {selectedCompany && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`Company ID: ${selectedCompany.id}`} size="small" />
                {selectedCompany.contactEmail && <Chip label={selectedCompany.contactEmail} size="small" />}
                {selectedCompany.status && (
                  <Chip 
                    label={selectedCompany.status} 
                    size="small" 
                    color={selectedCompany.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {featureFlags && (
        <Card sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {featureFlags.companyName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Company ID: {featureFlags.companyId} • XML File: company-{featureFlags.companyId}-features.xml
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="Enabled Features"
                    value={stats.enabled}
                    icon={<CheckCircle />}
                    color="#4caf50"
                    subtitle={`${stats.total} total`}
                    index={0}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="Disabled Features"
                    value={stats.disabled}
                    icon={<Cancel />}
                    color="#f44336"
                    subtitle={`${stats.total} total`}
                    index={1}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="Total Features"
                    value={stats.total}
                    icon={<Business />}
                    color="#667eea"
                    subtitle={stats.total > 0 ? `${((stats.enabled / stats.total) * 100).toFixed(1)}% enabled` : 'No features'}
                    index={2}
                  />
                </Grid>
              </Grid>
            </Box>

          <Divider sx={{ mb: 3 }} />

            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search features by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)'
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Cancel fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {searchTerm && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Showing {filteredPageGroups.reduce((sum, g) => sum + g.pages.length, 0)} features matching "{searchTerm}"
              </Alert>
            )}

            {/* Feature Groups */}
          <Grid container spacing={3}>
              {filteredPageGroups.map((group) => {
                const groupEnabled = group.pages.filter(p => featureFlags.pages[p.key]).length
                const groupTotal = group.pages.length
                const allEnabled = groupEnabled === groupTotal
                const allDisabled = groupEnabled === 0

                return (
                  <Grid item xs={12} key={group.title}>
                    <Card sx={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: 3,
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <CardContent>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            cursor: 'pointer',
                            mb: expandedGroups[group.title] ? 2 : 0
                          }}
                          onClick={() => toggleGroup(group.title)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                              {group.icon} {group.title}
                            </Typography>
                            <Chip 
                              label={`${groupEnabled}/${groupTotal}`}
                              size="small"
                              color={allEnabled ? 'success' : allDisabled ? 'error' : 'warning'}
                              variant="outlined"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!allEnabled && (
                              <Tooltip title="Enable All">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBulkToggle(group.pages, true)
                                  }}
                                >
                                  <SelectAll />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!allDisabled && (
                              <Tooltip title="Disable All">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBulkToggle(group.pages, false)
                                  }}
                                >
                                  <ClearAll />
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton size="small">
                              {expandedGroups[group.title] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {group.description}
                        </Typography>
                        <Collapse in={expandedGroups[group.title] !== false}>
                          <Divider sx={{ my: 2 }} />
                          <Grid container spacing={2}>
                            {group.pages.map((page) => {
                              const isEnabled = featureFlags.pages[page.key] || false
                              return (
                                <Grid item xs={12} sm={6} md={4} key={page.key}>
                                  <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                      p: 2,
                                      borderRadius: 2,
                                      backgroundColor: isEnabled ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.95)',
                                      backdropFilter: 'blur(10px)',
                                      borderColor: isEnabled ? '#4caf50' : 'rgba(102, 126, 234, 0.2)',
                                      borderWidth: isEnabled ? 2 : 1,
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                                        borderColor: isEnabled ? '#4caf50' : '#667eea'
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                          {page.label}
                                        </Typography>
                                        {page.description && (
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {page.description}
                  </Typography>
                                        )}
                                      </Box>
                        <Switch
                                        checked={isEnabled}
                          onChange={() => handleToggle(page.key)}
                                        size="small"
                                        color="success"
                                      />
                                    </Box>
                                    <Chip 
                                      label={isEnabled ? 'Enabled' : 'Disabled'} 
                                      size="small" 
                                      color={isEnabled ? 'success' : 'default'}
                                      sx={{ mt: 1 }}
                                    />
                </Paper>
              </Grid>
                              )
                            })}
                          </Grid>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
          </Grid>

            {filteredPageGroups.length === 0 && searchTerm && (
              <Alert severity="info" sx={{ mt: 3 }}>
                No features found matching "{searchTerm}". Try a different search term.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {!featureFlags && !loading && (
        <Alert severity="info">
          {user?.role === 'ADMIN' 
            ? 'Please select a company to view and manage its feature flags.' 
            : 'No feature flags found for your company.'}
        </Alert>
      )}
      </Box>
    </Box>
  )
}

export default CompanyFeatureFlags

