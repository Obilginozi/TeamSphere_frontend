import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Announcement as AnnouncementIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Notifications = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [tabValue, setTabValue] = useState(0)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('ALL')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/notifications')
      setNotifications(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setError(t('notificationsPage.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
    } catch (err) {
      setError(t('notificationsPage.failedToMarkRead'))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (err) {
      setError(t('notificationsPage.failedToMarkAllRead'))
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (err) {
      setError(t('notificationsPage.failedToDelete'))
    }
  }

  const handleDeleteAll = async () => {
    if (window.confirm(t('notificationsPage.deleteAllConfirm'))) {
      try {
        await api.delete('/notifications/all')
        setNotifications([])
      } catch (err) {
        setError(t('notificationsPage.failedToDeleteAll'))
      }
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LEAVE': return <EventIcon />
      case 'TICKET': return <AssignmentIcon />
      case 'ALERT': return <WarningIcon color="warning" />
      case 'ANNOUNCEMENT': return <AnnouncementIcon color="primary" />
      default: return <InfoIcon />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'LEAVE': return '#1976d2'
      case 'TICKET': return '#9c27b0'
      case 'ALERT': return '#ff9800'
      case 'ANNOUNCEMENT': return '#4caf50'
      default: return '#757575'
    }
  }

  const getFilteredNotifications = () => {
    let filtered = notifications

    // Filter by read status based on tab
    if (tabValue === 1) {
      filtered = filtered.filter(n => !n.read)
    } else if (tabValue === 2) {
      filtered = filtered.filter(n => n.read)
    }

    // Filter by type
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(n => n.type === selectedFilter)
    }

    return filtered
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <Badge badgeContent={unreadCount} color="error">
              {t('pageTitles.notifications')}
            </Badge>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('notificationsPage.stayUpdated')}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchNotifications}
            disabled={loading}
          >
            {t('common.refresh')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          >
            {t('common.filter')}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
            >
              {t('notificationsPage.markAllRead')}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteAll}
            >
              {t('notificationsPage.deleteAll')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem onClick={() => { setSelectedFilter('ALL'); setFilterAnchorEl(null) }}>
          {t('notificationsPage.allTypes')}
        </MenuItem>
        <MenuItem onClick={() => { setSelectedFilter('LEAVE'); setFilterAnchorEl(null) }}>
          {t('notificationsPage.leaveRequests')}
        </MenuItem>
        <MenuItem onClick={() => { setSelectedFilter('TICKET'); setFilterAnchorEl(null) }}>
          {t('notificationsPage.tickets')}
        </MenuItem>
        <MenuItem onClick={() => { setSelectedFilter('ALERT'); setFilterAnchorEl(null) }}>
          {t('notificationsPage.alerts')}
        </MenuItem>
        <MenuItem onClick={() => { setSelectedFilter('ANNOUNCEMENT'); setFilterAnchorEl(null) }}>
          {t('notificationsPage.announcements')}
        </MenuItem>
      </Menu>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`${t('notificationsPage.all')} (${notifications.length})`} />
          <Tab label={`${t('notificationsPage.unread')} (${unreadCount})`} />
          <Tab label={`${t('notificationsPage.read')} (${notifications.length - unreadCount})`} />
        </Tabs>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <Box textAlign="center" py={5}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                {t('notificationsPage.noNotifications')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {tabValue === 1 ? t('notificationsPage.allCaughtUp') : t('notificationsPage.checkBackLater')}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                    mb: 1,
                    borderRadius: 1
                  }}
                  secondaryAction={
                    <Box display="flex" gap={1}>
                      {!notification.read && (
                        <Tooltip title={t('notificationsPage.markAsRead')}>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t('notificationsPage.deleteNotification')}>
                        <IconButton
                          edge="end"
                          size="small"
                          color="error"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {notification.title}
                        </Typography>
                        <Chip label={notification.type} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary" component="div">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default Notifications

