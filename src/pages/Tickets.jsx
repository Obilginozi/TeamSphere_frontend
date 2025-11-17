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
  Image as ImageIcon
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
        const response = await api.get('/general-tickets/hr-tickets')
        console.log('Fetched HR tickets:', response.data.data)
        setTickets(response.data.data || [])
      } else if (isHR) {
        // HR sees their own tickets
        const response = await api.get('/general-tickets/my-tickets')
        console.log('Fetched my tickets:', response.data.data)
        setTickets(response.data.data || [])
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
      // Append JSON with proper content type for @RequestPart
      const ticketBlob = new Blob([JSON.stringify(ticketData)], { type: 'application/json' })
      formData.append('ticket', ticketBlob)
      
      if (attachment) {
        formData.append('attachment', attachment)
      }

      const response = await api.post('/general-tickets', formData, {
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
      const response = await api.get(`/general-tickets/${ticketId}`)
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
          await api.put(`/general-tickets/${ticketId}/mark-read`)
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
      await api.post(`/general-tickets/${ticketId}/resolve`)
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

  const getImageUrl = (attachmentUrl) => {
    if (!attachmentUrl) return null
    // If it's a relative path, construct full URL
    if (attachmentUrl.startsWith('uploads/')) {
      // Extract the file path after uploads/
      const filePath = attachmentUrl.replace('uploads/', '')
      return `/api/general-tickets/files?path=${encodeURIComponent(attachmentUrl)}`
    }
    return attachmentUrl
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {isAdmin ? 'HR Tickets Management' : 'Create Ticket to Admin'}
        </Typography>
        {isHR && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
          >
            Create Ticket
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('tickets.title')}</TableCell>
                <TableCell>{t('tickets.category')}</TableCell>
                <TableCell>{t('tickets.priority')}</TableCell>
                <TableCell>{t('tickets.status')}</TableCell>
                {isAdmin && <TableCell>{t('tickets.createdBy')}</TableCell>}
                <TableCell>{t('tickets.createdAt')}</TableCell>
                <TableCell>{t('common.actions')}</TableCell>
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
                      label={ticket.priority}
                      color={getPriorityColor(ticket.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status}
                      color={getStatusColor(ticket.status)}
                      size="small"
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
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('tickets.createTicketToAdmin')}</DialogTitle>
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
        <DialogActions>
          <Button onClick={() => {
            setOpenCreate(false)
            setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'SYSTEM' })
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
      <Dialog open={openView} onClose={() => {
        setOpenView(false)
        setSelectedTicket(null)
        setComments([])
        setNewComment('')
        // Clean up object URL
        if (attachmentObjectUrl) {
          URL.revokeObjectURL(attachmentObjectUrl)
          setAttachmentObjectUrl(null)
        }
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('tickets.ticketDetails')}
          {selectedTicket && (
            <Chip
              label={selectedTicket.status}
              color={getStatusColor(selectedTicket.status)}
              size="small"
              sx={{ ml: 2 }}
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
                  label={selectedTicket.priority}
                  color={getPriorityColor(selectedTicket.priority)}
                  size="small"
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
                    <Button
                      variant="contained"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="small"
                    >
                      {t('tickets.sendMessage')}
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isAdmin && selectedTicket && selectedTicket.status !== 'RESOLVED' && (
            <Button
              onClick={() => handleResolveTicket(selectedTicket.id)}
              variant="contained"
              color="success"
            >
              {t('tickets.resolveTicket')}
            </Button>
          )}
          <Button onClick={() => setOpenView(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Tickets
