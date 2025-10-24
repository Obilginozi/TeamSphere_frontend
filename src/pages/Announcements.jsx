import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Avatar,
  Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Campaign as CampaignIcon,
  PushPin as PushPinIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Announcements = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    isPinned: false
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/announcements')
      setAnnouncements(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
      setError('Failed to load announcements. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      await api.post('/api/announcements', formData)
      setSuccess('Announcement created successfully!')
      handleCloseDialog()
      await fetchAnnouncements()
    } catch (err) {
      setError('Failed to create announcement. Please try again.')
    }
  }

  const handleEdit = async () => {
    try {
      await api.put(`/api/announcements/${selectedAnnouncement.id}`, formData)
      setSuccess('Announcement updated successfully!')
      handleCloseDialog()
      await fetchAnnouncements()
    } catch (err) {
      setError('Failed to update announcement. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/api/announcements/${id}`)
        setSuccess('Announcement deleted successfully!')
        await fetchAnnouncements()
      } catch (err) {
        setError('Failed to delete announcement. Please try again.')
      }
    }
  }

  const handlePin = async (id) => {
    try {
      await api.put(`/api/announcements/${id}/pin`)
      await fetchAnnouncements()
    } catch (err) {
      setError('Failed to pin announcement.')
    }
  }

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setEditMode(true)
      setSelectedAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        isPinned: announcement.isPinned
      })
    } else {
      setEditMode(false)
      setSelectedAnnouncement(null)
      setFormData({ title: '', content: '', priority: 'NORMAL', isPinned: false })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditMode(false)
    setSelectedAnnouncement(null)
    setFormData({ title: '', content: '', priority: 'NORMAL', isPinned: false })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'error'
      case 'NORMAL': return 'primary'
      case 'LOW': return 'default'
      default: return 'default'
    }
  }

  const canManage = user?.role === 'ADMIN' || user?.role === 'HR'

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  const pinnedAnnouncements = announcements.filter(a => a.isPinned)
  const regularAnnouncements = announcements.filter(a => !a.isPinned)

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Company Announcements
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Important updates and news for all employees
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnnouncements}
            disabled={loading}
          >
            Refresh
          </Button>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              New Announcement
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
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <Box mb={4}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PushPinIcon color="primary" />
            <Typography variant="h6">Pinned Announcements</Typography>
          </Box>
          <Grid container spacing={3}>
            {pinnedAnnouncements.map((announcement) => (
              <Grid item xs={12} key={announcement.id}>
                <Card elevation={3} sx={{ borderTop: 3, borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PushPinIcon color="primary" fontSize="small" />
                          <Typography variant="h5">{announcement.title}</Typography>
                          <Chip
                            label={announcement.priority}
                            color={getPriorityColor(announcement.priority)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body1" paragraph>
                          {announcement.content}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {announcement.authorName?.charAt(0) || 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Posted by {announcement.authorName || 'Admin'}
                            </Typography>
                            <Typography variant="caption" display="block" color="textSecondary">
                              {new Date(announcement.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      {canManage && (
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(announcement)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Regular Announcements */}
      {regularAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <CampaignIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No announcements yet
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            {canManage
              ? "Create your first announcement to keep everyone informed"
              : "Check back later for updates"}
          </Typography>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create First Announcement
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {regularAnnouncements.map((announcement) => (
            <Grid item xs={12} md={6} key={announcement.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6">{announcement.title}</Typography>
                        <Chip
                          label={announcement.priority}
                          color={getPriorityColor(announcement.priority)}
                          size="small"
                        />
                      </Box>
                    </Box>
                    {canManage && (
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handlePin(announcement.id)}
                        >
                          <PushPinIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(announcement)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" paragraph>
                    {announcement.content}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                      {announcement.authorName?.charAt(0) || 'A'}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        {announcement.authorName || 'Admin'}
                      </Typography>
                      <Typography variant="caption" display="block" color="textSecondary">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Pin Announcement"
                value={formData.isPinned.toString()}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.value === 'true' })}
                SelectProps={{ native: true }}
              >
                <option value="false">No</option>
                <option value="true">Yes (Pin to top)</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={editMode ? handleEdit : handleAdd}
            variant="contained"
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Announcements

