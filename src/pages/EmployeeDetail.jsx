import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Work as WorkIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const EmployeeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [employee, setEmployee] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [tickets, setTickets] = useState([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({})

  useEffect(() => {
    if (id) {
      fetchEmployeeData()
    }
  }, [id])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [employeeRes, attendanceRes, leavesRes, ticketsRes] = await Promise.all([
        api.get(`/api/employees/${id}`),
        api.get(`/api/attendance/employee/${id}?limit=10`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/leave-requests/employee/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/tickets/employee/${id}`).catch(() => ({ data: { data: [] } }))
      ])

      setEmployee(employeeRes.data.data)
      setEditFormData(employeeRes.data.data)
      setAttendance(attendanceRes.data.data || [])
      setLeaves(leavesRes.data.data || [])
      setTickets(ticketsRes.data.data || [])
    } catch (err) {
      console.error('Failed to fetch employee data:', err)
      setError(t('employeeDetail.failedToLoadEmployeeData'))
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    try {
      await api.put(`/api/employees/${id}`, editFormData)
      setEditDialogOpen(false)
      await fetchEmployeeData()
    } catch (err) {
      setError(t('employeeDetail.failedToUpdateEmployee'))
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/employees/${id}`)
      navigate('/employees')
    } catch (err) {
      setError(t('employeeDetail.failedToDeleteEmployee'))
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const canEdit = user?.role === 'ADMIN' || user?.role === 'HR'

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error || !employee) {
    return (
      <Box>
        <Alert severity="error">{error || t('employeeDetail.employeeNotFound')}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/employees')} sx={{ mt: 2 }}>
          {t('employeeDetail.backToEmployees')}
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" gutterBottom>
            {t('pageTitles.employeeDetail')}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/employees')}
          >
            {t('common.back')} {t('pageTitles.employees')}
          </Button>
          {canEdit && (
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditDialogOpen(true)}
              >
                {t('common.edit')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                {t('common.delete')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Employee Profile Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3} display="flex" justifyContent="center" alignItems="center">
              <Avatar
                sx={{ width: 120, height: 120, fontSize: '3rem' }}
              >
                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography variant="h4" gutterBottom>
                {employee.firstName} {employee.lastName}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip label={employee.role || t('employeeDetail.employee')} color="primary" />
                <Chip
                  label={employee.isActive ? t('employeeDetail.active') : t('employeeDetail.inactive')}
                  color={employee.isActive ? 'success' : 'default'}
                />
                {employee.department && <Chip label={employee.department} />}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{employee.email}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{employee.phone || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <WorkIcon fontSize="small" color="action" />
                    <Typography variant="body2">{employee.position || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {t('employeeDetail.joined')} {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : t('common.not_available')}
                    </Typography>
                  </Box>
                </Grid>
                {employee.address && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2">{employee.address}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={t('employeeDetail.attendance')} icon={<AccessTimeIcon />} iconPosition="start" />
          <Tab label={t('employeeDetail.leaveRequests')} icon={<EventIcon />} iconPosition="start" />
          <Tab label={t('employeeDetail.tickets')} icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label={t('employeeDetail.details')} icon={<WorkIcon />} iconPosition="start" />
        </Tabs>

        <CardContent>
          {/* Attendance Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('employeeDetail.recentAttendance')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {attendance.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('employeeDetail.noAttendanceRecords')}
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('employeeDetail.date')}</TableCell>
                        <TableCell>{t('employeeDetail.clockIn')}</TableCell>
                        <TableCell>{t('employeeDetail.clockOut')}</TableCell>
                        <TableCell>{t('employeeDetail.totalHours')}</TableCell>
                        <TableCell>{t('employeeDetail.status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.clockIn || 'N/A'}</TableCell>
                          <TableCell>{record.clockOut || t('employeeDetail.inProgress')}</TableCell>
                          <TableCell>{record.totalHours || 0}h</TableCell>
                          <TableCell>
                            <Chip
                              label={record.status || 'PRESENT'}
                              color={record.status === 'PRESENT' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Leave Requests Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Leave History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {leaves.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  No leave requests
                </Typography>
              ) : (
                <List>
                  {leaves.map((leave) => (
                    <ListItem key={leave.id} divider>
                      <ListItemText
                        primary={leave.leaveType}
                        secondary={`${leave.startDate} to ${leave.endDate} • ${leave.days} days`}
                      />
                      <Chip
                        label={leave.status}
                        color={leave.status === 'APPROVED' ? 'success' : leave.status === 'REJECTED' ? 'error' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Tickets Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('employeeDetail.supportTickets')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {tickets.length === 0 ? (
                <Typography color="textSecondary" align="center" py={3}>
                  {t('employeeDetail.noSupportTickets')}
                </Typography>
              ) : (
                <List>
                  {tickets.map((ticket) => (
                    <ListItem key={ticket.id} divider>
                      <ListItemText
                        primary={ticket.title}
                        secondary={`${t('employeeDetail.created')} ${new Date(ticket.createdAt).toLocaleDateString()}`}
                      />
                      <Chip label={ticket.status} size="small" />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Details Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('employeeDetail.employeeDetails')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="textSecondary">{t('employeeDetail.employeeId')}</Typography>
                    <Typography variant="body1">{employee.id}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="textSecondary">{t('employeeDetail.department')}</Typography>
                    <Typography variant="body1">{employee.department || 'N/A'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="textSecondary">Position</Typography>
                    <Typography variant="body1">{employee.position || 'N/A'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="textSecondary">Salary</Typography>
                    <Typography variant="body1">{employee.salary ? `$${employee.salary.toLocaleString()}` : 'N/A'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="textSecondary">Hire Date</Typography>
                    <Typography variant="body1">
                      {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="textSecondary">Leave Balance</Typography>
                    <Typography variant="body1">{employee.leaveBalance || 0} days</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('employeeDetail.editEmployee')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.firstName')}
                value={editFormData.firstName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.lastName')}
                value={editFormData.lastName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.email')}
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.phone')}
                value={editFormData.phone || ''}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.mobile')}
                required
                value={editFormData.mobile || ''}
                onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Card Number"
                required
                value={editFormData.idCardNumber || ''}
                onChange={(e) => setEditFormData({ ...editFormData, idCardNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.birthDate')}
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                value={editFormData.birthDate || ''}
                onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.emergencyContact')}
                required
                value={editFormData.emergencyContact || ''}
                onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.position')}
                value={editFormData.position || ''}
                onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('employeeDetail.department')}
                value={editFormData.department || ''}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('employeeDetail.address')}
                multiline
                rows={2}
                required
                value={editFormData.address || ''}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained"
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
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('employeeDetail.deleteEmployee')}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {employee.firstName} {employee.lastName}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeeDetail

