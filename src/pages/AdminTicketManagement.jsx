import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Avatar,
  Grow
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Assignment as AssignIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Reply as ReplyIcon,
  Message as MessageIcon
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'

const AdminTicketManagement = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState(0)
  const [tickets, setTickets] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [assignedAdmin, setAssignedAdmin] = useState('')
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyAttachment, setReplyAttachment] = useState(null)
  const [ticketComments, setTicketComments] = useState([])
  const [attachmentObjectUrl, setAttachmentObjectUrl] = useState(null)
  const [adminUsers, setAdminUsers] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [orderBy, setOrderBy] = useState('')
  const [order, setOrder] = useState('asc')

  useEffect(() => {
    fetchTickets()
    fetchMetrics()
  }, [statusFilter, priorityFilter, orderBy, order])

  useEffect(() => {
    if (assignDialogOpen) {
      setAssignedAdmin('') // Reset selection when dialog opens
      fetchAdminUsers()
    } else {
      setAssignedAdmin('') // Reset selection when dialog closes
    }
  }, [assignDialogOpen])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/tickets')
      let filteredTickets = response.data.data

      // Remove duplicates by ticket ID (in case backend returns duplicates)
      const uniqueTickets = filteredTickets.filter((ticket, index, self) =>
        index === self.findIndex(t => t.id === ticket.id)
      )
      filteredTickets = uniqueTickets

      // Apply filters
      if (statusFilter !== 'ALL') {
        filteredTickets = filteredTickets.filter(t => t.status === statusFilter)
      }
      if (priorityFilter !== 'ALL') {
        filteredTickets = filteredTickets.filter(t => t.priority === priorityFilter)
      }
      if (searchTerm) {
        filteredTickets = filteredTickets.filter(t => 
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Sort tickets
      const sortedTickets = sortTickets(filteredTickets, orderBy, order)
      setTickets(sortedTickets)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/admin/tickets/metrics')
      setMetrics(response.data.data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await api.get(`/admin/tickets/${ticketId}`)
      const ticket = response.data.data
      setSelectedTicket(ticket)
      setViewDialogOpen(true)
      
      // Fetch attachment as blob if it exists
      if (ticket.attachmentUrl) {
        try {
          const imageUrl = getImageUrl(ticket.attachmentUrl)
          // Remove /api prefix since axios already adds it
          const apiPath = imageUrl.replace('/api', '')
          const blobResponse = await api.get(apiPath, {
            responseType: 'blob'
          })
          const blob = new Blob([blobResponse.data])
          const objectUrl = URL.createObjectURL(blob)
          setAttachmentObjectUrl(objectUrl)
        } catch (err) {
          console.error('Failed to fetch attachment as blob:', err)
          setAttachmentObjectUrl(null)
        }
      } else {
        setAttachmentObjectUrl(null)
      }
      
      // Also fetch comments
      await fetchTicketComments(ticketId)
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
    }
  }
  
  const getImageUrl = (attachmentUrl) => {
    if (!attachmentUrl) return null
    // If it's a relative path, construct full URL
    if (attachmentUrl.startsWith('uploads/')) {
      // Extract the file path after uploads/
      const filePath = attachmentUrl.replace('uploads/', '')
      return `/api/company-tickets/files?path=${encodeURIComponent(attachmentUrl)}`
    }
    return attachmentUrl
  }

  const fetchTicketComments = async (ticketId) => {
    try {
      const response = await api.get(`/admin/tickets/${ticketId}/comments`)
      setTicketComments(response.data.data)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleReplyToTicket = async () => {
    if (!selectedTicket || !replyText.trim()) return

    try {
      const formData = new FormData()
      const commentData = {
        comment: replyText,
        isInternal: false
      }
      // Append JSON with proper content type for @RequestPart
      // Spring's @RequestPart expects the part to have a filename for proper deserialization
      const commentBlob = new Blob([JSON.stringify(commentData)], { type: 'application/json' })
      formData.append('comment', commentBlob, 'comment.json')
      
      if (replyAttachment) {
        formData.append('attachment', replyAttachment)
      }

      await api.post(`/admin/tickets/${selectedTicket.id}/reply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setReplyDialogOpen(false)
      setReplyText('')
      setReplyAttachment(null)
      
      // Refresh ticket details and comments
      await handleViewTicket(selectedTicket.id)
      fetchTickets()
    } catch (error) {
      console.error('Failed to reply to ticket:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reply to ticket'
      alert(`Error: ${errorMessage}`)
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors)
      }
    }
  }

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await api.put(`/admin/tickets/${ticketId}/status?status=${newStatus}`)
      fetchTickets()
      fetchMetrics()
      if (selectedTicket && selectedTicket.id === ticketId) {
        handleViewTicket(ticketId) // Refresh dialog
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const fetchAdminUsers = async () => {
    try {
      setLoadingAdmins(true)
      const response = await api.get('/users/admin-users')
      console.log('Admin users response:', response.data)
      if (response.data && response.data.success && response.data.data) {
        console.log('Found admin users:', response.data.data.length, response.data.data)
        setAdminUsers(response.data.data)
      } else {
        console.warn('Unexpected response format:', response.data)
        setAdminUsers([])
      }
    } catch (error) {
      console.error('Failed to fetch admin users:', error)
      console.error('Error response:', error.response?.data)
      setAdminUsers([])
    } finally {
      setLoadingAdmins(false)
    }
  }

  const handleAssignTicket = async () => {
    if (!selectedTicket || !assignedAdmin) {
      console.warn('Cannot assign ticket: missing ticket or admin selection')
      return
    }

    try {
      await api.put(`/admin/tickets/${selectedTicket.id}/assign?adminUserId=${assignedAdmin}`)
      setAssignDialogOpen(false)
      setAssignedAdmin('')
      fetchTickets()
      if (viewDialogOpen) {
        handleViewTicket(selectedTicket.id)
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error)
      console.error('Error details:', error.response?.data)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'error'
      case 'HIGH': return 'error'
      case 'MEDIUM': return 'warning'
      case 'LOW': return 'info'
      default: return 'default'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'info'
      case 'IN_PROGRESS': return 'warning'
      case 'WAITING_FOR_CUSTOMER': return 'warning'
      case 'RESOLVED': return 'success'
      case 'CLOSED': return 'default'
      default: return 'default'
    }
  }

  const getStatusChipStyles = (status) => {
    const baseStyles = {
      borderRadius: 2,
      fontWeight: 600,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)'
      }
    }
    
    switch (status) {
      case 'OPEN':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)' }
        }
      case 'IN_PROGRESS':
      case 'WAITING_FOR_CUSTOMER':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)' }
        }
      case 'RESOLVED':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)' }
        }
      case 'CLOSED':
        return {
          ...baseStyles,
          background: 'rgba(158, 158, 158, 0.2)',
          color: '#424242',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
        }
      default:
        return {
          ...baseStyles,
          background: 'rgba(158, 158, 158, 0.2)',
          color: '#424242',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
        }
    }
  }

  const getPriorityChipStyles = (priority) => {
    const baseStyles = {
      borderRadius: 2,
      fontWeight: 600,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)'
      }
    }
    
    switch (priority) {
      case 'LOW':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)' }
        }
      case 'MEDIUM':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)' }
        }
      case 'HIGH':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)' }
        }
      case 'CRITICAL':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(211, 47, 47, 0.4)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(211, 47, 47, 0.5)' }
        }
      default:
        return {
          ...baseStyles,
          background: 'rgba(158, 158, 158, 0.2)',
          color: '#424242',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
        }
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      OPEN: t('tickets.open'),
      IN_PROGRESS: t('tickets.inProgress'),
      RESOLVED: t('tickets.resolved'),
      CLOSED: t('tickets.closed'),
      WAITING_FOR_CUSTOMER: t('adminTickets.waitingForCustomer')
    }
    return labels[status] || status.replace(/_/g, ' ')
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      LOW: t('adminTickets.priorityLow'),
      MEDIUM: t('adminTickets.priorityMedium'),
      HIGH: t('adminTickets.priorityHigh'),
      CRITICAL: t('adminTickets.priorityCritical')
    }
    return labels[priority] || priority
  }

  const getCategoryLabel = (category) => {
    const labels = {
      GENERAL: t('adminTickets.categoryGeneral'),
      TECHNICAL: t('adminTickets.categoryTechnical'),
      BILLING: t('adminTickets.categoryBilling'),
      FEATURE_REQUEST: t('adminTickets.categoryFeatureRequest'),
      BUG_REPORT: t('adminTickets.categoryBugReport'),
      ACCOUNT_MANAGEMENT: t('adminTickets.categoryAccountManagement'),
      ATTENDANCE_ISSUE: t('adminTickets.categoryAttendanceIssue'),
      EMPLOYEE_MANAGEMENT: t('adminTickets.categoryEmployeeManagement'),
      REPORT_ISSUE: t('adminTickets.categoryReportIssue'),
      SYSTEM: t('adminTickets.categorySystem'),
      FEATURE: t('adminTickets.categoryFeature'),
      MAINTENANCE: t('adminTickets.categoryMaintenance'),
      HR: t('tickets.hr'),
      PAYROLL: t('tickets.payroll')
    }
    return labels[category] || category.replace(/_/g, ' ')
  }

  const getSLAIndicator = (slaPercentage) => {
    if (slaPercentage >= 95) return { color: 'success', icon: <CheckCircleIcon /> }
    if (slaPercentage >= 80) return { color: 'warning', icon: <WarningIcon /> }
    return { color: 'error', icon: <ErrorIcon /> }
  }

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const StatCard = ({ title, value, icon, color, subtitle, index = 0 }) => (
    <Grow in timeout={600 + (index * 100)}>
      <Card 
        sx={{ 
          height: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
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
            background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
            opacity: 0.8
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
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
                  backgroundClip: 'text',
                  mb: subtitle ? 0.5 : 0
                }}
              >
                {value}
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

  const sortTickets = (ticketsToSort, sortBy, sortOrder) => {
    if (!sortBy) return ticketsToSort

    const sorted = [...ticketsToSort].sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'id':
          aValue = a.id
          bValue = b.id
          break
        case 'title':
          aValue = a.title || ''
          bValue = b.title || ''
          // Use Turkish locale for proper Turkish character sorting
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue, 'tr', { sensitivity: 'base' })
            : bValue.localeCompare(aValue, 'tr', { sensitivity: 'base' })
        case 'createdBy':
          aValue = a.createdByUserName || ''
          bValue = b.createdByUserName || ''
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue, 'tr', { sensitivity: 'base' })
            : bValue.localeCompare(aValue, 'tr', { sensitivity: 'base' })
        case 'company':
          aValue = a.companyName || ''
          bValue = b.companyName || ''
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue, 'tr', { sensitivity: 'base' })
            : bValue.localeCompare(aValue, 'tr', { sensitivity: 'base' })
        case 'category':
          aValue = getCategoryLabel(a.category) || ''
          bValue = getCategoryLabel(b.category) || ''
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue, 'tr', { sensitivity: 'base' })
            : bValue.localeCompare(aValue, 'tr', { sensitivity: 'base' })
        case 'priority':
          const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          aValue = priorityOrder[a.priority] || 0
          bValue = priorityOrder[b.priority] || 0
          break
        case 'status':
          const statusOrder = { OPEN: 1, IN_PROGRESS: 2, WAITING_FOR_CUSTOMER: 3, RESOLVED: 4, CLOSED: 5 }
          aValue = statusOrder[a.status] || 0
          bValue = statusOrder[b.status] || 0
          break
        case 'assignedTo':
          aValue = a.assignedToUserName || ''
          bValue = b.assignedToUserName || ''
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue, 'tr', { sensitivity: 'base' })
            : bValue.localeCompare(aValue, 'tr', { sensitivity: 'base' })
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return sorted
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography 
              variant="h4"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700
              }}
            >
              {t('pageTitles.adminTicketManagement')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('adminTickets.subtitle')}
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => { fetchTickets(); fetchMetrics(); }}
            sx={{
              borderRadius: 2,
              borderColor: '#667eea',
              color: '#667eea',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              textTransform: 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#764ba2',
                background: 'rgba(102, 126, 234, 0.1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
              }
            }}
          >
            {t('common.refresh')}
          </Button>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)} 
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
          <Tab label={t('adminTickets.allTickets')} />
          <Tab label={t('adminTickets.metricsDashboard')} />
          <Tab label={t('adminTickets.slaMonitor')} />
        </Tabs>

      {/* Tab 1: All Tickets */}
      {activeTab === 0 && (
        <>
          {/* Metrics Cards */}
          {metrics && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title={t('adminTickets.openTickets')}
                  value={metrics.openTickets}
                  icon={<CheckCircleIcon />}
                  color="#2196f3"
                  index={0}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title={t('adminTickets.inProgressTickets')}
                  value={metrics.inProgressTickets}
                  icon={<WarningIcon />}
                  color="#ff9800"
                  index={1}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title={t('adminTickets.resolvedTickets')}
                  value={metrics.resolvedTickets}
                  icon={<CheckCircleIcon />}
                  color="#4caf50"
                  index={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title={t('adminTickets.totalActive')}
                  value={metrics.activeTickets}
                  icon={<TrendingUpIcon />}
                  color="#667eea"
                  index={3}
                />
              </Grid>
            </Grid>
          )}

          {/* Filters */}
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('common.search')}
                  placeholder={t('adminTickets.searchTickets') || t('common.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={fetchTickets}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.95)',
                      },
                      '&.Mui-focused': {
                        background: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl 
                  fullWidth 
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.95)',
                      },
                      '&.Mui-focused': {
                        background: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                      }
                    }
                  }}
                >
                  <InputLabel>{t('tickets.status')}</InputLabel>
                  <Select
                    value={statusFilter}
                    label={t('tickets.status')}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">{t('adminTickets.allStatus')}</MenuItem>
                    <MenuItem value="OPEN">{t('tickets.open')}</MenuItem>
                    <MenuItem value="IN_PROGRESS">{t('tickets.inProgress')}</MenuItem>
                    <MenuItem value="WAITING_FOR_CUSTOMER">{t('adminTickets.waitingForCustomer')}</MenuItem>
                    <MenuItem value="RESOLVED">{t('tickets.resolved')}</MenuItem>
                    <MenuItem value="CLOSED">{t('tickets.closed')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl 
                  fullWidth 
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.95)',
                      },
                      '&.Mui-focused': {
                        background: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                      }
                    }
                  }}
                >
                  <InputLabel>{t('tickets.priority')}</InputLabel>
                  <Select
                    value={priorityFilter}
                    label={t('tickets.priority')}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">{t('adminTickets.allPriorities')}</MenuItem>
                    <MenuItem value="CRITICAL">{t('adminTickets.critical')}</MenuItem>
                    <MenuItem value="HIGH">{t('adminTickets.high')}</MenuItem>
                    <MenuItem value="MEDIUM">{t('adminTickets.medium')}</MenuItem>
                    <MenuItem value="LOW">{t('adminTickets.low')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Tickets Table */}
          <TableContainer 
            component={Paper}
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'id' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'id'}
                      direction={orderBy === 'id' ? order : 'asc'}
                      onClick={() => handleSort('id')}
                    >
                      {t('tickets.ticketId')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'title' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'title'}
                      direction={orderBy === 'title' ? order : 'asc'}
                      onClick={() => handleSort('title')}
                    >
                      {t('tickets.title')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'createdBy' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'createdBy'}
                      direction={orderBy === 'createdBy' ? order : 'asc'}
                      onClick={() => handleSort('createdBy')}
                    >
                      {t('adminTickets.createdByHR')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'company' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'company'}
                      direction={orderBy === 'company' ? order : 'asc'}
                      onClick={() => handleSort('company')}
                    >
                      {t('adminTickets.company')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'category' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'category'}
                      direction={orderBy === 'category' ? order : 'asc'}
                      onClick={() => handleSort('category')}
                    >
                      {t('tickets.category')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'priority' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'priority'}
                      direction={orderBy === 'priority' ? order : 'asc'}
                      onClick={() => handleSort('priority')}
                    >
                      {t('tickets.priority')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'status' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      {t('tickets.status')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'assignedTo' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'assignedTo'}
                      direction={orderBy === 'assignedTo' ? order : 'asc'}
                      onClick={() => handleSort('assignedTo')}
                    >
                      {t('tickets.assignedTo')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}
                    sortDirection={orderBy === 'createdAt' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'createdAt'}
                      direction={orderBy === 'createdAt' ? order : 'asc'}
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('tickets.createdAt')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, background: 'rgba(102, 126, 234, 0.05)' }}>{t('employees.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">{t('adminTickets.noTicketsFound')}</TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>#{ticket.id}</TableCell>
                      <TableCell>{ticket.title}</TableCell>
                      <TableCell>{ticket.createdByUserName}</TableCell>
                      <TableCell>{ticket.companyName}</TableCell>
                      <TableCell>
                        <Chip label={getCategoryLabel(ticket.category)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getPriorityLabel(ticket.priority)} 
                          size="small"
                          sx={getPriorityChipStyles(ticket.priority)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(ticket.status)} 
                          size="small"
                          sx={getStatusChipStyles(ticket.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {ticket.assignedToUserName || (
                          <Button
                            size="small"
                            startIcon={<AssignIcon />}
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setAssignDialogOpen(true)
                            }}
                            sx={{
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            {t('adminTickets.assign')}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={t('adminTickets.viewDetails')}>
                          <IconButton onClick={() => handleViewTicket(ticket.id)} size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('adminTickets.reply')}>
                          <IconButton 
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setReplyDialogOpen(true)
                            }} 
                            size="small"
                          >
                            <ReplyIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab 2: Metrics Dashboard */}
      {activeTab === 1 && metrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>SLA Compliance</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">First Response SLA</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.sla.firstResponseSLAPercentage} 
                      sx={{ flexGrow: 1, mr: 2, height: 10, borderRadius: 5 }}
                      color={getSLAIndicator(metrics.sla.firstResponseSLAPercentage).color}
                    />
                    <Typography variant="h6">{metrics.sla.firstResponseSLAPercentage.toFixed(1)}%</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2">Resolution SLA</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.sla.resolutionSLAPercentage} 
                      sx={{ flexGrow: 1, mr: 2, height: 10, borderRadius: 5 }}
                      color={getSLAIndicator(metrics.sla.resolutionSLAPercentage).color}
                    />
                    <Typography variant="h6">{metrics.sla.resolutionSLAPercentage.toFixed(1)}%</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  opacity: 0.8
                }
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Average Response Times</Typography>
                <Typography variant="body1">
                  First Response: {Math.round(metrics.sla.avgFirstResponseMinutes)} minutes
                </Typography>
                <Typography variant="body1">
                  Resolution: {Math.round(metrics.sla.avgResolutionMinutes / 60)} hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  opacity: 0.8
                }
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Ticket Statistics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Total Tickets</Typography>
                    <Typography variant="h4">{metrics.totalTickets}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Active Tickets</Typography>
                    <Typography variant="h4" color="warning.main">{metrics.activeTickets}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">SLA Breaches</Typography>
                    <Typography variant="h4" color="error.main">
                      {metrics.sla.firstResponseBreaches + metrics.sla.resolutionBreaches}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Resolved</Typography>
                    <Typography variant="h4" color="success.main">{metrics.resolvedTickets}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 3: SLA Monitor */}
      {activeTab === 2 && metrics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert 
              severity="warning"
              sx={{
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography variant="h6">SLA Breaches</Typography>
              <Typography>
                First Response Breaches: {metrics.sla.firstResponseBreaches}<br />
                Resolution Breaches: {metrics.sla.resolutionBreaches}
              </Typography>
            </Alert>
          </Grid>
          {/* Add detailed SLA breach list here */}
        </Grid>
      )}
      </Box>

      {/* View Ticket Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => {
          setViewDialogOpen(false)
          // Cleanup object URL when dialog closes
          if (attachmentObjectUrl) {
            URL.revokeObjectURL(attachmentObjectUrl)
            setAttachmentObjectUrl(null)
          }
        }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        {selectedTicket && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700,
                fontSize: '1.5rem',
                pb: 2
              }}
            >
              {t('tickets.title')} #{selectedTicket.id}: {selectedTicket.title}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Chip 
                    label={getStatusLabel(selectedTicket.status)} 
                    sx={{ mr: 1, ...getStatusChipStyles(selectedTicket.status) }} 
                  />
                  <Chip 
                    label={getPriorityLabel(selectedTicket.priority)} 
                    sx={{ mr: 1, ...getPriorityChipStyles(selectedTicket.priority) }} 
                  />
                  <Chip label={getCategoryLabel(selectedTicket.category)} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">{t('adminTickets.company')}:</Typography>
                  <Typography>{selectedTicket.companyName}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">{t('tickets.createdBy')}:</Typography>
                  <Typography>{selectedTicket.createdByUserName} ({selectedTicket.createdByUserEmail})</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">{t('tickets.description')}:</Typography>
                  <Typography>{selectedTicket.description}</Typography>
                </Grid>
                {selectedTicket.attachmentUrl && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Attached Screenshot:
                    </Typography>
                    {attachmentObjectUrl ? (
                      <Box sx={{ mt: 1 }}>
                        <img
                          src={attachmentObjectUrl}
                          alt="Ticket attachment"
                          style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block'
                            }
                          }}
                        />
                        <Typography variant="body2" color="error" sx={{ display: 'none' }}>
                          Failed to load image
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Loading image...
                      </Typography>
                    )}
                    {selectedTicket.attachmentFilename && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {selectedTicket.attachmentFilename}
                      </Typography>
                    )}
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2">{t('adminTickets.updateStatus')}:</Typography>
                  <FormControl fullWidth>
                    <Select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                    >
                      <MenuItem value="OPEN">{t('tickets.open')}</MenuItem>
                      <MenuItem value="IN_PROGRESS">{t('tickets.inProgress')}</MenuItem>
                      <MenuItem value="WAITING_FOR_CUSTOMER">{t('adminTickets.waitingForCustomer')}</MenuItem>
                      <MenuItem value="RESOLVED">{t('tickets.resolved')}</MenuItem>
                      <MenuItem value="CLOSED">{t('tickets.closed')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">{t('adminTickets.comments')} ({ticketComments.length}):</Typography>
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    {ticketComments.map((comment) => (
                      <Box key={comment.id} sx={{ mb: 2, p: 2, bgcolor: comment.isInternal ? '#f5f5f5' : 'white', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="primary">
                          {comment.userName} {comment.isInternal && `(${t('adminTickets.internal')})`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(comment.createdAt).toLocaleString()}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {comment.comment}
                        </Typography>
                      </Box>
                    ))}
                    {ticketComments.length === 0 && (
                      <Typography color="text.secondary">{t('adminTickets.noCommentsYet')}</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button 
                onClick={() => setViewDialogOpen(false)}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#667eea',
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                {t('common.close')}
              </Button>
              <Button 
                variant="contained" 
                startIcon={<ReplyIcon />}
                onClick={() => {
                  setViewDialogOpen(false)
                  setReplyDialogOpen(true)
                }}
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
                {t('adminTickets.reply')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Assign Ticket Dialog */}
        <Dialog 
        open={assignDialogOpen} 
        onClose={() => {
          setAssignDialogOpen(false)
          setAssignedAdmin('')
        }}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('adminTickets.assignTicket')}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('adminTickets.selectAdmin') || 'Select Admin'}</InputLabel>
            <Select
              value={assignedAdmin || ''}
              label={t('adminTickets.selectAdmin') || 'Select Admin'}
              onChange={(e) => setAssignedAdmin(String(e.target.value))}
              disabled={loadingAdmins}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                  }
                }
              }}
            >
              {loadingAdmins ? (
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>{t('common.loading') || 'Loading...'}</Typography>
                  </Box>
                </MenuItem>
              ) : adminUsers.length === 0 ? (
                <MenuItem disabled>
                  {t('adminTickets.noAdminsFound') || 'No admins found'}
                </MenuItem>
              ) : (
                adminUsers.map((admin) => (
                  <MenuItem key={admin.id} value={String(admin.id)}>
                    <Box>
                      <Typography variant="body1">
                        {admin.firstName} {admin.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {admin.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setAssignDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: '#667eea',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.1)'
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleAssignTicket} 
            variant="contained"
            disabled={!assignedAdmin || loadingAdmins}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {t('adminTickets.assign')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog 
        open={replyDialogOpen} 
        onClose={() => setReplyDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('adminTickets.replyToTicket')} #{selectedTicket?.id}: {selectedTicket?.title}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={6}
            label={t('adminTickets.yourReply')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            margin="normal"
            placeholder={t('adminTickets.typeYourReply')}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('adminTickets.attachmentOptional')}
            </Typography>
            <input
              type="file"
              onChange={(e) => setReplyAttachment(e.target.files[0])}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            {replyAttachment && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('adminTickets.selected')}: {replyAttachment.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setReplyDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: '#667eea',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.1)'
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleReplyToTicket} 
            variant="contained"
            disabled={!replyText.trim()}
            startIcon={<ReplyIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {t('adminTickets.sendReply')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminTicketManagement

