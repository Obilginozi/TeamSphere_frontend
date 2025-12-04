import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Link as MuiLink,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  Support as SupportIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  OpenInNew as OpenInNewIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

const AccountDetails = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [accountData, setAccountData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchAccountDetails()
  }, [])

  const fetchAccountDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/account/details')
      setAccountData(response.data?.data || response.data)
    } catch (err) {
      console.error('Error fetching account details:', err)
      setError(err.response?.data?.message || err.message || t('account.error_loading') || 'Failed to load account details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return t('common.not_available') || 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !accountData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchAccountDetails} sx={{ mt: 2 }}>
          {t('common.retry') || 'Retry'}
        </Button>
      </Box>
    )
  }

  if (!accountData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          {t('account.error_loading') || 'Failed to load account details'}
        </Alert>
      </Box>
    )
  }

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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
              }}
            >
              <PersonIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
          {t('pageTitles.accountDetails')}
        </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('account.welcome') || 'Welcome'}, {accountData.firstName} {accountData.lastName}
        </Typography>
            </Box>
          </Box>
      </Box>

      {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ 
            mb: 3,
            '& .MuiTab-root': {
              borderRadius: 2,
              mx: 0.5,
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                color: '#667eea',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label={t('account.tab_account') || 'Account'} />
          <Tab icon={<BusinessIcon />} iconPosition="start" label={t('account.tab_company') || 'Company'} />
          <Tab icon={<CreditCardIcon />} iconPosition="start" label={t('account.tab_subscription') || 'Subscription'} />
          <Tab icon={<SupportIcon />} iconPosition="start" label={t('account.tab_support') || 'Support'} />
        </Tabs>

      {/* Account Tab */}
      {activeTab === 0 && (
          <Paper 
            sx={{ 
              p: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              }
            }}
          >
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {t('account.personal_info') || 'Personal Information'}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.full_name') || 'Full Name'}
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {accountData.firstName} {accountData.lastName}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('account.email') || 'Email'}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleCopy(accountData.email)}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h6">{accountData.email}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.phone') || 'Phone'}
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {accountData.phone || t('common.not_set') || 'Not Set'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.role') || 'Role'}
                    </Typography>
                  </Box>
                  <Chip
                    label={accountData.role || 'EMPLOYEE'}
                    color="primary"
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InfoIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.account_created') || 'Account Created'}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {formatDate(accountData.accountCreatedAt)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Login Credentials */}
          <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('account.login_credentials') || 'Login Credentials'}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label={t('account.login_email') || 'Login Email'}
                value={accountData.email || ''}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => handleCopy(accountData.email)}>
                      <CopyIcon />
                    </IconButton>
                  )
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label={t('account.password') || 'Password'}
                type={showPassword ? 'text' : 'password'}
                value="••••••••"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('account.password_note') || 'Password cannot be displayed. Contact administrator to reset.'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Company Tab */}
      {activeTab === 1 && (
          <Paper 
            sx={{ 
              p: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              }
            }}
          >
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {t('account.company_info') || 'Company Information'}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.company_name') || 'Company Name'}
                    </Typography>
                  </Box>
                  <Typography variant="h6">{accountData.companyName || 'N/A'}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('account.company_email') || 'Company Email'}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleCopy(accountData.companyEmail)}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h6">{accountData.companyEmail || 'N/A'}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.company_phone') || 'Company Phone'}
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {accountData.companyPhone || t('common.not_set') || 'Not Set'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.employees') || 'Employees'}
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {accountData.currentEmployeeCount || 0} / {accountData.maxEmployees || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Subscription Tab */}
      {activeTab === 2 && (
          <Paper 
            sx={{ 
              p: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              }
            }}
          >
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {t('account.subscription_info') || 'Subscription Information'}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CreditCardIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.subscription_plan') || 'Subscription Plan'}
                    </Typography>
                  </Box>
                  <Chip
                    label={accountData.subscriptionPlan || 'NONE'}
                    color="primary"
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InfoIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.subscription_status') || 'Status'}
                    </Typography>
                  </Box>
                  <Chip
                    label={accountData.subscriptionStatus || 'INACTIVE'}
                    color={accountData.subscriptionStatus === 'ACTIVE' ? 'success' : 'warning'}
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('account.billing_cycle') || 'Billing Cycle'}
                  </Typography>
                  <Typography variant="body1">
                    {accountData.billingCycle || 'MONTHLY'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('account.payment_method') || 'Payment Method'}
                  </Typography>
                  <Typography variant="body1">
                    {accountData.paymentMethod || t('common.not_set') || 'Not Set'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Support Tab */}
      {activeTab === 3 && (
          <Paper 
            sx={{ 
              p: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              }
            }}
          >
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {t('account.support_info') || 'Support Information'}
          </Typography>
          
          <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              <SupportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('account.ticketing_system') || 'Ticketing System'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('account.ticketing_description') || 'Create tickets to get help from HR or Admin'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/employee-tickets' : '/company-tickets')}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {t('account.go_to_tickets') || 'Go to Tickets'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('account.support_email') || 'Support Email'}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleCopy(accountData.supportEmail)}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="body1">
                    {accountData.supportEmail || 'support@teamsphere.com'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('account.support_phone') || 'Support Phone'}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {accountData.supportPhone || '+1 (555) 123-4567'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      </Box>
    </Box>
  )
}

export default AccountDetails
