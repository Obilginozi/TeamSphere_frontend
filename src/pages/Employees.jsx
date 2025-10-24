import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  InputAdornment,
  Alert,
  Snackbar
} from '@mui/material'
import { Add, Edit, Delete, Download, Search, FilterList, Print } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'

const Employees = () => {
  const { t } = useLanguage()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    fetchEmployees()
  }, [page, rowsPerPage, searchTerm, statusFilter, departmentFilter])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        size: rowsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined
      }
      const response = await api.get('/employee', { params })
      setEmployees(response.data.data.content)
      setTotalElements(response.data.data.totalElements)
    } catch (error) {
      console.error('Error fetching employees:', error)
      showSnackbar('Failed to load employees', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/employee/export/excel', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'employees.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting employees:', error)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setEditingEmployee(null)
  }

  const handleSave = async (employeeData) => {
    try {
      if (editingEmployee) {
        await api.put(`/employee/${editingEmployee.id}`, employeeData)
        showSnackbar('Employee updated successfully', 'success')
      } else {
        await api.post('/employee', employeeData)
        showSnackbar('Employee created successfully', 'success')
      }
      fetchEmployees()
      handleClose()
    } catch (error) {
      console.error('Error saving employee:', error)
      showSnackbar('Failed to save employee', 'error')
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/api/export/employees/excel', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: 'Employees exported successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Export failed. Please try again.', severity: 'error' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/employee/${employeeToDelete.id}`)
      showSnackbar('Employee deleted successfully', 'success')
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      showSnackbar('Failed to delete employee', 'error')
    }
  }

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('employees.title')}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportExcel}
            sx={{ mr: 2 }}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{ mr: 2 }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
          >
            {t('employees.addEmployee')}
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search employees..."
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
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="ON_LEAVE">On Leave</MenuItem>
                <MenuItem value="TERMINATED">Terminated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                label="Department"
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Departments</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="SALES">Sales</MenuItem>
                <MenuItem value="MARKETING">Marketing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('employees.employeeId')}</TableCell>
              <TableCell>{t('employees.firstName')}</TableCell>
              <TableCell>{t('employees.lastName')}</TableCell>
              <TableCell>{t('employees.email')}</TableCell>
              <TableCell>{t('employees.position')}</TableCell>
              <TableCell>{t('employees.department')}</TableCell>
              <TableCell>{t('employees.status')}</TableCell>
              <TableCell>{t('employees.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Loading...</TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No employees found</TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>{employee.employeeId}</TableCell>
                  <TableCell>{employee.user?.firstName}</TableCell>
                  <TableCell>{employee.user?.lastName}</TableCell>
                  <TableCell>{employee.user?.email}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.employmentStatus}
                      color={employee.employmentStatus === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => {
                        setEditingEmployee(employee)
                        setOpen(true)
                      }}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error"
                      onClick={() => {
                        setEmployeeToDelete(employee)
                        setDeleteDialogOpen(true)
                      }}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
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
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Employee Dialog */}
      <EmployeeDialog
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        employee={editingEmployee}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {employeeToDelete?.user?.firstName} {employeeToDelete?.user?.lastName}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

const EmployeeDialog = ({ open, onClose, onSave, employee }) => {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    departmentId: '',
    phone: '',
    mobile: '',
    salary: ''
  })

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeId: employee.employeeId || '',
        firstName: employee.user?.firstName || '',
        lastName: employee.user?.lastName || '',
        email: employee.user?.email || '',
        position: employee.position || '',
        departmentId: employee.department?.id || '',
        phone: employee.phone || '',
        mobile: employee.mobile || '',
        salary: employee.salary || ''
      })
    }
  }, [employee])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {employee ? t('employees.editEmployee') : t('employees.addEmployee')}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('employees.employeeId')}
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('employees.position')}
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('employees.firstName')}
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('employees.lastName')}
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('employees.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('employees.phone')}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('employees.mobile')}
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('employees.salary')}
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default Employees
