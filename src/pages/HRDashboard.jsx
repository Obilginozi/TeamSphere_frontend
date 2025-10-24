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
  ListItemAvatar,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  LinearProgress
} from '@mui/material'
import {
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const HRDashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      activeEmployees: 0,
      pendingLeaves: 0,
      pendingTickets: 0,
      todayAbsences: 0,
      thisMonthHires: 0
    },
    recentLeaves: [],
    recentTickets: [],
    upcomingBirthdays: [],
    attendanceAlerts: [],
    departmentStats: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // For now, use mock data since the backend endpoints don't exist yet
      setDashboardData({
        stats: {
          totalEmployees: 25,
          activeEmployees: 23,
          pendingLeaves: 3,
          pendingTickets: 2,
          todayAbsences: 1,
          thisMonthHires: 2
        },
        recentLeaves: [
          { id: 1, employeeName: 'John Doe', type: 'Annual Leave', startDate: '2024-01-15', endDate: '2024-01-17', status: 'PENDING' },
          { id: 2, employeeName: 'Jane Smith', type: 'Sick Leave', startDate: '2024-01-14', endDate: '2024-01-14', status: 'PENDING' }
        ],
        recentTickets: [
          { id: 1, title: 'Password Reset Request', priority: 'MEDIUM', status: 'OPEN', createdAt: '2024-01-14' },
          { id: 2, title: 'Software Installation', priority: 'HIGH', status: 'IN_PROGRESS', createdAt: '2024-01-13' }
        ],
        upcomingBirthdays: [
          { id: 1, name: 'Mike Johnson', department: 'Engineering', birthday: '2024-01-20' },
          { id: 2, name: 'Sarah Wilson', department: 'Marketing', birthday: '2024-01-22' }
        ],
        attendanceAlerts: [
          { id: 1, message: 'Tom Brown - Late arrival', timestamp: '09:15 AM' }
        ],
        departmentStats: [
          { name: 'Engineering', employeeCount: 12, attendanceRate: 92 },
          { name: 'Marketing', employeeCount: 8, attendanceRate: 100 },
          { name: 'Sales', employeeCount: 5, attendanceRate: 80 }
        ]
      })
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {loading ? <CircularProgress size={24} /> : value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )

  const getLeaveStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'error'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'error'
      case 'MEDIUM': return 'warning'
      case 'LOW': return 'info'
      default: return 'default'
    }
  }

  if (loading && !dashboardData.stats.totalEmployees) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom>
            HR Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Welcome back, {user?.firstName || 'HR Manager'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Employees"
            value={dashboardData.stats.totalEmployees || 0}
            icon={<PeopleIcon />}
            color="#1976d2"
            onClick={() => navigate('/employees')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Active Today"
            value={dashboardData.stats.activeEmployees || 0}
            icon={<CheckCircleIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Pending Leaves"
            value={dashboardData.stats.pendingLeaves || 0}
            icon={<EventIcon />}
            color="#ff9800"
            onClick={() => navigate('/leave-requests')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Open Tickets"
            value={dashboardData.stats.pendingTickets || 0}
            icon={<AssignmentIcon />}
            color="#9c27b0"
            onClick={() => navigate('/support-tickets')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Today Absences"
            value={dashboardData.stats.todayAbsences || 0}
            icon={<WarningIcon />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="New Hires (Month)"
            value={dashboardData.stats.thisMonthHires || 0}
            icon={<TrendingUpIcon />}
            color="#00bcd4"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Leave Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Pending Leave Requests
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/leave-requests')}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.recentLeaves.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  No pending leave requests
                </Typography>
              ) : (
                <List>
                  {dashboardData.recentLeaves.map((leave) => (
                    <ListItem key={leave.id} divider>
                      <ListItemAvatar>
                        <Avatar>{leave.employeeName?.charAt(0) || 'E'}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={leave.employeeName || 'Employee'}
                        secondary={`${leave.leaveType} • ${leave.startDate} to ${leave.endDate}`}
                      />
                      <Chip
                        label={leave.status || 'PENDING'}
                        color={getLeaveStatusColor(leave.status)}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tickets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Recent Support Tickets
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/support-tickets')}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.recentTickets.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  No open tickets
                </Typography>
              ) : (
                <List>
                  {dashboardData.recentTickets.map((ticket) => (
                    <ListItem key={ticket.id} divider>
                      <ListItemText
                        primary={ticket.title}
                        secondary={`Created: ${new Date(ticket.createdAt).toLocaleDateString()}`}
                      />
                      <Chip
                        label={ticket.priority || 'MEDIUM'}
                        color={getPriorityColor(ticket.priority)}
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
                Upcoming Birthdays 🎂
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.upcomingBirthdays.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  No upcoming birthdays this week
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
                        secondary={employee.birthday}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Alerts ⚠️
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.attendanceAlerts.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  No attendance alerts
                </Typography>
              ) : (
                <List>
                  {dashboardData.attendanceAlerts.map((alert, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#f44336' }}>
                          <WarningIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={alert.message}
                        secondary={alert.timestamp}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Department Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Overview
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                {dashboardData.departmentStats.length === 0 ? (
                  <Grid item xs={12}>
                    <Typography color="textSecondary" align="center" py={3}>
                      No department data available
                    </Typography>
                  </Grid>
                ) : (
                  dashboardData.departmentStats.map((dept) => (
                    <Grid item xs={12} sm={6} md={4} key={dept.name}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {dept.name}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            Employees
                          </Typography>
                          <Typography variant="h6">
                            {dept.employeeCount || 0}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={dept.attendanceRate || 0}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary" mt={0.5}>
                          {dept.attendanceRate || 0}% attendance rate
                        </Typography>
                      </Paper>
                    </Grid>
                  ))
                )}
              </Grid>
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
            <Button variant="outlined" onClick={() => navigate('/employees')}>
              Manage Employees
            </Button>
            <Button variant="outlined" onClick={() => navigate('/leave-requests')}>
              Review Leaves
            </Button>
            <Button variant="outlined" onClick={() => navigate('/support-tickets')}>
              View Tickets
            </Button>
            <Button variant="outlined" onClick={() => navigate('/departments')}>
              Manage Departments
            </Button>
            <Button variant="outlined" onClick={() => navigate('/reports')}>
              View Reports
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default HRDashboard

