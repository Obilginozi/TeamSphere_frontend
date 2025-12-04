import React, { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { getErrorMessage, logSuccessDetails } from '../utils/errorHandler'
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Alert,
  IconButton,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { Edit, Save, Cancel, Add as AddIcon, Delete as DeleteIcon, Business as BusinessIcon, ExpandMore, ExpandLess, PersonAdd, SupervisorAccount } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import ValidatedTextField from '../components/ValidatedTextField'
import { fieldValidations, validationRules } from '../utils/validation'

const CompanyEdit = () => {
  const { user, selectedCompanyId } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [company, setCompany] = useState(null)
  const [hrUsers, setHrUsers] = useState([])
  const [hrFormData, setHrFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    mobile: ''
  })
  const [hrLoading, setHrLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    description: '',
    managerId: ''
  })
  const [departmentLoading, setDepartmentLoading] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [companyLogo, setCompanyLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoObjectUrl, setLogoObjectUrl] = useState(null)
  const [employees, setEmployees] = useState([])
  const [expandedDepartments, setExpandedDepartments] = useState({})
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignFormData, setAssignFormData] = useState({
    departmentId: '',
    role: 'EMPLOYEE'
  })

  const companyMethods = useForm({
    defaultValues: {
      name: '',
      description: '',
      domain: '',
      contactEmail: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isActive: true
    }
  })

  useEffect(() => {
    // For HR: always allow access
    // For ADMIN: only allow if a company is selected
    if (user && (user.role === 'HR' || (user.role === 'ADMIN' && selectedCompanyId))) {
      fetchCompany()
      fetchHRUsers()
      fetchDepartments()
    }
  }, [user, selectedCompanyId])

  useEffect(() => {
    // Fetch employees when department tab is active
    if (activeTab === 2 && user && (user.role === 'HR' || (user.role === 'ADMIN' && selectedCompanyId))) {
      fetchEmployees()
    }
  }, [activeTab, user, selectedCompanyId])

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (logoObjectUrl) {
        URL.revokeObjectURL(logoObjectUrl)
      }
    }
  }, [logoObjectUrl])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/companies/my-company')
      
      if (response.data && response.data.data) {
        setCompany(response.data.data)
        companyMethods.reset({
          name: response.data.data?.name || '',
          description: response.data.data?.description || '',
          domain: response.data.data?.domain || '',
          contactEmail: response.data.data?.contactEmail || '',
          phone: response.data.data?.phone || '',
          address: response.data.data?.address || '',
          city: response.data.data?.city || '',
          state: response.data.data?.state || '',
          postalCode: response.data.data?.postalCode || '',
          country: response.data.data?.country || '',
          isActive: response.data.data?.isActive ?? true
        })
        
        if (response.data.data.logoUrl) {
          // Fetch logo as authenticated blob
          await fetchLogoAsBlob(response.data.data.logoUrl)
        }
      }
    } catch (error) {
      console.error('Failed to fetch company:', error)
      // Check if error message indicates company not found
      const errorMessage = error.response?.data?.message || error.message || ''
      if (errorMessage.includes('Company not found') || errorMessage.includes('not found with id')) {
        setError(t('companyEdit.companyNotFound'))
      } else {
        setError(getErrorMessage(error, t('companyEdit.failedToLoadCompany'), '', t))
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchHRUsers = async () => {
    try {
      const response = await api.get('/users/hr-users')
      if (response.data && response.data.success) {
        setHrUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch HR users:', error)
      setHrUsers([])
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/department')
      setDepartments(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
      setDepartments([])
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employee', {
        params: { page: 0, size: 1000, includeDeleted: false }
      })
      const employeesData = response.data.data?.content || response.data.data || []
      setEmployees(employeesData)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      setEmployees([])
    }
  }

  const fetchLogoAsBlob = async (logoUrl) => {
    // Clean up old object URL
    if (logoObjectUrl) {
      URL.revokeObjectURL(logoObjectUrl)
      setLogoObjectUrl(null)
    }
    
    if (!logoUrl) {
      return
    }
    
    // Handle different logo URL formats
    let urlPath = logoUrl
    if (!logoUrl.startsWith('uploads/')) {
      if (logoUrl.includes('uploads/')) {
        urlPath = logoUrl.substring(logoUrl.indexOf('uploads/'))
      } else {
        urlPath = `uploads/companies/${logoUrl}`
      }
    }
    
    const url = `/companies/logo?path=${encodeURIComponent(urlPath)}`
    
    try {
      const response = await api.get(url, {
        responseType: 'blob'
      })
      if (response.data && response.data.size > 0) {
        const blob = new Blob([response.data], { type: response.data.type || 'image/png' })
        const objectUrl = URL.createObjectURL(blob)
        setLogoObjectUrl(objectUrl)
        setLogoPreview(objectUrl)
      }
    } catch (fetchError) {
      console.error('Failed to fetch logo as blob:', fetchError)
      // Fallback to direct URL if blob fetch fails
      setLogoPreview(null)
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Clear old object URL if exists
      if (logoObjectUrl) {
        URL.revokeObjectURL(logoObjectUrl)
        setLogoObjectUrl(null)
      }
      setCompanyLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const onCompanySubmit = async (data) => {
    try {
      setLoading(true)
      setError(null)
      
      const formData = new FormData()
      const companyData = {
        name: data.name,
        description: data.description,
        domain: data.domain,
        contactEmail: data.contactEmail,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country
      }
      const companyBlob = new Blob([JSON.stringify(companyData)], { type: 'application/json' })
      formData.append('company', companyBlob)
      
      if (companyLogo) {
        formData.append('logo', companyLogo)
      }
      
      const response = await api.put('/companies/my-company', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      logSuccessDetails(response, 'Company updated', { company: companyData, hasLogo: !!companyLogo })
      setCompany(response.data.data)
      setSuccess(t('companyEdit.companyUpdated'))
      setCompanyLogo(null)
      // Don't clear logoPreview here - let fetchCompany update it
      
      await fetchCompany()
      
      // Dispatch event to notify other components (like Layout) that company was updated
      window.dispatchEvent(new CustomEvent('companyUpdated'))
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('companyEdit.failedToUpdateCompany'), '', t))
    } finally {
      setLoading(false)
    }
  }

  const handleAddHRUser = async () => {
    try {
      if (!hrFormData.firstName || !hrFormData.lastName || !hrFormData.email || !hrFormData.password) {
        setError(t('companyEdit.pleaseFillRequiredFields'))
        return
      }

      setHrLoading(true)
      setError(null)

      const response = await api.post('/users/hr-users', hrFormData)
      logSuccessDetails(response, 'HR user added', { email: hrFormData.email })
      
      setSuccess(t('companyEdit.hrUserAdded'))
      setHrFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        mobile: ''
      })
      
      await fetchHRUsers()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('companyEdit.failedToAddHR'), '', t))
    } finally {
      setHrLoading(false)
    }
  }

  const handleAddDepartment = async () => {
    if (!departmentFormData.name.trim()) {
      setError(t('companyEdit.departmentNameRequired'))
      return
    }

    try {
      setDepartmentLoading(true)
      setError(null)

      // Create department without manager first
      const { managerId, ...deptData } = departmentFormData
      const response = await api.post('/department', deptData)
      logSuccessDetails(response, 'Department added', { name: departmentFormData.name })
      
      // If manager is selected, assign them
      if (managerId && response.data?.data?.id) {
        const managerEmployee = employees.find(emp => emp.user?.id === parseInt(managerId))
        if (managerEmployee) {
          await api.put(`/users/${managerEmployee.user.id}/role`, {
            role: 'DEPARTMENT_MANAGER',
            departmentId: response.data.data.id
          })
        }
      }
      
      setSuccess(t('companyEdit.departmentAdded'))
      setDepartmentFormData({ name: '', description: '', managerId: '' })
      
      await fetchDepartments()
      await fetchEmployees()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('companyEdit.failedToCreateDepartment'), '', t))
    } finally {
      setDepartmentLoading(false)
    }
  }

  const handleEditDepartment = async () => {
    if (!departmentFormData.name.trim() || !editingDepartment) {
      setError(t('companyEdit.departmentNameRequired'))
      return
    }

    try {
      setDepartmentLoading(true)
      setError(null)

      // Update department info
      const { managerId, ...deptData } = departmentFormData
      const response = await api.put(`/department/${editingDepartment.id}`, deptData)
      logSuccessDetails(response, 'Department updated', { id: editingDepartment.id, name: departmentFormData.name })
      
      // Handle manager assignment
      const currentManager = getDepartmentManager(editingDepartment.id)
      const newManagerId = managerId ? parseInt(managerId) : null
      const currentManagerId = currentManager?.user?.id

      // If manager changed
      if (newManagerId !== currentManagerId) {
        // If there's a current manager, demote them
        if (currentManager && currentManager.user) {
          await api.put(`/users/${currentManager.user.id}/role`, {
            role: 'EMPLOYEE',
            departmentId: editingDepartment.id
          })
        }

        // If a new manager is selected, promote them
        if (newManagerId) {
          const newManagerEmployee = employees.find(emp => emp.user?.id === newManagerId)
          if (newManagerEmployee) {
            await api.put(`/users/${newManagerEmployee.user.id}/role`, {
              role: 'DEPARTMENT_MANAGER',
              departmentId: editingDepartment.id
            })
          }
        }
      }
      
      setSuccess(t('companyEdit.departmentUpdated'))
      setEditingDepartment(null)
      setDepartmentFormData({ name: '', description: '', managerId: '' })
      
      await fetchDepartments()
      await fetchEmployees()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('companyEdit.failedToUpdateDepartment'), '', t))
    } finally {
      setDepartmentLoading(false)
    }
  }

  const handleDeleteDepartment = async (id) => {
    if (window.confirm(t('companyEdit.confirmDeleteDepartment'))) {
      try {
        setError(null)
        await api.delete(`/department/${id}`)
        setSuccess(t('companyEdit.departmentDeleted'))
        await fetchDepartments()
        await fetchEmployees()
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(getErrorMessage(err, t('companyEdit.failedToDeleteDepartment'), '', t))
      }
    }
  }

  const handleToggleDepartment = (deptId) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }))
  }

  const handleAssignEmployee = (employee) => {
    setSelectedEmployee(employee)
    setAssignFormData({
      departmentId: employee.department?.id || '',
      role: employee.user?.role || 'EMPLOYEE'
    })
    setAssignDialogOpen(true)
  }

  const handleSaveAssignment = async () => {
    if (!assignFormData.departmentId) return
    
    // If assigning Department Manager without selecting employee, require selection
    if (assignFormData.role === 'DEPARTMENT_MANAGER' && !selectedEmployee) {
      setError(t('companyEdit.selectEmployeeForManager'))
      return
    }

    try {
      setError(null)
      
      // If we have a selected employee
      if (selectedEmployee) {
        // Update employee department
        await api.put(`/employee/${selectedEmployee.id}`, {
          departmentId: assignFormData.departmentId
        })

        // Update user role and department if promoting to Department Manager
        if (assignFormData.role === 'DEPARTMENT_MANAGER' && assignFormData.departmentId) {
          await api.put(`/users/${selectedEmployee.user.id}/role`, {
            role: 'DEPARTMENT_MANAGER',
            departmentId: assignFormData.departmentId
          })
        } else if (assignFormData.role === 'EMPLOYEE' && selectedEmployee.user.role === 'DEPARTMENT_MANAGER') {
          // Demote from Department Manager to Employee
          await api.put(`/users/${selectedEmployee.user.id}/role`, {
            role: 'EMPLOYEE',
            departmentId: assignFormData.departmentId
          })
        }
      }

      setSuccess(selectedEmployee ? t('companyEdit.employeeAssignedSuccessfully') : t('companyEdit.departmentManagerAssignedSuccessfully'))
      setAssignDialogOpen(false)
      setSelectedEmployee(null)
      setAssignFormData({ departmentId: '', role: 'EMPLOYEE' })
      await fetchEmployees()
      await fetchDepartments()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('companyEdit.failedToAssignEmployee'), '', t))
    }
  }

  const getEmployeesByDepartment = (departmentId) => {
    return employees.filter(emp => {
      // Check both employee.department and user.department
      const empDeptId = emp.department?.id || emp.departmentId
      const userDeptId = emp.user?.department?.id || emp.user?.departmentId
      return empDeptId === departmentId || userDeptId === departmentId
    })
  }

  const getDepartmentManager = (departmentId) => {
    // First check employees who are Department Managers
    let manager = employees.find(emp => {
      const empDeptId = emp.department?.id || emp.departmentId
      const userDeptId = emp.user?.department?.id || emp.user?.departmentId
      return emp.user?.role === 'DEPARTMENT_MANAGER' && 
             (empDeptId === departmentId || userDeptId === departmentId)
    })
    
    // If not found in employees, we might need to check users directly
    // But for now, return what we found
    return manager
  }

  // Check access: HR always allowed, ADMIN only if company is selected
  if (!user || (user.role !== 'HR' && user.role !== 'ADMIN')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">{t('companyEdit.accessDenied')}</Typography>
          <Typography>{t('companyEdit.accessDeniedMessage')}</Typography>
        </Alert>
      </Box>
    )
  }

  if (user.role === 'ADMIN' && !selectedCompanyId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6">{t('companyEdit.noCompanySelected')}</Typography>
          <Typography>{t('companyEdit.noCompanySelectedMessage')}</Typography>
        </Alert>
      </Box>
    )
  }

  if (loading && !company) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>{t('companyEdit.loadingCompanyData')}</Typography>
      </Box>
    )
  }

  // Show error state if company not found
  if (error && !company && !loading) {
    const isCompanyNotFound = error.includes('not found') || error.includes('bulunamadı')
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {isCompanyNotFound ? t('companyEdit.companyNotFound') : error}
          </Typography>
          {isCompanyNotFound && (
            <Typography variant="body2">
              {t('companyEdit.companyNotFoundMessage')}
            </Typography>
          )}
        </Alert>
        {user?.role === 'ADMIN' && (
          <Button
            variant="contained"
            onClick={() => window.location.href = '/company-selector'}
            sx={{
              mt: 2,
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
            {t('navigation.switchCompany')}
          </Button>
        )}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                <BusinessIcon sx={{ fontSize: 28, color: 'white' }} />
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
          {t('pageTitles.companyEdit')}
        </Typography>
              </Box>
            </Box>
          </Box>
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

        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ 
            mb: 3,
            '& .MuiTab-root': {
              borderRadius: 2,
              mx: 0.5,
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                color: '#667eea',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label={t('companyEdit.companyInfo')} icon={<BusinessIcon />} iconPosition="start" />
          <Tab label={t('companyEdit.hrManagement')} icon={<AddIcon />} iconPosition="start" />
          <Tab label={t('companyEdit.departmentManagement')} icon={<SupervisorAccount />} iconPosition="start" />
        </Tabs>

        <Paper 
          sx={{ 
            p: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)'
            }
          }}
        >
        <FormProvider {...companyMethods}>
          <Box component="form" onSubmit={companyMethods.handleSubmit(onCompanySubmit)}>
            {/* Company Information Tab */}
            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('companyEdit.companyLogo')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {(logoPreview || logoObjectUrl || (company?.logoUrl && !companyLogo)) && (
                        <img
                          src={logoPreview || logoObjectUrl || undefined}
                          alt="Company logo"
                          style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '4px', objectFit: 'contain' }}
                          onError={(e) => {
                            console.error('Failed to load logo image')
                            // If logoObjectUrl fails, try to fetch again
                            if (company?.logoUrl && !logoObjectUrl) {
                              fetchLogoAsBlob(company.logoUrl)
                            }
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="company-logo-upload"
                        type="file"
                        onChange={handleLogoChange}
                      />
                      <label htmlFor="company-logo-upload">
                        <Button variant="outlined" component="span" size="small">
                          {company?.logoUrl ? t('companyEdit.changeLogo') : t('companyEdit.uploadLogo')}
                        </Button>
                      </label>
                      {companyLogo && (
                        <Button
                          variant="text"
                          size="small"
                          color="error"
                          onClick={() => {
                            setCompanyLogo(null)
                            setLogoPreview(null)
                            if (logoObjectUrl) {
                              URL.revokeObjectURL(logoObjectUrl)
                              setLogoObjectUrl(null)
                            }
                          }}
                        >
                          {t('companyEdit.remove')}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <ValidatedTextField
                    name="name"
                    label={t('company.companyName')}
                    required
                    validation={fieldValidations.companyName}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ValidatedTextField
                    name="description"
                    label={t('companyEdit.description')}
                    multiline
                    rows={3}
                    validation={{
                      maxLength: validationRules.maxLength(500, t('companyEdit.descriptionMaxLength'))
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    name="domain"
                    label={t('company.domain')}
                    validation={{
                      maxLength: validationRules.maxLength(100, t('companyEdit.domainMaxLength'))
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    name="contactEmail"
                    label={t('company.contactEmail')}
                    type="email"
                    required
                    validation={fieldValidations.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    name="phone"
                    label={t('company.phone')}
                    validation={fieldValidations.phoneOptional}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ValidatedTextField
                    name="address"
                    label={t('company.address')}
                    multiline
                    rows={2}
                    required
                    validation={{
                      required: validationRules.required(t('companyEdit.addressRequired')),
                      maxLength: validationRules.maxLength(200, t('companyEdit.addressMaxLength'))
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    name="city"
                    label={t('company.city')}
                    validation={{
                      maxLength: validationRules.maxLength(100, t('companyEdit.cityMaxLength'))
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    name="state"
                    label={t('company.state')}
                    validation={{
                      maxLength: validationRules.maxLength(50, t('companyEdit.stateMaxLength'))
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    name="postalCode"
                    label={t('company.postalCode')}
                    validation={fieldValidations.postalCode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ValidatedTextField
                    name="country"
                    label={t('company.country')}
                    validation={{
                      maxLength: validationRules.maxLength(50, t('companyEdit.countryMaxLength'))
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    type="submit"
                    variant="contained" 
                    startIcon={<Save />}
                    disabled={loading}
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
                    {loading ? t('companyEdit.saving') : t('companyEdit.saveChanges')}
                  </Button>
                </Grid>
              </Grid>
            )}
          </Box>
        </FormProvider>

        {/* HR Management Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('companyEdit.addNewHRUser')}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employees.firstName')}
                  required
                  value={hrFormData.firstName}
                  onChange={(e) => setHrFormData({ ...hrFormData, firstName: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employees.lastName')}
                  required
                  value={hrFormData.lastName}
                  onChange={(e) => setHrFormData({ ...hrFormData, lastName: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employees.email')}
                  type="email"
                  required
                  value={hrFormData.email}
                  onChange={(e) => setHrFormData({ ...hrFormData, email: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('auth.password')}
                  type="password"
                  required
                  value={hrFormData.password}
                  onChange={(e) => setHrFormData({ ...hrFormData, password: e.target.value })}
                  margin="normal"
                  helperText={t('companyEdit.passwordForNewHR')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.phone')}
                  value={hrFormData.phone}
                  onChange={(e) => setHrFormData({ ...hrFormData, phone: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employees.mobile')}
                  value={hrFormData.mobile}
                  onChange={(e) => setHrFormData({ ...hrFormData, mobile: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleAddHRUser}
                  disabled={hrLoading}
                  startIcon={<Save />}
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
                  {hrLoading ? t('companyEdit.adding') : t('companyEdit.addHRUser')}
                </Button>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              {t('companyEdit.existingHRUsers')} ({hrUsers.length})
            </Typography>
            {hrUsers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('companyEdit.noHRUsersFound')}
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('companyEdit.name')}</TableCell>
                      <TableCell>{t('companyEdit.email')}</TableCell>
                      <TableCell>{t('companyEdit.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hrUsers.map((hrUser) => (
                      <TableRow key={hrUser.id}>
                        <TableCell>{hrUser.firstName} {hrUser.lastName}</TableCell>
                        <TableCell>{hrUser.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={hrUser.isActive ? t('companyEdit.active') : t('companyEdit.inactive')} 
                            color={hrUser.isActive ? 'success' : 'default'}
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

        {/* Department Management Tab */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {editingDepartment ? t('companyEdit.editDepartment') : t('companyEdit.addNewDepartment')}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('companyEdit.departmentName')}
                  required
                  value={departmentFormData.name}
                  onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={departmentFormData.description}
                  onChange={(e) => setDepartmentFormData({ ...departmentFormData, description: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Department Manager</InputLabel>
                  <Select
                    value={departmentFormData.managerId || ''}
                    onChange={(e) => setDepartmentFormData({ ...departmentFormData, managerId: e.target.value })}
                    label="Department Manager"
                  >
                    <MenuItem value="">
                      <em>No Manager</em>
                    </MenuItem>
                    {employees
                      .filter(emp => emp.user?.role !== 'HR' && emp.user?.role !== 'ADMIN')
                      .map((emp) => (
                        <MenuItem key={emp.user?.id} value={emp.user?.id?.toString()}>
                          {emp.user?.firstName} {emp.user?.lastName} {emp.user?.role === 'DEPARTMENT_MANAGER' ? '(Current Manager)' : ''}
                        </MenuItem>
                      ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                    Select an employee to assign as department manager
                  </Typography>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={editingDepartment ? handleEditDepartment : handleAddDepartment}
                    disabled={departmentLoading}
                    startIcon={<Save />}
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
                    {departmentLoading ? (editingDepartment ? t('companyEdit.updating') : t('companyEdit.adding')) : (editingDepartment ? t('companyEdit.updateDepartment') : t('companyEdit.addDepartment'))}
                  </Button>
                  {editingDepartment && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingDepartment(null)
                        setDepartmentFormData({ name: '', description: '', managerId: '' })
                      }}
                      startIcon={<Cancel />}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              {t('companyEdit.existingDepartments')} ({departments.length})
            </Typography>
            {departments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('companyEdit.noDepartmentsFound')}
              </Typography>
            ) : (
              <React.Fragment>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="50px"></TableCell>
                      <TableCell>{t('companyEdit.name')}</TableCell>
                      <TableCell>{t('companyEdit.description')}</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell>Employees</TableCell>
                      <TableCell>{t('companyEdit.status')}</TableCell>
                      <TableCell align="right">{t('employees.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((dept) => {
                      const deptEmployees = getEmployeesByDepartment(dept.id)
                      const manager = getDepartmentManager(dept.id)
                      const isExpanded = expandedDepartments[dept.id]
                      
                      return (
                        <React.Fragment key={dept.id}>
                          <TableRow>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleDepartment(dept.id)}
                              >
                                {isExpanded ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </TableCell>
                            <TableCell><strong>{dept.name}</strong></TableCell>
                            <TableCell>{dept.description || '-'}</TableCell>
                            <TableCell>
                              {manager ? (
                                <Chip 
                                  label={`${manager.user?.firstName} ${manager.user?.lastName}`}
                                  color="primary"
                                  size="small"
                                  icon={<SupervisorAccount />}
                                />
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" color="text.secondary">No Manager</Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      // Open dialog to assign Department Manager
                                      setAssignFormData({
                                        departmentId: dept.id,
                                        role: 'DEPARTMENT_MANAGER'
                                      })
                                      setSelectedEmployee(null)
                                      setAssignDialogOpen(true)
                                    }}
                                    title="Assign Department Manager"
                                  >
                                    <PersonAdd />
                                  </IconButton>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`${deptEmployees.length} employee(s)`}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={dept.isActive ? t('companyEdit.active') : t('companyEdit.inactive')} 
                                color={dept.isActive ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingDepartment(dept)
                                  const manager = getDepartmentManager(dept.id)
                                  setDepartmentFormData({
                                    name: dept.name || '',
                                    description: dept.description || '',
                                    managerId: manager?.user?.id?.toString() || ''
                                  })
                                }}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteDepartment(dept.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={7} sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Employees in {dept.name}
                                  </Typography>
                                  {deptEmployees.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                      No employees assigned to this department
                                    </Typography>
                                  ) : (
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Name</TableCell>
                                          <TableCell>Email</TableCell>
                                          <TableCell>Position</TableCell>
                                          <TableCell>Role</TableCell>
                                          <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {deptEmployees.map((emp) => (
                                          <TableRow key={emp.id}>
                                            <TableCell>{emp.user?.firstName} {emp.user?.lastName}</TableCell>
                                            <TableCell>{emp.user?.email}</TableCell>
                                            <TableCell>{emp.position}</TableCell>
                                            <TableCell>
                                              <Chip 
                                                label={emp.user?.role || 'EMPLOYEE'}
                                                color={emp.user?.role === 'DEPARTMENT_MANAGER' ? 'primary' : 'default'}
                                                size="small"
                                              />
                                            </TableCell>
                                            <TableCell align="right">
                                              <IconButton
                                                size="small"
                                                onClick={() => handleAssignEmployee(emp)}
                                                title="Assign to Department / Promote to Manager"
                                              >
                                                <PersonAdd />
                                              </IconButton>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  )}
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Assign Employee to {dept.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                      {employees.filter(emp => !emp.department || emp.department.id !== dept.id).slice(0, 10).map((emp) => (
                                        <Chip
                                          key={emp.id}
                                          label={`${emp.user?.firstName} ${emp.user?.lastName}`}
                                          onClick={() => handleAssignEmployee(emp)}
                                          icon={<PersonAdd />}
                                          variant="outlined"
                                          sx={{ cursor: 'pointer' }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Assign Employee Dialog */}
              {assignDialogOpen && selectedEmployee && (
                <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                  <DialogTitle>Assign Employee to Department</DialogTitle>
                  <DialogContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Employee: <strong>{selectedEmployee.user?.firstName} {selectedEmployee.user?.lastName}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Department: {selectedEmployee.department?.name || 'None'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Role: {selectedEmployee.user?.role || 'EMPLOYEE'}
                      </Typography>
                    </Box>
                    <TextField
                      select
                      fullWidth
                      label="Department"
                      value={assignFormData.departmentId}
                      onChange={(e) => setAssignFormData({ ...assignFormData, departmentId: e.target.value })}
                      margin="normal"
                      SelectProps={{
                        native: true
                      }}
                      disabled={!selectedEmployee && assignFormData.role === 'DEPARTMENT_MANAGER'}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </TextField>
                    {selectedEmployee ? (
                      <TextField
                        select
                        fullWidth
                        label="Role"
                        value={assignFormData.role}
                        onChange={(e) => setAssignFormData({ ...assignFormData, role: e.target.value })}
                        margin="normal"
                        SelectProps={{
                          native: true
                        }}
                        helperText={assignFormData.role === 'DEPARTMENT_MANAGER' ? 'Promoting to Department Manager will assign them to the selected department' : ''}
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="DEPARTMENT_MANAGER">Department Manager</option>
                      </TextField>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Select Employee to Assign as Department Manager
                        </Typography>
                        <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                          {employees.filter(emp => emp.user?.role !== 'HR' && emp.user?.role !== 'ADMIN').map((emp) => (
                            <Chip
                              key={emp.id}
                              label={`${emp.user?.firstName} ${emp.user?.lastName} ${emp.user?.role === 'DEPARTMENT_MANAGER' ? '(Current Manager)' : ''}`}
                              onClick={() => {
                                setSelectedEmployee(emp)
                                setAssignFormData({
                                  ...assignFormData,
                                  role: 'DEPARTMENT_MANAGER'
                                })
                              }}
                              color={emp.user?.role === 'DEPARTMENT_MANAGER' ? 'primary' : 'default'}
                              variant={selectedEmployee?.id === emp.id ? 'filled' : 'outlined'}
                              sx={{ m: 0.5, cursor: 'pointer' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => {
                      setAssignDialogOpen(false)
                      setSelectedEmployee(null)
                      setAssignFormData({ departmentId: '', role: 'EMPLOYEE' })
                    }}>Cancel</Button>
                    <Button 
                      onClick={handleSaveAssignment} 
                      variant="contained"
                      disabled={!assignFormData.departmentId || (!selectedEmployee && assignFormData.role === 'DEPARTMENT_MANAGER')}
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
                      Save
                    </Button>
                  </DialogActions>
                </Dialog>
              )}
              </React.Fragment>
            )}
          </Box>
        )}
      </Paper>
      </Box>
    </Box>
  )
}

export default CompanyEdit

