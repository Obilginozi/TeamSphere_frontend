import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import {
  Box, Typography, Grid, Paper, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Card, CardContent, LinearProgress,
  Chip, Alert, Button, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import {
  TrendingUp, Error, Speed, Storage, Memory, Api, Warning, CheckCircle
} from '@mui/icons-material'

const Monitoring = () => {
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

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchMonitoringData()
      const interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [user, timeRange])

  const fetchMonitoringData = async () => {
    try {
      const [overviewRes, logsRes, errorsRes, metricsRes, slowRes, endpointsRes] = await Promise.all([
        api.get('/monitoring/overview'),
        api.get(`/monitoring/logs/recent?hours=${timeRange}&limit=50`),
        api.get(`/monitoring/logs/errors?hours=${timeRange}&limit=50`),
        api.get(`/monitoring/metrics?hours=${timeRange}`),
        api.get(`/monitoring/logs/slow?hours=${timeRange}&thresholdMs=1000`),
        api.get(`/monitoring/stats/endpoints?hours=${timeRange}`)
      ])

      setOverview(overviewRes.data.data)
      setApiLogs(logsRes.data.data)
      setErrors(errorsRes.data.data)
      setMetrics(metricsRes.data.data)
      setSlowRequests(slowRes.data.data)
      setTopEndpoints(endpointsRes.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
      setLoading(false)
    }
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

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">System Monitoring Dashboard</Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label="Time Range">
            <MenuItem value={1}>Last Hour</MenuItem>
            <MenuItem value={24}>Last 24 Hours</MenuItem>
            <MenuItem value={168}>Last Week</MenuItem>
            <MenuItem value={720}>Last Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>Total Requests</Typography>
                  <Typography variant="h4">{overview?.totalRequests24h || 0}</Typography>
                  <Typography variant="caption" color="textSecondary">Last 24h</Typography>
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
                  <Typography color="textSecondary" gutterBottom>Error Rate</Typography>
                  <Typography variant="h4">{(overview?.errorRate || 0).toFixed(2)}%</Typography>
                  <Typography variant="caption" color="error">{overview?.totalErrors24h || 0} errors</Typography>
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
                  <Typography color="textSecondary" gutterBottom>Avg Response Time</Typography>
                  <Typography variant="h4">{(overview?.avgResponseTime || 0).toFixed(0)}ms</Typography>
                  <Typography variant="caption" color="textSecondary">Average</Typography>
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
                  <Typography color="textSecondary" gutterBottom>Memory Usage</Typography>
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
          <Tab label="API Logs" />
          <Tab label="Errors" />
          <Tab label="Performance" />
          <Tab label="Top Endpoints" />
          <Tab label="System Metrics" />
        </Tabs>

        <Box p={3}>
          {/* API Logs Tab */}
          {tab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>IP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiLogs.map((log) => (
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Errors Tab */}
          {tab === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Error Type</TableCell>
                    <TableCell>Error Message</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{error.endpoint}</TableCell>
                      <TableCell><Chip label={error.errorType || 'ERROR'} size="small" color="error" /></TableCell>
                      <TableCell>{error.errorMessage}</TableCell>
                      <TableCell>{error.durationMs}ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Performance Tab */}
          {tab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slowRequests.map((req) => (
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Top Endpoints Tab */}
          {tab === 3 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Request Count</TableCell>
                    <TableCell>Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topEndpoints.map((endpoint, index) => (
                    <TableRow key={index}>
                      <TableCell>{endpoint.path}</TableCell>
                      <TableCell>{endpoint.count}</TableCell>
                      <TableCell>
                        <LinearProgress 
                          variant="determinate" 
                          value={(endpoint.count / overview?.totalRequests24h) * 100} 
                          sx={{ width: 200 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* System Metrics Tab */}
          {tab === 4 && (
            <Grid container spacing={2}>
              {metrics.map((metric) => (
                <Grid item xs={12} sm={6} md={4} key={metric.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{metric.metricName}</Typography>
                      <Typography variant="h4">{metric.value.toFixed(2)}</Typography>
                      <Typography variant="caption">{metric.unit}</Typography>
                      {metric.isAlert && (
                        <Chip label="ALERT" size="small" color="error" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default Monitoring


