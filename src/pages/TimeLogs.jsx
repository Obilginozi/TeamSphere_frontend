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
  TablePagination,
  Avatar,
  Grow
} from '@mui/material'
import {
  AccessTime,
  CalendarToday,
  TrendingUp,
  Download,
  TimerOff as TimerOffIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../utils/errorHandler'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'
import { useTranslation } from 'react-i18next'

const TimeLogs = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR'
  const isEmployeeOrManager = user?.role === 'EMPLOYEE' || user?.role === 'DEPARTMENT_MANAGER'
  const [records, setRecords] = useState([])
  const [clockedIn, setClockedIn] = useState(false)
  const [clockingIn, setClockingIn] = useState(false)
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

  const StatCard = ({ title, value, icon, color, index = 0 }) => (
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
                  backgroundClip: 'text'
                }}
              >
                {value}
              </Typography>
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

  useEffect(() => {
    fetchTimeHistory()
  }, [page, rowsPerPage, startDate, endDate, isAdminOrHR, isEmployeeOrManager])
  
  useEffect(() => {
    fetchStats()
  }, [records, startDate, endDate, isAdminOrHR])

  useEffect(() => {
    if (isEmployeeOrManager) {
      checkClockStatus()
    }
  }, [isEmployeeOrManager])
  
  const checkClockStatus = async () => {
    try {
      const response = await api.get('/time-logs/my-clock-status')
      if (response.data && response.data.data) {
        setClockedIn(response.data.data.clockedIn || false)
      } else {
        setClockedIn(false)
      }
    } catch (error) {
      // Only log error if it's not an "employee not found" error
      const errorMessage = error.response?.data?.message || error.message || ''
      if (!errorMessage.includes('Employee record not found')) {
        console.error('Error checking clock status:', error)
      }
      setClockedIn(false)
    }
  }

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
      // For EMPLOYEE/DEPARTMENT_MANAGER: use personal history endpoint
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
      // Stats endpoint is only for employees and department managers (personal stats)
      // For ADMIN/HR, we can skip stats or calculate from the records
      if (isEmployeeOrManager) {
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
  
  const handleClockIn = async () => {
    try {
      setClockingIn(true)
      setError(null)
      await api.post('/time-logs/my-clock-in')
      setClockedIn(true)
      await fetchTimeHistory()
      await checkClockStatus()
    } catch (error) {
      const errorMessage = getErrorMessage(error, t('timeLogs.failedToClockIn') || 'Failed to clock in')
      setError(errorMessage)
      console.error('Clock in error:', error)
    } finally {
      setClockingIn(false)
    }
  }
  
  const handleClockOut = async () => {
    try {
      setClockingIn(true)
      setError(null)
      await api.post('/time-logs/my-clock-out')
      setClockedIn(false)
      await fetchTimeHistory()
      await checkClockStatus()
    } catch (error) {
      const errorMessage = getErrorMessage(error, t('timeLogs.failedToClockOut') || 'Failed to clock out')
      setError(errorMessage)
      console.error('Clock out error:', error)
    } finally {
      setClockingIn(false)
    }
  }

  useEffect(() => {
    dayjs.locale(i18n.language === 'tr' ? 'tr' : 'en')
  }, [i18n.language])

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
            <AccessTimeIcon sx={{ fontSize: 28, color: 'white' }} />
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
              {t('pageTitles.timeLogs')}
            </Typography>
          </Box>
        </Box>
        {isEmployeeOrManager && (
          <Box>
            {clockedIn ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<TimerOffIcon />}
                onClick={handleClockOut}
                disabled={clockingIn}
                size="large"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                  boxShadow: '0 8px 24px rgba(244, 67, 54, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                    boxShadow: '0 12px 32px rgba(244, 67, 54, 0.5)',
                    transform: 'translateY(-2px)'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                    opacity: 0.7
                  }
                }}
              >
                {t('timeLogs.checkOut')}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<AccessTimeIcon />}
                onClick={handleClockIn}
                disabled={clockingIn}
                size="large"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                    transform: 'translateY(-2px)'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.7
                  }
                }}
              >
                {t('timeLogs.checkIn')}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      {/* Stats Cards */}
      {isEmployeeOrManager && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('timeLogs.totalHours')}
              value={`${stats.totalHours}h`}
              icon={<AccessTimeIcon />}
              color="#1976d2"
              index={0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('timeLogs.daysWorked')}
              value={stats.daysWorked}
              icon={<CalendarToday />}
              color="#4caf50"
              index={1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('timeLogs.averageHoursPerDay')}
              value={`${stats.averageHours}h`}
              icon={<TrendingUp />}
              color="#ff9800"
              index={2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('timeLogs.overtime')}
              value={`${stats.overtime}h`}
              icon={<AccessTimeIcon />}
              color="#9c27b0"
              index={3}
            />
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 2,
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
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
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
              {t('timeLogs.exportToExcel')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Time Records Table */}
      <TableContainer 
        component={Paper}
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
                        size="small"
                        sx={
                          isInProgress
                            ? {
                                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                color: 'white',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                              }
                            : record.checkOutTime
                            ? {
                                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                                color: 'white',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                              }
                            : {
                                background: 'rgba(158, 158, 158, 0.2)',
                                color: '#424242',
                                fontWeight: 500
                              }
                        }
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
    </Box>
  )
}

export default TimeLogs
