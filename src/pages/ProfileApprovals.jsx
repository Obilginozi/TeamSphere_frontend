import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Divider
} from '@mui/material'
import { 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { getErrorMessage } from '../utils/errorHandler'
import dayjs from 'dayjs'

const ProfileApprovals = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [pendingRequests, setPendingRequests] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  // Ensure component re-renders when language changes
  useEffect(() => {
    const currentLang = i18n.language || localStorage.getItem('language') || 'en'
    dayjs.locale(currentLang === 'tr' ? 'tr' : 'en')
  }, [i18n.language])

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (activeTab === 0) {
        const response = await api.get('/profile-approvals/pending')
        setPendingRequests(response.data.data || [])
      } else {
        const response = await api.get('/profile-approvals/all')
        setAllRequests(response.data.data || [])
      }
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToLoadRequests'), '', t))
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return
    
    try {
      setProcessing(true)
      setError(null)
      
      const response = await api.put(`/profile-approvals/${selectedRequest.id}/approve`, {
        notes: reviewNotes || null
      })
      
      setSuccess(t('profile.requestApproved'))
      setApproveDialogOpen(false)
      setReviewNotes('')
      setSelectedRequest(null)
      fetchRequests()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToApprove'), '', t))
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    
    try {
      setProcessing(true)
      setError(null)
      
      const response = await api.put(`/profile-approvals/${selectedRequest.id}/reject`, {
        notes: reviewNotes || null
      })
      
      setSuccess(t('profile.requestRejected'))
      setRejectDialogOpen(false)
      setReviewNotes('')
      setSelectedRequest(null)
      fetchRequests()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToReject'), '', t))
    } finally {
      setProcessing(false)
    }
  }

  const openDetailDialog = (request) => {
    setSelectedRequest(request)
    setDetailDialogOpen(true)
  }

  const openApproveDialog = (request) => {
    setSelectedRequest(request)
    setApproveDialogOpen(true)
  }

  const openRejectDialog = (request) => {
    setSelectedRequest(request)
    setRejectDialogOpen(true)
  }

  const getStatusChipStyles = (status) => {
    const baseStyles = {
      borderRadius: 2,
      fontWeight: 600,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)'
      }
    }
    
    switch (status) {
      case 'PENDING':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)' }
        }
      case 'APPROVED':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)' }
        }
      case 'REJECTED':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)' }
        }
      default:
        return {
          ...baseStyles,
          background: 'rgba(158, 158, 158, 0.2)',
          color: '#424242',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
        }
    }
  }

  const getStatusChip = (status) => {
    const statusMap = {
      PENDING: { label: t('profile.pending') },
      APPROVED: { label: t('profile.approved') },
      REJECTED: { label: t('profile.rejected') }
    }
    const statusInfo = statusMap[status] || statusMap.PENDING
    return <Chip label={statusInfo.label} size="small" sx={getStatusChipStyles(status)} />
  }

  const getChangedFields = (request) => {
    const fields = []
    const user = request.user || {}
    const employee = user.employee || {}
    
    // Helper function to get current value
    const getCurrentValue = (fieldName, isEmployeeField = false) => {
      if (isEmployeeField) {
        // For employee fields, check employee first, then user as fallback
        const value = employee[fieldName] || user[fieldName]
        return value || '-'
      }
      // For user fields, check user directly
      const value = user[fieldName]
      return value || '-'
    }
    
    // Helper function to format date
    const formatDate = (date) => {
      if (!date) return '-'
      return dayjs(date).format('YYYY-MM-DD')
    }
    
    if (request.firstName) {
      fields.push({ 
        field: t('profile.firstName'), 
        currentValue: getCurrentValue('firstName'),
        newValue: request.firstName 
      })
    }
    if (request.lastName) {
      fields.push({ 
        field: t('profile.lastName'), 
        currentValue: getCurrentValue('lastName'),
        newValue: request.lastName 
      })
    }
    if (request.email) {
      fields.push({ 
        field: t('profile.email'), 
        currentValue: getCurrentValue('email'),
        newValue: request.email 
      })
    }
    if (request.phone) {
      fields.push({ 
        field: t('profile.phone'), 
        currentValue: getCurrentValue('phone'),
        newValue: request.phone 
      })
    }
    if (request.mobile) {
      fields.push({ 
        field: t('profile.mobile'), 
        currentValue: getCurrentValue('mobile', true),
        newValue: request.mobile 
      })
    }
    if (request.address) {
      fields.push({ 
        field: t('profile.address'), 
        currentValue: getCurrentValue('address', true),
        newValue: request.address 
      })
    }
    if (request.city) {
      fields.push({ 
        field: t('profile.city'), 
        currentValue: getCurrentValue('city'),
        newValue: request.city 
      })
    }
    if (request.state) {
      fields.push({ 
        field: t('profile.state'), 
        currentValue: getCurrentValue('state'),
        newValue: request.state 
      })
    }
    if (request.postalCode) {
      fields.push({ 
        field: t('profile.postalCode'), 
        currentValue: getCurrentValue('postalCode'),
        newValue: request.postalCode 
      })
    }
    if (request.country) {
      fields.push({ 
        field: t('profile.country'), 
        currentValue: getCurrentValue('country'),
        newValue: request.country 
      })
    }
    if (request.idCardNumber) {
      fields.push({ 
        field: t('profile.idCardNumber'), 
        currentValue: getCurrentValue('idCardNumber', true),
        newValue: request.idCardNumber 
      })
    }
    if (request.birthDate) {
      fields.push({ 
        field: t('profile.birthDate'), 
        currentValue: formatDate(getCurrentValue('birthDate', true)),
        newValue: formatDate(request.birthDate) 
      })
    }
    if (request.emergencyContact) {
      fields.push({ 
        field: t('profile.emergencyContact'), 
        currentValue: getCurrentValue('emergencyContact', true),
        newValue: request.emergencyContact 
      })
    }
    return fields
  }

  const requests = activeTab === 0 ? pendingRequests : allRequests
  
  // Force re-render when language changes by including language in key
  const tableHeaders = useMemo(() => ({
    employeeName: t('profile.employeeName'),
    requestedChanges: t('profile.requestedChanges'),
    submittedAt: t('profile.submittedAt'),
    status: t('profile.status'),
    actions: t('profile.actions')
  }), [t, i18n.language])

  if (loading && requests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      key={`profile-approvals-${i18n.language}`}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
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
                <CheckCircleIcon sx={{ fontSize: 28, color: 'white' }} />
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
          {t('pageTitles.profileApprovals')}
        </Typography>
              </Box>
            </Box>
          </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchRequests}
          disabled={loading}
            sx={{
              borderRadius: 2,
              borderColor: '#667eea',
              color: '#667eea',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#764ba2',
                background: 'rgba(102, 126, 234, 0.08)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                borderColor: 'rgba(0, 0, 0, 0.26)',
                color: 'rgba(0, 0, 0, 0.26)'
              },
              transition: 'all 0.2s ease'
            }}
        >
            {t('common.refresh')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

        <Tabs 
            key={i18n.language}
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
          <Tab label={t('profile.pendingApprovals')} />
          <Tab label={t('profile.allApprovals')} />
        </Tabs>

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {activeTab === 0 ? t('profile.noPendingRequests') : t('profile.noRequests')}
          </Typography>
        </Paper>
      ) : (
        <TableContainer 
          component={Paper}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Table key={`table-${i18n.language}`}>
            <TableHead key={`table-head-${i18n.language}`}>
              <TableRow key={`table-row-head-${i18n.language}`}>
                <TableCell key={`header-employeeName-${i18n.language}`}>
                  <Typography component="span">{tableHeaders.employeeName}</Typography>
                </TableCell>
                <TableCell key={`header-requestedChanges-${i18n.language}`}>
                  <Typography component="span">{tableHeaders.requestedChanges}</Typography>
                </TableCell>
                <TableCell key={`header-submittedAt-${i18n.language}`}>
                  <Typography component="span">{tableHeaders.submittedAt}</Typography>
                </TableCell>
                <TableCell key={`header-status-${i18n.language}`}>
                  <Typography component="span">{tableHeaders.status}</Typography>
                </TableCell>
                <TableCell key={`header-actions-${i18n.language}`} align="right">
                  <Typography component="span">{tableHeaders.actions}</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => {
                const changedFields = getChangedFields(request)
                const employeeName = request.user 
                  ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim()
                  : 'Unknown'
                
                return (
                  <TableRow key={request.id}>
                    <TableCell>{employeeName}</TableCell>
                    <TableCell>
                      {changedFields.length > 0 ? (
                        <Box>
                          {changedFields.slice(0, 2).map((field, idx) => (
                            <Typography key={idx} variant="body2">
                              {field.field}: {field.currentValue} → {field.newValue}
                            </Typography>
                          ))}
                          {changedFields.length > 2 && (
                            <Typography variant="body2" color="text.secondary">
                              {t('profile.moreChanges', { count: changedFields.length - 2 })}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t('profile.noChanges')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.createdAt 
                        ? dayjs(request.createdAt).format('YYYY-MM-DD HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openDetailDialog(request)}
                        title={t('profile.viewDetails')}
                        sx={{
                          color: '#667eea',
                          '&:hover': {
                            background: 'rgba(102, 126, 234, 0.1)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {request.status === 'PENDING' && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => openApproveDialog(request)}
                            title={t('profile.approve')}
                            sx={{
                              color: '#4caf50',
                              '&:hover': {
                                background: 'rgba(76, 175, 80, 0.1)',
                                transform: 'scale(1.1)',
                                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openRejectDialog(request)}
                            title={t('profile.reject')}
                            sx={{
                              color: '#f44336',
                              '&:hover': {
                                background: 'rgba(244, 67, 54, 0.1)',
                                transform: 'scale(1.1)',
                                boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('profile.viewDetails')} - {selectedRequest?.user 
            ? `${selectedRequest.user.firstName} ${selectedRequest.user.lastName}`
            : 'Unknown'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('profile.status')}
                  </Typography>
                  {getStatusChip(selectedRequest.status)}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('profile.submittedAt')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedRequest.createdAt 
                      ? dayjs(selectedRequest.createdAt).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </Typography>
                </Grid>
                {selectedRequest.reviewedAt && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('profile.reviewedAt')}
                      </Typography>
                      <Typography variant="body1">
                        {dayjs(selectedRequest.reviewedAt).format('YYYY-MM-DD HH:mm')}
                      </Typography>
                    </Grid>
                    {selectedRequest.reviewedBy && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('profile.reviewedBy')}
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.reviewedBy.firstName} {selectedRequest.reviewedBy.lastName}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}
                {selectedRequest.reviewNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('profile.reviewNotes')}
                    </Typography>
                    <Typography variant="body1">
                      {selectedRequest.reviewNotes}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {t('profile.requestedChanges')}
                  </Typography>
                  {getChangedFields(selectedRequest).map((field, idx) => (
                    <Box key={idx} sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        {field.field}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {t('profile.currentValue')}
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            p: 1, 
                            bgcolor: 'error.light', 
                            color: 'error.contrastText',
                            borderRadius: 1,
                            wordBreak: 'break-word'
                          }}>
                            {field.currentValue}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {t('profile.newValue')}
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            p: 1, 
                            bgcolor: 'success.light', 
                            color: 'success.contrastText',
                            borderRadius: 1,
                            wordBreak: 'break-word'
                          }}>
                            {field.newValue}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setDetailDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog 
        open={approveDialogOpen} 
        onClose={() => setApproveDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4caf50 0%, #388e3c 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            color: '#4caf50',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('profile.approve')} {t('profile.request')}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('profile.reviewNotes')}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)',
                }
              }
            }}
            placeholder={t('profile.optionalNotes')}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => {
            setApproveDialogOpen(false)
            setReviewNotes('')
            }}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleApprove} 
            variant="contained" 
            color="success"
            disabled={processing}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
              boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {processing ? t('common.processing') : t('profile.approve')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => setRejectDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #f44336 0%, #d32f2f 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            color: '#f44336',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('profile.reject')} {t('profile.request')}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('profile.reviewNotes')}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(244, 67, 54, 0.2)',
                }
              }
            }}
            placeholder={t('profile.rejectionReason')}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => {
            setRejectDialogOpen(false)
            setReviewNotes('')
            }}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            disabled={processing}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              boxShadow: '0 4px 16px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {processing ? t('common.processing') : t('profile.reject')}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  )
}

export default ProfileApprovals

