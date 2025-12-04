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
  Snackbar,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { Add, Edit, Delete, Download, Search, FilterList, Print, People } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import ValidatedTextField from '../components/ValidatedTextField'
import ValidatedSelect from '../components/ValidatedSelect'
import { fieldValidations, validationRules } from '../utils/validation'
import { getErrorMessage, logSuccessDetails } from '../utils/errorHandler'

const Employees = () => {
  const { t } = useTranslation()
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
  const [departments, setDepartments] = useState([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const { user } = useAuth()

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [page, rowsPerPage, searchTerm, statusFilter, departmentFilter])

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/department')
      setDepartments(response.data.data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      setDepartments([])
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        size: rowsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        department: departmentFilter !== 'ALL' ? Number(departmentFilter) : undefined,
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
        showSnackbar(t('employees.unexpectedResponseFormat'), 'error')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
      setTotalElements(0)
      showSnackbar(getErrorMessage(error, t('employees.failedToLoad'), '', t), 'error')
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
      showSnackbar(t('employees.exportedSuccessfully'), 'success')
    } catch (error) {
      console.error('Error exporting employees:', error)
      showSnackbar(getErrorMessage(error, t('employees.failedToExport'), '', t), 'error')
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
        showSnackbar(t('employees.updatedSuccessfully'), 'success')
      } else {
        response = await api.post('/employee', employeeData)
        logSuccessDetails(response, 'Employee created', employeeData)
        showSnackbar(t('employees.createdSuccessfully'), 'success')
      }
      fetchEmployees()
      handleClose()
    } catch (error) {
      console.error('Error saving employee:', error)
      showSnackbar(getErrorMessage(error, t('employees.failedToSave'), '', t), 'error')
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

  const getEmploymentStatusLabel = (status) => {
    const labels = {
      ACTIVE: t('employees.active'),
      INACTIVE: t('employees.inactive'),
      ON_LEAVE: t('employees.onLeave'),
      SUSPENDED: t('employees.suspended'),
      TERMINATED: t('employees.terminated')
    }
    return labels[status] || status
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
                <People sx={{ fontSize: 28, color: 'white' }} />
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
          {t('pageTitles.employees')}
        </Typography>
              </Box>
            </Box>
          </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportExcel}
              sx={{ mr: 2, borderRadius: 2 }}
          >
            {t('common.export')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
              sx={{ mr: 2, borderRadius: 2 }}
          >
            {t('common.print')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
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
            {t('employees.addEmployee')}
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
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
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label={t('common.search')}
              placeholder={t('employees.searchPlaceholder')}
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
          <Grid item xs={12} md={4}>
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
              <InputLabel>{t('employees.status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('employees.status')}
                onChange={(e) => setStatusFilter(e.target.value)}
                renderValue={(value) => {
                  if (value === 'ALL') return t('employees.allStatus')
                  if (value === 'ACTIVE') return t('employees.active')
                  if (value === 'INACTIVE') return t('employees.inactive')
                  if (value === 'ON_LEAVE') return t('employees.onLeave')
                  if (value === 'TERMINATED') return t('employees.terminated')
                  return value
                }}
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
              <InputLabel>{t('employees.department')}</InputLabel>
              <Select
                value={departmentFilter}
                label={t('employees.department')}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                renderValue={(value) => {
                  if (value === 'ALL') return t('employees.allDepartments')
                  const dept = departments.find(d => String(d.id) === value)
                  return dept ? dept.name : value
                }}
              >
                <MenuItem value="ALL">{t('employees.allDepartments')}</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </MenuItem>
                ))}
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
                <TableCell colSpan={8} align="center">{t('common.loadingData')}</TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">{t('employees.noEmployeesFound')}</TableCell>
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
                        label={t('common.deleted')} 
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
                      label={getEmploymentStatusLabel(employee.employmentStatus)}
                      size="small"
                      sx={{
                        ...(employee.employmentStatus === 'ACTIVE' ? {
                          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                        } : employee.employmentStatus === 'INACTIVE' ? {
                          background: 'rgba(158, 158, 158, 0.2)',
                          color: '#424242',
                          fontWeight: 500,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        } : employee.employmentStatus === 'ON_LEAVE' ? {
                          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
                        } : employee.employmentStatus === 'TERMINATED' ? {
                          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                        } : {
                          background: 'rgba(158, 158, 158, 0.2)',
                          color: '#424242',
                          fontWeight: 500,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }),
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: employee.employmentStatus === 'ACTIVE' 
                            ? '0 4px 12px rgba(76, 175, 80, 0.4)' 
                            : employee.employmentStatus === 'ON_LEAVE'
                            ? '0 4px 12px rgba(255, 152, 0, 0.4)'
                            : employee.employmentStatus === 'TERMINATED'
                            ? '0 4px 12px rgba(244, 67, 54, 0.4)'
                            : '0 4px 8px rgba(0, 0, 0, 0.15)'
                        },
                        transition: 'all 0.2s ease'
                      }}
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
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
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
          {t('common.confirmDelete')}
        </DialogTitle>
        <DialogContent>
          {t('common.areYouSureDelete', { name: `${employeeToDelete?.user?.firstName} ${employeeToDelete?.user?.lastName}` })}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
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
            {t('common.delete')}
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
    </Box>
  )
}

const EmployeeDialog = ({ open, onClose, onSave, employee }) => {
  const { t } = useTranslation()
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
      employmentStatus: 'ACTIVE',
      worksInShifts: false
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
        employmentStatus: employee.employmentStatus || 'ACTIVE',
        worksInShifts: employee.worksInShifts || false
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
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
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...methods.register('worksInShifts')}
                      checked={methods.watch('worksInShifts') || false}
                      onChange={(e) => methods.setValue('worksInShifts', e.target.checked)}
                    />
                  }
                  label={t('employees.worksInShifts') || 'Works in Shifts'}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button 
              onClick={onClose}
              sx={{ borderRadius: 2 }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
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
              {t('common.save')}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  )
}

export default Employees
