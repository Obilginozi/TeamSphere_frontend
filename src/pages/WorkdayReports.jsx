import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Download as DownloadIcon,
  Info as InfoIcon,
  NightsStay as NightIcon,
  WbSunny as DayIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function WorkdayReports() {
  const { t } = useTranslation()
  const [tabValue, setTabValue] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState([])
  const [summary, setSummary] = useState({})
  const [error, setError] = useState('')
  const [workdayInfo, setWorkdayInfo] = useState(null)

  // Load workday info on mount
  React.useEffect(() => {
    loadWorkdayInfo()
  }, [])

  const loadWorkdayInfo = async () => {
    try {
      const response = await api.get('/workday-reports/info')
      setWorkdayInfo(response.data.data)
    } catch (err) {
      console.error('Failed to load workday info:', err)
    }
  }

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError(t('workdayReports.selectDates'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.get('/workday-reports/range', {
        params: { startWorkday: startDate, endWorkday: endDate }
      })
      setReports(response.data.data)
    } catch (err) {
      setError(err.response?.data?.message || t('workdayReports.failedToGenerateReport'))
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    if (!startDate || !endDate) {
      setError(t('workdayReports.selectDates'))
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError(t('workdayReports.startDateBeforeEndDate'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.get('/workday-reports/summary', {
        params: { startWorkday: startDate, endWorkday: endDate }
      })
      if (response.data && response.data.data) {
        setSummary(response.data.data)
        if (Object.keys(response.data.data).length === 0) {
          setError(t('workdayReports.noSummaryDataFound'))
        }
      } else {
        setSummary({})
        setError(t('workdayReports.noSummaryDataReturned'))
      }
    } catch (err) {
      console.error('Failed to generate summary:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || t('workdayReports.failedToGenerateSummary')
      setError(errorMessage)
      setSummary({})
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      setError(t('workdayReports.selectDates'))
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError(t('workdayReports.startDateBeforeEndDate'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.get('/workday-reports/export/excel', {
        params: { startWorkday: startDate, endWorkday: endDate },
        responseType: 'blob'
      })

      if (response.data && response.data.size > 0) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Workday_Report_${startDate}_to_${endDate}.xlsx`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        setError(t('workdayReports.noDataToExport'))
      }
    } catch (err) {
      console.error('Failed to export Excel file:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || t('workdayReports.failedToExportExcel')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('workdayReports.title')}
        <Tooltip title={t('workdayReports.workdayRule')}>
          <IconButton size="small">
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Typography>

      {/* Workday Rule Information */}
      {workdayInfo && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>{t('workdayReports.workdayCalculationRule')}</strong>
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t('workdayReports.workdayRule')}
          </Typography>
          <Typography variant="caption">
            <strong>{t('workdayReports.examples')}</strong>
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>
              <Typography variant="caption">{t('workdayReports.example1')}</Typography>
            </li>
            <li>
              <Typography variant="caption">{t('workdayReports.example2')}</Typography>
            </li>
            <li>
              <Typography variant="caption">{t('workdayReports.example3')}</Typography>
            </li>
            <li>
              <Typography variant="caption">{t('workdayReports.example4')}</Typography>
            </li>
          </ul>
        </Alert>
      )}

      {/* Date Range Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label={t('workdayReports.startDate')}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label={t('workdayReports.endDate')}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleGenerateReport}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : t('workdayReports.generateReport')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGenerateSummary}
                  disabled={loading}
                >
                  {t('workdayReports.summary')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportExcel}
                  disabled={loading}
                >
                  {t('workdayReports.downloadReport')}
                </Button>
              </Box>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={t('workdayReports.detailedReport')} />
          <Tab label={t('workdayReports.summary')} />
        </Tabs>

        <Divider />

        <CardContent>
          {/* Detailed Report Tab */}
          {tabValue === 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('workdayReports.employee')}</TableCell>
                    <TableCell>{t('workdayReports.department')}</TableCell>
                    <TableCell>{t('workdayReports.workdayDate')}</TableCell>
                    <TableCell>{t('workdayReports.checkIn')}</TableCell>
                    <TableCell>{t('workdayReports.checkOut')}</TableCell>
                    <TableCell align="right">{t('workdayReports.totalHours')}</TableCell>
                    <TableCell align="right">{t('workdayReports.regular')}</TableCell>
                    <TableCell align="right">{t('workdayReports.overtime')}</TableCell>
                    <TableCell>{t('workdayReports.shiftType')}</TableCell>
                    <TableCell>{t('workdayReports.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="textSecondary">
                          {t('workdayReports.noDataAvailable')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report, index) => {
                      // Parse workdayDate (format: "2024-01-15")
                      const workdayDate = report.workdayDate 
                        ? (typeof report.workdayDate === 'string' 
                            ? new Date(report.workdayDate + 'T00:00:00')
                            : new Date(report.workdayDate))
                        : null
                      
                      return (
                        <TableRow key={report.employeeId ? `${report.employeeId}-${report.workdayDate}-${index}` : index}>
                          <TableCell>
                            <Typography variant="body2">
                              {report.employeeName || t('workdayReports.unknown')}
                            </Typography>
                            {report.employeeNumber && (
                              <Typography variant="caption" color="textSecondary">
                                {report.employeeNumber}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{report.department || t('common.not_available')}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {workdayDate ? workdayDate.toLocaleDateString() : report.workdayDate || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{report.checkInTime || '-'}</TableCell>
                          <TableCell>{report.checkOutTime || '-'}</TableCell>
                          <TableCell align="right">
                            <strong>{report.totalWorkingHours != null ? report.totalWorkingHours.toFixed(2) : '0.00'}</strong>
                          </TableCell>
                          <TableCell align="right">
                            {report.regularHours != null ? report.regularHours.toFixed(2) : '0.00'}
                          </TableCell>
                          <TableCell align="right">
                            {report.overtimeHours != null ? report.overtimeHours.toFixed(2) : '0.00'}
                          </TableCell>
                          <TableCell>
                            {report.isNightShift ? (
                              <Chip
                                icon={<NightIcon />}
                                label={t('workdayReports.nightShift')}
                                size="small"
                                color="secondary"
                              />
                            ) : (
                              <Chip
                                icon={<DayIcon />}
                                label={t('workdayReports.dayShift')}
                                size="small"
                                color="default"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.status === 'PRESENT' ? t('workdayReports.present') : 
                                     report.status === 'ABSENT' ? t('workdayReports.absent') :
                                     report.status === 'LATE' ? t('workdayReports.late') :
                                     report.status === 'EARLY_LEAVE' ? t('workdayReports.earlyLeave') : 
                                     (report.status || t('workdayReports.unknown'))}
                              size="small"
                              color={report.status === 'PRESENT' ? 'success' : 
                                     report.status === 'LATE' ? 'warning' :
                                     report.status === 'ABSENT' ? 'error' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Summary Tab */}
          {tabValue === 1 && (
            <Box>
              {Object.keys(summary).length === 0 ? (
                <Alert severity="info">
                  {t('workdayReports.noSummaryData')}
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {Object.entries(summary)
                    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                    .map(([date, data]) => {
                      // Parse date string (format: "2024-01-15")
                      const dateObj = new Date(date + 'T00:00:00')
                      return (
                        <Grid item xs={12} md={6} key={date}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {dateObj.toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="textSecondary">
                                    {t('employees.employees')}
                                  </Typography>
                                  <Typography variant="h5">
                                    {data.employeeCount || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="textSecondary">
                                    {t('workdayReports.totalHours')}
                                  </Typography>
                                  <Typography variant="h5">
                                    {data.totalHours ? data.totalHours.toFixed(1) : '0.0'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="textSecondary">
                                    {t('workdayReports.averageHours')}
                                  </Typography>
                                  <Typography variant="h6">
                                    {data.averageHours ? data.averageHours.toFixed(1) : '0.0'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="textSecondary">
                                    {t('workdayReports.overtime')}
                                  </Typography>
                                  <Typography variant="h6" color="warning.main">
                                    {data.overtimeHours ? data.overtimeHours.toFixed(1) : '0.0'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="textSecondary">
                                    {t('workdayReports.nightShiftWorkers')}
                                  </Typography>
                                  <Typography variant="h6">
                                    {data.nightShiftCount || 0}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      )
                    })}
                </Grid>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default WorkdayReports

