import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  LinearProgress,
  Fade,
  Zoom,
  Grow
} from '@mui/material'
import {
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  TimerOff as TimerOffIcon,
  CalendarToday as CalendarTodayIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'

const EmployeeDashboard = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clockedIn, setClockedIn] = useState(false)
  const [clockingIn, setClockingIn] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalHoursThisWeek: 0,
      totalHoursThisMonth: 0,
      leaveBalance: 0,
      upcomingLeaves: 0,
      pendingRequests: 0
    },
    recentAttendance: [],
    upcomingLeaves: [],
    upcomingBirthdays: [],
    announcements: [],
    todaySchedule: null
  })

  useEffect(() => {
    fetchDashboardData()
    checkClockStatus()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current date range for stats (this week and this month)
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0)
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const [statsRes, historyRes, leavesRes, announcementsRes, birthdaysRes] = await Promise.all([
          api.get('/time-logs/my-stats', {
            params: {
              startDate: startOfMonth.toISOString().split('T')[0],
              endDate: endOfMonth.toISOString().split('T')[0]
            }
          }).catch((err) => {
            // Only log if it's not an "employee not found" error
            const errorMessage = err.response?.data?.message || err.message || ''
            if (!errorMessage.includes('Employee record not found')) {
              console.error('Failed to fetch time log stats:', err)
            }
            return { data: { data: {} } }
          }),
          api.get('/time-logs/my-history', {
            params: { page: 0, size: 5 }
          }).catch((err) => {
            // Only log if it's not an "employee not found" error
            const errorMessage = err.response?.data?.message || err.message || ''
            if (!errorMessage.includes('Employee record not found')) {
              console.error('Failed to fetch time log history:', err)
            }
            return { data: { data: { content: [] } } }
          }),
          api.get('/leave-requests/my').catch(() => ({ data: { data: [] } })),
          api.get('/announcements/active').catch(() => ({ data: { data: [] } })),
          api.get('/employee/upcoming-birthdays', { params: { daysAhead: 30 } }).catch(() => ({ data: { data: [] } }))
        ])

      // Calculate week stats from history
      const allHistory = historyRes.data.data?.content || []
      const weekStart = new Date(startOfWeek)
      const weekHistory = allHistory.filter(log => {
        const logDate = new Date(log.logDate)
        return logDate >= weekStart
      })
      const weekHours = weekHistory.reduce((sum, log) => {
        return sum + (log.totalWorkingHours || 0)
      }, 0)

      // Get pending leave requests
      const allLeaves = leavesRes.data.data || []
      const pendingLeaves = allLeaves.filter(leave => leave.status === 'PENDING')
      const upcomingLeaves = allLeaves.filter(leave => 
        leave.status === 'APPROVED' && new Date(leave.startDate) >= new Date()
      )

      // Get leave balance from employee data
      const employeeRes = await api.get('/employee/me').catch(() => ({ data: { data: {} } }))
      const leaveBalance = employeeRes.data.data?.annualLeaveBalance || 0

      // Process upcoming birthdays
      const employees = birthdaysRes.data.data || []
      const today = new Date()
      const upcomingBirthdays = employees
        .slice(0, 5)
        .map(emp => {
          if (!emp.birthDate) return null
          const birthDate = new Date(emp.birthDate)
          const todayYear = today.getFullYear()
          const thisYearBirthday = new Date(todayYear, birthDate.getMonth(), birthDate.getDate())
          const nextYearBirthday = new Date(todayYear + 1, birthDate.getMonth(), birthDate.getDate())
          const birthdayToShow = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday
          
          return {
            id: emp.id,
            name: emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : t('common.not_available'),
            department: emp.department?.name || t('common.not_available'),
            birthday: dayjs(birthdayToShow).locale(i18n.language === 'tr' ? 'tr' : 'en').format('D MMM')
          }
        })
        .filter(emp => emp !== null)

      setDashboardData({
        stats: {
          totalHoursThisWeek: Math.round(weekHours * 100) / 100,
          totalHoursThisMonth: statsRes.data.data?.totalHours || 0,
          leaveBalance: leaveBalance,
          upcomingLeaves: upcomingLeaves.length,
          pendingRequests: pendingLeaves.length
        },
        recentAttendance: allHistory.map(log => ({
          id: log.id,
          date: log.logDate,
          clockIn: log.checkInTime,
          clockOut: log.checkOutTime,
          totalHours: log.totalWorkingHours,
          status: log.status
        })),
        upcomingLeaves: upcomingLeaves.slice(0, 5),
        upcomingBirthdays: upcomingBirthdays,
        announcements: announcementsRes.data.data || []
      })
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const checkClockStatus = async () => {
    try {
      const response = await api.get('/time-logs/my-clock-status')
      setClockedIn(response.data.data?.clockedIn || false)
    } catch (err) {
      // Only log error if it's not an "employee not found" error
      const errorMessage = err.response?.data?.message || err.message || ''
      if (!errorMessage.includes('Employee record not found')) {
        console.error('Failed to check clock status:', err)
      }
      setClockedIn(false)
    }
  }

  const handleClockIn = async () => {
    try {
      setClockingIn(true)
      setError(null)
      await api.post('/time-logs/my-clock-in')
      setClockedIn(true)
      await fetchDashboardData()
      await checkClockStatus()
    } catch (err) {
      // Get error message from response
      let errorMessage = 'Failed to clock in. Please try again.'
      if (err.response?.data) {
        // Try different possible error message locations
        errorMessage = err.response.data.message || 
                      err.response.data.error || 
                      err.response.data.data?.message ||
                      errorMessage
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
      console.error('Clock in error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error message:', errorMessage)
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
      await fetchDashboardData()
      await checkClockStatus()
    } catch (err) {
      setError(t('employeeDashboard.failedToClockOut'))
      console.error('Clock out error:', err)
    } finally {
      setClockingIn(false)
    }
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
                  backgroundClip: 'text'
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

  if (loading && !dashboardData.stats.totalHoursThisWeek) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

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
        {/* Header */}
        <Fade in timeout={600}>
          <Box 
            mb={4} 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            flexWrap="wrap" 
            gap={2}
          >
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
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
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {t('employeeDashboard.welcome')}, {user?.firstName || t('roles.employee')}!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dayjs().locale(i18n.language === 'tr' ? 'tr' : 'en').format('dddd, D MMMM YYYY')}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchDashboardData}
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
          </Box>
        </Fade>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Clock Status Alert */}
      {clockedIn && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {t('employeeDashboard.currentlyClockedIn')}
        </Alert>
      )}

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('employeeDashboard.hoursThisWeek')}
              value={`${dashboardData.stats.totalHoursThisWeek || 0}h`}
              icon={<AccessTimeIcon />}
              color="#1976d2"
              subtitle={t('employeeDashboard.targetHours', { hours: 40 })}
              index={0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('employeeDashboard.hoursThisMonth')}
              value={`${dashboardData.stats.totalHoursThisMonth || 0}h`}
              icon={<TrendingUpIcon />}
              color="#4caf50"
              index={1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('employeeDashboard.leaveBalance')}
              value={`${dashboardData.stats.leaveBalance || 0} ${t('common.days')}`}
              icon={<EventIcon />}
              color="#ff9800"
              index={2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('employeeDashboard.pendingRequests')}
              value={dashboardData.stats.pendingRequests || 0}
              icon={<AssignmentIcon />}
              color="#9c27b0"
              index={3}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Attendance */}
          <Grid item xs={12} md={6}>
            <Zoom in timeout={800}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography 
                      variant="h6"
                      sx={{ fontWeight: 600 }}
                    >
                      {t('employeeDashboard.recentAttendance')}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate('/time-logs')}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {t('common.viewAll')}
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
              {dashboardData.recentAttendance.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('employeeDashboard.noAttendanceRecordsYet')}
                </Typography>
              ) : (
                <List>
                  {dashboardData.recentAttendance.slice(0, 5).map((record) => (
                    <ListItem key={record.id} divider>
                      <ListItemText
                        primary={new Date(record.date).toLocaleDateString()}
                        secondary={`${record.clockIn || t('common.notAvailable')} - ${record.clockOut || t('timeLogs.inProgress')} • ${record.totalHours || 0}h`}
                      />
                      <Chip
                        label={record.status || t('employeeDashboard.present')}
                        color={record.status === 'PRESENT' ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
            </Zoom>
          </Grid>

          {/* Upcoming Leaves */}
          <Grid item xs={12} md={6}>
            <Zoom in timeout={900}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography 
                      variant="h6"
                      sx={{ fontWeight: 600 }}
                    >
                      {t('employeeDashboard.upcomingLeaves')}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate('/leave-requests')}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {t('leaveRequests.requestLeave')}
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
              {dashboardData.upcomingLeaves.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('employeeDashboard.noUpcomingLeaves')}
                </Typography>
              ) : (
                <List>
                  {dashboardData.upcomingLeaves.map((leave) => (
                    <ListItem key={leave.id} divider>
                      <ListItemText
                        primary={leave.leaveType || t('leaveRequests.leaveType')}
                        secondary={`${leave.startDate ? new Date(leave.startDate).toLocaleDateString() : t('common.notAvailable')} ${t('common.to')} ${leave.endDate ? new Date(leave.endDate).toLocaleDateString() : t('common.notAvailable')} • ${leave.totalDays || 0} ${t('common.days')}`}
                      />
                      <Chip
                        label={leave.status || t('leaveRequests.approved')}
                        color={leave.status === 'APPROVED' ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
            </Zoom>
          </Grid>

          {/* Upcoming Birthdays */}
          <Grid item xs={12} md={6}>
            <Zoom in timeout={1000}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {t('employeeDashboard.upcomingBirthdays')}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
              {dashboardData.upcomingBirthdays.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('employeeDashboard.noUpcomingBirthdays')}
                </Typography>
              ) : (
                <List>
                  {dashboardData.upcomingBirthdays.map((employee) => (
                    <ListItem key={employee.id}>
                      <ListItemAvatar>
                        <Avatar>{employee.name?.charAt(0) || 'E'}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={employee.name}
                        secondary={`${employee.department} • ${employee.birthday}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
            </Zoom>
          </Grid>

          {/* Announcements */}
          <Grid item xs={12}>
            <Zoom in timeout={1100}>
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
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {t('employeeDashboard.companyAnnouncements')}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {dashboardData.announcements.length === 0 ? (
                    <Typography color="textSecondary" align="center" py={3}>
                      {t('employeeDashboard.noAnnouncementsAtThisTime')}
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {dashboardData.announcements.map((announcement, index) => (
                        <Grid item xs={12} key={announcement.id}>
                          <Grow in timeout={800 + (index * 100)}>
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 2.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                                border: '1px solid rgba(102, 126, 234, 0.1)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)',
                                  borderColor: 'rgba(102, 126, 234, 0.3)'
                                }
                              }}
                            >
                              <Typography 
                                variant="subtitle1" 
                                gutterBottom
                                sx={{ fontWeight: 600 }}
                              >
                                {announcement.title}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" paragraph>
                                {announcement.content}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {t('employeeDashboard.posted')}: {new Date(announcement.createdAt).toLocaleDateString()}
                              </Typography>
                            </Paper>
                          </Grow>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default EmployeeDashboard

