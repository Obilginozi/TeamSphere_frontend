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
  InputAdornment
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

  useEffect(() => {
    fetchTickets()
    fetchMetrics()
  }, [statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/tickets')
      let filteredTickets = response.data.data

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

      setTickets(filteredTickets)
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
      return `/api/general-tickets/files?path=${encodeURIComponent(attachmentUrl)}`
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
      formData.append('comment', JSON.stringify({
        comment: replyText,
        isInternal: false
      }))
      
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

  const handleAssignTicket = async () => {
    if (!selectedTicket || !assignedAdmin) return

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

  const getSLAIndicator = (slaPercentage) => {
    if (slaPercentage >= 95) return { color: 'success', icon: <CheckCircleIcon /> }
    if (slaPercentage >= 80) return { color: 'warning', icon: <WarningIcon /> }
    return { color: 'error', icon: <ErrorIcon /> }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">{t('adminTickets.title')}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('adminTickets.subtitle')}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchTickets(); fetchMetrics(); }}>
          {t('common.refresh')}
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
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
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>{t('adminTickets.openTickets')}</Typography>
                    <Typography variant="h3" color="primary">{metrics.openTickets}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>{t('adminTickets.inProgressTickets')}</Typography>
                    <Typography variant="h3" color="warning.main">{metrics.inProgressTickets}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>{t('adminTickets.resolvedTickets')}</Typography>
                    <Typography variant="h3" color="success.main">{metrics.resolvedTickets}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>{t('adminTickets.totalActive')}</Typography>
                    <Typography variant="h3">{metrics.activeTickets}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder={t('adminTickets.searchTickets')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={fetchTickets}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
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
                <FormControl fullWidth>
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('tickets.ticketId')}</TableCell>
                  <TableCell>{t('tickets.title')}</TableCell>
                  <TableCell>{t('adminTickets.createdByHR')}</TableCell>
                  <TableCell>{t('adminTickets.company')}</TableCell>
                  <TableCell>{t('tickets.category')}</TableCell>
                  <TableCell>{t('tickets.priority')}</TableCell>
                  <TableCell>{t('tickets.status')}</TableCell>
                  <TableCell>{t('tickets.assignedTo')}</TableCell>
                  <TableCell>{t('tickets.createdAt')}</TableCell>
                  <TableCell>{t('employees.actions')}</TableCell>
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
                        {ticket.assignedToUserName || (
                          <Button
                            size="small"
                            startIcon={<AssignIcon />}
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setAssignDialogOpen(true)
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
            <Card>
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
            <Card>
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
            <Card>
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
            <Alert severity="warning">
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
      >
        {selectedTicket && (
          <>
            <DialogTitle>{t('tickets.title')} #{selectedTicket.id}: {selectedTicket.title}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Chip label={selectedTicket.status} color={getStatusColor(selectedTicket.status)} sx={{ mr: 1 }} />
                  <Chip label={selectedTicket.priority} color={getPriorityColor(selectedTicket.priority)} sx={{ mr: 1 }} />
                  <Chip label={selectedTicket.category} />
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
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>{t('common.close')}</Button>
              <Button 
                variant="contained" 
                startIcon={<ReplyIcon />}
                onClick={() => {
                  setViewDialogOpen(false)
                  setReplyDialogOpen(true)
                }}
              >
                {t('adminTickets.reply')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Assign Ticket Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>{t('adminTickets.assignTicket')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('adminTickets.adminUserId')}
            type="number"
            value={assignedAdmin}
            onChange={(e) => setAssignedAdmin(e.target.value)}
            margin="normal"
            helperText={t('adminTickets.enterAdminUserId')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleAssignTicket} variant="contained">{t('adminTickets.assign')}</Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
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
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleReplyToTicket} 
            variant="contained"
            disabled={!replyText.trim()}
            startIcon={<ReplyIcon />}
          >
            {t('adminTickets.sendReply')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminTicketManagement

