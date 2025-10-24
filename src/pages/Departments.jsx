import { useState, useEffect } from 'react'
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
  Avatar,
  AvatarGroup,
  Tooltip
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Departments = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [departments, setDepartments] = useState([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: ''
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/departments')
      setDepartments(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch departments:', err)
      setError('Failed to load departments. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      await api.post('/api/departments', formData)
      setSuccess('Department created successfully!')
      setAddDialogOpen(false)
      setFormData({ name: '', description: '', managerId: '' })
      await fetchDepartments()
    } catch (err) {
      setError('Failed to create department. Please try again.')
    }
  }

  const handleEdit = async () => {
    try {
      await api.put(`/api/departments/${selectedDepartment.id}`, formData)
      setSuccess('Department updated successfully!')
      setEditDialogOpen(false)
      setSelectedDepartment(null)
      setFormData({ name: '', description: '', managerId: '' })
      await fetchDepartments()
    } catch (err) {
      setError('Failed to update department. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/api/departments/${id}`)
        setSuccess('Department deleted successfully!')
        await fetchDepartments()
      } catch (err) {
        setError('Failed to delete department. Please try again.')
      }
    }
  }

  const openEditDialog = (dept) => {
    setSelectedDepartment(dept)
    setFormData({
      name: dept.name,
      description: dept.description || '',
      managerId: dept.managerId || ''
    })
    setEditDialogOpen(true)
  }

  const canManage = user?.role === 'ADMIN' || user?.role === 'HR'

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom>
            Departments
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage organizational structure and teams
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDepartments}
            disabled={loading}
          >
            Refresh
          </Button>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Department
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

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Departments
                  </Typography>
                  <Typography variant="h4">{departments.length}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, color: '#1976d2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Employees
                  </Typography>
                  <Typography variant="h4">
                    {departments.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0)}
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 48, color: '#4caf50' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Largest Department
                  </Typography>
                  <Typography variant="h6" noWrap>
                    {departments.reduce((max, dept) => 
                      (dept.employeeCount || 0) > (max.employeeCount || 0) ? dept : max, 
                      { name: 'N/A', employeeCount: 0 }
                    ).name}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, color: '#ff9800' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Dept Size
                  </Typography>
                  <Typography variant="h4">
                    {departments.length > 0 
                      ? Math.round(departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0) / departments.length)
                      : 0}
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 48, color: '#9c27b0' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Departments Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Employees</TableCell>
                  <TableCell>Team Members</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 5 : 4} align="center">
                      <Typography color="textSecondary" py={3}>
                        No departments found. Create your first department to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept) => (
                    <TableRow key={dept.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{dept.name}</Typography>
                        {dept.description && (
                          <Typography variant="caption" color="textSecondary">
                            {dept.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {dept.managerName || 'No Manager'}
                      </TableCell>
                      <TableCell>
                        <Chip label={dept.employeeCount || 0} size="small" />
                      </TableCell>
                      <TableCell>
                        {dept.employees && dept.employees.length > 0 ? (
                          <AvatarGroup max={4}>
                            {dept.employees.map((emp, idx) => (
                              <Tooltip key={idx} title={emp.name}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                  {emp.name?.charAt(0)}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            No members
                          </Typography>
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openEditDialog(dept)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(dept.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Department Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Manager ID (Optional)"
                type="number"
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                helperText="Leave empty if no manager assigned yet"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">Create Department</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Department</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Manager ID"
                type="number"
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">Update Department</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Departments

