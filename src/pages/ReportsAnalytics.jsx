import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material'
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const ReportsAnalytics = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reportType, setReportType] = useState('attendance')
  const [dateRange, setDateRange] = useState('THIS_MONTH')
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    fetchReportData()
  }, [reportType, dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/reports/${reportType}?range=${dateRange}`)
      setReportData(response.data.data)
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      setError(t('reportsAnalytics.failedToLoadReportData'))
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await api.get(
        `/api/reports/${reportType}/export?range=${dateRange}&format=${format}`,
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report_${reportType}_${dateRange}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError(t('reportsAnalytics.failedToExportReport'))
    }
  }

  const canAccessReports = user?.role === 'ADMIN' || user?.role === 'HR'

  if (!canAccessReports) {
    return (
      <Box>
        <Alert severity="error">
          You don't have permission to access reports. Please contact your administrator.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('pageTitles.reportsAnalytics')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Generate comprehensive reports and insights
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchReportData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('xlsx')}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="attendance">Attendance Report</MenuItem>
                  <MenuItem value="leaves">Leave Report</MenuItem>
                  <MenuItem value="payroll">Payroll Summary</MenuItem>
                  <MenuItem value="performance">Performance Report</MenuItem>
                  <MenuItem value="department">Department Report</MenuItem>
                  <MenuItem value="overtime">Overtime Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="TODAY">Today</MenuItem>
                  <MenuItem value="THIS_WEEK">This Week</MenuItem>
                  <MenuItem value="THIS_MONTH">This Month</MenuItem>
                  <MenuItem value="LAST_MONTH">Last Month</MenuItem>
                  <MenuItem value="THIS_QUARTER">This Quarter</MenuItem>
                  <MenuItem value="THIS_YEAR">This Year</MenuItem>
                  <MenuItem value="CUSTOM">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Records
                      </Typography>
                      <Typography variant="h4">
                        {reportData?.summary?.totalRecords || 0}
                      </Typography>
                    </Box>
                    <BarChartIcon sx={{ fontSize: 48, color: '#1976d2' }} />
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
                        Average
                      </Typography>
                      <Typography variant="h4">
                        {reportData?.summary?.average || 0}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 48, color: '#4caf50' }} />
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
                        Total Hours
                      </Typography>
                      <Typography variant="h4">
                        {reportData?.summary?.totalHours || 0}h
                      </Typography>
                    </Box>
                    <DateRangeIcon sx={{ fontSize: 48, color: '#ff9800' }} />
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
                        Rate
                      </Typography>
                      <Typography variant="h4">
                        {reportData?.summary?.rate || 0}%
                      </Typography>
                    </Box>
                    <PieChartIcon sx={{ fontSize: 48, color: '#9c27b0' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Report Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Report
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Days Present</TableCell>
                      <TableCell>Total Hours</TableCell>
                      <TableCell>Overtime</TableCell>
                      <TableCell>Leaves</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData?.details && reportData.details.length > 0 ? (
                      reportData.details.map((row, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{row.employeeName || 'N/A'}</TableCell>
                          <TableCell>{row.department || 'N/A'}</TableCell>
                          <TableCell>{row.daysPresent || 0}</TableCell>
                          <TableCell>{row.totalHours || 0}h</TableCell>
                          <TableCell>{row.overtime || 0}h</TableCell>
                          <TableCell>{row.leaves || 0}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.status || 'N/A'}
                              color={row.status === 'Good' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="textSecondary" py={3}>
                            No data available for the selected criteria
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Chart Placeholders */}
          <Grid container spacing={3} mt={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attendance Trend
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight={300}
                    bgcolor="grey.100"
                    borderRadius={1}
                  >
                    <Typography color="textSecondary">
                      Chart placeholder - integrate charting library (Chart.js/Recharts)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Department Distribution
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight={300}
                    bgcolor="grey.100"
                    borderRadius={1}
                  >
                    <Typography color="textSecondary">
                      Chart placeholder - integrate charting library (Chart.js/Recharts)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default ReportsAnalytics

