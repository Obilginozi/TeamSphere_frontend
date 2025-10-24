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

const EmployeeDashboard = () => {
  const { t } = useTranslation()
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

      const [statsRes, attendanceRes, leavesRes, announcementsRes] = await Promise.all([
        api.get('/api/employee/dashboard/stats').catch(() => ({ data: { data: {} } })),
        api.get('/api/attendance/my-recent').catch(() => ({ data: { data: [] } })),
        api.get('/api/leave-requests/my-upcoming').catch(() => ({ data: { data: [] } })),
        api.get('/api/announcements/active').catch(() => ({ data: { data: [] } }))
      ])

      setDashboardData({
        stats: statsRes.data.data || {},
        recentAttendance: attendanceRes.data.data || [],
        upcomingLeaves: leavesRes.data.data || [],
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
      const response = await api.get('/api/attendance/clock-status')
      setClockedIn(response.data.data?.clockedIn || false)
    } catch (err) {
      console.error('Failed to check clock status:', err)
    }
  }

  const handleClockIn = async () => {
    try {
      setClockingIn(true)
      await api.post('/api/attendance/clock-in')
      setClockedIn(true)
      await fetchDashboardData()
    } catch (err) {
      setError('Failed to clock in. Please try again.')
    } finally {
      setClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    try {
      setClockingIn(true)
      await api.post('/api/attendance/clock-out')
      setClockedIn(false)
      await fetchDashboardData()
    } catch (err) {
      setError('Failed to clock out. Please try again.')
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
            Welcome, {user?.firstName || 'Employee'}!
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            Refresh
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
              Clock Out
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
              Clock In
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
          You are currently clocked in. Don't forget to clock out when you're done for the day!
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hours This Week"
            value={`${dashboardData.stats.totalHoursThisWeek || 0}h`}
            icon={<AccessTimeIcon />}
            color="#1976d2"
            subtitle="Target: 40 hours"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hours This Month"
            value={`${dashboardData.stats.totalHoursThisMonth || 0}h`}
            icon={<TrendingUpIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Leave Balance"
            value={`${dashboardData.stats.leaveBalance || 0} days`}
            icon={<EventIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Requests"
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
                  Recent Attendance
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/time-logs')}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.recentAttendance.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  No attendance records yet
                </Typography>
              ) : (
                <List>
                  {dashboardData.recentAttendance.slice(0, 5).map((record) => (
                    <ListItem key={record.id} divider>
                      <ListItemText
                        primary={new Date(record.date).toLocaleDateString()}
                        secondary={`${record.clockIn || 'N/A'} - ${record.clockOut || 'In Progress'} • ${record.totalHours || 0}h`}
                      />
                      <Chip
                        label={record.status || 'PRESENT'}
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
                  Upcoming Leaves
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/leave-requests')}
                >
                  Request Leave
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.upcomingLeaves.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  No upcoming leaves
                </Typography>
              ) : (
                <List>
                  {dashboardData.upcomingLeaves.map((leave) => (
                    <ListItem key={leave.id} divider>
                      <ListItemText
                        primary={leave.leaveType}
                        secondary={`${leave.startDate} to ${leave.endDate} • ${leave.days} days`}
                      />
                      <Chip
                        label={leave.status}
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

        {/* Announcements */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Announcements 📢
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.announcements.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  No announcements at this time
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
                          Posted: {new Date(announcement.createdAt).toLocaleDateString()}
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

      {/* Quick Actions */}
      <Box mt={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button variant="outlined" startIcon={<EventIcon />} onClick={() => navigate('/leave-requests')}>
              Request Leave
            </Button>
            <Button variant="outlined" startIcon={<AccessTimeIcon />} onClick={() => navigate('/time-logs')}>
              View Time Logs
            </Button>
            <Button variant="outlined" startIcon={<AssignmentIcon />} onClick={() => navigate('/support-tickets')}>
              Create Ticket
            </Button>
            <Button variant="outlined" startIcon={<CalendarTodayIcon />} onClick={() => navigate('/profile')}>
              My Profile
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default EmployeeDashboard

