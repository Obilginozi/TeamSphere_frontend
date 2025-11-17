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
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import QRCodeDisplay from '../components/QRCodeDisplay'
import api from '../services/api'

const AccessControl = () => {
  const { t } = useLanguage()
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

  const isHR = user?.role === 'HR' || user?.role === 'ADMIN'

  useEffect(() => {
    loadCurrentUser()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (isHR && user) {
      loadDeviceStatus()
      loadEmployeesWithoutDevices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHR, user])

  const loadCurrentUser = async () => {
    try {
      const response = await api.get('/employee/me')
      const employee = response.data?.data || response.data
      setCurrentUser(employee)
      setEmployeeId(employee?.id || null)
      setSelectedEmployeeId(employee?.id?.toString() || '')
    } catch (err) {
      console.error('Failed to load current user:', err)
      // Employee might not exist yet (e.g., for ADMIN users), that's okay
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
        setError('Failed to load employees: ' + (err.response?.data?.message || err.message))
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
      setError('Failed to load device status: ' + (err.response?.data?.message || err.message))
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
      setError('Please select an employee')
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

  const handleMatchEmployee = async () => {
    if (!selectedEmployeeForMatch || !matchForm.deviceId) {
      setError('Please fill in all required fields')
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('accessControl.title', 'Access Control')}
      </Typography>

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
              Refresh
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
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label={t('accessControl.qrCodeGenerator')} />
            <Tab label={t('accessControl.deviceMatching')} />
          </Tabs>

          {tabValue === 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Security sx={{ fontSize: 48, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('accessControl.systemTitle', 'QR Code Generator')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      'accessControl.systemDescription',
                      'Generate ISO/IEC 18004 compliant QR codes for employee access and identification'
                    )}
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
                  >
                    {t('accessControl.generateQR', 'Generate QR Code')}
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
            <Paper sx={{ p: 3 }}>
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
                  <Table>
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
                                <Tooltip title={t('accessControl.matchDevice')}>
                                  <IconButton
                                    color="primary"
                                    onClick={() => handleOpenMatchDialog(status)}
                                  >
                                    <PersonAdd />
                                  </IconButton>
                                </Tooltip>
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
        </Box>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Security sx={{ fontSize: 48, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('accessControl.systemTitle', 'QR Code Generator')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(
                  'accessControl.systemDescription',
                  'Generate ISO/IEC 18004 compliant QR codes for employee access and identification'
                )}
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
              >
                {t('accessControl.generateQR', 'Generate QR Code')}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                QR codes follow ISO/IEC 18004 standard and can be scanned by any standard QR code
                reader. The QR code contains employee identification data in JSON format.
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
      <Dialog open={matchDialogOpen} onClose={() => setMatchDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('accessControl.matchDeviceWithEmployee')}</DialogTitle>
        <DialogContent>
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
            placeholder="550e8400-e29b-41d4-a716-446655440000"
          />

          <TextField
            fullWidth
            label={t('accessControl.deviceName')}
            value={matchForm.deviceName}
            onChange={(e) => setMatchForm({ ...matchForm, deviceName: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="e.g., iPhone 13 Pro"
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
            placeholder="e.g., iOS 17.2, Android 14"
          />

          <TextField
            fullWidth
            label={t('accessControl.appVersionOptional')}
            value={matchForm.appVersion}
            onChange={(e) => setMatchForm({ ...matchForm, appVersion: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="e.g., 1.0.0"
          />

          <TextField
            fullWidth
            label={t('accessControl.deviceFingerprintOptional')}
            value={matchForm.deviceFingerprint}
            onChange={(e) => setMatchForm({ ...matchForm, deviceFingerprint: e.target.value })}
            placeholder={t('accessControl.additionalSecurityFingerprint')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMatchDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleMatchEmployee}
            variant="contained"
            disabled={loading || !matchForm.deviceId}
          >
            {loading ? <CircularProgress size={20} /> : t('accessControl.matchDevice')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AccessControl
