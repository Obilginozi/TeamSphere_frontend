import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  TablePagination
} from '@mui/material'
import {
  AccessTime,
  CalendarToday,
  TrendingUp,
  Download
} from '@mui/icons-material'
import api from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../utils/errorHandler'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'
import { useTranslation } from 'react-i18next'

const TimeLogs = () => {
  const { t } = useLanguage()
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR'
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState({
    totalHours: 0,
    daysWorked: 0,
    averageHours: 0,
    overtime: 0
  })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTimeHistory()
  }, [page, rowsPerPage, startDate, endDate, isAdminOrHR])
  
  useEffect(() => {
    fetchStats()
  }, [records, startDate, endDate, isAdminOrHR])

  const fetchTimeHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page,
        size: rowsPerPage,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }
      
      // For ADMIN/HR: use company-wide endpoint (respects X-Company-Id header)
      // For EMPLOYEE: use personal history endpoint
      const endpoint = isAdminOrHR ? '/time-logs' : '/time-logs/my-history'
      
      // Note: Company-wide endpoint accepts date params but may not filter by them
      // Date filtering is primarily for employee-specific views
      const response = await api.get(endpoint, { params })
      
      if (response.data && response.data.data) {
        // Handle both paginated response (company-wide) and direct array (my-history)
        if (response.data.data.content) {
          // Paginated response from company-wide endpoint
          setRecords(response.data.data.content || [])
          setTotalElements(response.data.data.totalElements || 0)
        } else if (Array.isArray(response.data.data)) {
          // Direct array from my-history endpoint
          setRecords(response.data.data || [])
          setTotalElements(response.data.data.length || 0)
        } else {
          setRecords([])
          setTotalElements(0)
        }
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, t('timeLogs.failedToLoad'))
      setError(errorMessage)
      console.error('Error fetching time history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Stats endpoint is only for employees (personal stats)
      // For ADMIN/HR, we can skip stats or calculate from the records
      if (!isAdminOrHR) {
        const response = await api.get('/time-logs/my-stats', {
          params: { startDate: startDate || undefined, endDate: endDate || undefined }
        })
        if (response.data && response.data.data) {
          setStats(response.data.data)
        }
      } else {
        // For ADMIN/HR, calculate stats from the fetched records
        // This is a simplified calculation - you might want to add a dedicated endpoint
        const totalHours = records.reduce((sum, r) => sum + (r.totalWorkingHours || 0), 0)
        const daysWorked = records.filter(r => r.checkOutTime).length
        const avgHours = daysWorked > 0 ? totalHours / daysWorked : 0
        const overtime = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0)
        setStats({
          totalHours: Math.round(totalHours * 10) / 10,
          daysWorked,
          averageHours: Math.round(avgHours * 10) / 10,
          overtime: Math.round(overtime * 10) / 10
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const formatTime = (time) => {
    if (!time) return '-'
    // Handle LocalTime string format (HH:mm:ss or HH:mm)
    if (typeof time === 'string') {
      const parts = time.split(':')
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10)
        const minutes = parseInt(parts[1], 10)
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
      }
    }
    return time
  }

  const formatDate = (date) => {
    if (!date) return '-'
    // Handle LocalDate string format (YYYY-MM-DD)
    if (typeof date === 'string') {
      const dateObj = new Date(date + 'T00:00:00')
      return dayjs(dateObj).locale(i18n.language === 'tr' ? 'tr' : 'en').format('D MMM YYYY')
    }
    return dayjs(date).locale(i18n.language === 'tr' ? 'tr' : 'en').format('D MMM YYYY')
  }

  const formatDuration = (hours) => {
    if (hours == null) return '-'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/time-logs/export/my-history', {
        responseType: 'blob',
        params: { startDate: startDate || undefined, endDate: endDate || undefined }
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `my_time_logs_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to export time logs')
      alert(errorMessage)
      console.error('Error exporting:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isAdminOrHR ? (t('timeLogs.companyTitle') || 'Company Time Logs') : (t('timeLogs.title') || 'My Time Logs')}
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  {t('timeLogs.totalHours')}
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.totalHours}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarToday color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  {t('timeLogs.daysWorked')}
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.daysWorked}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  {t('timeLogs.averageHoursPerDay')}
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.averageHours}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  {t('timeLogs.overtime')}
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.overtime}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('timeLogs.startDate')}
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(0)
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('timeLogs.endDate')}
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(0)
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
            >
              {t('timeLogs.exportToExcel')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Time Records Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {isAdminOrHR && <TableCell>{t('timeLogs.employee')}</TableCell>}
              <TableCell>{t('timeLogs.date')}</TableCell>
              <TableCell>{t('timeLogs.checkIn')}</TableCell>
              <TableCell>{t('timeLogs.checkOut')}</TableCell>
              <TableCell>{t('timeLogs.totalHours')}</TableCell>
              <TableCell>{t('timeLogs.overtime')}</TableCell>
              <TableCell>{t('timeLogs.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isAdminOrHR ? 7 : 6} align="center">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdminOrHR ? 7 : 6} align="center">
                  {t('timeLogs.noRecordsFound')}
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const isInProgress = record.checkInTime && !record.checkOutTime
                
                return (
                  <TableRow key={record.id} hover>
                    {isAdminOrHR && (
                      <TableCell>
                        {record.employeeName || record.employee?.user?.firstName + ' ' + record.employee?.user?.lastName || 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>{formatDate(record.logDate)}</TableCell>
                    <TableCell>{formatTime(record.checkInTime)}</TableCell>
                    <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                    <TableCell>
                      {record.totalWorkingHours != null 
                        ? formatDuration(record.totalWorkingHours)
                        : isInProgress ? t('timeLogs.inProgress') : '-'}
                    </TableCell>
                    <TableCell>
                      {record.overtimeHours && record.overtimeHours > 0 ? `${formatDuration(record.overtimeHours)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isInProgress ? t('timeLogs.inProgressStatus') : record.checkOutTime ? t('timeLogs.completed') : t('timeLogs.pending')}
                        color={isInProgress ? 'warning' : record.checkOutTime ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Box>
  )
}

export default TimeLogs
