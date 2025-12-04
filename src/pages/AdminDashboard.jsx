import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import {
  Box, Typography, Grid, Paper, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Card, CardContent, LinearProgress,
  Chip, Alert, Button, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Fade, Zoom, Grow, Avatar, CircularProgress
} from '@mui/material'
import {
  TrendingUp, Error, Speed, Storage, Memory, Api, Warning, CheckCircle,
  Refresh as RefreshIcon, Computer as ComputerIcon, CloudOff as CloudOffIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState('0')
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

  const StatCard = ({ title, value, icon, color, subtitle, index = 0 }) => (
    <Grow in timeout={600 + (index * 100)}>
      <Card 
        sx={{ 
          height: '100%',
          cursor: 'default',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
            background: color,
            opacity: 0.8
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
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
                {loading ? <CircularProgress size={28} /> : value}
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
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)', // Subtract AppBar height
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        position: 'relative',
        margin: -3, // Override Layout padding
        padding: 3, // Restore padding for content
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
        <Fade in timeout={600}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
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
                <DashboardIcon sx={{ fontSize: 28, color: 'white' }} />
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
                  {t('pageTitles.adminDashboard')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('adminDashboard.systemMonitoring') || 'System Monitoring & Analytics'}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <FormControl 
                size="small"
                sx={{ 
                  minWidth: 150,
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 1)',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)'
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 1)',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }
                }}
              >
                <InputLabel>{t('adminDashboard.timeRange')}</InputLabel>
                <Select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)} 
                  label={t('adminDashboard.timeRange')}
                >
                  <MenuItem value={1}>{t('adminDashboard.lastHour')}</MenuItem>
                  <MenuItem value={24}>{t('adminDashboard.last24Hours')}</MenuItem>
                  <MenuItem value={168}>{t('adminDashboard.lastWeek')}</MenuItem>
                  <MenuItem value={720}>{t('adminDashboard.lastMonth')}</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => { fetchMonitoringData(); fetchHealthData(); }}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {t('common.refresh')}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setAutoRefresh(!autoRefresh)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#667eea',
                  color: '#667eea',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: '#764ba2',
                    background: 'rgba(102, 126, 234, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {t('adminDashboard.autoRefresh')}: {autoRefresh ? t('common.on') : t('common.off')}
              </Button>
            </Box>
          </Box>
        </Fade>

        {/* System Health Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('adminDashboard.healthySystems')}
              value={healthySystems}
              icon={<CheckCircle />}
              color="#4caf50"
              index={0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('adminDashboard.warnings')}
              value={warningSystems}
              icon={<Warning />}
              color="#ff9800"
              index={1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('adminDashboard.critical')}
              value={criticalSystems}
              icon={<Error />}
              color="#f44336"
              index={2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('adminDashboard.offline')}
              value={offlineSystems}
              icon={<CloudOffIcon />}
              color="#9e9e9e"
              index={3}
            />
          </Grid>
        </Grid>

        {/* Performance Overview Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('adminDashboard.totalRequests')}
              value={overview?.totalRequests24h || 0}
              icon={<Api />}
              color="#1976d2"
              subtitle={t('adminDashboard.last24h')}
              index={4}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('adminDashboard.errorRate')}
              value={`${(overview?.errorRate || 0).toFixed(2)}%`}
              icon={<Error />}
              color="#f44336"
              subtitle={`${overview?.totalErrors24h || 0} ${t('adminDashboard.errors')}`}
              index={5}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('adminDashboard.avgResponseTime')}
              value={`${(overview?.avgResponseTime || 0).toFixed(0)}ms`}
              icon={<Speed />}
              color="#4caf50"
              subtitle={t('adminDashboard.average')}
              index={6}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('adminDashboard.memoryUsage')}
              value={`${(overview?.memoryUsagePercent || 0).toFixed(1)}%`}
              icon={<Memory />}
              color="#ff9800"
              subtitle={`${overview?.memoryUsed || 0}MB / ${overview?.memoryMax || 0}MB`}
              index={7}
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Tabs 
            value={tab} 
            onChange={(e, v) => setTab(String(v))} 
            variant="scrollable"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 64
              },
              '& .Mui-selected': {
                color: '#667eea'
              },
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                height: 3
              }
            }}
          >
            <Tab value="0" label={t('adminDashboard.systemHealth') || 'System Health'} />
            <Tab value="1" label={t('adminDashboard.apiLogs') || 'API Logs'} />
            <Tab value="2" label={t('adminDashboard.errors') || 'Errors'} />
            <Tab value="3" label={t('adminDashboard.performance') || 'Performance'} />
            <Tab value="4" label={t('adminDashboard.topEndpoints') || 'Top Endpoints'} />
            <Tab value="5" label={t('adminDashboard.systemMetrics') || 'System Metrics'} />
          </Tabs>

          <Zoom in timeout={1400}>
            <Box p={3}>
          {/* System Health Tab */}
          {tab === '0' && (
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
          {tab === '1' && (
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
          {tab === '2' && (
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
          {tab === '3' && (
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
          {tab === '4' && (
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
          {tab === '5' && (
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
          </Zoom>
        </Paper>
      </Box>
    </Box>
  )
}

export default AdminDashboard
