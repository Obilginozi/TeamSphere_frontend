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
  Tabs,
  Tab,
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
  FilterList as FilterListIcon,
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

const GeneralTickets = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isHR = user?.role === 'HR'
  const isEmployee = user?.role === 'EMPLOYEE'
  
  // State management
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0) // 0: All, 1: My Tickets, 2: Assigned to Me
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
    category: 'GENERAL'
  })
  const [attachment, setAttachment] = useState(null)
  const [preview, setPreview] = useState(null)
  const [newComment, setNewComment] = useState('')
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)
  
  // UI state
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [attachmentObjectUrl, setAttachmentObjectUrl] = useState(null)

  useEffect(() => {
    fetchTickets()
  }, [activeTab])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') {
        fetchTickets()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError('')
      
      let response
      if (activeTab === 0) {
        // All tickets - paginated
        response = await api.get('/general-tickets', {
          params: {
            page: 0,
            size: 100,
            sort: 'createdAt,desc'
          }
        })
        setTickets(response.data.data?.content || response.data.data || [])
      } else if (activeTab === 1) {
        // My tickets
        response = await api.get('/general-tickets/my-tickets')
        setTickets(response.data.data || [])
      } else if (activeTab === 2 && (isAdmin || isHR)) {
        // Assigned to me
        response = await api.get('/general-tickets/assigned-to-me')
        setTickets(response.data.data || [])
      } else {
        setTickets([])
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      setError(getErrorMessage(error, t('tickets.failedToLoad')))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      setError(t('tickets.pleaseFillInAllRequiredFields'))
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

      await api.post('/general-tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(t('tickets.ticketCreatedSuccessfully'))
      setOpenCreate(false)
      setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL' })
      setAttachment(null)
      setPreview(null)
      await fetchTickets()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to create ticket:', error)
      setError(getErrorMessage(error, t('tickets.failedToCreateTicket')))
    }
  }

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await api.get(`/general-tickets/${ticketId}`)
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
      if ((isHR || isEmployee) && ticket.hasUnreadUpdates && ticket.user?.id === user?.id) {
        try {
          await api.put(`/general-tickets/${ticketId}/mark-read`)
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
      setError(getErrorMessage(error, t('tickets.failedToLoadTicketDetails')))
    }
  }

  const fetchComments = async (ticketId) => {
    try {
      setLoadingComments(true)
      const response = await api.get(`/general-tickets/${ticketId}/comments`)
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
      const response = await api.post(`/general-tickets/${selectedTicket.id}/comments`, {
        comment: newComment
      })
      setComments([...comments, response.data.data])
      setNewComment('')
      setSuccess(t('tickets.commentAddedSuccessfully'))
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to add comment:', error)
      setError(getErrorMessage(error, t('tickets.failedToAddComment')))
    }
  }

  const handleAssignTicket = async (ticketId, assignedToId) => {
    try {
      await api.post(`/general-tickets/${ticketId}/assign`, null, {
        params: { assignedToId }
      })
      setSuccess(t('tickets.ticketAssignedSuccessfully'))
      await fetchTickets()
      if (selectedTicket?.id === ticketId) {
        handleViewTicket(ticketId)
      }
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to assign ticket:', error)
      setError(getErrorMessage(error, t('tickets.failedToAssignTicket')))
    }
  }

  const handleResolveTicket = async (ticketId) => {
    try {
      await api.post(`/general-tickets/${ticketId}/resolve`)
      setSuccess(t('tickets.ticketResolvedSuccessfully'))
      await fetchTickets()
      if (selectedTicket?.id === ticketId) {
        handleViewTicket(ticketId)
      }
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to resolve ticket:', error)
      setError(getErrorMessage(error, t('tickets.failedToResolveTicket')))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setAttachment(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setError(t('tickets.pleaseSelectImageFile'))
      }
    }
  }

  const handleRemoveAttachment = () => {
    setAttachment(null)
    setPreview(null)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'info'
      case 'MEDIUM': return 'warning'
      case 'HIGH': return 'error'
      case 'CRITICAL': return 'error'
      default: return 'default'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'info'
      case 'IN_PROGRESS': return 'warning'
      case 'RESOLVED': return 'success'
      case 'CLOSED': return 'default'
      default: return 'default'
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
      MAINTENANCE: t('tickets.categoryMaintenance')
    }
    return labels[category] || category
  }

  const getImageUrl = (attachmentUrl) => {
    if (!attachmentUrl) return null
    if (attachmentUrl.startsWith('uploads/')) {
      return `/api/general-tickets/files?path=${encodeURIComponent(attachmentUrl)}`
    }
    return attachmentUrl
  }

  const canAddComment = () => {
    if (!selectedTicket || !user) return false
    if (isAdmin) return true
    if ((isHR || isEmployee) && selectedTicket.user?.id === user.id) return true
    return false
  }

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter
    const matchesCategory = categoryFilter === 'ALL' || ticket.category === categoryFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  if (loading && tickets.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            {t('tickets.generalTickets') || 'General Tickets'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('tickets.manageInternalTickets') || 'Manage and track internal company tickets'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTickets}
            disabled={loading}
          >
            {t('common.refresh') || 'Refresh'}
          </Button>
          {(isHR || isEmployee) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreate(true)}
            >
              {t('tickets.createTicket') || 'Create Ticket'}
            </Button>
          )}
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

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={t('tickets.allTickets') || 'All Tickets'} />
          <Tab label={t('tickets.myTickets') || 'My Tickets'} />
          {(isAdmin || isHR) && <Tab label={t('tickets.assignedToMe') || 'Assigned to Me'} />}
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{t('common.filters') || 'Filters'}</Typography>
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            <FilterListIcon />
          </IconButton>
        </Box>
        {showFilters && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('tickets.searchTickets') || 'Search tickets...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('tickets.status')}</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label={t('tickets.status')}
                >
                  <MenuItem value="ALL">{t('common.all') || 'All'}</MenuItem>
                  <MenuItem value="OPEN">{t('tickets.open')}</MenuItem>
                  <MenuItem value="IN_PROGRESS">{t('tickets.inProgress')}</MenuItem>
                  <MenuItem value="RESOLVED">{t('tickets.resolved')}</MenuItem>
                  <MenuItem value="CLOSED">{t('tickets.closed')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('tickets.priority')}</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  label={t('tickets.priority')}
                >
                  <MenuItem value="ALL">{t('common.all') || 'All'}</MenuItem>
                  <MenuItem value="LOW">{t('tickets.priorityLow')}</MenuItem>
                  <MenuItem value="MEDIUM">{t('tickets.priorityMedium')}</MenuItem>
                  <MenuItem value="HIGH">{t('tickets.priorityHigh')}</MenuItem>
                  <MenuItem value="CRITICAL">{t('tickets.priorityCritical')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('tickets.category')}</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label={t('tickets.category')}
                >
                  <MenuItem value="ALL">{t('common.all') || 'All'}</MenuItem>
                  <MenuItem value="GENERAL">{t('tickets.categoryGeneral')}</MenuItem>
                  <MenuItem value="TECHNICAL">{t('tickets.categoryTechnical')}</MenuItem>
                  <MenuItem value="BILLING">{t('tickets.categoryBilling')}</MenuItem>
                  <MenuItem value="FEATURE_REQUEST">{t('tickets.categoryFeatureRequest')}</MenuItem>
                  <MenuItem value="BUG_REPORT">{t('tickets.categoryBugReport')}</MenuItem>
                  <MenuItem value="ATTENDANCE_ISSUE">{t('tickets.categoryAttendanceIssue')}</MenuItem>
                  <MenuItem value="EMPLOYEE_MANAGEMENT">{t('tickets.categoryEmployeeManagement')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Tickets List */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {t('tickets.noTicketsFound') || 'No tickets found'}
            </Typography>
            {(isHR || isEmployee) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreate(true)}
                sx={{ mt: 2 }}
              >
                {t('tickets.createYourFirstTicket') || 'Create Your First Ticket'}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredTickets.map((ticket) => (
            <Grid item xs={12} key={ticket.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  borderLeft: ticket.hasUnreadUpdates ? '4px solid' : 'none',
                  borderColor: 'error.main'
                }}
                onClick={() => handleViewTicket(ticket.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {ticket.hasUnreadUpdates && (
                          <Badge badgeContent=" " color="error" variant="dot" />
                        )}
                        <Typography variant="h6" sx={{ fontWeight: ticket.hasUnreadUpdates ? 600 : 400 }}>
                          {ticket.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {ticket.description?.substring(0, 150)}
                        {ticket.description?.length > 150 ? '...' : ''}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        <Chip 
                          label={getCategoryLabel(ticket.category)} 
                          size="small" 
                          variant="outlined"
                        />
                        <Chip
                          label={ticket.priority}
                          color={getPriorityColor(ticket.priority)}
                          size="small"
                          icon={<PriorityHighIcon />}
                        />
                        <Chip
                          label={ticket.status}
                          color={getStatusColor(ticket.status)}
                          size="small"
                        />
                        {ticket.assignedTo && (
                          <Chip
                            label={`Assigned: ${ticket.assignedTo?.firstName || 'N/A'}`}
                            size="small"
                            icon={<PersonIcon />}
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        <ScheduleIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewTicket(ticket.id)
                        }}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('tickets.createNewTicket') || 'Create New Ticket'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t('tickets.title')}
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('tickets.description')}
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('tickets.category')}</InputLabel>
                  <Select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    label={t('tickets.category')}
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
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('tickets.priority')}</InputLabel>
                  <Select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    label={t('tickets.priority')}
                  >
                    <MenuItem value="LOW">{t('tickets.priorityLow')}</MenuItem>
                    <MenuItem value="MEDIUM">{t('tickets.priorityMedium')}</MenuItem>
                    <MenuItem value="HIGH">{t('tickets.priorityHigh')}</MenuItem>
                    <MenuItem value="CRITICAL">{t('tickets.priorityCritical')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
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
                >
                  {t('tickets.attachScreenshot') || 'Attach Screenshot'}
                </Button>
              </label>
              {attachment && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">{attachment.name}</Typography>
                    <IconButton size="small" onClick={handleRemoveAttachment} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  {preview && (
                    <Box sx={{ mt: 2 }}>
                      <img
                        src={preview}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCreate(false)
            setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL' })
            setAttachment(null)
            setPreview(null)
            setError('')
          }}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreateTicket} variant="contained">
            {t('tickets.createTicket')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog 
        open={openView} 
        onClose={() => {
          setOpenView(false)
          setSelectedTicket(null)
          setComments([])
          setNewComment('')
          if (attachmentObjectUrl) {
            URL.revokeObjectURL(attachmentObjectUrl)
            setAttachmentObjectUrl(null)
          }
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('tickets.ticketDetails') || 'Ticket Details'}</Typography>
            {selectedTicket && (
              <Chip
                label={selectedTicket.status}
                color={getStatusColor(selectedTicket.status)}
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {selectedTicket.title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
                <Chip label={getCategoryLabel(selectedTicket.category)} size="small" variant="outlined" />
                <Chip
                  label={selectedTicket.priority}
                  color={getPriorityColor(selectedTicket.priority)}
                  size="small"
                />
              </Stack>
              <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                {selectedTicket.description}
              </Typography>
              
              {selectedTicket.attachmentUrl && (
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('tickets.attachedScreenshot') || 'Attached Screenshot'}:
                  </Typography>
                  {attachmentObjectUrl ? (
                    <img
                      src={attachmentObjectUrl}
                      alt="Ticket attachment"
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }}
                    />
                  ) : (
                    <CircularProgress size={24} />
                  )}
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Ticket Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('tickets.createdBy') || 'Created by'}: {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('tickets.createdAt') || 'Created'}: {new Date(selectedTicket.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedTicket.assignedTo && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('tickets.assignedTo') || 'Assigned to'}: {selectedTicket.assignedTo?.firstName} {selectedTicket.assignedTo?.lastName}
                    </Typography>
                  </Grid>
                )}
                {selectedTicket.resolvedAt && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('tickets.resolvedAt') || 'Resolved'}: {new Date(selectedTicket.resolvedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Comments Section */}
              <Typography variant="h6" gutterBottom>
                {t('tickets.comments') || 'Comments'} ({comments.length})
              </Typography>
              
              {loadingComments ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
                  {t('tickets.noCommentsYet') || 'No comments yet'}
                </Typography>
              ) : (
                <Box sx={{ maxHeight: '400px', overflowY: 'auto', mb: 2 }}>
                  {comments.map((comment) => (
                    <Card key={comment.id} sx={{ mb: 2, bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {comment.userName?.charAt(0) || 'U'}
                            </Avatar>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {comment.userName}
                            </Typography>
                            {comment.userRole === 'ADMIN' && (
                              <Chip label={t('roles.admin')} size="small" color="primary" />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(comment.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {comment.comment}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Add Comment */}
              {canAddComment() && (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={t('tickets.typeYourCommentHere') || 'Type your comment here...'}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    {t('tickets.sendComment') || 'Send Comment'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {(isAdmin || isHR) && selectedTicket && selectedTicket.status !== 'RESOLVED' && (
            <>
              <Button
                onClick={() => handleResolveTicket(selectedTicket.id)}
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
              >
                {t('tickets.resolveTicket') || 'Resolve Ticket'}
              </Button>
            </>
          )}
          <Button onClick={() => setOpenView(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default GeneralTickets

