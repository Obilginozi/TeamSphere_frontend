import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Tooltip,
  Paper
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  RotateRight as RotateRightIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'
import api from '../services/api'

const ShiftManagement = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { isPageEnabled } = useFeatureFlags()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(getMondayOfCurrentWeek())
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '08:00',
    endTime: '16:00',
    color: '#1976d2',
    breakDurationMinutes: 60,
    maxEmployees: null,
    isActive: true
  })
  const [assignFormData, setAssignFormData] = useState({
    employeeId: '',
    shiftId: ''
  })

  // Check if shift management is enabled
  if (!isPageEnabled('shift-management')) {
    return (
      <Box p={3}>
        <Alert severity="info">
          {t('shiftManagement.featureNotEnabled')}
        </Alert>
      </Box>
    )
  }

  useEffect(() => {
    fetchShifts()
    fetchEmployees()
    fetchAssignments()
  }, [selectedWeek])

  function getMondayOfCurrentWeek() {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  const fetchShifts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/shift')
      setShifts(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch shifts:', err)
      setError(t('shiftManagement.failedToLoadShifts'))
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employee', { params: { size: 1000 } })
      const employeesList = response.data.data?.content || response.data.data || []
      // Show all employees, but prefer those who work in shifts
      // If no employees have worksInShifts=true, show all employees
      const shiftEmployees = employeesList.filter(emp => emp.worksInShifts === true)
      if (shiftEmployees.length > 0) {
        setEmployees(shiftEmployees)
      } else {
        // If no shift employees, show all active employees
        const activeEmployees = employeesList.filter(emp => 
          emp.employmentStatus === 'ACTIVE' && 
          (emp.isDeleted === false || emp.isDeleted === undefined)
        )
        setEmployees(activeEmployees)
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err)
      setError(t('shiftManagement.failedToLoadEmployees'))
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/shift/assignments', {
        params: { weekStartDate: selectedWeek }
      })
      setAssignments(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
      // Don't show error to user if it's just a 500 (might be no assignments yet)
      // Only log for debugging
      if (err.response?.status !== 500) {
        setError(t('shiftManagement.failedToLoadAssignments'))
      }
      // Set empty array as fallback
      setAssignments([])
    }
  }

  const handleAddShift = async () => {
    try {
      await api.post('/shift', formData)
      setSuccess(t('shiftManagement.shiftCreated'))
      setAddDialogOpen(false)
      setFormData({
        name: '',
        description: '',
        startTime: '08:00',
        endTime: '16:00',
        color: '#1976d2',
        breakDurationMinutes: 60,
        maxEmployees: null,
        isActive: true
      })
      await fetchShifts()
    } catch (err) {
      setError(err.response?.data?.message || t('shiftManagement.failedToCreateShift'))
    }
  }

  const handleEditShift = async () => {
    try {
      await api.put(`/shift/${selectedShift.id}`, formData)
      setSuccess(t('shiftManagement.shiftUpdated'))
      setEditDialogOpen(false)
      setSelectedShift(null)
      setFormData({
        name: '',
        description: '',
        startTime: '08:00',
        endTime: '16:00',
        color: '#1976d2',
        breakDurationMinutes: 60,
        maxEmployees: null,
        isActive: true
      })
      await fetchShifts()
      await fetchAssignments()
    } catch (err) {
      setError(err.response?.data?.message || t('shiftManagement.failedToUpdateShift'))
    }
  }

  const handleDeleteShift = async (id) => {
    if (window.confirm(t('shiftManagement.confirmDeleteShift'))) {
      try {
        await api.delete(`/shift/${id}`)
        setSuccess(t('shiftManagement.shiftDeleted'))
        await fetchShifts()
        await fetchAssignments()
      } catch (err) {
        setError(err.response?.data?.message || t('shiftManagement.failedToDeleteShift'))
      }
    }
  }

  const handleAssignEmployee = async () => {
    try {
      if (!assignFormData.employeeId || !assignFormData.shiftId) {
        setError(t('shiftManagement.selectBothEmployeeAndShift'))
        return
      }
      
      await api.post('/shift/assign', {
        employeeId: assignFormData.employeeId,
        shiftId: assignFormData.shiftId,
        weekStartDate: selectedWeek
      })
      setSuccess(t('shiftManagement.employeeAssigned'))
      setAssignDialogOpen(false)
      setAssignFormData({ employeeId: '', shiftId: '' })
      await fetchAssignments()
      await fetchEmployees() // Refresh employees list
    } catch (err) {
      setError(err.response?.data?.message || t('shiftManagement.failedToAssignEmployee'))
    }
  }

  const handleRemoveAssignment = async (employeeId) => {
    if (window.confirm(t('shiftManagement.confirmRemoveEmployee'))) {
      try {
        await api.delete('/shift/assign', {
          params: {
            employeeId: employeeId,
            weekStartDate: selectedWeek
          }
        })
        setSuccess(t('shiftManagement.employeeRemoved'))
        await fetchAssignments()
      } catch (err) {
        setError(err.response?.data?.message || t('shiftManagement.failedToRemoveEmployee'))
      }
    }
  }

  const handleRotateShifts = async () => {
    if (window.confirm(t('shiftManagement.confirmRotateShifts'))) {
      try {
        await api.post('/shift/rotate', null, {
          params: { currentWeekStart: selectedWeek }
        })
        setSuccess(t('shiftManagement.shiftsRotated'))
        // Move to next week to see the rotation
        const nextWeek = new Date(selectedWeek)
        nextWeek.setDate(nextWeek.getDate() + 7)
        setSelectedWeek(nextWeek.toISOString().split('T')[0])
        await fetchAssignments()
      } catch (err) {
        setError(err.response?.data?.message || t('shiftManagement.failedToRotateShifts'))
      }
    }
  }

  const openEditDialog = (shift) => {
    setSelectedShift(shift)
    setFormData({
      name: shift.name,
      description: shift.description || '',
      startTime: shift.startTime || '08:00',
      endTime: shift.endTime || '16:00',
      color: shift.color || '#1976d2',
      breakDurationMinutes: shift.breakDurationMinutes || 60,
      maxEmployees: shift.maxEmployees || null,
      isActive: shift.isActive !== undefined ? shift.isActive : true
    })
    setEditDialogOpen(true)
  }

  const getEmployeesInShift = (shiftId) => {
    return assignments
      .filter(a => a.shift?.id === shiftId)
      .map(a => a.employee)
  }

  const canManage = user?.role === 'ADMIN' || user?.role === 'HR'

  if (loading && shifts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
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
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
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
                <ScheduleIcon sx={{ fontSize: 28, color: 'white' }} />
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
            {t('pageTitles.shiftManagement')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('shiftManagement.subtitle') || 'Manage work shifts and employee assignments for 24-hour operations'}
          </Typography>
              </Box>
            </Box>
        </Box>
        <Box display="flex" gap={2}>
          <TextField
            type="date"
            label={t('shiftManagement.selectWeek') || 'Select Week'}
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          {canManage && (
            <>
              <Button
                variant="outlined"
                startIcon={<RotateRightIcon />}
                onClick={handleRotateShifts}
                disabled={shifts.length < 2}
                color="primary"
                sx={{ borderRadius: 2 }}
              >
                {t('shiftManagement.rotateShifts') || 'Rotate Shifts'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
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
                {t('shiftManagement.addShift') || 'Add Shift'}
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchShifts()
              fetchAssignments()
            }}
            sx={{ borderRadius: 2 }}
          >
            {t('common.refresh') || 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Shifts Grid */}
      <Grid container spacing={3}>
        {shifts.map((shift) => {
          const shiftEmployees = getEmployeesInShift(shift.id)
          const employeeCount = shiftEmployees.length
          const isAtCapacity = shift.maxEmployees && employeeCount >= shift.maxEmployees

          return (
            <Grid item xs={12} md={6} lg={4} key={shift.id}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                      background: `linear-gradient(90deg, ${shift.color || '#667eea'} 0%, ${shift.color || '#764ba2'}80 100%)`,
                      opacity: 0.8
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                      '&::before': {
                        opacity: 1
                      }
                    }
                  }}
                >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: shift.color || '#1976d2'
                          }}
                        />
                        <Typography variant="h6">{shift.name}</Typography>
                        {!shift.isActive && (
                          <Chip label={t('shiftManagement.inactive')} size="small" color="default" />
                        )}
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {shift.startTime} - {shift.endTime}
                      </Typography>
                      {shift.description && (
                        <Typography variant="body2" color="textSecondary" mt={1}>
                          {shift.description}
                        </Typography>
                      )}
                    </Box>
                    {canManage && (
                      <Box>
                        <IconButton size="small" onClick={() => openEditDialog(shift)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteShift(shift.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="medium">
                        <PeopleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        {t('shiftManagement.employees')} {employeeCount}
                        {shift.maxEmployees && ` / ${shift.maxEmployees}`}
                      </Typography>
                      {isAtCapacity && (
                        <Chip label={t('shiftManagement.full')} size="small" color="warning" />
                      )}
                    </Box>

                    {canManage && (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setAssignFormData({ employeeId: '', shiftId: shift.id })
                          setAssignDialogOpen(true)
                        }}
                        disabled={isAtCapacity}
                        sx={{ mt: 1 }}
                      >
                        {t('shiftManagement.assignEmployee') || 'Assign Employee'}
                      </Button>
                    )}

                    {shiftEmployees.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="caption" color="textSecondary" display="block" mb={1}>
                          {t('shiftManagement.assignedEmployees')}
                        </Typography>
                        {shiftEmployees.map((emp) => (
                          <Box
                            key={emp.id}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            py={0.5}
                          >
                            <Typography variant="body2">
                              {emp.user?.firstName} {emp.user?.lastName}
                            </Typography>
                            {canManage && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveAssignment(emp.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Add Shift Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        maxWidth="sm" 
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
          {t('shiftManagement.addShift') || 'Add Shift'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={t('shiftManagement.shiftName') || 'Shift Name'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('shiftManagement.description') || 'Description'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label={t('shiftManagement.startTime') || 'Start Time'}
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={t('shiftManagement.endTime') || 'End Time'}
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label={t('shiftManagement.breakDuration') || 'Break Duration (minutes)'}
                  type="number"
                  value={formData.breakDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, breakDurationMinutes: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={t('shiftManagement.maxEmployees') || 'Max Employees (optional)'}
                  type="number"
                  value={formData.maxEmployees || ''}
                  onChange={(e) => setFormData({ ...formData, maxEmployees: e.target.value ? parseInt(e.target.value) : null })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label={t('shiftManagement.color') || 'Color'}
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setAddDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button 
            onClick={handleAddShift} 
            variant="contained" 
            disabled={!formData.name}
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
            {t('common.save') || 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="sm" 
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
          {t('shiftManagement.editShift') || 'Edit Shift'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={t('shiftManagement.shiftName') || 'Shift Name'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('shiftManagement.description') || 'Description'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label={t('shiftManagement.startTime') || 'Start Time'}
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={t('shiftManagement.endTime') || 'End Time'}
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label={t('shiftManagement.breakDuration') || 'Break Duration (minutes)'}
                  type="number"
                  value={formData.breakDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, breakDurationMinutes: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={t('shiftManagement.maxEmployees') || 'Max Employees (optional)'}
                  type="number"
                  value={formData.maxEmployees || ''}
                  onChange={(e) => setFormData({ ...formData, maxEmployees: e.target.value ? parseInt(e.target.value) : null })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label={t('shiftManagement.color') || 'Color'}
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button 
            onClick={handleEditShift} 
            variant="contained" 
            disabled={!formData.name}
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
            {t('common.save') || 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Employee Dialog */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={() => setAssignDialogOpen(false)} 
        maxWidth="sm" 
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
          {t('shiftManagement.assignEmployee') || 'Assign Employee to Shift'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {employees.length === 0 ? (
              <Alert severity="warning">
                {t('shiftManagement.noEmployeesAvailable')}
              </Alert>
            ) : (
              <FormControl fullWidth>
                <InputLabel>{t('shiftManagement.selectEmployee') || 'Select Employee'}</InputLabel>
                <Select
                  value={assignFormData.employeeId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
                  label={t('shiftManagement.selectEmployee') || 'Select Employee'}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.user?.firstName} {emp.user?.lastName} ({emp.employeeId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {!assignFormData.shiftId && (
              <FormControl fullWidth>
                <InputLabel>{t('shiftManagement.selectShift') || 'Select Shift'}</InputLabel>
                <Select
                  value={assignFormData.shiftId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, shiftId: e.target.value })}
                  label={t('shiftManagement.selectShift') || 'Select Shift'}
                >
                  {shifts.filter(s => s.isActive).map((shift) => (
                    <MenuItem key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => {
            setAssignDialogOpen(false)
            setAssignFormData({ employeeId: '', shiftId: '' })
            }}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleAssignEmployee}
            variant="contained"
            disabled={!assignFormData.employeeId || !assignFormData.shiftId || employees.length === 0}
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
            {t('common.assign') || 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
      </Box>
    </Box>
  )
}

export default ShiftManagement

