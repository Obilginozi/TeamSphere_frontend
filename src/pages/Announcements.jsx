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
    isActive: true
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      const endpoint = (user?.role === 'ADMIN' || user?.role === 'HR') ? '/announcements' : '/announcements/active'
      const response = await api.get(endpoint)
      setAnnouncements(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
      setError(t('announcements.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      setError(null)
      const announcementData = {
        title: formData.title,
        content: formData.content,
        isActive: true
      }
      await api.post('/announcements', announcementData)
      setSuccess(t('announcements.announcementCreated'))
      setTimeout(() => setSuccess(null), 3000)
      handleCloseDialog()
      await fetchAnnouncements()
    } catch (err) {
      setError(t('announcements.failedToCreate'))
      console.error('Create announcement error:', err)
    }
  }

  const handleEdit = async () => {
    try {
      setError(null)
      const announcementData = {
        title: formData.title,
        content: formData.content,
        isActive: formData.isActive !== undefined ? formData.isActive : true
      }
      await api.put(`/announcements/${selectedAnnouncement.id}`, announcementData)
      setSuccess(t('announcements.announcementUpdated'))
      setTimeout(() => setSuccess(null), 3000)
      handleCloseDialog()
      await fetchAnnouncements()
    } catch (err) {
      setError(t('announcements.failedToUpdate'))
      console.error('Update announcement error:', err)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('announcements.confirmDelete'))) {
      try {
        setError(null)
        await api.delete(`/announcements/${id}`)
        setSuccess(t('announcements.announcementDeleted'))
        setTimeout(() => setSuccess(null), 3000)
        await fetchAnnouncements()
      } catch (err) {
        setError(t('announcements.failedToDelete'))
        console.error('Delete announcement error:', err)
      }
    }
  }

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setEditMode(true)
      setSelectedAnnouncement(announcement)
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        isActive: announcement.isActive !== undefined ? announcement.isActive : true
      })
    } else {
      setEditMode(false)
      setSelectedAnnouncement(null)
      setFormData({ title: '', content: '', isActive: true })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditMode(false)
    setSelectedAnnouncement(null)
    setFormData({ title: '', content: '', isActive: true })
  }

  const canManage = user?.role === 'ADMIN' || user?.role === 'HR'

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  const activeAnnouncements = announcements.filter(a => a.isActive !== false)
  const inactiveAnnouncements = announcements.filter(a => a.isActive === false)

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('announcements.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('announcements.subtitle')}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnnouncements}
            disabled={loading}
          >
            {t('announcements.refresh')}
          </Button>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              {t('announcements.createAnnouncement')}
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

      {/* Active Announcements */}
      {activeAnnouncements.length === 0 && !canManage ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <CampaignIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {t('announcements.noAnnouncementsYet')}
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            {canManage
              ? t('announcements.createFirstAnnouncement')
              : t('announcements.checkBackLater')}
          </Typography>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              {t('announcements.createFirst')}
            </Button>
          )}
        </Paper>
      ) : (
        <>
          {/* Active Announcements */}
          {activeAnnouncements.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                {t('announcements.activeAnnouncements')}
              </Typography>
              <Grid container spacing={3}>
                {activeAnnouncements.map((announcement) => (
                  <Grid item xs={12} md={6} key={announcement.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box flex={1}>
                            <Typography variant="h6" gutterBottom>
                              {announcement.title}
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                              {announcement.content}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                {announcement.createdBy?.firstName?.charAt(0) || 'A'}
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  {announcement.createdBy ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}` : 'Admin'}
                                </Typography>
                                <Typography variant="caption" display="block" color="textSecondary">
                                  {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'N/A'}
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

          {/* Inactive Announcements (HR/Admin only) */}
          {canManage && inactiveAnnouncements.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom color="textSecondary">
                {t('announcements.inactiveAnnouncements')}
              </Typography>
              <Grid container spacing={3}>
                {inactiveAnnouncements.map((announcement) => (
                  <Grid item xs={12} md={6} key={announcement.id}>
                    <Card sx={{ opacity: 0.7 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box flex={1}>
                            <Typography variant="h6" gutterBottom>
                              {announcement.title}
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                              {announcement.content}
                            </Typography>
                            <Chip label={t('announcements.inactive')} size="small" color="default" sx={{ mt: 1 }} />
                          </Box>
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
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? t('announcements.editAnnouncement') : t('announcements.createAnnouncement')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('announcements.announcementTitle')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('announcements.announcementContent')}
                multiline
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </Grid>
            {editMode && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  SelectProps={{ native: true }}
                >
                  <option value="true">{t('announcements.active')}</option>
                  <option value="false">{t('announcements.inactive')}</option>
                </TextField>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('announcements.cancel')}</Button>
          <Button
            onClick={editMode ? handleEdit : handleAdd}
            variant="contained"
          >
            {editMode ? t('common.save') : t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Announcements

