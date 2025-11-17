import React, { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
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
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import ValidatedTextField from '../components/ValidatedTextField'
import ValidatedSelect from '../components/ValidatedSelect'
import { fieldValidations, validationRules } from '../utils/validation'
import { getErrorMessage, logSuccessDetails } from '../utils/errorHandler'

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
  const { user } = useAuth()

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
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        includeDeleted: user?.role === 'ADMIN' ? true : undefined // Admins see deleted employees
      }
      const response = await api.get('/employee', { params })
      
      // Handle response structure
      if (response.data && response.data.success && response.data.data) {
        setEmployees(response.data.data.content || [])
        setTotalElements(response.data.data.totalElements || 0)
      } else {
        console.error('Unexpected response structure:', response.data)
        setEmployees([])
        setTotalElements(0)
        showSnackbar('Unexpected response format', 'error')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
      setTotalElements(0)
      showSnackbar(getErrorMessage(error, 'Failed to load employees'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/export/employees/excel', {
        responseType: 'blob'
      })
      logSuccessDetails(response, 'Employees exported')
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const contentDisposition = response.headers['content-disposition']
      let filename = 'employees.xlsx'
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
      showSnackbar('Employees exported successfully', 'success')
    } catch (error) {
      console.error('Error exporting employees:', error)
      showSnackbar(getErrorMessage(error, 'Failed to export employees'), 'error')
    }
  }

  const handleClose = () => {
    setOpen(false)
    setEditingEmployee(null)
  }

  const handleSave = async (employeeData) => {
    try {
      let response
      if (editingEmployee) {
        response = await api.put(`/employee/${editingEmployee.id}`, employeeData)
        logSuccessDetails(response, 'Employee updated', employeeData)
        showSnackbar('Employee updated successfully', 'success')
      } else {
        response = await api.post('/employee', employeeData)
        logSuccessDetails(response, 'Employee created', employeeData)
        showSnackbar('Employee created successfully', 'success')
      }
      fetchEmployees()
      handleClose()
    } catch (error) {
      console.error('Error saving employee:', error)
      showSnackbar(getErrorMessage(error, 'Failed to save employee'), 'error')
    }
  }

  const handleExportExcel = async () => {
    await handleExport()
  }
  
  const handleExportExcelOld = async () => {
    try {
      const response = await api.get('/export/employees/excel', {
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
      
      setSnackbar({ open: true, message: t('employees.exportSuccess'), severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: t('employees.exportFailed'), severity: 'error' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/employee/${employeeToDelete.id}`)
      showSnackbar(t('employees.deleteSuccess'), 'success')
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      showSnackbar(t('employees.deleteFailed'), 'error')
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
            {t('common.export')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{ mr: 2 }}
          >
            {t('common.print')}
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
              placeholder={t('employees.searchPlaceholder')}
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
              <InputLabel>{t('employees.status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('employees.status')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">{t('employees.allStatus')}</MenuItem>
                <MenuItem value="ACTIVE">{t('employees.active')}</MenuItem>
                <MenuItem value="INACTIVE">{t('employees.inactive')}</MenuItem>
                <MenuItem value="ON_LEAVE">{t('employees.onLeave')}</MenuItem>
                <MenuItem value="TERMINATED">{t('employees.terminated')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('employees.department')}</InputLabel>
              <Select
                value={departmentFilter}
                label={t('employees.department')}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="ALL">{t('employees.allDepartments')}</MenuItem>
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
                <TableRow 
                  key={employee.id} 
                  hover
                  sx={{
                    opacity: employee.isDeleted ? 0.6 : 1,
                    textDecoration: employee.isDeleted ? 'line-through' : 'none',
                    backgroundColor: employee.isDeleted ? 'rgba(0, 0, 0, 0.02)' : 'inherit'
                  }}
                >
                  <TableCell>
                    {employee.employeeId}
                    {employee.isDeleted && (
                      <Chip 
                        label={t('employees.deleted')} 
                        size="small" 
                        color="error" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
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
                      disabled={employee.isDeleted}
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
                      disabled={employee.isDeleted}
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
  const [departments, setDepartments] = useState([])
  
  const methods = useForm({
    defaultValues: {
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      position: '',
      departmentId: '',
      phone: '',
      mobile: '',
      address: '',
      idCardNumber: '',
      birthDate: '',
      emergencyContact: '',
      salary: '',
      paymentType: 'GROSS_PAY',
      employmentStatus: 'ACTIVE'
    }
  })

  useEffect(() => {
    if (employee) {
      methods.reset({
        employeeId: employee.employeeId || '',
        firstName: employee.user?.firstName || '',
        lastName: employee.user?.lastName || '',
        email: employee.user?.email || '',
        position: employee.position || '',
        departmentId: employee.department?.id || '',
        phone: employee.phone || '',
        mobile: employee.mobile || '',
        address: employee.address || '',
        idCardNumber: employee.idCardNumber || '',
        birthDate: employee.birthDate || '',
        emergencyContact: employee.emergencyContact || '',
        salary: employee.salary || '',
        paymentType: employee.paymentType || 'GROSS_PAY',
        employmentStatus: employee.employmentStatus || 'ACTIVE'
      })
    } else {
      methods.reset()
    }
  }, [employee, methods])

  useEffect(() => {
    // Fetch departments
    api.get('/department')
      .then(response => setDepartments(response.data.data || []))
      .catch(() => setDepartments([]))
  }, [])

  const onSubmit = (data) => {
    onSave(data)
  }

  const departmentOptions = departments.map(dept => ({
    value: dept.id,
    label: dept.name
  }))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {employee ? t('employees.editEmployee') : t('employees.addEmployee')}
      </DialogTitle>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="employeeId"
                  label={t('employees.employeeId')}
                  required
                  validation={fieldValidations.employeeId}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="position"
                  label={t('employees.position')}
                  required
                  validation={{
                    required: validationRules.required('Position is required'),
                    maxLength: validationRules.maxLength(100, 'Position must not exceed 100 characters')
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="firstName"
                  label={t('employees.firstName')}
                  required
                  validation={fieldValidations.firstName}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="lastName"
                  label={t('employees.lastName')}
                  required
                  validation={fieldValidations.lastName}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="email"
                  label={t('employees.email')}
                  type="email"
                  required
                  validation={fieldValidations.email}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="idCardNumber"
                  label={t('employees.idCardNumber')}
                  required
                  validation={{
                    required: validationRules.required('ID Card Number is required'),
                    maxLength: validationRules.maxLength(20, 'ID Card Number must not exceed 20 characters')
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="phone"
                  label={t('employees.phone')}
                  validation={fieldValidations.phoneOptional}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="mobile"
                  label={t('employees.mobile')}
                  required
                  validation={fieldValidations.phone}
                />
              </Grid>
              <Grid item xs={12}>
                <ValidatedTextField
                  name="address"
                  label={t('employees.address')}
                  required
                  validation={{
                    required: validationRules.required(t('validation.addressRequired')),
                    maxLength: validationRules.maxLength(200, t('validation.addressMaxLength'))
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="birthDate"
                  label={t('employees.birthDate')}
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  validation={{
                    required: validationRules.required(t('validation.birthDate'))
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="emergencyContact"
                  label={t('employees.emergencyContact')}
                  required
                  validation={{
                    required: validationRules.required(t('validation.emergencyContactRequired')),
                    maxLength: validationRules.maxLength(100, t('validation.emergencyContactMaxLength'))
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="salary"
                  label={t('employees.salary')}
                  type="number"
                  validation={fieldValidations.salary}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedSelect
                  name="paymentType"
                  label={t('employees.paymentType')}
                  options={[
                    { value: 'GROSS_PAY', label: t('employees.grossPay') },
                    { value: 'NET_PAY', label: t('employees.netPay') }
                  ]}
                  validation={{
                    required: validationRules.required(t('validation.paymentTypeRequired'))
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedSelect
                  name="departmentId"
                  label={t('employees.department')}
                  options={departmentOptions}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedSelect
                  name="employmentStatus"
                  label={t('employees.employmentStatus')}
                  options={[
                    { value: 'ACTIVE', label: t('employees.active') },
                    { value: 'INACTIVE', label: t('employees.inactive') },
                    { value: 'ON_LEAVE', label: t('employees.onLeave') },
                    { value: 'SUSPENDED', label: t('employees.suspended') },
                    { value: 'TERMINATED', label: t('employees.terminated') }
                  ]}
                  validation={{
                    required: validationRules.required(t('validation.employmentStatusRequired'))
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained">{t('common.save')}</Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  )
}

export default Employees
