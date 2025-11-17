import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import {
  Box, Typography, Grid, Paper, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Card, CardContent, LinearProgress,
  Chip, Alert, Button, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton
} from '@mui/material'
import {
  TrendingUp, Error, Speed, Storage, Memory, Api, Warning, CheckCircle,
  Refresh as RefreshIcon, Computer as ComputerIcon, CloudOff as CloudOffIcon
} from '@mui/icons-material'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [apiLogs, setApiLogs] = useState([])
  const [errors, setErrors] = useState([])
  const [metrics, setMetrics] = useState([])
  const [slowRequests, setSlowRequests] = useState([])
  const [topEndpoints, setTopEndpoints] = useState([])
  const [timeRange, setTimeRange] = useState(24)
  const [healthData, setHealthData] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchMonitoringData()
      fetchHealthData()
      const interval = autoRefresh ? setInterval(() => {
        fetchMonitoringData()
        fetchHealthData()
      }, 30000) : null
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [user, timeRange, autoRefresh])

  const fetchMonitoringData = async () => {
    try {
      const [overviewRes, logsRes, errorsRes, metricsRes, slowRes, endpointsRes] = await Promise.all([
        api.get('/monitoring/overview').catch(() => ({ data: { data: {} } })),
        api.get(`/monitoring/logs/recent?hours=${timeRange}&limit=50`).catch(() => ({ data: { data: [] } })),
        api.get(`/monitoring/logs/errors?hours=${timeRange}&limit=50`).catch(() => ({ data: { data: [] } })),
        api.get(`/monitoring/metrics?hours=${timeRange}`).catch(() => ({ data: { data: [] } })),
        api.get(`/monitoring/logs/slow?hours=${timeRange}&thresholdMs=1000`).catch(() => ({ data: { data: [] } })),
        api.get(`/monitoring/stats/endpoints?hours=${timeRange}`).catch(() => ({ data: { data: [] } }))
      ])

      setOverview(overviewRes.data.data || {})
      setApiLogs(logsRes.data.data || [])
      setErrors(errorsRes.data.data || [])
      setMetrics(metricsRes.data.data || [])
      setSlowRequests(slowRes.data.data || [])
      setTopEndpoints(endpointsRes.data.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
      setLoading(false)
    }
  }

  const fetchHealthData = async () => {
    try {
      const response = await api.get('/admin/health/all').catch(() => ({ data: { data: [] } }))
      setHealthData(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch health data:', err)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle color="success" />
      case 'WARNING':
        return <Warning color="warning" />
      case 'CRITICAL':
        return <Error color="error" />
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
    if (!seconds) return t('common.notAvailable')
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

  if (!user || user.role !== 'ADMIN') {
    return (
      <Box p={3}>
        <Alert severity="error">Access Denied - ADMIN role required</Alert>
      </Box>
    )
  }

  if (loading) {
    return <Box p={3}><LinearProgress /></Box>
  }

  const healthySystems = healthData.filter(h => h.healthStatus === 'HEALTHY').length
  const warningSystems = healthData.filter(h => h.healthStatus === 'WARNING').length
  const criticalSystems = healthData.filter(h => h.healthStatus === 'CRITICAL').length
  const offlineSystems = healthData.filter(h => h.healthStatus === 'OFFLINE').length

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('adminDashboard.title')}</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>{t('adminDashboard.timeRange')}</InputLabel>
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label={t('adminDashboard.timeRange')}>
              <MenuItem value={1}>{t('adminDashboard.lastHour')}</MenuItem>
              <MenuItem value={24}>{t('adminDashboard.last24Hours')}</MenuItem>
              <MenuItem value={168}>{t('adminDashboard.lastWeek')}</MenuItem>
              <MenuItem value={720}>{t('adminDashboard.lastMonth')}</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {t('adminDashboard.autoRefresh')}: {autoRefresh ? t('common.on') : t('common.off')}
          </Button>
          <IconButton onClick={() => { fetchMonitoringData(); fetchHealthData(); }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* System Health Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('adminDashboard.healthySystems')}</Typography>
                  <Typography variant="h4" color="success.main">{healthySystems}</Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('adminDashboard.warnings')}</Typography>
                  <Typography variant="h4" color="warning.main">{warningSystems}</Typography>
                </Box>
                <Warning sx={{ fontSize: 48, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('adminDashboard.critical')}</Typography>
                  <Typography variant="h4" color="error.main">{criticalSystems}</Typography>
                </Box>
                <Error sx={{ fontSize: 48, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('adminDashboard.offline')}</Typography>
                  <Typography variant="h4" color="text.secondary">{offlineSystems}</Typography>
                </Box>
                <CloudOffIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('adminDashboard.totalRequests')}</Typography>
                  <Typography variant="h4">{overview?.totalRequests24h || 0}</Typography>
                  <Typography variant="caption" color="textSecondary">{t('adminDashboard.last24h')}</Typography>
                </Box>
                <Api sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('adminDashboard.errorRate')}</Typography>
                  <Typography variant="h4">{(overview?.errorRate || 0).toFixed(2)}%</Typography>
                  <Typography variant="caption" color="error">{overview?.totalErrors24h || 0} {t('adminDashboard.errors')}</Typography>
                </Box>
                <Error sx={{ fontSize: 48, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('adminDashboard.avgResponseTime')}</Typography>
                  <Typography variant="h4">{(overview?.avgResponseTime || 0).toFixed(0)}ms</Typography>
                  <Typography variant="caption" color="textSecondary">{t('adminDashboard.average')}</Typography>
                </Box>
                <Speed sx={{ fontSize: 48, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('adminDashboard.memoryUsage')}</Typography>
                  <Typography variant="h4">{(overview?.memoryUsagePercent || 0).toFixed(1)}%</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {overview?.memoryUsed}MB / {overview?.memoryMax}MB
                  </Typography>
                </Box>
                <Memory sx={{ fontSize: 48, color: 'warning.main' }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={overview?.memoryUsagePercent || 0} 
                sx={{ mt: 1 }}
                color={overview?.memoryUsagePercent > 85 ? 'error' : 'primary'}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable">
          <Tab label={t('adminDashboard.systemHealth')} />
          <Tab label={t('adminDashboard.apiLogs')} />
          <Tab label={t('adminDashboard.errors')} />
          <Tab label={t('adminDashboard.performance')} />
          <Tab label={t('adminDashboard.topEndpoints')} />
          <Tab label={t('adminDashboard.systemMetrics')} />
        </Tabs>

        <Box p={3}>
          {/* System Health Tab */}
          {tab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('adminDashboard.status')}</TableCell>
                    <TableCell>{t('adminDashboard.company')}</TableCell>
                    <TableCell>{t('adminDashboard.deploymentId')}</TableCell>
                    <TableCell>{t('adminDashboard.type')}</TableCell>
                    <TableCell>{t('adminDashboard.cpu')}</TableCell>
                    <TableCell>{t('adminDashboard.memory')}</TableCell>
                    <TableCell>{t('adminDashboard.disk')}</TableCell>
                    <TableCell>{t('adminDashboard.uptime')}</TableCell>
                    <TableCell>{t('adminDashboard.lastHeartbeat')}</TableCell>
                    <TableCell>{t('adminDashboard.version')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {healthData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        {t('adminDashboard.noHealthDataAvailable')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    healthData.map((health) => (
                      <TableRow key={health.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
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
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={health.cpuUsage || 0}
                              sx={{ width: 60, height: 8, borderRadius: 1 }}
                              color={health.cpuUsage > 80 ? 'error' : health.cpuUsage > 60 ? 'warning' : 'primary'}
                            />
                            <Typography variant="body2">
                              {health.cpuUsage ? `${health.cpuUsage.toFixed(1)}%` : t('common.notAvailable')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={health.memoryUsage || 0}
                              sx={{ width: 60, height: 8, borderRadius: 1 }}
                              color={health.memoryUsage > 80 ? 'error' : health.memoryUsage > 60 ? 'warning' : 'primary'}
                            />
                            <Typography variant="body2">
                              {health.memoryUsage ? `${health.memoryUsage.toFixed(1)}%` : t('common.notAvailable')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={health.diskUsage || 0}
                              sx={{ width: 60, height: 8, borderRadius: 1 }}
                              color={health.diskUsage > 80 ? 'error' : health.diskUsage > 60 ? 'warning' : 'primary'}
                            />
                            <Typography variant="body2">
                              {health.diskUsage ? `${health.diskUsage.toFixed(1)}%` : t('common.notAvailable')}
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
                            label={health.applicationVersion || t('common.notAvailable')}
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
          )}

          {/* API Logs Tab */}
          {tab === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('adminDashboard.timestamp')}</TableCell>
                    <TableCell>{t('adminDashboard.method')}</TableCell>
                    <TableCell>{t('adminDashboard.endpoint')}</TableCell>
                    <TableCell>{t('adminDashboard.status')}</TableCell>
                    <TableCell>{t('adminDashboard.duration')}</TableCell>
                    <TableCell>{t('adminDashboard.ip')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">{t('adminDashboard.noApiLogsAvailable')}</TableCell>
                    </TableRow>
                  ) : (
                    apiLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell><Chip label={log.httpMethod} size="small" color="primary" /></TableCell>
                        <TableCell>{log.endpoint}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.status} 
                            size="small" 
                            color={log.status === 'SUCCESS' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{log.durationMs}ms</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Errors Tab */}
          {tab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('adminDashboard.timestamp')}</TableCell>
                    <TableCell>{t('adminDashboard.endpoint')}</TableCell>
                    <TableCell>{t('adminDashboard.errorType')}</TableCell>
                    <TableCell>{t('adminDashboard.errorMessage')}</TableCell>
                    <TableCell>{t('adminDashboard.duration')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">{t('adminDashboard.noErrorsFound')}</TableCell>
                    </TableRow>
                  ) : (
                    errors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{error.endpoint}</TableCell>
                        <TableCell><Chip label={error.errorType || t('adminDashboard.error')} size="small" color="error" /></TableCell>
                        <TableCell>{error.errorMessage}</TableCell>
                        <TableCell>{error.durationMs}ms</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Performance Tab */}
          {tab === 3 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('adminDashboard.endpoint')}</TableCell>
                    <TableCell>{t('adminDashboard.duration')}</TableCell>
                    <TableCell>{t('adminDashboard.method')}</TableCell>
                    <TableCell>{t('adminDashboard.timestamp')}</TableCell>
                    <TableCell>{t('adminDashboard.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slowRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">{t('adminDashboard.noSlowRequestsFound')}</TableCell>
                    </TableRow>
                  ) : (
                    slowRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.endpoint}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${req.durationMs}ms`} 
                            size="small" 
                            color={req.durationMs > 5000 ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{req.httpMethod}</TableCell>
                        <TableCell>{new Date(req.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{req.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Top Endpoints Tab */}
          {tab === 4 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('adminDashboard.endpoint')}</TableCell>
                    <TableCell>{t('adminDashboard.requestCount')}</TableCell>
                    <TableCell>{t('adminDashboard.percentage')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topEndpoints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">{t('adminDashboard.noEndpointDataAvailable')}</TableCell>
                    </TableRow>
                  ) : (
                    topEndpoints.map((endpoint, index) => (
                      <TableRow key={index}>
                        <TableCell>{endpoint.path}</TableCell>
                        <TableCell>{endpoint.count}</TableCell>
                        <TableCell>
                          <LinearProgress 
                            variant="determinate" 
                            value={(endpoint.count / (overview?.totalRequests24h || 1)) * 100} 
                            sx={{ width: 200 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* System Metrics Tab */}
          {tab === 5 && (
            <Grid container spacing={2}>
              {metrics.length === 0 ? (
                <Grid item xs={12}>
                  <Typography align="center" color="textSecondary">{t('adminDashboard.noMetricsAvailable')}</Typography>
                </Grid>
              ) : (
                metrics.map((metric) => (
                  <Grid item xs={12} sm={6} md={4} key={metric.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{metric.metricName}</Typography>
                        <Typography variant="h4">{metric.value.toFixed(2)}</Typography>
                        <Typography variant="caption">{metric.unit}</Typography>
                        {metric.isAlert && (
                          <Chip label={t('adminDashboard.alert')} size="small" color="error" sx={{ mt: 1 }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default AdminDashboard
