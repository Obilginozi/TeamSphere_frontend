import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material'
import {
  People,
  AccessTime,
  EventNote,
  Support,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const Dashboard = () => {
  const { t } = useLanguage()
  const { user } = useAuth()

  // Redirect based on user role
  if (user?.role === 'ADMIN') {
    return <Navigate to="/system-monitoring" replace />
  } else if (user?.role === 'HR') {
    return <Navigate to="/hr-dashboard" replace />
  } else if (user?.role === 'EMPLOYEE') {
    return <Navigate to="/employee-dashboard" replace />
  }

  const stats = [
    { title: t('dashboard.totalEmployees'), value: '156', icon: <People />, color: 'primary' },
    { title: t('dashboard.activeEmployees'), value: '142', icon: <AccessTime />, color: 'success' },
    { title: t('dashboard.pendingRequests'), value: '8', icon: <EventNote />, color: 'warning' },
    { title: t('dashboard.openTickets'), value: '12', icon: <Support />, color: 'error' },
  ]

  const recentActivities = [
    { action: 'New employee added', user: 'John Doe', time: '2 hours ago', type: 'success' },
    { action: 'Leave request approved', user: 'Jane Smith', time: '4 hours ago', type: 'info' },
    { action: 'Ticket resolved', user: 'Mike Johnson', time: '6 hours ago', type: 'success' },
    { action: 'Time log updated', user: 'Sarah Wilson', time: '8 hours ago', type: 'info' },
  ]

  const quickActions = [
    { title: t('employees.addEmployee'), icon: <People />, color: 'primary' },
    { title: t('timeLogs.checkIn'), icon: <AccessTime />, color: 'success' },
    { title: t('leaveRequests.requestLeave'), icon: <EventNote />, color: 'info' },
    { title: t('tickets.createTicket'), icon: <Support />, color: 'warning' },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.welcome')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ mr: 2, color: `${stat.color}.main` }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.recentActivity')}
            </Typography>
            <List>
              {recentActivities.map((activity, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color={activity.type} />
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.action}
                    secondary={`${activity.user} • ${activity.time}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.quickActions')}
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={6} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Box sx={{ color: `${action.color}.main`, mb: 1 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="body2">
                        {action.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
