import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Tooltip,
  InputAdornment
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Computer as ComputerIcon,
  Tablet as TabletIcon,
  DevicesOther as DevicesOtherIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const DeviceManagement = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [devices, setDevices] = useState([])
  const [filteredDevices, setFilteredDevices] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [newDevice, setNewDevice] = useState({
    employeeId: '',
    deviceType: 'MOBILE',
    deviceName: '',
    deviceId: '',
    fingerprint: ''
  })

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = devices.filter(device =>
        device.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.deviceId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredDevices(filtered)
    } else {
      setFilteredDevices(devices)
    }
  }, [searchQuery, devices])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/devices')
      setDevices(response.data.data || [])
      setFilteredDevices(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch devices:', err)
      setError('Failed to load devices. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDevice = async () => {
    try {
      await api.post('/devices', newDevice)
      setSuccess('Device added successfully!')
      setAddDialogOpen(false)
      setNewDevice({
        employeeId: '',
        deviceType: 'MOBILE',
        deviceName: '',
        deviceId: '',
        fingerprint: ''
      })
      await fetchDevices()
    } catch (err) {
      setError('Failed to add device. Please try again.')
    }
  }

  const handleBlockDevice = async (deviceId) => {
    try {
      await api.put(`/api/devices/${deviceId}/block`)
      setSuccess('Device blocked successfully!')
      setBlockDialogOpen(false)
      setSelectedDevice(null)
      await fetchDevices()
    } catch (err) {
      setError('Failed to block device. Please try again.')
    }
  }

  const handleUnblockDevice = async (deviceId) => {
    try {
      await api.put(`/api/devices/${deviceId}/unblock`)
      setSuccess('Device unblocked successfully!')
      await fetchDevices()
    } catch (err) {
      setError('Failed to unblock device. Please try again.')
    }
  }

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await api.delete(`/api/devices/${deviceId}`)
        setSuccess('Device deleted successfully!')
        await fetchDevices()
      } catch (err) {
        setError('Failed to delete device. Please try again.')
      }
    }
  }

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'MOBILE': return <PhoneAndroidIcon />
      case 'TABLET': return <TabletIcon />
      case 'DESKTOP': return <ComputerIcon />
      default: return <DevicesOtherIcon />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'BLOCKED': return 'error'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  const canManageDevices = user?.role === 'ADMIN' || user?.role === 'HR'

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Device Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage employee devices and enforce security policies
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDevices}
            disabled={loading}
          >
            Refresh
          </Button>
          {canManageDevices && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Device
            </Button>
          )}
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Devices
                  </Typography>
                  <Typography variant="h4">
                    {devices.length}
                  </Typography>
                </Box>
                <SecurityIcon sx={{ fontSize: 48, color: '#1976d2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active
                  </Typography>
                  <Typography variant="h4">
                    {devices.filter(d => d.status === 'ACTIVE').length}
                  </Typography>
                </Box>
                <CheckIcon sx={{ fontSize: 48, color: '#4caf50' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Blocked
                  </Typography>
                  <Typography variant="h4">
                    {devices.filter(d => d.status === 'BLOCKED').length}
                  </Typography>
                </Box>
                <BlockIcon sx={{ fontSize: 48, color: '#f44336' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Mobile
                  </Typography>
                  <Typography variant="h4">
                    {devices.filter(d => d.deviceType === 'MOBILE').length}
                  </Typography>
                </Box>
                <PhoneAndroidIcon sx={{ fontSize: 48, color: '#9c27b0' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder={t('deviceManagement.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Status</TableCell>
                  {canManageDevices && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageDevices ? 7 : 6} align="center">
                      <Typography color="textSecondary" py={3}>
                        {searchQuery ? 'No devices found matching your search' : 'No devices registered'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getDeviceIcon(device.deviceType)}
                          <Typography>{device.deviceName || t('deviceManagement.unknownDevice')}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{device.employeeName || 'N/A'}</TableCell>
                      <TableCell>{device.deviceType}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {device.deviceId?.substring(0, 20)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {device.lastUsed ? new Date(device.lastUsed).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={device.status || 'ACTIVE'}
                          color={getStatusColor(device.status)}
                          size="small"
                        />
                      </TableCell>
                      {canManageDevices && (
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            {device.status === 'ACTIVE' ? (
                              <Tooltip title={t('deviceManagement.blockDevice')}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedDevice(device)
                                    setBlockDialogOpen(true)
                                  }}
                                >
                                  <BlockIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title={t('deviceManagement.unblockDevice')}>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleUnblockDevice(device.id)}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title={t('deviceManagement.deleteDevice')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteDevice(device.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('deviceManagement.addNewDevice')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('deviceManagement.employeeId')}
                type="number"
                value={newDevice.employeeId}
                onChange={(e) => setNewDevice({ ...newDevice, employeeId: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label={t('deviceManagement.deviceType')}
                value={newDevice.deviceType}
                onChange={(e) => setNewDevice({ ...newDevice, deviceType: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="MOBILE">Mobile</option>
                <option value="TABLET">Tablet</option>
                <option value="DESKTOP">Desktop</option>
                <option value="OTHER">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('deviceManagement.deviceName')}
                value={newDevice.deviceName}
                onChange={(e) => setNewDevice({ ...newDevice, deviceName: e.target.value })}
                placeholder="e.g., iPhone 13 Pro"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('deviceManagement.deviceId')}
                value={newDevice.deviceId}
                onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                required
                helperText={t('deviceManagement.uniqueIdentifier')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('deviceManagement.deviceFingerprintOptional')}
                value={newDevice.fingerprint}
                onChange={(e) => setNewDevice({ ...newDevice, fingerprint: e.target.value })}
                helperText={t('deviceManagement.additionalSecurityFingerprint')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDevice} variant="contained">Add Device</Button>
        </DialogActions>
      </Dialog>

      {/* Block Device Dialog */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>Block Device?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to block this device? The employee will not be able to use this device until it is unblocked.
          </Typography>
          {selectedDevice && (
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                <strong>Device:</strong> {selectedDevice.deviceName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Employee:</strong> {selectedDevice.employeeName}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleBlockDevice(selectedDevice?.id)}
            color="error"
            variant="contained"
          >
            Block Device
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DeviceManagement

