import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  Badge
} from '@mui/material'
import {
  Add as AddIcon,
  EventNote as EventNoteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material'
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const LeaveRequests = () => {
  const { t } = useLanguage()
  const { user, hasAnyRole } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState([])
  const [allLeaveRequests, setAllLeaveRequests] = useState([]) // For calendar view
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [leaveBalances, setLeaveBalances] = useState({
    annual: 20,
    sick: 10,
    used: 0
  })
  
  const [newRequest, setNewRequest] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
    totalDays: 0
  })

  const isAdmin = hasAnyRole(['ADMIN', 'HR'])

  useEffect(() => {
    fetchLeaveRequests()
    fetchLeaveBalances()
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      // For employees, fetch their own requests
      // For admins/HR, fetch all requests
      const endpoint = isAdmin ? '/api/leave-requests' : '/api/leave-requests/my'
      const response = await api.get(endpoint)
      setLeaveRequests(response.data.data || [])
      
      // For calendar view, fetch all approved leaves (for employees to see others' approved leaves)
      if (!isAdmin) {
        try {
          const allResponse = await api.get('/api/leave-requests/approved')
          setAllLeaveRequests(allResponse.data.data || [])
        } catch (err) {
          // If endpoint doesn't exist, use mock data
          setAllLeaveRequests([
            { id: 1, employeeName: 'John Doe', leaveType: 'ANNUAL', startDate: '2024-01-15', endDate: '2024-01-17', status: 'APPROVED' },
            { id: 2, employeeName: 'Jane Smith', leaveType: 'SICK', startDate: '2024-01-20', endDate: '2024-01-20', status: 'APPROVED' },
            { id: 3, employeeName: 'Mike Johnson', leaveType: 'ANNUAL', startDate: '2024-01-25', endDate: '2024-01-29', status: 'APPROVED' },
            { id: 4, employeeName: 'Sarah Wilson', leaveType: 'ANNUAL', startDate: '2024-02-05', endDate: '2024-02-09', status: 'APPROVED' }
          ])
        }
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err)
      setError('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaveBalances = async () => {
    try {
      // This endpoint would need to be implemented
      // For now using default values
      setLeaveBalances({
        annual: 20,
        sick: 10,
        used: 5
      })
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    }
  }

  const handleCreateRequest = async () => {
    try {
      setError(null)
      
      // Calculate total days
      const start = new Date(newRequest.startDate)
      const end = new Date(newRequest.endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      
      const requestData = {
        ...newRequest,
        totalDays: diffDays
      }

      await api.post('/api/leave-requests', requestData)
      
      setSuccess('Leave request submitted successfully!')
      setOpenDialog(false)
      setNewRequest({
        leaveType: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: '',
        totalDays: 0
      })
      fetchLeaveRequests()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create leave request')
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/leave-requests/${id}/approve`)
      setSuccess('Leave request approved!')
      fetchLeaveRequests()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to approve request')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.put(`/api/leave-requests/${id}/reject`)
      setSuccess('Leave request rejected!')
      fetchLeaveRequests()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to reject request')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'success'
      case 'REJECTED':
        return 'error'
      case 'PENDING':
        return 'warning'
      case 'CANCELLED':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon />
      case 'REJECTED':
        return <CancelIcon />
      case 'PENDING':
        return <PendingIcon />
      default:
        return <EventNoteIcon />
    }
  }

  const calculateDays = () => {
    if (newRequest.startDate && newRequest.endDate) {
      const start = new Date(newRequest.startDate)
      const end = new Date(newRequest.endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }
    return 0
  }

  const getLeaveTypeColor = (leaveType) => {
    switch (leaveType) {
      case 'ANNUAL': return 'primary'
      case 'SICK': return 'secondary'
      case 'PERSONAL': return 'info'
      case 'EMERGENCY': return 'error'
      default: return 'default'
    }
  }

  // Get leaves for a specific date
  const getLeavesForDate = (date) => {
    return allLeaveRequests.filter(leave => {
      const startDate = dayjs(leave.startDate)
      const endDate = dayjs(leave.endDate)
      const checkDate = dayjs(date)
      return checkDate.isBetween(startDate, endDate, 'day', '[]')
    })
  }

  // Calendar day renderer with badges
  const renderCalendarDay = (day) => {
    const leaves = getLeavesForDate(day)
    return (
      <Badge
        badgeContent={leaves.length}
        color="primary"
        sx={{ width: '100%', height: '100%' }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          {day.format('D')}
        </Box>
      </Badge>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('leaveRequests.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          {t('leaveRequests.requestLeave')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Main Content Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Calendar Widget */}
        {!isAdmin && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Team Leave Calendar
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                See when your colleagues are on leave to plan your time off
              </Typography>
              
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <StaticDatePicker
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  displayStaticWrapperAs="desktop"
                  slots={{
                    day: renderCalendarDay
                  }}
                  sx={{
                    '& .MuiPickersCalendarHeader-root': {
                      paddingLeft: 0,
                      paddingRight: 0,
                    },
                    '& .MuiDayCalendar-root': {
                      width: '100%',
                    }
                  }}
                />
              </LocalizationProvider>
              
              {/* Selected Date Info */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {selectedDate.format('MMMM DD, YYYY')}
                </Typography>
                {getLeavesForDate(selectedDate).length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No approved leaves on this date
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {getLeavesForDate(selectedDate).length} colleague(s) on leave:
                    </Typography>
                    {getLeavesForDate(selectedDate).map((leave) => (
                      <Box key={leave.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Chip
                          label={leave.employeeName}
                          color={getLeaveTypeColor(leave.leaveType)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {leave.leaveType}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Right Column - Leave Request Form & My Requests */}
        <Grid item xs={12} md={isAdmin ? 12 : 6}>
          {/* Quick Leave Request Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Request Leave
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Submit a new leave request
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ width: '100%' }}
            >
              Create Leave Request
            </Button>
          </Paper>

          {/* My Leave Requests */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventNoteIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                {isAdmin ? 'All Leave Requests' : 'My Leave Requests'}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {isAdmin ? 'Manage all employee leave requests' : 'Track your submitted leave requests'}
            </Typography>
            
            {leaveRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <EventNoteIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography color="textSecondary">
                  {isAdmin ? 'No leave requests found' : 'You haven\'t submitted any leave requests yet'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {leaveRequests.map((request) => (
                  <Card key={request.id} sx={{ mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Chip
                            label={request.leaveType}
                            color={getLeaveTypeColor(request.leaveType)}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {request.totalDays} day(s)
                          </Typography>
                          {request.reason && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              "{request.reason}"
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={request.status}
                            color={getStatusColor(request.status)}
                            size="small"
                          />
                          {isAdmin && request.status === 'PENDING' && (
                            <Box sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                color="success"
                                onClick={() => handleApprove(request.id)}
                                sx={{ mr: 1 }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleReject(request.id)}
                              >
                                Reject
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Leave Balance Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Annual Leave Balance
              </Typography>
              <Typography variant="h3" color="primary">
                {leaveBalances.annual - leaveBalances.used}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                out of {leaveBalances.annual} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Sick Leave Balance
              </Typography>
              <Typography variant="h3" color="secondary">
                {leaveBalances.sick}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                days available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Days Used This Year
              </Typography>
              <Typography variant="h3" color="text.primary">
                {leaveBalances.used}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                days taken
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* Create Leave Request Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Leave Type</InputLabel>
            <Select
              value={newRequest.leaveType}
              onChange={(e) => setNewRequest({ ...newRequest, leaveType: e.target.value })}
              label="Leave Type"
            >
              <MenuItem value="ANNUAL">Annual Leave</MenuItem>
              <MenuItem value="SICK">Sick Leave</MenuItem>
              <MenuItem value="UNPAID">Unpaid Leave</MenuItem>
              <MenuItem value="MATERNITY">Maternity Leave</MenuItem>
              <MenuItem value="PATERNITY">Paternity Leave</MenuItem>
              <MenuItem value="PERSONAL">Personal Leave</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={newRequest.startDate}
            onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />

          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={newRequest.endDate}
            onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            inputProps={{ min: newRequest.startDate }}
          />

          {newRequest.startDate && newRequest.endDate && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Total Days: {calculateDays()} day(s)
            </Alert>
          )}

          <TextField
            fullWidth
            label="Reason"
            value={newRequest.reason}
            onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
            multiline
            rows={3}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRequest}
            variant="contained"
            disabled={!newRequest.startDate || !newRequest.endDate}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeaveRequests
