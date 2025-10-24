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
  InputAdornment
} from '@mui/material'
import {
  Edit,
  Delete,
  RestoreFromTrash,
  Search,
  FilterList,
  Download
} from '@mui/icons-material'
import api from '../services/api'

const AttendanceManagement = () => {
  const [records, setRecords] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [showDeleted, setShowDeleted] = useState(false)

  useEffect(() => {
    fetchRecords()
  }, [page, rowsPerPage, searchTerm, showDeleted])

  const fetchRecords = async () => {
    try {
      const params = {
        page,
        size: rowsPerPage,
        search: searchTerm || undefined,
        showDeleted
      }
      const response = await api.get('/api/time-logs', { params })
      setRecords(response.data.data.content || [])
      setTotalElements(response.data.data.totalElements || 0)
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      showSnackbar('Failed to load attendance records', 'error')
    }
  }

  const handleSoftDelete = async () => {
    try {
      await api.put(`/api/time-logs/${selectedRecord.id}/soft-delete`)
      showSnackbar('Record soft deleted successfully', 'success')
      setDeleteDialog(false)
      fetchRecords()
    } catch (error) {
      showSnackbar('Failed to delete record', 'error')
    }
  }

  const handleRestore = async (id) => {
    try {
      await api.put(`/api/time-logs/${id}/restore`)
      showSnackbar('Record restored successfully', 'success')
      fetchRecords()
    } catch (error) {
      showSnackbar('Failed to restore record', 'error')
    }
  }

  const handleUpdate = async (data) => {
    try {
      await api.put(`/api/time-logs/${selectedRecord.id}`, data)
      showSnackbar('Record updated successfully', 'success')
      setEditDialog(false)
      fetchRecords()
    } catch (error) {
      showSnackbar('Failed to update record', 'error')
    }
  }

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  const formatTime = (dateTime) => {
    if (!dateTime) return '-'
    return new Date(dateTime).toLocaleString()
  }

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'
    const diff = new Date(checkOut) - new Date(checkIn)
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>

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
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant={showDeleted ? 'contained' : 'outlined'}
                onClick={() => setShowDeleted(!showDeleted)}
                startIcon={<RestoreFromTrash />}
              >
                {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
              </Button>
              <Button variant="outlined" startIcon={<Download />}>
                Export
              </Button>
            </Box>
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
                  <TableCell>{record.employee?.user?.firstName} {record.employee?.user?.lastName}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{formatTime(record.checkInTime)}</TableCell>
                  <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                  <TableCell>{calculateDuration(record.checkInTime, record.checkOutTime)}</TableCell>
                  <TableCell>
                    {record.isDeleted ? (
                      <Chip label="DELETED" color="error" size="small" />
                    ) : (
                      <Chip 
                        label={record.checkOutTime ? 'COMPLETED' : 'IN_PROGRESS'} 
                        color={record.checkOutTime ? 'success' : 'warning'}
                        size="small"
                      />
                    )}
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
                          onClick={() => {
                            setSelectedRecord(record)
                            setEditDialog(true)
                          }}
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
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Check In Time"
            type="datetime-local"
            defaultValue={selectedRecord?.checkInTime?.slice(0, 16)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Check Out Time"
            type="datetime-local"
            defaultValue={selectedRecord?.checkOutTime?.slice(0, 16)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Changes will be logged in audit trail
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleUpdate({})}>
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

