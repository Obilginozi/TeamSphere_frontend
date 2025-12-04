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
            <InfoIcon sx={{ fontSize: 28, color: 'white' }} />
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
        {t('pageTitles.workdayReports')}
      </Typography>
          </Box>
        </Box>

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
        <Card 
          sx={{ 
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
                  {loading ? <CircularProgress size={24} /> : t('workdayReports.generateReport')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGenerateSummary}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  {t('workdayReports.summary')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportExcel}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
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
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)}
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
          <Tab label={t('workdayReports.detailedReport')} />
          <Tab label={t('workdayReports.summary')} />
        </Tabs>

        <Card
          sx={{
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
        <CardContent sx={{ pt: 3 }}>
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
                              sx={{
                                ...(report.status === 'PRESENT' ? {
                                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                                  color: 'white',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                                } : report.status === 'LATE' ? {
                                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                  color: 'white',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
                                } : report.status === 'ABSENT' ? {
                                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                                  color: 'white',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                                } : report.status === 'EARLY_LEAVE' ? {
                                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                  color: 'white',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
                                } : {
                                  background: 'rgba(158, 158, 158, 0.2)',
                                  color: '#424242',
                                  fontWeight: 500,
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                }),
                                borderRadius: 2,
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: report.status === 'PRESENT' 
                                    ? '0 4px 12px rgba(76, 175, 80, 0.4)' 
                                    : report.status === 'LATE' || report.status === 'EARLY_LEAVE'
                                    ? '0 4px 12px rgba(255, 152, 0, 0.4)'
                                    : report.status === 'ABSENT'
                                    ? '0 4px 12px rgba(244, 67, 54, 0.4)'
                                    : '0 4px 8px rgba(0, 0, 0, 0.15)'
                                },
                                transition: 'all 0.2s ease'
                              }}
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
    </Box>
  )
}

export default WorkdayReports

