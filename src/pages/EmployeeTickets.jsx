import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  IconButton,
  Alert,
  Grid,
  CircularProgress,
  InputAdornment,
  Avatar,
  Divider,
  Badge,
  Tooltip,
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { getErrorMessage } from '../utils/errorHandler'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'

const EmployeeTickets = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isEmployee = user?.role === 'EMPLOYEE'
  const isHR = user?.role === 'HR'
  
  // State management
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  
  // Form state
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL',
    assignedTo: null // For HR: can assign to ADMIN, For Employee: assigned to HR
  })
  const [attachment, setAttachment] = useState(null)
  const [preview, setPreview] = useState(null)
  const [newComment, setNewComment] = useState('')
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  
  // UI state
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [attachmentObjectUrl, setAttachmentObjectUrl] = useState(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL') {
        fetchTickets()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, priorityFilter])

  useEffect(() => {
    dayjs.locale(i18n.language === 'tr' ? 'tr' : 'en')
  }, [i18n.language])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Only fetch my tickets (employee can only see their own tickets)
      const response = await api.get('/company-tickets/my-tickets')
      let fetchedTickets = response.data.data || []
      
      // Apply filters
      if (searchTerm) {
        fetchedTickets = fetchedTickets.filter(ticket =>
          ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (statusFilter !== 'ALL') {
        fetchedTickets = fetchedTickets.filter(ticket => ticket.status === statusFilter)
      }
      
      if (priorityFilter !== 'ALL') {
        fetchedTickets = fetchedTickets.filter(ticket => ticket.priority === priorityFilter)
      }
      
      setTickets(fetchedTickets)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      setError(getErrorMessage(error, t('tickets.failedToLoad')))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      setError(t('tickets.pleaseFillInAllRequiredFields') || 'Please fill in all required fields')
      return
    }

    try {
      setError('')
      setSuccess('')
      
      const formData = new FormData()
      const ticketData = {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category
      }
      const ticketBlob = new Blob([JSON.stringify(ticketData)], { type: 'application/json' })
      formData.append('ticket', ticketBlob)
      
      if (attachment) {
        formData.append('attachment', attachment)
      }

      await api.post('/company-tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(t('tickets.ticketCreatedSuccessfully') || 'Ticket created successfully')
      setOpenCreate(false)
      setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL', assignedTo: null })
      setAttachment(null)
      setPreview(null)
      await fetchTickets()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to create ticket:', error)
      setError(getErrorMessage(error, t('tickets.failedToCreateTicket') || 'Failed to create ticket'))
    }
  }

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await api.get(`/company-tickets/${ticketId}`)
      const ticket = response.data.data
      setSelectedTicket(ticket)
      setOpenView(true)
      
      // Fetch attachment if exists
      if (ticket.attachmentUrl) {
        try {
          const imageUrl = getImageUrl(ticket.attachmentUrl)
          const apiPath = imageUrl.replace('/api', '')
          const blobResponse = await api.get(apiPath, { responseType: 'blob' })
          const blob = new Blob([blobResponse.data])
          const objectUrl = URL.createObjectURL(blob)
          setAttachmentObjectUrl(objectUrl)
        } catch (err) {
          console.error('Failed to fetch attachment:', err)
          setAttachmentObjectUrl(null)
        }
      } else {
        setAttachmentObjectUrl(null)
      }
      
      await fetchComments(ticketId)
      
      // Mark as read if user is ticket creator
      if (ticket.hasUnreadUpdates && ticket.user?.id === user?.id) {
        try {
          await api.put(`/company-tickets/${ticketId}/mark-read`)
          setTickets(prevTickets => 
            prevTickets.map(t => 
              t.id === ticketId ? { ...t, hasUnreadUpdates: false } : t
            )
          )
          setSelectedTicket({ ...ticket, hasUnreadUpdates: false })
        } catch (error) {
          console.error('Failed to mark ticket as read:', error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch ticket details:', error)
      setError(getErrorMessage(error, t('tickets.failedToLoadTicketDetails') || 'Failed to load ticket details'))
    }
  }

  const fetchComments = async (ticketId) => {
    try {
      setLoadingComments(true)
      const response = await api.get(`/company-tickets/${ticketId}/comments`)
      setComments(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return

    try {
      await api.post(`/company-tickets/${selectedTicket.id}/comments`, {
        comment: newComment
      })
      
      setNewComment('')
      await fetchComments(selectedTicket.id)
      await fetchTickets() // Refresh to update hasUnreadUpdates
    } catch (error) {
      console.error('Failed to add comment:', error)
      setError(getErrorMessage(error, t('tickets.failedToAddComment') || 'Failed to add comment'))
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setAttachment(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    }
  }

  const handleRemoveAttachment = () => {
    setAttachment(null)
    setPreview(null)
  }

  const getImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${api.defaults.baseURL.replace('/api', '')}${url}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'error'
      case 'IN_PROGRESS': return 'warning'
      case 'RESOLVED': return 'success'
      case 'CLOSED': return 'default'
      case 'WAITING_FOR_CUSTOMER': return 'warning'
      default: return 'default'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      OPEN: t('tickets.open'),
      IN_PROGRESS: t('tickets.inProgress'),
      RESOLVED: t('tickets.resolved'),
      CLOSED: t('tickets.closed'),
      WAITING_FOR_CUSTOMER: t('tickets.waitingForCustomer')
    }
    return labels[status] || status
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'error'
      case 'MEDIUM': return 'warning'
      case 'LOW': return 'info'
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
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)' }
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
      case 'HIGH':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)' }
        }
      case 'MEDIUM':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)' }
        }
      case 'LOW':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)' }
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

  const getCategoryLabel = (category) => {
    const labels = {
      GENERAL: t('tickets.categoryGeneral'),
      TECHNICAL: t('tickets.categoryTechnical'),
      BILLING: t('tickets.categoryBilling'),
      FEATURE_REQUEST: t('tickets.categoryFeatureRequest'),
      BUG_REPORT: t('tickets.categoryBugReport'),
      ACCOUNT_MANAGEMENT: t('tickets.categoryAccountManagement'),
      ATTENDANCE_ISSUE: t('tickets.categoryAttendanceIssue'),
      EMPLOYEE_MANAGEMENT: t('tickets.categoryEmployeeManagement'),
      REPORT_ISSUE: t('tickets.categoryReportIssue'),
      SYSTEM: t('tickets.categorySystem'),
      FEATURE: t('tickets.categoryFeature'),
      MAINTENANCE: t('tickets.categoryMaintenance'),
      HR: t('tickets.hr'),
      PAYROLL: t('tickets.payroll')
    }
    return labels[category] || category
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && tickets.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    )
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
            <AssignmentIcon sx={{ fontSize: 28, color: 'white' }} />
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
              {t('pageTitles.employeeTickets')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEmployee 
                ? (t('tickets.employeeTicketsDescription') || 'Create and manage tickets to HR')
                : (t('tickets.hrTicketsDescription') || 'Create and manage tickets to Admin')
              }
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTickets}
            disabled={loading}
            sx={{
              borderRadius: 2,
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#764ba2',
                background: 'rgba(102, 126, 234, 0.08)'
              }
            }}
          >
            {t('common.refresh') || 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
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
            {t('tickets.createTicket') || 'Create Ticket'}
          </Button>
        </Stack>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label={t('common.search')}
              placeholder={t('tickets.searchTickets') || t('common.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                )
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
              <InputLabel>{t('tickets.status') || 'Status'}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={t('tickets.status')}
              >
                <MenuItem value="ALL">{t('tickets.all') || t('common.all')}</MenuItem>
                <MenuItem value="OPEN">{t('tickets.open')}</MenuItem>
                <MenuItem value="IN_PROGRESS">{t('tickets.inProgress')}</MenuItem>
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
                onChange={(e) => setPriorityFilter(e.target.value)}
                label={t('tickets.priority')}
              >
                <MenuItem value="ALL">{t('tickets.all') || t('common.all')}</MenuItem>
                <MenuItem value="HIGH">{t('tickets.high') || t('tickets.priorityHigh')}</MenuItem>
                <MenuItem value="MEDIUM">{t('tickets.medium') || t('tickets.priorityMedium')}</MenuItem>
                <MenuItem value="LOW">{t('tickets.low') || t('tickets.priorityLow')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('tickets.noTickets') || 'No tickets found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('tickets.createYourFirstTicket') || 'Create your first ticket to get started'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
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
            {t('tickets.createTicket') || 'Create Ticket'}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {tickets.map((ticket) => (
            <Grid item xs={12} key={ticket.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  },
                  borderLeft: ticket.hasUnreadUpdates ? '4px solid' : 'none',
                  borderColor: ticket.hasUnreadUpdates ? 'primary.main' : 'transparent'
                }}
                onClick={() => handleViewTicket(ticket.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {ticket.title}
                        </Typography>
                        {ticket.hasUnreadUpdates && (
                          <Badge color="primary" variant="dot" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {ticket.description?.substring(0, 150)}
                        {ticket.description?.length > 150 ? '...' : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={getStatusLabel(ticket.status)}
                          size="small"
                          sx={getStatusChipStyles(ticket.status)}
                        />
                        <Chip
                          label={ticket.priority}
                          size="small"
                          icon={<PriorityHighIcon />}
                          sx={getPriorityChipStyles(ticket.priority)}
                        />
                        {ticket.category && (
                          <Chip
                            label={getCategoryLabel(ticket.category)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                        <Tooltip title={t('tickets.createdAt') || 'Created at'}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(ticket.createdAt)}
                            </Typography>
                          </Box>
                        </Tooltip>
                        {ticket.assignedTo && (
                          <Tooltip title={t('tickets.assignedTo') || 'Assigned to'}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {ticket.assignedTo?.firstName} {ticket.assignedTo?.lastName}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewTicket(ticket.id)
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      </Box>

      {/* Create Ticket Dialog */}
      <Dialog 
        open={openCreate} 
        onClose={() => setOpenCreate(false)} 
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('tickets.createTicket') || 'Create Ticket'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('tickets.title') || 'Title'}
            value={newTicket.title}
            onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('tickets.description') || 'Description'}
            value={newTicket.description}
            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('tickets.priority')}</InputLabel>
              <Select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                label={t('tickets.priority')}
              >
                <MenuItem value="LOW">{t('tickets.low') || 'Low'}</MenuItem>
                <MenuItem value="MEDIUM">{t('tickets.medium') || 'Medium'}</MenuItem>
                <MenuItem value="HIGH">{t('tickets.high') || 'High'}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('tickets.category') || 'Category'}</InputLabel>
              <Select
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                label={t('tickets.category') || 'Category'}
                renderValue={(value) => getCategoryLabel(value)}
              >
                <MenuItem value="GENERAL">{t('tickets.categoryGeneral')}</MenuItem>
                <MenuItem value="TECHNICAL">{t('tickets.categoryTechnical')}</MenuItem>
                <MenuItem value="BILLING">{t('tickets.categoryBilling')}</MenuItem>
                <MenuItem value="FEATURE_REQUEST">{t('tickets.categoryFeatureRequest')}</MenuItem>
                <MenuItem value="BUG_REPORT">{t('tickets.categoryBugReport')}</MenuItem>
                <MenuItem value="ACCOUNT_MANAGEMENT">{t('tickets.categoryAccountManagement')}</MenuItem>
                <MenuItem value="ATTENDANCE_ISSUE">{t('tickets.categoryAttendanceIssue')}</MenuItem>
                <MenuItem value="EMPLOYEE_MANAGEMENT">{t('tickets.categoryEmployeeManagement')}</MenuItem>
                <MenuItem value="REPORT_ISSUE">{t('tickets.categoryReportIssue')}</MenuItem>
                <MenuItem value="SYSTEM">{t('tickets.categorySystem')}</MenuItem>
                <MenuItem value="FEATURE">{t('tickets.categoryFeature')}</MenuItem>
                <MenuItem value="MAINTENANCE">{t('tickets.categoryMaintenance')}</MenuItem>
                <MenuItem value="HR">{t('tickets.hr')}</MenuItem>
                <MenuItem value="PAYROLL">{t('tickets.payroll')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2 }}>
            <input
              accept="image/*,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              id="attachment-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="attachment-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AttachFileIcon />}
                fullWidth
              >
                {attachment ? attachment.name : (t('tickets.attachFile') || 'Attach File')}
              </Button>
            </label>
            {preview && (
              <Box sx={{ mt: 2 }}>
                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleRemoveAttachment}
                  sx={{ mt: 1 }}
                >
                  {t('tickets.removeAttachment') || 'Remove'}
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button 
            onClick={handleCreateTicket} 
            variant="contained" 
            disabled={loading}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
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
            {t('tickets.create') || 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog 
        open={openView} 
        onClose={() => setOpenView(false)} 
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
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography 
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {selectedTicket?.title}
            </Typography>
            <IconButton onClick={() => setOpenView(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={getStatusLabel(selectedTicket.status)}
                    size="small"
                    sx={getStatusChipStyles(selectedTicket.status)}
                  />
                  <Chip
                    label={selectedTicket.priority}
                    size="small"
                    icon={<PriorityHighIcon />}
                    sx={getPriorityChipStyles(selectedTicket.priority)}
                  />
                  {selectedTicket.category && (
                    <Chip
                      label={getCategoryLabel(selectedTicket.category)}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        background: 'rgba(102, 126, 234, 0.08)',
                        color: '#667eea',
                        fontWeight: 500
                      }}
                    />
                  )}
                </Box>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.description}
                </Typography>
                {attachmentObjectUrl && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={attachmentObjectUrl}
                      alt="Attachment"
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('tickets.createdAt') || 'Created'}: {formatDate(selectedTicket.createdAt)}
                  </Typography>
                  {selectedTicket.assignedTo && (
                    <Typography variant="caption" color="text.secondary">
                      {t('tickets.assignedTo') || 'Assigned to'}: {selectedTicket.assignedTo?.firstName} {selectedTicket.assignedTo?.lastName}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Comments Section */}
              <Typography variant="h6" gutterBottom>
                {t('tickets.comments') || 'Comments'}
              </Typography>
              {loadingComments ? (
                <CircularProgress size={24} />
              ) : (
                <Box sx={{ maxHeight: '300px', overflowY: 'auto', mb: 2 }}>
                  {comments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('tickets.noComments') || 'No comments yet'}
                    </Typography>
                  ) : (
                    comments.map((comment) => (
                      <Box key={comment.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {comment.user?.firstName?.[0] || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {comment.user?.firstName} {comment.user?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(comment.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2">{comment.comment}</Typography>
                      </Box>
                    ))
                  )}
                </Box>
              )}

              {/* Add Comment */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('tickets.addComment') || 'Add a comment...'}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  multiline
                  rows={2}
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
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
                  {t('tickets.send') || 'Send'}
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>
            {t('common.close') || 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeeTickets

