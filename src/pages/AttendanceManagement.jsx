import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Edit,
  Delete,
  RestoreFromTrash,
  Search,
  FilterList,
  Download,
  Add,
  AccessTime
} from '@mui/icons-material'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage, logSuccessDetails } from '../utils/errorHandler'
import { Autocomplete } from '@mui/material'
import { useTranslation } from 'react-i18next'

const AttendanceManagement = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [addDialog, setAddDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [showDeleted, setShowDeleted] = useState(false)
  const [editFormData, setEditFormData] = useState({ checkInTime: '', checkOutTime: '', stillWorking: false })
  const [addFormData, setAddFormData] = useState({ 
    employeeId: null, 
    logDate: '', 
    checkInTime: '', 
    checkOutTime: '', 
    stillWorking: false,
    notes: '' 
  })
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchRecords()
  }, [page, rowsPerPage, searchTerm, showDeleted, statusFilter])

  // Update current time every minute to refresh duration for active shifts
  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date())
    
    // Update every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Fetch employees when add dialog opens
  useEffect(() => {
    if (addDialog && (user?.role === 'HR' || user?.role === 'ADMIN')) {
      fetchEmployees()
    }
  }, [addDialog, user])

  const handleExport = async () => {
    try {
      const response = await api.get('/export/attendance/excel', {
        responseType: 'blob'
      })
      logSuccessDetails(response, 'Attendance exported')
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const contentDisposition = response.headers['content-disposition']
      let filename = 'attendance.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      showSnackbar(t('attendance.exportedSuccessfully'), 'success')
    } catch (error) {
      console.error('Error exporting attendance:', error)
      showSnackbar(getErrorMessage(error, t('attendance.failedToExport'), '', t), 'error')
    }
  }

  const fetchRecords = async () => {
    try {
      const params = {
        page: 0, // Get all records for filtering
        size: 10000, // Large size to get all records
        search: searchTerm || undefined,
        includeDeleted: showDeleted || undefined
      }
      const response = await api.get('/time-logs', { params })
      if (response.data && response.data.success && response.data.data) {
        let content = response.data.data.content || []
        
        // Filter by status on frontend
        if (statusFilter !== 'ALL') {
          content = content.filter(record => {
            if (statusFilter === 'DELETED') {
              return record.isDeleted
            }
            if (record.isDeleted) return false
            
            const isStillWorking = record.checkInTime && !record.checkOutTime
            let durationHours = null
            if (record.totalWorkingHours !== null && record.totalWorkingHours !== undefined) {
              durationHours = record.totalWorkingHours
            } else {
              durationHours = calculateDurationFromParts(record.logDate, record.checkInTime, record.checkOutTime)
            }
            
            if (statusFilter === 'IN_PROGRESS') {
              return isStillWorking
            }
            if (statusFilter === 'COMPLETED') {
              return !isStillWorking && durationHours !== null && durationHours <= 8
            }
            if (statusFilter === 'OVERTIME') {
              return !isStillWorking && durationHours !== null && durationHours > 8
            }
            return true
          })
        }
        
        // Apply pagination
        const startIndex = page * rowsPerPage
        const endIndex = startIndex + rowsPerPage
        const paginatedContent = content.slice(startIndex, endIndex)
        
        setRecords(paginatedContent)
        setTotalElements(content.length)
      } else {
        setRecords([])
        setTotalElements(0)
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      showSnackbar(getErrorMessage(error, t('attendance.failedToLoadRecords'), '', t), 'error')
      setRecords([])
      setTotalElements(0)
    }
  }

  const handleSoftDelete = async () => {
    try {
      const response = await api.put(`/time-logs/${selectedRecord.id}/soft-delete`)
      logSuccessDetails(response, 'Record soft deleted', { recordId: selectedRecord.id })
      showSnackbar(t('attendance.recordSoftDeletedSuccessfully'), 'success')
      setDeleteDialog(false)
      setSelectedRecord(null)
      fetchRecords()
    } catch (error) {
      console.error('Delete error:', error)
      showSnackbar(getErrorMessage(error, t('attendance.failedToDeleteRecord'), '', t), 'error')
    }
  }

  const handleRestore = async (id) => {
    try {
      const response = await api.put(`/time-logs/${id}/restore`)
      logSuccessDetails(response, 'Record restored', { recordId: id })
      showSnackbar(t('attendance.recordRestoredSuccessfully'), 'success')
      fetchRecords()
    } catch (error) {
      showSnackbar(getErrorMessage(error, t('attendance.failedToRestoreRecord'), '', t), 'error')
    }
  }

  const handleUpdate = async () => {
    try {
      // Convert datetime-local strings to LocalTime format (HH:mm:ss)
      // datetime-local format: "YYYY-MM-DDTHH:mm"
      let updateData = {}
      
      if (editFormData.checkInTime) {
        const timePart = editFormData.checkInTime.includes('T') 
          ? editFormData.checkInTime.split('T')[1] 
          : editFormData.checkInTime
        // Ensure format is HH:mm:ss (add seconds if missing)
        updateData.checkInTime = timePart.length === 5 ? `${timePart}:00` : timePart
      }
      
      // If "Still Working" is checked, set checkOutTime to empty string (which backend will interpret as null)
      // Otherwise, use the provided checkOutTime
      if (editFormData.stillWorking) {
        updateData.checkOutTime = '' // Empty string signals to backend to set to null
      } else if (editFormData.checkOutTime) {
        const timePart = editFormData.checkOutTime.includes('T') 
          ? editFormData.checkOutTime.split('T')[1] 
          : editFormData.checkOutTime
        // Ensure format is HH:mm:ss (add seconds if missing)
        updateData.checkOutTime = timePart.length === 5 ? `${timePart}:00` : timePart
      }
      
      const response = await api.put(`/time-logs/${selectedRecord.id}`, updateData)
      logSuccessDetails(response, 'Record updated', { recordId: selectedRecord.id, updateData })
      showSnackbar(t('attendance.recordUpdatedSuccessfully'), 'success')
      setEditDialog(false)
      setSelectedRecord(null)
      setEditFormData({ checkInTime: '', checkOutTime: '', stillWorking: false })
      fetchRecords()
    } catch (error) {
      console.error('Update error:', error)
      showSnackbar(getErrorMessage(error, t('attendance.failedToUpdateRecord'), '', t), 'error')
    }
  }

  const handleEditDialogOpen = (record) => {
    setSelectedRecord(record)
    // Combine logDate with checkInTime and checkOutTime for datetime-local input
    const checkInDateTime = record.logDate && record.checkInTime 
      ? `${record.logDate}T${record.checkInTime}` 
      : ''
    const checkOutDateTime = record.logDate && record.checkOutTime 
      ? `${record.logDate}T${record.checkOutTime}` 
      : ''
    
    // Check if employee is still working (has check-in but no check-out)
    const isStillWorking = record.checkInTime && !record.checkOutTime
    
    setEditFormData({
      checkInTime: checkInDateTime,
      checkOutTime: checkOutDateTime,
      stillWorking: isStillWorking
    })
    setEditDialog(true)
  }

  const handleEditDialogClose = () => {
    setEditDialog(false)
    setSelectedRecord(null)
    setEditFormData({ checkInTime: '', checkOutTime: '', stillWorking: false })
  }

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  const formatTime = (dateTime) => {
    if (!dateTime) return '-'
    try {
      // Handle both full datetime strings and date+time combinations
      const date = new Date(dateTime)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleString()
    } catch (e) {
      return '-'
    }
  }

  const formatTimeFromParts = (date, time) => {
    if (!date || !time) return '-'
    try {
      // Combine date and time strings
      const dateTimeStr = `${date}T${time}`
      const dateObj = new Date(dateTimeStr)
      if (isNaN(dateObj.getTime())) return time // Just show time if date parsing fails
      return dateObj.toLocaleTimeString()
    } catch (e) {
      return time
    }
  }

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'
    try {
      const diff = new Date(checkOut) - new Date(checkIn)
      if (isNaN(diff)) return '-'
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      return `${hours}h ${minutes}m`
    } catch (e) {
      return '-'
    }
  }

  const calculateDurationFromParts = (logDate, checkInTime, checkOutTime) => {
    if (!logDate || !checkInTime) return null
    
    try {
      // Parse logDate - it comes as "YYYY-MM-DD" from backend
      // Parse checkInTime - it comes as "HH:mm:ss" from backend (LocalTime serialization)
      let checkInTimeStr = String(checkInTime).trim()
      if (!checkInTimeStr || !checkInTimeStr.includes(':')) {
        return null // Invalid time format
      }
      
      // Ensure time has seconds if missing (HH:mm -> HH:mm:00)
      const timeParts = checkInTimeStr.split(':')
      if (timeParts.length === 2) {
        checkInTimeStr = checkInTimeStr + ':00'
      }
      
      // Create check-in datetime: "YYYY-MM-DDTHH:mm:ss"
      const checkInDateTimeStr = `${logDate}T${checkInTimeStr}`
      const checkInDateTime = new Date(checkInDateTimeStr)
      
      if (isNaN(checkInDateTime.getTime())) {
        console.error('Invalid check-in date/time:', checkInDateTimeStr, { logDate, checkInTime })
        return null
      }
      
      let checkOutDateTime
      if (checkOutTime) {
        // Parse checkOutTime - it comes as "HH:mm:ss" from backend
        let checkOutTimeStr = String(checkOutTime).trim()
        const timePartsOut = checkOutTimeStr.split(':')
        if (timePartsOut.length === 2) {
          checkOutTimeStr = checkOutTimeStr + ':00'
        }
        const checkOutDateTimeStr = `${logDate}T${checkOutTimeStr}`
        checkOutDateTime = new Date(checkOutDateTimeStr)
        
        if (isNaN(checkOutDateTime.getTime())) {
          console.error('Invalid check-out date/time:', checkOutDateTimeStr, { logDate, checkOutTime })
          return null
        }
      } else {
        // Still working - use current time (real-time calculation)
        // Always use fresh Date() for real-time accuracy, not the state
        checkOutDateTime = new Date()
      }
      
      // Calculate difference in milliseconds
      const diffMs = checkOutDateTime.getTime() - checkInDateTime.getTime()
      
      if (isNaN(diffMs)) {
        return null
      }
      
      // If negative, it might mean the check-in was on a different day
      // For "still working" records, if logDate is today, this shouldn't happen
      // But if it does, try using logDate for current time as well
      if (diffMs < 0 && !checkOutTime) {
        // Try using logDate with current time
        const todayStr = currentTime.toISOString().split('T')[0]
        const currentTimeStr = currentTime.toTimeString().split(' ')[0] // HH:mm:ss
        const checkOutWithLogDate = new Date(`${logDate}T${currentTimeStr}`)
        const diffMs2 = checkOutWithLogDate.getTime() - checkInDateTime.getTime()
        if (!isNaN(diffMs2) && diffMs2 >= 0) {
          const hours = diffMs2 / (1000 * 60 * 60)
          return hours
        }
        // If still negative, return 0 (shouldn't happen for today's records)
        return 0
      }
      
      // Convert milliseconds to hours
      const hours = diffMs / (1000 * 60 * 60)
      return hours >= 0 ? hours : 0
    } catch (e) {
      console.error('Error calculating duration:', e, { logDate, checkInTime, checkOutTime })
      return null
    }
  }

  const formatDuration = (hours) => {
    if (hours === null || hours === undefined) return '-'
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const response = await api.get('/employee', { params: { page: 0, size: 1000 } })
      if (response.data && response.data.success && response.data.data) {
        const employeeList = response.data.data.content || []
        setEmployees(employeeList.map(emp => ({
          id: emp.id,
          label: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim() || emp.employeeId || 'Unknown',
          employeeId: emp.employeeId
        })))
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      showSnackbar(getErrorMessage(error, 'Failed to load employees'), 'error')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleAddDialogOpen = () => {
    const today = new Date().toISOString().split('T')[0]
    setAddFormData({ 
      employeeId: null, 
      logDate: today, 
      checkInTime: '', 
      checkOutTime: '', 
      stillWorking: false,
      notes: '' 
    })
    setAddDialog(true)
  }

  const handleAddDialogClose = () => {
    setAddDialog(false)
    setAddFormData({ 
      employeeId: null, 
      logDate: '', 
      checkInTime: '', 
      checkOutTime: '', 
      stillWorking: false,
      notes: '' 
    })
  }

  const handleAddSubmit = async () => {
    try {
      if (!addFormData.employeeId || !addFormData.logDate || !addFormData.checkInTime) {
        showSnackbar(t('attendance.pleaseFillRequiredFields'), 'error')
        return
      }

      // Convert time format from "HH:mm" to "HH:mm:ss"
      let checkInTimeStr = addFormData.checkInTime
      if (checkInTimeStr && checkInTimeStr.length === 5) {
        checkInTimeStr = `${checkInTimeStr}:00`
      }

      // If "Still Working" is checked, set checkOutTime to null
      // Otherwise, use the provided checkOutTime
      let checkOutTimeStr = null
      if (!addFormData.stillWorking && addFormData.checkOutTime) {
        checkOutTimeStr = addFormData.checkOutTime
        if (checkOutTimeStr.length === 5) {
          checkOutTimeStr = `${checkOutTimeStr}:00`
        }
      }

      const requestData = {
        employeeId: addFormData.employeeId,
        logDate: addFormData.logDate,
        checkInTime: checkInTimeStr,
        checkOutTime: checkOutTimeStr,
        notes: addFormData.notes || null
      }

      const response = await api.post('/time-logs', requestData)
      logSuccessDetails(response, 'Attendance record added', requestData)
      showSnackbar(t('attendance.recordAddedSuccessfully'), 'success')
      handleAddDialogClose()
      fetchRecords()
    } catch (error) {
      console.error('Error adding attendance record:', error)
      showSnackbar(getErrorMessage(error, t('attendance.failedToAddRecord'), '', t), 'error')
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
                <AccessTime sx={{ fontSize: 28, color: 'white' }} />
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
          {t('pageTitles.attendanceManagement')}
        </Typography>
              </Box>
            </Box>
          </Box>
        <Box>
          <Button
            variant={showDeleted ? 'contained' : 'outlined'}
            onClick={() => setShowDeleted(!showDeleted)}
            startIcon={<RestoreFromTrash />}
            sx={{ mr: 2 }}
          >
            {showDeleted ? t('attendance.hideDeleted') : t('attendance.showDeleted')}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={handleExport}
            sx={{ mr: 2 }}
          >
            {t('attendance.export')}
          </Button>
          {(user?.role === 'HR' || user?.role === 'ADMIN') && (
            <Button
              variant="contained"
              onClick={handleAddDialogOpen}
              startIcon={<Add />}
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
              {t('attendance.addManual')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label={t('common.search')}
              placeholder={t('attendance.searchPlaceholder') || t('common.searchPlaceholder')}
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
                    <Search sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
              <InputLabel id="attendance-status-filter-label">{t('attendance.status')}</InputLabel>
              <Select
                labelId="attendance-status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={t('attendance.status')}
                renderValue={(selected) => {
                  if (selected === 'ALL') return t('common.all')
                  if (selected === 'COMPLETED') return t('common.status.completed')
                  if (selected === 'IN_PROGRESS') return t('common.status.inProgress')
                  if (selected === 'OVERTIME') return t('common.status.overtime')
                  if (selected === 'DELETED') return t('common.status.deleted')
                  return selected
                }}
              >
                <MenuItem value="ALL">{t('common.all')}</MenuItem>
                <MenuItem value="COMPLETED">{t('common.status.completed')}</MenuItem>
                <MenuItem value="IN_PROGRESS">{t('common.status.inProgress')}</MenuItem>
                <MenuItem value="OVERTIME">{t('common.status.overtime')}</MenuItem>
                {showDeleted && <MenuItem value="DELETED">{t('common.status.deleted')}</MenuItem>}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
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
              <TableCell><strong>{t('attendance.employee')}</strong></TableCell>
              <TableCell><strong>{t('attendance.date')}</strong></TableCell>
              <TableCell><strong>{t('attendance.checkIn')}</strong></TableCell>
              <TableCell><strong>{t('attendance.checkOut')}</strong></TableCell>
              <TableCell><strong>{t('attendance.duration')}</strong></TableCell>
              <TableCell><strong>{t('attendance.status')}</strong></TableCell>
              <TableCell><strong>{t('attendance.actions')}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">{t('attendance.noRecordsFound')}</TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} hover sx={{ opacity: record.isDeleted ? 0.5 : 1 }}>
                  <TableCell>{record.employeeName || (record.employee?.user?.firstName + ' ' + record.employee?.user?.lastName) || '-'}</TableCell>
                  <TableCell>{record.logDate ? new Date(record.logDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{record.checkInTime ? formatTimeFromParts(record.logDate, record.checkInTime) : '-'}</TableCell>
                  <TableCell>{record.checkOutTime ? formatTimeFromParts(record.logDate, record.checkOutTime) : '-'}</TableCell>
                  <TableCell>
                    {(() => {
                      // Check if still working (clocked in but not clocked out)
                      const isStillWorking = record.checkInTime && !record.checkOutTime
                      
                      // Calculate duration
                      let durationHours = null
                      if (record.totalWorkingHours !== null && record.totalWorkingHours !== undefined) {
                        durationHours = record.totalWorkingHours
                      } else {
                        durationHours = calculateDurationFromParts(record.logDate, record.checkInTime, record.checkOutTime)
                      }
                      
                      // Determine color based on status
                      let bgColor = 'transparent'
                      let textColor = 'inherit'
                      
                      if (isStillWorking) {
                        // Still working - check if overtime (> 8 hours)
                        if (durationHours !== null && durationHours > 8) {
                          // Still working but overtime - red
                          bgColor = 'rgba(244, 67, 54, 0.2)'
                          textColor = '#C62828'
                        } else {
                          // Still working normal hours - blue
                          bgColor = 'rgba(33, 150, 243, 0.2)'
                          textColor = '#1976D2'
                        }
                      } else if (durationHours !== null && durationHours > 8) {
                        // Completed shift with overtime - red
                        bgColor = 'rgba(244, 67, 54, 0.2)'
                        textColor = '#C62828'
                      } else if (durationHours !== null && durationHours <= 8) {
                        // Completed normal shift - green
                        bgColor = 'rgba(76, 175, 80, 0.2)'
                        textColor = '#2E7D32'
                      }
                      
                      return (
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: bgColor,
                            color: textColor,
                            fontWeight: durationHours !== null ? 500 : 'normal'
                          }}
                        >
                          {durationHours !== null ? formatDuration(durationHours) : '-'}
                        </Box>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {record.isDeleted ? (
                      <Chip 
                        label={t('common.status.deleted')} 
                        size="small"
                        sx={{
                          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                          borderRadius: 2,
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)',
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ) : (() => {
                      // Check if still working
                      const isStillWorking = record.checkInTime && !record.checkOutTime
                      
                      // Calculate duration for status
                      let durationHours = null
                      if (record.totalWorkingHours !== null && record.totalWorkingHours !== undefined) {
                        durationHours = record.totalWorkingHours
                      } else {
                        durationHours = calculateDurationFromParts(record.logDate, record.checkInTime, record.checkOutTime)
                      }
                      
                      // Determine status and styling
                      let statusLabel = record.status || (record.checkOutTime ? t('common.status.completed') : t('common.status.inProgress'))
                      let chipStyles = {}
                      
                      if (isStillWorking) {
                        statusLabel = t('common.status.inProgress')
                        chipStyles = {
                          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                        }
                      } else if (durationHours !== null && durationHours > 8) {
                        statusLabel = t('common.status.overtime')
                        chipStyles = {
                          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
                        }
                      } else if (durationHours !== null && durationHours <= 8) {
                        statusLabel = t('common.status.completed')
                        chipStyles = {
                          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                        }
                      } else {
                        chipStyles = {
                          background: 'rgba(158, 158, 158, 0.2)',
                          color: '#424242',
                          fontWeight: 500,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }
                      }
                      
                      return (
                        <Chip 
                          label={statusLabel} 
                          size="small"
                          sx={{
                            ...chipStyles,
                            borderRadius: 2,
                            '&:hover': {
                              boxShadow: chipStyles.boxShadow ? chipStyles.boxShadow.replace('0 2px', '0 4px').replace('0.3', '0.4') : '0 4px 8px rgba(0, 0, 0, 0.15)',
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        />
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {record.isDeleted ? (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleRestore(record.id)}
                      >
                        <RestoreFromTrash />
                      </IconButton>
                    ) : (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleEditDialogOpen(record)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedRecord(record)
                            setDeleteDialog(true)
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={handleEditDialogClose} 
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
          {t('attendance.editAttendanceRecord')}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('attendance.checkInTime')}
            type="datetime-local"
            value={editFormData.checkInTime}
            onChange={(e) => setEditFormData({ ...editFormData, checkInTime: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editFormData.stillWorking}
                onChange={(e) => {
                  setEditFormData({ 
                    ...editFormData, 
                    stillWorking: e.target.checked,
                    // Clear check-out time when "still working" is checked
                    checkOutTime: e.target.checked ? '' : editFormData.checkOutTime
                  })
                }}
              />
            }
            label={t('attendance.stillWorking')}
            sx={{ mt: 1, mb: 1 }}
          />
          <TextField
            fullWidth
            label={t('attendance.checkOutTime')}
            type="datetime-local"
            value={editFormData.checkOutTime}
            onChange={(e) => setEditFormData({ ...editFormData, checkOutTime: e.target.value })}
            margin="normal"
            disabled={editFormData.stillWorking}
            InputLabelProps={{ shrink: true }}
            helperText={editFormData.stillWorking ? t('attendance.checkOutTimeNotRequired') : t('attendance.checkOutTimeOptional')}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('attendance.changesLogged')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={handleEditDialogClose}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdate}
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
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        open={deleteDialog} 
        onClose={() => setDeleteDialog(false)}
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
              background: 'linear-gradient(90deg, #f44336 0%, #d32f2f 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            color: '#f44336',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('attendance.deleteAttendanceRecord')}
        </DialogTitle>
        <DialogContent>
          {t('attendance.confirmDelete')}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setDeleteDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSoftDelete} 
            color="error" 
            variant="contained"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              boxShadow: '0 4px 16px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Manual Attendance Dialog */}
      <Dialog 
        open={addDialog} 
        onClose={handleAddDialogClose} 
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
          {t('attendance.addAttendanceRecord')}
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            options={employees}
            loading={loadingEmployees}
            getOptionLabel={(option) => option.label || ''}
            value={employees.find(emp => emp.id === addFormData.employeeId) || null}
            onChange={(event, newValue) => {
              setAddFormData({ ...addFormData, employeeId: newValue?.id || null })
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('attendance.selectEmployee')}
                margin="normal"
                required
                helperText={t('attendance.selectEmployeeHelper')}
              />
            )}
          />
          <TextField
            fullWidth
            label={t('attendance.logDate')}
            type="date"
            value={addFormData.logDate}
            onChange={(e) => setAddFormData({ ...addFormData, logDate: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label={t('attendance.checkInTime')}
            type="time"
            value={addFormData.checkInTime}
            onChange={(e) => setAddFormData({ ...addFormData, checkInTime: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 60 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={addFormData.stillWorking}
                onChange={(e) => {
                  setAddFormData({ 
                    ...addFormData, 
                    stillWorking: e.target.checked,
                    // Clear check-out time when "still working" is checked
                    checkOutTime: e.target.checked ? '' : addFormData.checkOutTime
                  })
                }}
              />
            }
            label={t('attendance.stillWorking')}
            sx={{ mt: 1, mb: 1 }}
          />
          <TextField
            fullWidth
            label={t('attendance.checkOutTime')}
            type="time"
            value={addFormData.checkOutTime}
            onChange={(e) => setAddFormData({ ...addFormData, checkOutTime: e.target.value })}
            margin="normal"
            disabled={addFormData.stillWorking}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 60 }}
            helperText={addFormData.stillWorking ? t('attendance.checkOutTimeNotRequired') : t('attendance.checkOutTimeOptional')}
          />
          <TextField
            fullWidth
            label={t('attendance.notes')}
            multiline
            rows={3}
            value={addFormData.notes}
            onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            helperText={t('attendance.notesHelper')}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('attendance.manualRecordInfo')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={handleAddDialogClose}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddSubmit}
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
            {t('attendance.addRecord')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </Box>
  )
}

export default AttendanceManagement

