import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Security,
  QrCode,
  Download,
  Warning,
  CheckCircle,
  PhoneAndroid,
  PersonAdd,
  Refresh,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import QRCodeDisplay from '../components/QRCodeDisplay'
import api from '../services/api'

const AccessControl = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [employeeId, setEmployeeId] = useState(null)
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [deviceStatusList, setDeviceStatusList] = useState([])
  const [employeesWithoutDevices, setEmployeesWithoutDevices] = useState([])
  const [matchDialogOpen, setMatchDialogOpen] = useState(false)
  const [selectedEmployeeForMatch, setSelectedEmployeeForMatch] = useState(null)
  const [matchForm, setMatchForm] = useState({
    deviceId: '',
    deviceName: '',
    deviceType: 'MOBILE',
    osVersion: '',
    appVersion: '',
    deviceFingerprint: '',
  })
  const [deviceMatchQRCode, setDeviceMatchQRCode] = useState(null)
  const [deviceMatchQRLoading, setDeviceMatchQRLoading] = useState(false)
  const [selectedEmployeeForQR, setSelectedEmployeeForQR] = useState(null)
  const [nfcTagStatusList, setNfcTagStatusList] = useState([])
  const [nfcTagDialogOpen, setNfcTagDialogOpen] = useState(false)
  const [nfcTagId, setNfcTagId] = useState('')
  const [selectedEmployeeForNfcTag, setSelectedEmployeeForNfcTag] = useState(null)

  const isHR = user?.role === 'HR' || user?.role === 'ADMIN'

  // Ensure component re-renders when language changes
  useEffect(() => {
    const currentLang = i18n.language || localStorage.getItem('language') || 'en'
    // Update dayjs locale if needed
    if (typeof dayjs !== 'undefined' && dayjs.locale) {
      dayjs.locale(currentLang === 'tr' ? 'tr' : 'en')
    }
  }, [i18n.language])

  useEffect(() => {
    loadCurrentUser()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (isHR && user) {
      loadDeviceStatus()
      loadEmployeesWithoutDevices()
      loadNfcTagStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHR, user])

  const loadCurrentUser = async () => {
    // Skip for HR/ADMIN users who might not have employee records
    // They can select any employee from the list anyway
    const userRole = user?.role
    if (userRole === 'HR' || userRole === 'ADMIN') {
      setCurrentUser(null)
      return
    }
    
    try {
      const response = await api.get('/employee/me')
      const employee = response.data?.data || response.data
      setCurrentUser(employee)
      setEmployeeId(employee?.id || null)
      setSelectedEmployeeId(employee?.id?.toString() || '')
    } catch (err) {
      // Only log error if it's not a 500 (employee not found) or 404
      // Employee might not exist yet (e.g., for ADMIN users), that's okay
      if (err.response?.status !== 500 && err.response?.status !== 404) {
        console.error('Failed to load current user:', err)
      }
      // Don't set error state here as it's not critical for the page to function
      setCurrentUser(null)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employee?page=0&size=100')
      const employeeList = response.data?.data?.content || response.data?.content || []
      setEmployees(employeeList)
    } catch (err) {
      console.error('Failed to load employees:', err)
      // Only show error if user is HR/Admin (they should be able to see employees)
      if (isHR) {
        const errorMsg = err.response?.data?.message || err.message || t('accessControl.failedToLoadEmployees')
        setError(t('accessControl.failedToLoadEmployees') + ': ' + errorMsg)
      }
    }
  }

  const loadDeviceStatus = async () => {
    try {
      setLoading(true)
      const response = await api.get('/devices/employees/status')
      setDeviceStatusList(response.data?.data || [])
    } catch (err) {
      console.error('Failed to load device status:', err)
      const errorMsg = err.response?.data?.message || err.message || t('accessControl.failedToLoadDeviceStatus')
      setError(t('accessControl.failedToLoadDeviceStatus') + ': ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeesWithoutDevices = async () => {
    try {
      const response = await api.get('/devices/employees/without-devices')
      setEmployeesWithoutDevices(response.data?.data || [])
    } catch (err) {
      console.error('Failed to load employees without devices:', err)
    }
  }

  const handleEmployeeChange = (event) => {
    const id = event.target.value
    setSelectedEmployeeId(id)
    setEmployeeId(id ? parseInt(id) : null)
  }

  const handleGenerateQR = () => {
    if (!selectedEmployeeId) {
      setError(t('accessControl.pleaseSelectEmployee'))
      return
    }
    setEmployeeId(parseInt(selectedEmployeeId))
    setError(null)
  }

  const handleOpenMatchDialog = (employee) => {
    setSelectedEmployeeForMatch(employee)
    setMatchForm({
      deviceId: '',
      deviceName: '',
      deviceType: 'MOBILE',
      osVersion: '',
      appVersion: '',
      deviceFingerprint: '',
    })
    setMatchDialogOpen(true)
  }

  const handleGenerateDeviceMatchQR = async (employee) => {
    if (!employee || !employee.employeeId) {
      setError(t('accessControl.pleaseSelectEmployee'))
      return
    }

    try {
      setDeviceMatchQRLoading(true)
      setError(null)
      setSelectedEmployeeForQR(employee)
      const response = await api.get(`/devices/match-qr/${employee.employeeId}`, {
        params: { width: 400, height: 400 }
      })
      setDeviceMatchQRCode(response.data.data)
      setMatchDialogOpen(true) // Open dialog to show QR code
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t('accessControl.failedToGenerateQR')
      setError(errorMsg)
    } finally {
      setDeviceMatchQRLoading(false)
    }
  }

  const handleMatchEmployee = async () => {
    if (!selectedEmployeeForMatch || !matchForm.deviceId) {
      setError(t('accessControl.pleaseFillRequiredFields'))
      return
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(matchForm.deviceId)) {
      setError(t('accessControl.deviceIdMustBeUUID'))
      return
    }

    try {
      setLoading(true)
      setError(null)
      await api.post('/devices/match-employee', {
        employeeId: selectedEmployeeForMatch.employeeId,
        ...matchForm,
      })
      setSuccess(t('accessControl.deviceMatchedSuccessfully'))
      setMatchDialogOpen(false)
      await loadDeviceStatus()
      await loadEmployeesWithoutDevices()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t('accessControl.failedToMatchDevice')
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const loadNfcTagStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/employee/nfc-status')
      setNfcTagStatusList(response.data?.data || [])
    } catch (err) {
      console.error('Failed to load NFC tag status:', err)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t('accessControl.failedToLoadNfcTagStatus')
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNfcTagDialog = (status) => {
    setSelectedEmployeeForNfcTag({
      employeeId: status.employeeId,
      employeeName: status.employeeName,
      employeeEmail: status.employeeEmail
    })
    setNfcTagId('')
    setNfcTagDialogOpen(true)
  }

  const handleAssignNfcTag = async () => {
    if (!selectedEmployeeForNfcTag || !nfcTagId.trim()) {
      setError(t('accessControl.nfcTagIdRequired'))
      return
    }

    try {
      setLoading(true)
      setError(null)
      await api.post(`/employee/${selectedEmployeeForNfcTag.employeeId}/nfc-tag`, {
        nfcTagId: nfcTagId.trim()
      })
      setSuccess(t('accessControl.nfcTagAssignedSuccessfully'))
      setNfcTagDialogOpen(false)
      setNfcTagId('')
      setSelectedEmployeeForNfcTag(null)
      await loadNfcTagStatus()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t('accessControl.failedToAssignNfcTag')
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveNfcTag = async (status) => {
    if (!window.confirm(t('accessControl.confirmRemoveNfcTag', { name: status.employeeName }))) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await api.delete(`/employee/${status.employeeId}/nfc-tag`)
      setSuccess(t('accessControl.nfcTagRemovedSuccessfully'))
      await loadNfcTagStatus()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t('accessControl.failedToRemoveNfcTag')
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
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
        <Box display="flex" alignItems="center" gap={2} mb={3}>
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
            <Security sx={{ fontSize: 28, color: 'white' }} />
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
        {t('pageTitles.accessControl')}
      </Typography>
          </Box>
        </Box>

      {/* Warning for employees without devices */}
      {isHR && employeesWithoutDevices.length > 0 && (
        <Alert
          severity="warning"
          icon={<Warning />}
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                loadEmployeesWithoutDevices()
                loadDeviceStatus()
              }}
            >
              <Refresh sx={{ mr: 1 }} />
              {t('common.refresh')}
            </Button>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            {t('accessControl.employeesWithoutMatchedDevice', { count: employeesWithoutDevices.length })}
          </Typography>
          <Typography variant="body2">
            {t('accessControl.pleaseMatchDevicesForEmployees')}
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
            {employeesWithoutDevices.slice(0, 5).map((emp) => (
              <li key={emp.employeeId}>
                {emp.employeeName} ({emp.employeeEmail})
              </li>
            ))}
            {employeesWithoutDevices.length > 5 && (
              <li>{t('accessControl.andMore', { count: employeesWithoutDevices.length - 5 })}</li>
            )}
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {isHR ? (
        <Box>
          <Tabs 
            key={i18n.language} 
            value={tabValue} 
            onChange={handleTabChange}
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
            <Tab label={t('accessControl.qrCodeGenerator')} />
            <Tab label={t('accessControl.deviceMatching')} />
            <Tab label={t('accessControl.nfcTagManagement')} />
          </Tabs>

          {tabValue === 0 && (
            <Paper 
              sx={{ 
                p: 3, 
                mb: 3,
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
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Security sx={{ fontSize: 48, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('accessControl.systemTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('accessControl.systemDescription')}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>{t('accessControl.selectEmployee')}</InputLabel>
                    <Select
                      value={selectedEmployeeId}
                      onChange={handleEmployeeChange}
                      label={t('accessControl.selectEmployee')}
                    >
                      {currentUser && (
                        <MenuItem value={currentUser.id?.toString()}>
                          {currentUser.firstName} {currentUser.lastName} ({t('accessControl.currentUser')})
                        </MenuItem>
                      )}
                      {employees
                        .filter((emp) => !currentUser || emp.id !== currentUser.id)
                        .map((employee) => (
                          <MenuItem key={employee.id} value={employee.id?.toString()}>
                            {employee.firstName} {employee.lastName} ({employee.email})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<QrCode />}
                    onClick={handleGenerateQR}
                    disabled={!selectedEmployeeId}
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
                    {t('accessControl.generateQR')}
                  </Button>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    {t('accessControl.qrCodesFollowStandard')}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  {employeeId ? (
                    <QRCodeDisplay employeeId={employeeId} size={300} showDownload={true} />
                  ) : (
                    <Paper
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: 'grey.50',
                        border: '2px dashed',
                        borderColor: 'grey.300',
                      }}
                    >
                      <QrCode sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        {t('accessControl.selectEmployeeAndClickGenerate')}
                      </Typography>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}

          {tabValue === 1 && (
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">{t('accessControl.employeeDeviceMatching')}</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => {
                    loadDeviceStatus()
                    loadEmployeesWithoutDevices()
                  }}
                >
                  {t('accessControl.refresh')}
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('accessControl.matchEmployeesWithDevices')}
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table key={i18n.language}>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('accessControl.employee')}</TableCell>
                        <TableCell>{t('accessControl.email')}</TableCell>
                        <TableCell>{t('accessControl.deviceStatus')}</TableCell>
                        <TableCell>{t('accessControl.deviceInfo')}</TableCell>
                        <TableCell>{t('accessControl.registered')}</TableCell>
                        <TableCell align="right">{t('accessControl.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deviceStatusList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="text.secondary" py={3}>
                              {t('accessControl.noEmployeesFound')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        deviceStatusList.map((status) => (
                          <TableRow key={status.employeeId} hover>
                            <TableCell>
                              <Typography fontWeight="medium">
                                {status.employeeName}
                              </Typography>
                            </TableCell>
                            <TableCell>{status.employeeEmail}</TableCell>
                            <TableCell>
                              {status.hasDevice ? (
                                <Chip
                                  icon={<CheckCircle />}
                                  label={t('accessControl.deviceMatched')}
                                  color="success"
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  icon={<Warning />}
                                  label={t('accessControl.noDevice')}
                                  color="warning"
                                  size="small"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {status.hasDevice ? (
                                <Box>
                                  <Typography variant="body2">
                                    <strong>{t('accessControl.device')}:</strong> {status.deviceName || t('accessControl.unknown')}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                    {status.deviceId?.substring(0, 20)}...
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {t('accessControl.noDeviceRegistered')}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {status.registeredAt
                                ? new Date(status.registeredAt).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {!status.hasDevice ? (
                                <Box display="flex" gap={1} justifyContent="flex-end">
                                  <Tooltip title={t('accessControl.generateQRForMatch')}>
                                    <IconButton
                                      color="primary"
                                      onClick={() => handleGenerateDeviceMatchQR(status)}
                                      disabled={deviceMatchQRLoading}
                                    >
                                      <QrCode />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={t('accessControl.matchDeviceManually')}>
                                    <IconButton
                                      color="secondary"
                                      onClick={() => handleOpenMatchDialog(status)}
                                    >
                                      <PersonAdd />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Tooltip title={t('accessControl.deviceAlreadyMatched')}>
                                  <IconButton disabled>
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}

          {tabValue === 2 && (
            <Paper 
              sx={{ 
                p: 3, 
                mb: 3,
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
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <PhoneAndroid sx={{ fontSize: 48, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('accessControl.nfcTagManagement')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('accessControl.nfcTagManagementDescription')}
                  </Typography>
                </Box>
              </Box>

              <Box mb={3}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadNfcTagStatus}
                  disabled={loading}
                >
                  {t('common.refresh')}
                </Button>
              </Box>

              <TableContainer>
                <Table key={i18n.language}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('accessControl.employeeName')}</TableCell>
                      <TableCell>{t('accessControl.employeeEmail')}</TableCell>
                      <TableCell>{t('accessControl.nfcTagStatus')}</TableCell>
                      <TableCell>{t('accessControl.nfcTagId')}</TableCell>
                      <TableCell align="right">{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {nfcTagStatusList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            {loading ? t('common.loading') : t('accessControl.noEmployeesFound')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      nfcTagStatusList.map((status) => (
                        <TableRow key={status.employeeId}>
                          <TableCell>{status.employeeName}</TableCell>
                          <TableCell>{status.employeeEmail}</TableCell>
                          <TableCell>
                            {status.hasNfcTag ? (
                              <Chip
                                label={t('accessControl.assigned')}
                                color="success"
                                size="small"
                                icon={<CheckCircle />}
                              />
                            ) : (
                              <Chip
                                label={t('accessControl.notAssigned')}
                                color="warning"
                                size="small"
                                icon={<Warning />}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {status.nfcTagId ? (
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                {status.nfcTagId}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {status.hasNfcTag ? (
                              <Tooltip title={t('accessControl.removeNfcTag')}>
                                <IconButton
                                  color="error"
                                  onClick={() => handleRemoveNfcTag(status)}
                                  disabled={loading}
                                >
                                  <PersonAdd />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title={t('accessControl.assignNfcTag')}>
                                <IconButton
                                  color="primary"
                                  onClick={() => handleOpenNfcTagDialog(status)}
                                  disabled={loading}
                                >
                                  <PersonAdd />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      ) : (
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={2}>
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
              <Security sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography 
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t('accessControl.systemTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('accessControl.systemDescription')}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('accessControl.selectEmployee')}</InputLabel>
                <Select
                  value={selectedEmployeeId}
                  onChange={handleEmployeeChange}
                  label={t('accessControl.selectEmployee')}
                >
                  {currentUser && (
                    <MenuItem value={currentUser.id?.toString()}>
                      {currentUser.firstName} {currentUser.lastName} ({t('accessControl.currentUser')})
                    </MenuItem>
                  )}
                  {employees
                    .filter((emp) => !currentUser || emp.id !== currentUser.id)
                    .map((employee) => (
                      <MenuItem key={employee.id} value={employee.id?.toString()}>
                        {employee.firstName} {employee.lastName} ({employee.email})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<QrCode />}
                onClick={handleGenerateQR}
                disabled={!selectedEmployeeId}
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
                {t('accessControl.generateQR')}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                {t('accessControl.qrCodesFollowStandard')}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              {employeeId ? (
                <QRCodeDisplay employeeId={employeeId} size={300} showDownload={true} />
              ) : (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'grey.50',
                    border: '2px dashed',
                    borderColor: 'grey.300',
                  }}
                >
                  <QrCode sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {t('accessControl.selectEmployeeAndClickGenerate')}
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Match Device Dialog */}
      <Dialog open={matchDialogOpen} onClose={() => {
        setMatchDialogOpen(false)
        setDeviceMatchQRCode(null)
        setSelectedEmployeeForQR(null)
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {deviceMatchQRCode 
            ? t('accessControl.scanQRWithMobile')
            : t('accessControl.matchDeviceWithEmployee')}
        </DialogTitle>
        <DialogContent>
          {deviceMatchQRCode ? (
            <Box>
              {selectedEmployeeForQR && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('accessControl.employee')}:
                  </Typography>
                  <Typography variant="h6">
                    {selectedEmployeeForQR.employeeName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedEmployeeForQR.employeeEmail}
                  </Typography>
                </Box>
              )}
              <Box display="flex" flexDirection="column" alignItems="center" gap={2} mb={2}>
                <Paper sx={{ p: 2, backgroundColor: 'white' }}>
                  <img 
                    src={deviceMatchQRCode.image} 
                    alt="Device Match QR Code" 
                    style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
                  />
                </Paper>
                <Alert severity="info">
                  <Typography variant="body2">
                    {t('accessControl.qrCodeInstructions')}
                  </Typography>
                  <Typography variant="body2">
                    {t('accessControl.qrCodeInstructions2')}
                  </Typography>
                  <Typography variant="body2">
                    {t('accessControl.qrCodeInstructions3')}
                  </Typography>
                  <Typography variant="body2">
                    {t('accessControl.qrCodeInstructions4')}
                  </Typography>
                </Alert>
                <Typography variant="caption" color="text.secondary">
                  {t('accessControl.qrCodeExpires')}
                </Typography>
              </Box>
              <Box display="flex" gap={2} justifyContent="center" mt={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setDeviceMatchQRCode(null)
                    setSelectedEmployeeForQR(null)
                    handleOpenMatchDialog(selectedEmployeeForQR)
                  }}
                >
                  {t('accessControl.manualEntry')}
                </Button>
              </Box>
            </Box>
          ) : (
            <>
          {selectedEmployeeForMatch && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('accessControl.employee')}:
              </Typography>
              <Typography variant="h6">
                {selectedEmployeeForMatch.employeeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedEmployeeForMatch.employeeEmail}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label={t('accessControl.deviceIdUUID')}
            value={matchForm.deviceId}
            onChange={(e) => setMatchForm({ ...matchForm, deviceId: e.target.value })}
            required
            sx={{ mb: 2 }}
            helperText={t('accessControl.deviceIdFormat')}
            placeholder={t('accessControl.deviceIdPlaceholder')}
          />

          <TextField
            fullWidth
            label={t('accessControl.deviceName')}
            value={matchForm.deviceName}
            onChange={(e) => setMatchForm({ ...matchForm, deviceName: e.target.value })}
            sx={{ mb: 2 }}
            placeholder={t('accessControl.deviceNamePlaceholder')}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('accessControl.deviceType')}</InputLabel>
            <Select
              value={matchForm.deviceType}
              onChange={(e) => setMatchForm({ ...matchForm, deviceType: e.target.value })}
              label={t('accessControl.deviceType')}
            >
              <MenuItem value="MOBILE">{t('accessControl.mobile')}</MenuItem>
              <MenuItem value="TABLET">{t('accessControl.tablet')}</MenuItem>
              <MenuItem value="DESKTOP">{t('accessControl.desktop')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('accessControl.osVersionOptional')}
            value={matchForm.osVersion}
            onChange={(e) => setMatchForm({ ...matchForm, osVersion: e.target.value })}
            sx={{ mb: 2 }}
            placeholder={t('accessControl.osVersionPlaceholder')}
          />

          <TextField
            fullWidth
            label={t('accessControl.appVersionOptional')}
            value={matchForm.appVersion}
            onChange={(e) => setMatchForm({ ...matchForm, appVersion: e.target.value })}
            sx={{ mb: 2 }}
            placeholder={t('accessControl.appVersionPlaceholder')}
          />

          <TextField
            fullWidth
            label={t('accessControl.deviceFingerprintOptional')}
            value={matchForm.deviceFingerprint}
            onChange={(e) => setMatchForm({ ...matchForm, deviceFingerprint: e.target.value })}
            placeholder={t('accessControl.additionalSecurityFingerprint')}
          />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setMatchDialogOpen(false)
            setDeviceMatchQRCode(null)
            setSelectedEmployeeForQR(null)
          }}>
            {t('common.cancel')}
          </Button>
          {!deviceMatchQRCode && (
            <Button
              onClick={handleMatchEmployee}
              variant="contained"
              disabled={loading || !matchForm.deviceId}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)'
                }
              }}
            >
              {loading ? <CircularProgress size={20} /> : t('accessControl.matchDevice')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* NFC Tag Assignment Dialog */}
      <Dialog open={nfcTagDialogOpen} onClose={() => {
        setNfcTagDialogOpen(false)
        setNfcTagId('')
        setSelectedEmployeeForNfcTag(null)
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('accessControl.assignNfcTag')}
        </DialogTitle>
        <DialogContent>
          {selectedEmployeeForNfcTag && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('accessControl.employee')}:
              </Typography>
              <Typography variant="h6">
                {selectedEmployeeForNfcTag.employeeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedEmployeeForNfcTag.employeeEmail}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label={t('accessControl.nfcTagId')}
            value={nfcTagId}
            onChange={(e) => setNfcTagId(e.target.value)}
            required
            sx={{ mb: 2 }}
            helperText={t('accessControl.nfcTagIdHelper')}
            placeholder={t('accessControl.nfcTagIdPlaceholder')}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {t('accessControl.nfcTagInstructions')}
            </Typography>
            <Typography variant="body2">
              {t('accessControl.nfcTagInstructions2')}
            </Typography>
            <Typography variant="body2">
              {t('accessControl.nfcTagInstructions3')}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNfcTagDialogOpen(false)
            setNfcTagId('')
            setSelectedEmployeeForNfcTag(null)
          }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleAssignNfcTag}
            variant="contained"
            disabled={loading || !nfcTagId.trim()}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : t('accessControl.assignNfcTag')}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  )
}

export default AccessControl
