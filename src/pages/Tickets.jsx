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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  Grid,
  ImageList,
  ImageListItem
} from '@mui/material'
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Support
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { getErrorMessage, logSuccessDetails } from '../utils/errorHandler'
import { useTranslation } from 'react-i18next'

const Tickets = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isHR = user?.role === 'HR'
  
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'SYSTEM'
  })
  const [attachment, setAttachment] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [attachmentObjectUrl, setAttachmentObjectUrl] = useState(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError('')
      if (isAdmin) {
        // Admins see all HR tickets
        const response = await api.get('/company-tickets/hr-tickets')
        setTickets(response.data.data || [])
      } else if (isHR) {
        // HR sees their own tickets
        const response = await api.get('/company-tickets/my-tickets')
        setTickets(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      const errorMessage = getErrorMessage(error, t('tickets.failedToLoad'))
      setError(errorMessage)
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
      // Append JSON with proper content type for @RequestPart
      const ticketBlob = new Blob([JSON.stringify(ticketData)], { type: 'application/json' })
      formData.append('ticket', ticketBlob)
      
      if (attachment) {
        formData.append('attachment', attachment)
      }

      const response = await api.post('/company-tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      logSuccessDetails(response, 'Ticket created', { ticket: newTicket, hasAttachment: !!attachment })
      setSuccess(t('tickets.ticketCreatedSuccessfully'))
      setOpenCreate(false)
      setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'SYSTEM' })
      setAttachment(null)
      setPreview(null)
      // Refresh tickets immediately
      await fetchTickets()
      setTimeout(() => {
        setSuccess('')
      }, 2000)
    } catch (error) {
      console.error('Failed to create ticket:', error)
      setError(getErrorMessage(error, t('tickets.failedToCreateTicket')))
    }
  }

  const handleViewTicket = async (ticketId) => {
    try {
      setError('')
      const response = await api.get(`/company-tickets/${ticketId}`)
      const ticket = response.data.data
      setSelectedTicket(ticket)
      setOpenView(true)
      
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
      
      // Load comments
      await fetchComments(ticketId)
      
      // Mark ticket as read if HR user views it
      if (isHR && ticket.hasUnreadUpdates) {
        try {
          await api.put(`/company-tickets/${ticketId}/mark-read`)
          // Update local ticket state
          setTickets(prevTickets => 
            prevTickets.map(t => 
              t.id === ticketId ? { ...t, hasUnreadUpdates: false } : t
            )
          )
          // Update selected ticket
          setSelectedTicket({ ...ticket, hasUnreadUpdates: false })
        } catch (error) {
          console.error('Failed to mark ticket as read:', error)
          // Don't show error to user, just log it
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
      const response = await api.post(`/company-tickets/${selectedTicket.id}/comments`, {
        comment: newComment
      })
      logSuccessDetails(response, 'Comment added', { ticketId: selectedTicket.id, comment: newComment })
      setComments([...comments, response.data.data])
      setNewComment('')
      setSuccess(t('tickets.commentAddedSuccessfully'))
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to add comment:', error)
      setError(getErrorMessage(error, t('tickets.failedToAddComment')))
    }
  }

  const canAddComment = () => {
    if (!selectedTicket || !user) return false
    // Admin or ticket creator (HR) can add comments
    if (isAdmin) return true
    if (isHR && selectedTicket.user && user.id) {
      return selectedTicket.user.id === user.id
    }
    return false
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        setAttachment(file)
        // Create preview
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

  const handleResolveTicket = async (ticketId) => {
    try {
      await api.post(`/company-tickets/${ticketId}/resolve`)
      setSuccess(t('tickets.ticketResolvedSuccessfully'))
      fetchTickets()
      if (selectedTicket?.id === ticketId) {
        handleViewTicket(ticketId)
      }
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to resolve ticket:', error)
      setError(t('tickets.failedToResolveTicket'))
    }
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

  const getCategoryLabel = (category) => {
    const labels = {
      SYSTEM: t('tickets.categorySystem'),
      FEATURE: t('tickets.categoryFeature'),
      MAINTENANCE: t('tickets.categoryMaintenance'),
      GENERAL: t('tickets.categoryGeneral'),
      TECHNICAL: t('tickets.categoryTechnical'),
      BILLING: t('tickets.categoryBilling'),
      FEATURE_REQUEST: t('tickets.categoryFeatureRequest'),
      BUG_REPORT: t('tickets.categoryBugReport'),
      ACCOUNT_MANAGEMENT: t('tickets.categoryAccountManagement'),
      ATTENDANCE_ISSUE: t('tickets.categoryAttendanceIssue'),
      EMPLOYEE_MANAGEMENT: t('tickets.categoryEmployeeManagement'),
      REPORT_ISSUE: t('tickets.categoryReportIssue')
    }
    return labels[category] || category
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

  const getPriorityLabel = (priority) => {
    const labels = {
      LOW: t('tickets.priorityLow'),
      MEDIUM: t('tickets.priorityMedium'),
      HIGH: t('tickets.priorityHigh'),
      CRITICAL: t('tickets.priorityCritical')
    }
    return labels[priority] || priority
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
                <Support sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
          {isAdmin ? t('pageTitles.supportTickets') : t('pageTitles.createTicketToAdmin')}
        </Typography>
              </Box>
            </Box>
          </Box>
        {isHR && (
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
            {t('tickets.createTicket')}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Typography>{t('tickets.loadingTickets')}</Typography>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {isAdmin ? t('tickets.noHRTicketsFound') : t('tickets.noTicketsCreatedYet')}
            </Typography>
            {isHR && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreate(true)}
                sx={{ mt: 2 }}
              >
                {t('tickets.createYourFirstTicket')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
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
                <TableCell><strong>{t('tickets.title')}</strong></TableCell>
                <TableCell><strong>{t('tickets.category')}</strong></TableCell>
                <TableCell><strong>{t('tickets.priority')}</strong></TableCell>
                <TableCell><strong>{t('tickets.status')}</strong></TableCell>
                {isAdmin && <TableCell><strong>{t('tickets.createdBy')}</strong></TableCell>}
                <TableCell><strong>{t('tickets.createdAt')}</strong></TableCell>
                <TableCell><strong>{t('common.actions')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
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
                      <Typography variant="body2" sx={{ fontWeight: ticket.hasUnreadUpdates ? 'bold' : 'normal' }}>
                        {ticket.title}
                      </Typography>
                    </Box>
                  </TableCell>
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
                  {isAdmin && (
                    <TableCell>
                      {ticket.user?.email || t('common.unknown')}
                    </TableCell>
                  )}
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewTicket(ticket.id)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {isAdmin && ticket.status !== 'RESOLVED' && (
                      <IconButton
                        size="small"
                        onClick={() => handleResolveTicket(ticket.id)}
                        color="success"
                      >
                        <Typography variant="caption">{t('tickets.resolve')}</Typography>
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
          {t('tickets.createTicketToAdmin')}
        </DialogTitle>
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
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('tickets.category')}</InputLabel>
              <Select
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                label={t('tickets.category')}
              >
                <MenuItem value="SYSTEM">{t('tickets.categorySystem')}</MenuItem>
                <MenuItem value="FEATURE">{t('tickets.categoryFeature')}</MenuItem>
                <MenuItem value="MAINTENANCE">{t('tickets.categoryMaintenance')}</MenuItem>
                <MenuItem value="GENERAL">{t('tickets.categoryGeneral')}</MenuItem>
                <MenuItem value="TECHNICAL">{t('tickets.categoryTechnical')}</MenuItem>
              </Select>
            </FormControl>
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
                  sx={{ mr: 2 }}
                >
                  {t('tickets.attachScreenshot')}
                </Button>
              </label>
              {attachment && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ImageIcon color="primary" />
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
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => {
            setOpenCreate(false)
            setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'SYSTEM' })
            setAttachment(null)
            setPreview(null)
            setError('')
            }}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleCreateTicket} 
            variant="contained"
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
        // Clean up object URL
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
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          <Box component="span">
          {t('tickets.ticketDetails')}
          </Box>
          {selectedTicket && (
            <Chip
              label={getStatusLabel(selectedTicket.status)}
              size="small"
              sx={getStatusChipStyles(selectedTicket.status)}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTicket.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip label={getCategoryLabel(selectedTicket.category)} size="small" />
                <Chip
                  label={getPriorityLabel(selectedTicket.priority)}
                  size="small"
                  sx={getPriorityChipStyles(selectedTicket.priority)}
                />
              </Box>
              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {selectedTicket.description}
              </Typography>
              {selectedTicket.attachmentUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('tickets.attachedScreenshot')}:
                  </Typography>
                  {attachmentObjectUrl ? (
                    <img
                      src={attachmentObjectUrl}
                      alt="Ticket attachment"
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t('tickets.loadingImage')}
                    </Typography>
                  )}
                  <Typography variant="body2" color="error" sx={{ display: 'none' }}>
                    {t('tickets.failedToLoadImage')}
                  </Typography>
                  {selectedTicket.attachmentFilename && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedTicket.attachmentFilename}
                    </Typography>
                  )}
                </Box>
              )}
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('tickets.created')}: {new Date(selectedTicket.createdAt).toLocaleString()}
                </Typography>
                {selectedTicket.resolvedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('tickets.resolved')}: {new Date(selectedTicket.resolvedAt).toLocaleString()}
                  </Typography>
                )}
              </Box>

              {/* Comments Section */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  {t('tickets.messages')}
                </Typography>
                
                {/* Comments List */}
                {loadingComments ? (
                  <Typography variant="body2" color="text.secondary">{t('tickets.loadingComments')}</Typography>
                ) : comments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('tickets.noMessagesYet')}
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: '300px', overflowY: 'auto', mb: 2 }}>
                    {comments.map((comment) => (
                      <Box
                        key={comment.id}
                        sx={{
                          mb: 2,
                          p: 2,
                          bgcolor: comment.userRole === 'ADMIN' ? 'primary.50' : 'grey.50',
                          borderRadius: 1,
                          borderLeft: comment.userRole === 'ADMIN' ? '3px solid' : '3px solid',
                          borderColor: comment.userRole === 'ADMIN' ? 'primary.main' : 'grey.400'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {comment.userName} {comment.userRole === 'ADMIN' && `(${t('roles.admin')})`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(comment.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {comment.comment}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Add Comment Form */}
                {canAddComment() && (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder={t('tickets.typeYourMessageHere')}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        size="small"
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
                        {t('tickets.sendMessage')}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          {isAdmin && selectedTicket && selectedTicket.status !== 'RESOLVED' && (
            <Button
              onClick={() => handleResolveTicket(selectedTicket.id)}
              variant="contained"
              color="success"
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {t('tickets.resolveTicket')}
            </Button>
          )}
          <Button 
            onClick={() => setOpenView(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  )
}

export default Tickets
