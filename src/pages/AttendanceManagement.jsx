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
  FormControlLabel
} from '@mui/material'
import {
  Edit,
  Delete,
  RestoreFromTrash,
  Search,
  FilterList,
  Download,
  Add
} from '@mui/icons-material'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage, logSuccessDetails } from '../utils/errorHandler'
import { Autocomplete } from '@mui/material'

const AttendanceManagement = () => {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
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
  }, [page, rowsPerPage, searchTerm, showDeleted])

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
      showSnackbar('Attendance exported successfully', 'success')
    } catch (error) {
      console.error('Error exporting attendance:', error)
      showSnackbar(getErrorMessage(error, 'Failed to export attendance'), 'error')
    }
  }

  const fetchRecords = async () => {
    try {
      const params = {
        page,
        size: rowsPerPage,
        search: searchTerm || undefined,
        includeDeleted: showDeleted || undefined
      }
      const response = await api.get('/time-logs', { params })
      console.log('Attendance API response:', response.data)
      if (response.data && response.data.success && response.data.data) {
        const content = response.data.data.content || []
        console.log('Setting records:', content.length, 'records')
        setRecords(content)
        setTotalElements(response.data.data.totalElements || 0)
      } else {
        console.warn('Unexpected response structure:', response.data)
        setRecords([])
        setTotalElements(0)
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      showSnackbar(getErrorMessage(error, 'Failed to load attendance records'), 'error')
      setRecords([])
      setTotalElements(0)
    }
  }

  const handleSoftDelete = async () => {
    try {
      console.log('Deleting record:', selectedRecord?.id)
      const response = await api.put(`/time-logs/${selectedRecord.id}/soft-delete`)
      logSuccessDetails(response, 'Record soft deleted', { recordId: selectedRecord.id })
      showSnackbar('Record soft deleted successfully', 'success')
      setDeleteDialog(false)
      setSelectedRecord(null)
      fetchRecords()
    } catch (error) {
      console.error('Delete error:', error)
      console.error('Error response:', error.response?.data)
      showSnackbar(getErrorMessage(error, 'Failed to delete record'), 'error')
    }
  }

  const handleRestore = async (id) => {
    try {
      const response = await api.put(`/time-logs/${id}/restore`)
      logSuccessDetails(response, 'Record restored', { recordId: id })
      showSnackbar('Record restored successfully', 'success')
      fetchRecords()
    } catch (error) {
      showSnackbar(getErrorMessage(error, 'Failed to restore record'), 'error')
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
      
      console.log('Sending update data:', updateData)
      const response = await api.put(`/time-logs/${selectedRecord.id}`, updateData)
      logSuccessDetails(response, 'Record updated', { recordId: selectedRecord.id, updateData })
      showSnackbar('Record updated successfully', 'success')
      setEditDialog(false)
      setSelectedRecord(null)
      setEditFormData({ checkInTime: '', checkOutTime: '', stillWorking: false })
      fetchRecords()
    } catch (error) {
      console.error('Update error:', error)
      console.error('Error response:', error.response?.data)
      showSnackbar(getErrorMessage(error, 'Failed to update record'), 'error')
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
        showSnackbar('Please fill in all required fields (Employee, Date, Check In Time)', 'error')
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
      showSnackbar('Attendance record added successfully', 'success')
      handleAddDialogClose()
      fetchRecords()
    } catch (error) {
      console.error('Error adding attendance record:', error)
      showSnackbar(getErrorMessage(error, 'Failed to add attendance record'), 'error')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Attendance Management
        </Typography>
        <Box>
          <Button
            variant={showDeleted ? 'contained' : 'outlined'}
            onClick={() => setShowDeleted(!showDeleted)}
            startIcon={<RestoreFromTrash />}
            sx={{ mr: 2 }}
          >
            {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={handleExport}
            sx={{ mr: 2 }}
          >
            Export
          </Button>
          {(user?.role === 'HR' || user?.role === 'ADMIN') && (
            <Button
              variant="contained"
              onClick={handleAddDialogOpen}
              startIcon={<Add />}
            >
              Add Manual
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No records found</TableCell>
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
                      <Chip label="DELETED" color="error" size="small" />
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
                      
                      // Determine status and color
                      let statusLabel = record.status || (record.checkOutTime ? 'COMPLETED' : 'IN_PROGRESS')
                      let chipColor = 'default'
                      
                      if (isStillWorking) {
                        statusLabel = 'IN_PROGRESS'
                        chipColor = 'primary' // Blue
                      } else if (durationHours !== null && durationHours > 8) {
                        statusLabel = 'OVERTIME'
                        chipColor = 'error' // Red
                      } else if (durationHours !== null && durationHours <= 8) {
                        statusLabel = 'COMPLETED'
                        chipColor = 'success' // Green
                      }
                      
                      return (
                        <Chip 
                          label={statusLabel} 
                          color={chipColor}
                          size="small"
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
      <Dialog open={editDialog} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Check In Time"
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
            label="Still Working (No Clock Out Time)"
            sx={{ mt: 1, mb: 1 }}
          />
          <TextField
            fullWidth
            label="Check Out Time"
            type="datetime-local"
            value={editFormData.checkOutTime}
            onChange={(e) => setEditFormData({ ...editFormData, checkOutTime: e.target.value })}
            margin="normal"
            disabled={editFormData.stillWorking}
            InputLabelProps={{ shrink: true }}
            helperText={editFormData.stillWorking ? "Check-out time is not required when employee is still working" : "Leave empty if employee is still working"}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Changes will be logged in audit trail
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Soft Delete Record</DialogTitle>
        <DialogContent>
          Are you sure you want to soft delete this attendance record? It can be restored later.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleSoftDelete} color="error" variant="contained">
            Soft Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Manual Attendance Dialog */}
      <Dialog open={addDialog} onClose={handleAddDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Manual Attendance</DialogTitle>
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
                label="Employee"
                margin="normal"
                required
                helperText="Select an employee"
              />
            )}
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={addFormData.logDate}
            onChange={(e) => setAddFormData({ ...addFormData, logDate: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Check In Time"
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
            label="Still Working (No Clock Out Time)"
            sx={{ mt: 1, mb: 1 }}
          />
          <TextField
            fullWidth
            label="Check Out Time"
            type="time"
            value={addFormData.checkOutTime}
            onChange={(e) => setAddFormData({ ...addFormData, checkOutTime: e.target.value })}
            margin="normal"
            disabled={addFormData.stillWorking}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 60 }}
            helperText={addFormData.stillWorking ? "Check-out time is not required when employee is still working" : "Optional - leave empty if employee is still working"}
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={addFormData.notes}
            onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            helperText="Optional notes about this attendance record"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            This will create a manual attendance record. The record will be marked with scan method "MANUAL".
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSubmit}>
            Add Record
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
  )
}

export default AttendanceManagement

