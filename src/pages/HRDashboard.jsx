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
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'

const HRDashboard = () => {
  const { t, i18n } = useTranslation()
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

      // Determine the correct tickets endpoint based on user role
      const ticketsEndpoint = user?.role === 'ADMIN' 
        ? '/general-tickets/hr-tickets' 
        : '/general-tickets/my-tickets'

      // Fetch all data in parallel
      const [employeesRes, leaveRequestsRes, ticketsRes, timeLogsRes, departmentsRes] = await Promise.all([
        api.get('/employee', { params: { page: 0, size: 1000, includeDeleted: false } }).catch(() => ({ data: { data: { content: [], totalElements: 0 } } })),
        api.get('/leave-requests').catch(() => ({ data: { data: [] } })),
        api.get(ticketsEndpoint).catch(() => ({ data: { data: [] } })),
        api.get('/time-logs', { params: { page: 0, size: 1000 } }).catch(() => ({ data: { data: { content: [] } } })),
        api.get('/department').catch(() => ({ data: { data: [] } }))
      ])

      const employees = employeesRes.data.data?.content || employeesRes.data.data || []
      const totalEmployees = employeesRes.data.data?.totalElements || employees.length
      const activeEmployees = employees.filter(emp => emp.employmentStatus === 'ACTIVE' && !emp.isDeleted).length

      const allLeaves = leaveRequestsRes.data.data || []
      const pendingLeaves = allLeaves.filter(leave => leave.status === 'PENDING')
      const recentLeaves = pendingLeaves.slice(0, 5).map(leave => ({
        id: leave.id,
        employeeName: leave.employee?.user ? `${leave.employee.user.firstName} ${leave.employee.user.lastName}` : t('common.not_available'),
        leaveType: leave.leaveType || 'Leave',
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status
      }))

      const tickets = ticketsRes.data.data || []
      const openTickets = tickets.filter(ticket => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS')
      const recentTickets = tickets.slice(0, 5).map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt
      }))

      // Calculate today's absences (employees without time logs today)
      const todayStr = new Date().toISOString().split('T')[0]
      const today = new Date()
      const todayLogs = (timeLogsRes.data.data?.content || []).filter(log => {
        const logDate = log.logDate ? new Date(log.logDate).toISOString().split('T')[0] : null
        return logDate === todayStr
      })
      const employeesWithLogsToday = new Set(todayLogs.map(log => log.employee?.id))
      const todayAbsences = employees.filter(emp => 
        emp.employmentStatus === 'ACTIVE' && 
        !emp.isDeleted && 
        !employeesWithLogsToday.has(emp.id)
      ).length

      // Calculate this month's hires
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      const thisMonthHires = employees.filter(emp => {
        if (!emp.hireDate) return false
        const hireDate = new Date(emp.hireDate)
        return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear
      }).length

      // Get upcoming birthdays (next 30 days) - handles year rollover
      const upcomingBirthdays = employees
        .filter(emp => {
          if (!emp.birthDate) return false
          const birthDate = new Date(emp.birthDate)
          const todayYear = today.getFullYear()
          const todayMonth = today.getMonth()
          const todayDate = today.getDate()
          
          // Calculate this year's birthday
          const thisYearBirthday = new Date(todayYear, birthDate.getMonth(), birthDate.getDate())
          
          // Calculate next year's birthday (for year rollover)
          const nextYearBirthday = new Date(todayYear + 1, birthDate.getMonth(), birthDate.getDate())
          
          // Check if birthday is within next 30 days (this year or next year)
          const daysUntilThisYear = Math.floor((thisYearBirthday - today) / (1000 * 60 * 60 * 24))
          const daysUntilNextYear = Math.floor((nextYearBirthday - today) / (1000 * 60 * 60 * 24))
          
          return (daysUntilThisYear >= 0 && daysUntilThisYear <= 30) || 
                 (daysUntilNextYear >= 0 && daysUntilNextYear <= 30)
        })
        .sort((empA, empB) => {
          // Sort by days until birthday
          const aDate = new Date(empA.birthDate)
          const bDate = new Date(empB.birthDate)
          const todayYear = today.getFullYear()
          const aThisYear = new Date(todayYear, aDate.getMonth(), aDate.getDate())
          const bThisYear = new Date(todayYear, bDate.getMonth(), bDate.getDate())
          const aNextYear = new Date(todayYear + 1, aDate.getMonth(), aDate.getDate())
          const bNextYear = new Date(todayYear + 1, bDate.getMonth(), bDate.getDate())
          
          const aDays = aThisYear >= today ? 
            Math.floor((aThisYear - today) / (1000 * 60 * 60 * 24)) :
            Math.floor((aNextYear - today) / (1000 * 60 * 60 * 24))
          const bDays = bThisYear >= today ?
            Math.floor((bThisYear - today) / (1000 * 60 * 60 * 24)) :
            Math.floor((bNextYear - today) / (1000 * 60 * 60 * 24))
          
          return aDays - bDays
        })
        .slice(0, 5)
        .map(emp => {
          const birthDate = new Date(emp.birthDate)
          const todayYear = today.getFullYear()
          const thisYearBirthday = new Date(todayYear, birthDate.getMonth(), birthDate.getDate())
          const nextYearBirthday = new Date(todayYear + 1, birthDate.getMonth(), birthDate.getDate())
          
          // Determine which birthday to show
          const birthdayToShow = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday
          
          return {
            id: emp.id,
            name: emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : t('common.not_available'),
            department: emp.department?.name || t('common.not_available'),
            birthday: dayjs(birthdayToShow).locale(i18n.language === 'tr' ? 'tr' : 'en').format('D MMM')
          }
        })

      // Department stats
      const departments = departmentsRes.data.data || []
      const departmentStats = departments.map(dept => {
        const deptEmployees = employees.filter(emp => emp.department?.id === dept.id && !emp.isDeleted)
        const employeeCount = deptEmployees.length
        
        // Calculate attendance rate for this department
        const deptEmployeeIds = new Set(deptEmployees.map(emp => emp.id))
        const deptTodayLogs = todayLogs.filter(log => deptEmployeeIds.has(log.employee?.id))
        const attendanceRate = employeeCount > 0 ? Math.round((deptTodayLogs.length / employeeCount) * 100) : 0
        
        return {
          name: dept.name,
          employeeCount,
          attendanceRate
        }
      })

      // Attendance alerts (employees who are late - check in after 9:00 AM)
      const attendanceAlerts = todayLogs
        .filter(log => {
          if (!log.checkInTime) return false
          // Handle both string format (HH:mm or HH:mm:ss) and ensure proper comparison
          let checkInTimeStr = String(log.checkInTime).trim()
          if (checkInTimeStr && checkInTimeStr.includes(':')) {
            const timeParts = checkInTimeStr.split(':')
            const checkInHour = parseInt(timeParts[0], 10)
            const checkInMinute = parseInt(timeParts[1] || '0', 10)
            // Late if checked in at 9:00 AM or later (9:00:00 or later)
            return checkInHour > 9 || (checkInHour === 9 && checkInMinute >= 0)
          }
          return false
        })
        .slice(0, 5)
        .map(log => {
          // Try to get employee name from different possible structures
          let employeeName = t('common.not_available')
          if (log.employeeName) {
            // If DTO already has employeeName
            employeeName = log.employeeName
          } else if (log.employee?.user?.firstName && log.employee?.user?.lastName) {
            // If employee.user is available
            employeeName = `${log.employee.user.firstName} ${log.employee.user.lastName}`
          } else if (log.employee?.firstName && log.employee?.lastName) {
            // If employee has direct name fields
            employeeName = `${log.employee.firstName} ${log.employee.lastName}`
          }
          
          return {
            id: log.id,
            employeeName: employeeName,
            checkInTime: log.checkInTime || t('common.not_available'),
            message: `${employeeName} - ${t('hrDashboard.lateArrival')}`,
            timestamp: log.checkInTime || t('common.not_available')
          }
        })

      setDashboardData({
        stats: {
          totalEmployees,
          activeEmployees,
          pendingLeaves: pendingLeaves.length,
          pendingTickets: openTickets.length,
          todayAbsences,
          thisMonthHires
        },
        recentLeaves,
        recentTickets,
        upcomingBirthdays,
        attendanceAlerts,
        departmentStats
      })
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(t('hrDashboard.failedToLoad'))
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
            {t('hrDashboard.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('hrDashboard.welcomeBack')}, {user?.firstName || t('hrDashboard.hrManager')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          {t('hrDashboard.refresh')}
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
            title={t('hrDashboard.totalEmployees')}
            value={dashboardData.stats.totalEmployees || 0}
            icon={<PeopleIcon />}
            color="#1976d2"
            onClick={() => navigate('/employees')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('hrDashboard.activeToday')}
            value={dashboardData.stats.activeEmployees || 0}
            icon={<CheckCircleIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('hrDashboard.pendingLeaves')}
            value={dashboardData.stats.pendingLeaves || 0}
            icon={<EventIcon />}
            color="#ff9800"
            onClick={() => navigate('/leave-requests')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('hrDashboard.openTickets')}
            value={dashboardData.stats.pendingTickets || 0}
            icon={<AssignmentIcon />}
            color="#9c27b0"
            onClick={() => navigate('/tickets')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('hrDashboard.todayAbsences')}
            value={dashboardData.stats.todayAbsences || 0}
            icon={<WarningIcon />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('hrDashboard.newHiresMonth')}
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
                  {t('hrDashboard.pendingLeaveRequests')}
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/leave-requests')}
                >
                  {t('hrDashboard.viewAll')}
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.recentLeaves.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('hrDashboard.noPendingLeaves')}
                </Typography>
              ) : (
                <List>
                  {dashboardData.recentLeaves.map((leave) => (
                    <ListItem key={leave.id} divider>
                      <ListItemAvatar>
                        <Avatar>{leave.employeeName?.charAt(0) || 'E'}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={leave.employeeName || t('roles.employee')}
                        secondary={`${leave.leaveType} • ${leave.startDate ? new Date(leave.startDate).toLocaleDateString() : t('common.notAvailable')} ${t('common.to')} ${leave.endDate ? new Date(leave.endDate).toLocaleDateString() : t('common.notAvailable')}`}
                      />
                      <Chip
                        label={leave.status || t('leaveRequests.pending')}
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
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">
                    {t('hrDashboard.recentTickets')}
                  </Typography>
                  {dashboardData.recentTickets.some(ticket => ticket.hasUnreadUpdates) && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        ml: 0.5
                      }}
                    />
                  )}
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/tickets')}
                >
                  {t('hrDashboard.viewAll')}
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.recentTickets.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('hrDashboard.noOpenTickets')}
                </Typography>
              ) : (
                <List>
                  {dashboardData.recentTickets.map((ticket) => (
                    <ListItem key={ticket.id} divider>
                      <Box display="flex" alignItems="center" gap={1} flex={1}>
                        {ticket.hasUnreadUpdates && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'error.main',
                              flexShrink: 0
                            }}
                          />
                        )}
                        <ListItemText
                          primary={ticket.title}
                          secondary={`${t('hrDashboard.created')}: ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : t('common.not_available')}`}
                        />
                      </Box>
                      <Chip
                        label={ticket.priority || t('tickets.priorityMedium')}
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
                {t('hrDashboard.upcomingBirthdays')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.upcomingBirthdays.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('hrDashboard.noUpcomingBirthdays')}
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
                {t('hrDashboard.attendanceAlerts')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.attendanceAlerts.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('hrDashboard.noAttendanceAlerts')}
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
                {t('hrDashboard.departmentOverview')}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                {dashboardData.departmentStats.length === 0 ? (
                  <Grid item xs={12}>
                    <Typography color="textSecondary" align="center" py={3}>
                      {t('hrDashboard.noDepartmentData')}
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
                            {t('hrDashboard.employees')}
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
                          {dept.attendanceRate || 0}% {t('hrDashboard.attendanceRate')}
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

    </Box>
  )
}

export default HRDashboard

