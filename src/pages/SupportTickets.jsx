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
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material'
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const SupportTickets = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL'
  })
  const [attachment, setAttachment] = useState(null)
  const [comment, setComment] = useState('')
  const [commentAttachment, setCommentAttachment] = useState(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/tickets/my')
      setTickets(response.data.data)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    try {
      const formData = new FormData()
      formData.append('ticket', JSON.stringify(newTicket))
      if (attachment) {
        formData.append('attachment', attachment)
      }

      await api.post('/api/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setOpenCreate(false)
      setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL' })
      setAttachment(null)
      fetchTickets()
    } catch (error) {
      console.error('Failed to create ticket:', error)
    }
  }

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await api.get(`/api/tickets/${ticketId}`)
      setSelectedTicket(response.data.data)
      setOpenView(true)
    } catch (error) {
      console.error('Failed to fetch ticket details:', error)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return

    try {
      const formData = new FormData()
      formData.append('comment', JSON.stringify({ comment }))
      if (commentAttachment) {
        formData.append('attachment', commentAttachment)
      }

      await api.post(`/api/tickets/${selectedTicket.id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setComment('')
      setCommentAttachment(null)
      handleViewTicket(selectedTicket.id) // Refresh ticket details
    } catch (error) {
      console.error('Failed to add comment:', error)
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
      case 'WAITING_FOR_CUSTOMER': return 'warning'
      case 'RESOLVED': return 'success'
      case 'CLOSED': return 'default'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Support Tickets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          Create Ticket
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell>#{ticket.id}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    <Chip label={ticket.category} size="small" />
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
                      label={ticket.status.replace('_', ' ')} 
                      color={getStatusColor(ticket.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewTicket(ticket.id)} size="small">
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Ticket Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={newTicket.title}
            onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={newTicket.description}
            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            multiline
            rows={4}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              label="Category"
            >
              <MenuItem value="GENERAL">General</MenuItem>
              <MenuItem value="TECHNICAL">Technical</MenuItem>
              <MenuItem value="BILLING">Billing</MenuItem>
              <MenuItem value="FEATURE_REQUEST">Feature Request</MenuItem>
              <MenuItem value="BUG_REPORT">Bug Report</MenuItem>
              <MenuItem value="ACCOUNT_MANAGEMENT">Account Management</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              label="Priority"
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAttachment(e.target.files[0])}
              style={{ display: 'none' }}
              id="ticket-attachment"
            />
            <label htmlFor="ticket-attachment">
              <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                Attach Screenshot
              </Button>
            </label>
            {attachment && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {attachment.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateTicket} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
        {selectedTicket && (
          <>
            <DialogTitle>
              Ticket #{selectedTicket.id}: {selectedTicket.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={selectedTicket.status.replace('_', ' ')} 
                  color={getStatusColor(selectedTicket.status)}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={selectedTicket.priority} 
                  color={getPriorityColor(selectedTicket.priority)}
                />
              </Box>
              <Typography variant="subtitle2" color="textSecondary">
                Description:
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedTicket.description}
              </Typography>
              {selectedTicket.attachmentUrl && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Attachment:
                  </Typography>
                  <a href={selectedTicket.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    {selectedTicket.attachmentFilename}
                  </a>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Comments
              </Typography>
              <List>
                {selectedTicket.comments && selectedTicket.comments.map((comment) => (
                  <ListItem key={comment.id} alignItems="flex-start">
                    <ListItemText
                      primary={comment.userName}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary">
                            {comment.comment}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(comment.createdAt).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Add Comment
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Type your comment here..."
                margin="normal"
              />
              <Box sx={{ mt: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCommentAttachment(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="comment-attachment"
                />
                <label htmlFor="comment-attachment">
                  <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                    Attach File
                  </Button>
                </label>
                {commentAttachment && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected: {commentAttachment.name}
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenView(false)}>Close</Button>
              <Button onClick={handleAddComment} variant="contained">
                Add Comment
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default SupportTickets

