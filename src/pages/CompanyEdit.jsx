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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material'
import { Edit, Save, Cancel, Add as AddIcon, Delete as DeleteIcon, Business as BusinessIcon } from '@mui/icons-material'
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
    description: ''
  })
  const [departmentLoading, setDepartmentLoading] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [companyLogo, setCompanyLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

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
          setLogoPreview(getLogoUrl(response.data.data.logoUrl))
        }
      }
    } catch (error) {
      console.error('Failed to fetch company:', error)
      setError(getErrorMessage(error, t('companyEdit.failedToLoadCompany'), '', t))
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

  const getLogoUrl = (logoUrl) => {
    if (!logoUrl) return null
    if (logoUrl.startsWith('uploads/')) {
      return `/api/companies/logo?path=${encodeURIComponent(logoUrl)}`
    }
    return logoUrl
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
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
      setLogoPreview(null)
      
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

      const response = await api.post('/department', departmentFormData)
      logSuccessDetails(response, 'Department added', { name: departmentFormData.name })
      
      setSuccess(t('companyEdit.departmentAdded'))
      setDepartmentFormData({ name: '', description: '' })
      
      await fetchDepartments()
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

      const response = await api.put(`/department/${editingDepartment.id}`, departmentFormData)
      logSuccessDetails(response, 'Department updated', { id: editingDepartment.id, name: departmentFormData.name })
      
      setSuccess(t('companyEdit.departmentUpdated'))
      setEditingDepartment(null)
      setDepartmentFormData({ name: '', description: '' })
      
      await fetchDepartments()
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
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(getErrorMessage(err, t('companyEdit.failedToDeleteDepartment'), '', t))
      }
    }
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('companyEdit.title')}
        </Typography>
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

      <Paper sx={{ p: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={t('companyEdit.companyInfo')} icon={<BusinessIcon />} iconPosition="start" />
          <Tab label={t('companyEdit.hrManagement')} icon={<AddIcon />} iconPosition="start" />
          <Tab label={t('companyEdit.departmentManagement')} icon={<AddIcon />} iconPosition="start" />
        </Tabs>

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
                      {(logoPreview || (company?.logoUrl && !companyLogo)) && (
                        <img
                          src={logoPreview || getLogoUrl(company?.logoUrl)}
                          alt="Company logo"
                          style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '4px', objectFit: 'contain' }}
                          onError={(e) => {
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
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={editingDepartment ? handleEditDepartment : handleAddDepartment}
                    disabled={departmentLoading}
                    startIcon={<Save />}
                  >
                    {departmentLoading ? (editingDepartment ? t('companyEdit.updating') : t('companyEdit.adding')) : (editingDepartment ? t('companyEdit.updateDepartment') : t('companyEdit.addDepartment'))}
                  </Button>
                  {editingDepartment && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingDepartment(null)
                        setDepartmentFormData({ name: '', description: '' })
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
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('companyEdit.name')}</TableCell>
                      <TableCell>{t('companyEdit.description')}</TableCell>
                      <TableCell>{t('companyEdit.status')}</TableCell>
                      <TableCell align="right">{t('employees.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell>{dept.name}</TableCell>
                        <TableCell>{dept.description || '-'}</TableCell>
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
                              setDepartmentFormData({
                                name: dept.name || '',
                                description: dept.description || ''
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
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default CompanyEdit

