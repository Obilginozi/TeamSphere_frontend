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
  LinearProgress
} from '@mui/material'
import {
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  TimerOff as TimerOffIcon,
  CalendarToday as CalendarTodayIcon
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

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box flex={1}>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {loading ? <CircularProgress size={24} /> : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading && !dashboardData.stats.totalHoursThisWeek) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('employeeDashboard.welcome')}, {user?.firstName || t('roles.employee')}!
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {dayjs().locale(i18n.language === 'tr' ? 'tr' : 'en').format('dddd, D MMMM YYYY')}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            disabled={loading}
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
            >
              {t('timeLogs.checkIn')}
            </Button>
          )}
        </Box>
      </Box>

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
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('employeeDashboard.hoursThisMonth')}
            value={`${dashboardData.stats.totalHoursThisMonth || 0}h`}
            icon={<TrendingUpIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('employeeDashboard.leaveBalance')}
            value={`${dashboardData.stats.leaveBalance || 0} ${t('common.days')}`}
            icon={<EventIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('employeeDashboard.pendingRequests')}
            value={dashboardData.stats.pendingRequests || 0}
            icon={<AssignmentIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Attendance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  {t('employeeDashboard.recentAttendance')}
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/time-logs')}
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
        </Grid>

        {/* Upcoming Leaves */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  {t('employeeDashboard.upcomingLeaves')}
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/leave-requests')}
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
        </Grid>

        {/* Upcoming Birthdays */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
        </Grid>

        {/* Announcements */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('employeeDashboard.companyAnnouncements')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.announcements.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('employeeDashboard.noAnnouncementsAtThisTime')}
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {dashboardData.announcements.map((announcement) => (
                    <Grid item xs={12} key={announcement.id}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {announcement.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {announcement.content}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {t('employeeDashboard.posted')}: {new Date(announcement.createdAt).toLocaleDateString()}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Box>
  )
}

export default EmployeeDashboard

