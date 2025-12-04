import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  LinearProgress,
  Alert
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

const SystemMonitoring = () => {
  const { t } = useTranslation()
  const [healthData, setHealthData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchHealthData()
    
    const interval = autoRefresh ? setInterval(fetchHealthData, 30000) : null
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/health/all')
      setHealthData(response.data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch health data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircleIcon color="success" />
      case 'WARNING':
        return <WarningIcon color="warning" />
      case 'CRITICAL':
        return <ErrorIcon color="error" />
      case 'OFFLINE':
        return <CloudOffIcon color="disabled" />
      default:
        return <ComputerIcon />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'HEALTHY':
        return 'success'
      case 'WARNING':
        return 'warning'
      case 'CRITICAL':
        return 'error'
      case 'OFFLINE':
        return 'default'
      default:
        return 'info'
    }
  }

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatLastHeartbeat = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  }

  const healthySystems = healthData.filter(h => h.healthStatus === 'HEALTHY').length
  const warningSystems = healthData.filter(h => h.healthStatus === 'WARNING').length
  const criticalSystems = healthData.filter(h => h.healthStatus === 'CRITICAL').length
  const offlineSystems = healthData.filter(h => h.healthStatus === 'OFFLINE').length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('pageTitles.systemMonitoring')}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{ mr: 2 }}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <IconButton onClick={fetchHealthData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Healthy Systems
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {healthySystems}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Warnings
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {warningSystems}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Critical
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {criticalSystems}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Offline
                  </Typography>
                  <Typography variant="h4" color="text.secondary">
                    {offlineSystems}
                  </Typography>
                </Box>
                <CloudOffIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Systems Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Client Deployments
          </Typography>
          {loading && <LinearProgress />}
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Deployment ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>CPU</TableCell>
                  <TableCell>Memory</TableCell>
                  <TableCell>Disk</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Last Heartbeat</TableCell>
                  <TableCell>Version</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {healthData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No health data available
                    </TableCell>
                  </TableRow>
                ) : (
                  healthData.map((health) => (
                    <TableRow key={health.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(health.healthStatus)}
                          <Chip
                            label={health.healthStatus}
                            color={getStatusColor(health.healthStatus)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{health.companyName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {health.deploymentId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={health.deploymentType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={health.cpuUsage || 0}
                            sx={{ width: 60, height: 8, borderRadius: 1 }}
                            color={health.cpuUsage > 80 ? 'error' : health.cpuUsage > 60 ? 'warning' : 'primary'}
                          />
                          <Typography variant="body2">
                            {health.cpuUsage ? `${health.cpuUsage.toFixed(1)}%` : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={health.memoryUsage || 0}
                            sx={{ width: 60, height: 8, borderRadius: 1 }}
                            color={health.memoryUsage > 80 ? 'error' : health.memoryUsage > 60 ? 'warning' : 'primary'}
                          />
                          <Typography variant="body2">
                            {health.memoryUsage ? `${health.memoryUsage.toFixed(1)}%` : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={health.diskUsage || 0}
                            sx={{ width: 60, height: 8, borderRadius: 1 }}
                            color={health.diskUsage > 80 ? 'error' : health.diskUsage > 60 ? 'warning' : 'primary'}
                          />
                          <Typography variant="body2">
                            {health.diskUsage ? `${health.diskUsage.toFixed(1)}%` : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatUptime(health.uptimeSeconds)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatLastHeartbeat(health.lastHeartbeat)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={health.applicationVersion || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SystemMonitoring

