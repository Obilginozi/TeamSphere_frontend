import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { getErrorMessage } from '../utils/errorHandler'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  InputAdornment,
  Alert,
  Tooltip,
  Avatar,
  Divider,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Search,
  Business as BusinessIcon,
  People as PeopleIcon,
  Domain as DomainIcon,
  CreditCard as CreditCardIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import axios from 'axios'
import ValidatedTextField from '../components/ValidatedTextField'
import ValidatedSelect from '../components/ValidatedSelect'
import { fieldValidations, validationRules } from '../utils/validation'

const CompanyManagement = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [companies, setCompanies] = useState([])
  const [departments, setDepartments] = useState([])
  const [hrUsers, setHrUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deptLoading, setDeptLoading] = useState(false)
  const [hrLoading, setHrLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [selectedCompanyForDept, setSelectedCompanyForDept] = useState(null)
  const [selectedCompanyForHR, setSelectedCompanyForHR] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [showHRForm, setShowHRForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [editingHRUser, setEditingHRUser] = useState(null)

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchCompanies()
    }
  }, [user])

  useEffect(() => {
    if (selectedCompanyForDept) {
      fetchDepartments(selectedCompanyForDept)
    } else {
      setDepartments([])
    }
  }, [selectedCompanyForDept])

  useEffect(() => {
    if (selectedCompanyForHR) {
      fetchHRUsers(selectedCompanyForHR)
    } else {
      setHrUsers([])
    }
  }, [selectedCompanyForHR])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await api.get('/companies')
      setCompanies(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCompanies()
      return
    }

    try {
      const response = await api.get(`/companies/search?q=${encodeURIComponent(searchTerm)}`)
      setCompanies(response.data.data || [])
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleCreateCompany = async (companyData) => {
    try {
      await api.post('/companies', companyData)
      fetchCompanies()
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create company:', error)
      alert(getErrorMessage(error, 'Failed to create company'))
    }
  }

  const handleUpdateCompany = async (id, companyData) => {
    try {
      await api.put(`/companies/${id}`, companyData)
      fetchCompanies()
      setEditingCompany(null)
    } catch (error) {
      console.error('Failed to update company:', error)
      alert(getErrorMessage(error, 'Failed to update company'))
    }
  }

  const handleDeleteCompany = async (id) => {
    const confirmMessage = t('company.confirmDelete') || 'Are you sure you want to delete this company?'
    if (window.confirm(confirmMessage)) {
      try {
        await api.delete(`/companies/${id}`)
        fetchCompanies()
      } catch (error) {
        console.error('Failed to delete company:', error)
        alert(getErrorMessage(error, 'Failed to delete company'))
      }
    }
  }

  const handleUpdateSubscription = async (id, subscriptionPlan) => {
    try {
      await api.put(`/companies/${id}/subscription`, { subscriptionPlan })
      fetchCompanies()
    } catch (error) {
      console.error('Failed to update subscription:', error)
      alert(getErrorMessage(error, 'Failed to update subscription'))
    }
  }

  // Helper function to make API calls with specific company ID
  const apiWithCompany = (companyId) => {
    const apiInstance = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    apiInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        if (companyId) {
          config.headers['X-Company-Id'] = companyId.toString()
        }
      }
      return config
    })
    
    return apiInstance
  }

  const fetchDepartments = async (companyId) => {
    if (!companyId) {
      setDepartments([])
      return
    }
    try {
      setDeptLoading(true)
      const apiInstance = apiWithCompany(companyId)
      const response = await apiInstance.get('/department')
      setDepartments(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
      setDepartments([])
    } finally {
      setDeptLoading(false)
    }
  }

  const fetchHRUsers = async (companyId) => {
    if (!companyId) {
      setHrUsers([])
      return
    }
    try {
      setHrLoading(true)
      const apiInstance = apiWithCompany(companyId)
      const response = await apiInstance.get('/users/hr-users')
      setHrUsers(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch HR users:', error)
      setHrUsers([])
    } finally {
      setHrLoading(false)
    }
  }

  const handleCreateDepartment = async (deptData) => {
    if (!selectedCompanyForDept) {
      alert('Please select a company first')
      return
    }
    try {
      const apiInstance = apiWithCompany(selectedCompanyForDept)
      await apiInstance.post('/department', deptData)
      fetchDepartments(selectedCompanyForDept)
      setShowDeptForm(false)
    } catch (error) {
      console.error('Failed to create department:', error)
      alert(getErrorMessage(error, 'Failed to create department'))
    }
  }

  const handleUpdateDepartment = async (id, deptData) => {
    if (!selectedCompanyForDept) {
      alert('Please select a company first')
      return
    }
    try {
      const apiInstance = apiWithCompany(selectedCompanyForDept)
      await apiInstance.put(`/department/${id}`, deptData)
      fetchDepartments(selectedCompanyForDept)
      setEditingDepartment(null)
    } catch (error) {
      console.error('Failed to update department:', error)
      alert(getErrorMessage(error, 'Failed to update department'))
    }
  }

  const handleDeleteDepartment = async (id) => {
    if (!selectedCompanyForDept) {
      alert('Please select a company first')
      return
    }
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        const apiInstance = apiWithCompany(selectedCompanyForDept)
        await apiInstance.delete(`/department/${id}`)
        fetchDepartments(selectedCompanyForDept)
      } catch (error) {
        console.error('Failed to delete department:', error)
        alert(getErrorMessage(error, 'Failed to delete department'))
      }
    }
  }

  const handleCreateHRUser = async (hrData) => {
    if (!selectedCompanyForHR) {
      alert('Please select a company first')
      return
    }
    try {
      const apiInstance = apiWithCompany(selectedCompanyForHR)
      await apiInstance.post('/users/hr-users', hrData)
      fetchHRUsers(selectedCompanyForHR)
      setShowHRForm(false)
    } catch (error) {
      console.error('Failed to create HR user:', error)
      alert(getErrorMessage(error, 'Failed to create HR user'))
    }
  }

  const handleUpdateHRUser = async (id, hrData) => {
    if (!selectedCompanyForHR) {
      alert('Please select a company first')
      return
    }
    try {
      const apiInstance = apiWithCompany(selectedCompanyForHR)
      await apiInstance.put(`/users/${id}`, hrData)
      fetchHRUsers(selectedCompanyForHR)
      setEditingHRUser(null)
    } catch (error) {
      console.error('Failed to update HR user:', error)
      alert(getErrorMessage(error, 'Failed to update HR user'))
    }
  }

  const handleDeleteHRUser = async (id) => {
    if (!selectedCompanyForHR) {
      alert('Please select a company first')
      return
    }
    if (window.confirm('Are you sure you want to delete this HR user?')) {
      try {
        const apiInstance = apiWithCompany(selectedCompanyForHR)
        await apiInstance.delete(`/users/${id}`)
        fetchHRUsers(selectedCompanyForHR)
      } catch (error) {
        console.error('Failed to delete HR user:', error)
        alert(getErrorMessage(error, 'Failed to delete HR user'))
      }
    }
  }

  const getSubscriptionColor = (plan) => {
    switch (plan) {
      case 'UNLIMITED':
        return 'secondary'
      case 'ENTERPRISE_150':
        return 'primary'
      case 'BUSINESS_100':
        return 'info'
      case 'GROWTH_50':
        return 'success'
      default:
        return 'default'
    }
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">{t('common.error') || 'Error'}</Typography>
          <Typography>{t('common.unauthorized') || 'You are not authorized to access this page.'}</Typography>
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Company Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage companies, subscriptions, and departments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/company-setup')}
          sx={{ minWidth: 160 }}
        >
          {t('company.createCompany') || 'Create Company'}
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue)
            // Reset selected companies when switching tabs
            if (newValue === 1) {
              setSelectedCompanyForDept(null)
            } else if (newValue === 2) {
              setSelectedCompanyForHR(null)
            }
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Companies" icon={<BusinessIcon />} iconPosition="start" />
          <Tab label="Departments" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="HR Users" icon={<PeopleIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Box>
          {/* Search Bar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                placeholder={t('company.searchCompanies') || 'Search companies by name, email, or domain...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={fetchCompanies} size="small">
                        <RefreshIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
          </Card>

          {/* Companies Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subscription</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Employees</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'No companies found' : 'No companies available'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Try adjusting your search terms' : 'Create your first company to get started'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {company.name}
                            </Typography>
                            {company.domain && (
                              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                <DomainIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {company.domain}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{company.contactEmail}</Typography>
                          </Box>
                          {company.phone && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {company.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={company.subscriptionPlan?.replace(/_/g, ' ') || 'N/A'}
                          color={getSubscriptionColor(company.subscriptionPlan)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {company.currentEmployeeCount} / {company.maxEmployees === -1 ? '∞' : company.maxEmployees}
                          </Typography>
                          {company.maxEmployees !== -1 && (
                            <LinearProgress
                              variant="determinate"
                              value={(company.currentEmployeeCount / company.maxEmployees) * 100}
                              color={
                                (company.currentEmployeeCount / company.maxEmployees) > 0.9 ? 'error' :
                                (company.currentEmployeeCount / company.maxEmployees) > 0.7 ? 'warning' : 'success'
                              }
                              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={company.isActive ? 'Active' : 'Inactive'}
                          color={company.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Tooltip title="Edit Company">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setEditingCompany(company)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Company">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCompany(company.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2} flex={1}>
              <Typography variant="h6">Departments</Typography>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel>Select Company</InputLabel>
                <Select
                  value={selectedCompanyForDept || ''}
                  onChange={(e) => setSelectedCompanyForDept(e.target.value)}
                  label="Select Company"
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<Add />}
              onClick={() => {
                if (!selectedCompanyForDept) {
                  alert('Please select a company first')
                  return
                }
                setEditingDepartment(null)
                setShowDeptForm(true)
              }}
              disabled={!selectedCompanyForDept}
            >
              Add Department
            </Button>
          </Box>

          {deptLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No departments found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Create your first department to get started
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => {
                            setEditingDepartment(null)
                            setShowDeptForm(true)
                          }}
                        >
                          Add Department
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight={500}>
                            {dept.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {dept.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={dept.isActive ? 'Active' : 'Inactive'}
                            color={dept.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" gap={1} justifyContent="flex-end">
                            <Tooltip title="Edit Department">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setEditingDepartment(dept)
                                  setShowDeptForm(true)
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Department">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteDepartment(dept.id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2} flex={1}>
              <Typography variant="h6">HR Users</Typography>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel>Select Company</InputLabel>
                <Select
                  value={selectedCompanyForHR || ''}
                  onChange={(e) => setSelectedCompanyForHR(e.target.value)}
                  label="Select Company"
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<Add />}
              onClick={() => {
                if (!selectedCompanyForHR) {
                  alert('Please select a company first')
                  return
                }
                setEditingHRUser(null)
                setShowHRForm(true)
              }}
              disabled={!selectedCompanyForHR}
            >
              Add HR User
            </Button>
          </Box>

          {hrLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!selectedCompanyForHR ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Select a Company
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Please select a company from the dropdown above to view and manage HR users
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : hrUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No HR users found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Create your first HR user for {companies.find(c => c.id === selectedCompanyForHR)?.name}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => {
                            setEditingHRUser(null)
                            setShowHRForm(true)
                          }}
                        >
                          Add HR User
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    hrUsers.map((hrUser) => (
                      <TableRow key={hrUser.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight={500}>
                            {hrUser.firstName} {hrUser.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{hrUser.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {hrUser.phone || hrUser.mobile || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={hrUser.isActive ? 'Active' : 'Inactive'}
                            color={hrUser.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" gap={1} justifyContent="flex-end">
                            <Tooltip title="Edit HR User">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setEditingHRUser(hrUser)
                                  setShowHRForm(true)
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete HR User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteHRUser(hrUser.id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Create/Edit Company Dialog */}
      {(showCreateForm || editingCompany) && (
        <CompanyForm
          company={editingCompany}
          onSave={editingCompany ? handleUpdateCompany : handleCreateCompany}
          onClose={() => {
            setShowCreateForm(false)
            setEditingCompany(null)
          }}
        />
      )}

      {/* Create/Edit Department Dialog */}
      {(showDeptForm || editingDepartment) && (
        <DepartmentForm
          department={editingDepartment}
          onSave={editingDepartment ? handleUpdateDepartment : handleCreateDepartment}
          onClose={() => {
            setShowDeptForm(false)
            setEditingDepartment(null)
          }}
        />
      )}

      {/* Create/Edit HR User Dialog */}
      {(showHRForm || editingHRUser) && (
        <HRUserForm
          hrUser={editingHRUser}
          companyId={selectedCompanyForHR}
          onSave={editingHRUser ? handleUpdateHRUser : handleCreateHRUser}
          onClose={() => {
            setShowHRForm(false)
            setEditingHRUser(null)
          }}
        />
      )}
    </Box>
  )
}

// Department Form Component
const DepartmentForm = ({ department, companyId, onSave, onClose }) => {
  const { t } = useLanguage()
  
  const methods = useForm({
    defaultValues: {
      name: '',
      description: '',
      isActive: true
    }
  })

  useEffect(() => {
    if (department) {
      methods.reset({
        name: department.name || '',
        description: department.description || '',
        isActive: department.isActive ?? true
      })
    } else {
      methods.reset()
    }
  }, [department, methods])

  const onSubmit = (data) => {
    onSave(department?.id, data)
    onClose()
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <FormProvider {...methods}>
        <Box component="form" onSubmit={methods.handleSubmit(onSubmit)}>
          <DialogTitle>
            {department ? 'Edit Department' : 'Add Department'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <ValidatedTextField
                  name="name"
                  label="Department Name"
                  required
                  validation={{
                    required: validationRules.required('Department name is required'),
                    minLength: validationRules.minLength(2, 'Department name must be at least 2 characters'),
                    maxLength: validationRules.maxLength(100, 'Department name must not exceed 100 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <ValidatedTextField
                  name="description"
                  label="Description"
                  multiline
                  rows={3}
                  validation={{
                    maxLength: validationRules.maxLength(500, 'Description must not exceed 500 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="isActive"
                  control={methods.control}
                  defaultValue={department?.isActive ?? true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('common.cancel') || 'Cancel'}</Button>
            <Button type="submit" variant="contained">
              {department ? (t('common.save') || 'Save') : (t('common.add') || 'Add')}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  )
}

// Company Form Component
const CompanyForm = ({ company, onSave, onClose }) => {
  const { t } = useLanguage()
  
  const methods = useForm({
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
      subscriptionPlan: 'STARTER_20',
      paymentMethod: 'STRIPE',
      isActive: true
    }
  })

  useEffect(() => {
    if (company) {
      methods.reset({
        name: company.name || '',
        description: company.description || '',
        domain: company.domain || '',
        contactEmail: company.contactEmail || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        postalCode: company.postalCode || '',
        country: company.country || '',
        subscriptionPlan: company.subscriptionPlan || 'STARTER_20',
        paymentMethod: company.paymentMethod || 'STRIPE',
        isActive: company.isActive ?? true
      })
    } else {
      methods.reset()
    }
  }, [company, methods])

  const onSubmit = (data) => {
    onSave(company?.id, data)
    onClose()
  }

  const subscriptionPlanOptions = [
    { value: 'STARTER_20', label: t('subscription.plan.starter') || 'Starter (20 employees)' },
    { value: 'GROWTH_50', label: t('subscription.plan.growth') || 'Growth (50 employees)' },
    { value: 'BUSINESS_100', label: t('subscription.plan.business') || 'Business (100 employees)' },
    { value: 'ENTERPRISE_150', label: t('subscription.plan.enterprise') || 'Enterprise (150 employees)' },
    { value: 'UNLIMITED', label: t('subscription.plan.unlimited') || 'Unlimited' }
  ]

  const paymentMethodOptions = [
    { value: 'STRIPE', label: t('payment.method.stripe') || 'Stripe' },
    { value: 'IYZICO', label: t('payment.method.iyzico') || 'Iyzico' },
    { value: 'PAYTR', label: t('payment.method.paytr') || 'PayTR' },
    { value: 'PARAM', label: t('payment.method.param') || 'Param' },
    { value: 'GARANTI_PAY', label: t('payment.method.garanti_pay') || 'Garanti Pay' },
    { value: 'WIRE_TRANSFER', label: t('payment.method.wire_transfer') || 'Wire Transfer' },
    { value: 'BANK_TRANSFER_TR', label: t('payment.method.bank_transfer_tr') || 'Bank Transfer (TR)' }
  ]

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <FormProvider {...methods}>
        <Box component="form" onSubmit={methods.handleSubmit(onSubmit)}>
          <DialogTitle>
            {company ? (t('company.editCompany') || 'Edit Company') : (t('company.createCompany') || 'Create Company')}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <ValidatedTextField
                  name="name"
                  label={t('company.companyName') || 'Company Name'}
                  required
                  validation={{
                    required: validationRules.required('Company name is required'),
                    minLength: validationRules.minLength(2, 'Company name must be at least 2 characters'),
                    maxLength: validationRules.maxLength(200, 'Company name must not exceed 200 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <ValidatedTextField
                  name="contactEmail"
                  label={t('company.contactEmail') || 'Contact Email'}
                  type="email"
                  required
                  validation={fieldValidations.email}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="domain"
                  label={t('company.domain') || 'Domain'}
                  validation={fieldValidations.domain}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="phone"
                  label={t('company.phone') || 'Phone'}
                  validation={fieldValidations.phoneOptional}
                />
              </Grid>
              
              <Grid item xs={12}>
                <ValidatedTextField
                  name="address"
                  label={t('company.address') || 'Address'}
                  multiline
                  rows={2}
                  validation={{
                    maxLength: validationRules.maxLength(200, 'Address must not exceed 200 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <ValidatedTextField
                  name="city"
                  label={t('company.city') || 'City'}
                  validation={{
                    maxLength: validationRules.maxLength(100, 'City must not exceed 100 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <ValidatedTextField
                  name="state"
                  label={t('company.state') || 'State'}
                  validation={{
                    maxLength: validationRules.maxLength(50, 'State must not exceed 50 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <ValidatedTextField
                  name="postalCode"
                  label={t('company.postalCode') || 'Postal Code'}
                  validation={fieldValidations.postalCode}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="country"
                  label={t('company.country') || 'Country'}
                  validation={{
                    maxLength: validationRules.maxLength(50, 'Country must not exceed 50 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedSelect
                  name="subscriptionPlan"
                  label={t('company.subscriptionPlan') || 'Subscription Plan'}
                  options={subscriptionPlanOptions}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedSelect
                  name="paymentMethod"
                  label={t('company.paymentMethod') || 'Payment Method'}
                  options={paymentMethodOptions}
                />
              </Grid>
              
              <Grid item xs={12}>
                <ValidatedTextField
                  name="description"
                  label={t('company.description') || 'Description'}
                  multiline
                  rows={3}
                  validation={{
                    maxLength: validationRules.maxLength(500, 'Description must not exceed 500 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="isActive"
                  control={methods.control}
                  defaultValue={company?.isActive ?? true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label={t('company.isActive') || 'Active'}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('common.cancel') || 'Cancel'}</Button>
            <Button type="submit" variant="contained">
              {company ? (t('common.save') || 'Save') : (t('common.add') || 'Add')}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  )
}

// HR User Form Component
const HRUserForm = ({ hrUser, companyId, onSave, onClose }) => {
  const { t } = useLanguage()
  
  const methods = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isActive: true
    }
  })

  useEffect(() => {
    if (hrUser) {
      methods.reset({
        firstName: hrUser.firstName || '',
        lastName: hrUser.lastName || '',
        email: hrUser.email || '',
        password: '', // Don't pre-fill password
        phone: hrUser.phone || '',
        mobile: hrUser.mobile || '',
        address: hrUser.address || '',
        city: hrUser.city || '',
        state: hrUser.state || '',
        postalCode: hrUser.postalCode || '',
        country: hrUser.country || '',
        isActive: hrUser.isActive ?? true
      })
    } else {
      methods.reset()
    }
  }, [hrUser, methods])

  const onSubmit = (data) => {
    // Only include password if creating new user or if password is provided
    const submitData = { ...data }
    if (hrUser && !submitData.password) {
      delete submitData.password // Don't send empty password on update
    }
    onSave(hrUser?.id, submitData)
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <FormProvider {...methods}>
        <Box component="form" onSubmit={methods.handleSubmit(onSubmit)}>
          <DialogTitle>
            {hrUser ? 'Edit HR User' : 'Add HR User'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="firstName"
                  label="First Name"
                  required
                  validation={{
                    required: validationRules.required('First name is required'),
                    minLength: validationRules.minLength(2, 'First name must be at least 2 characters'),
                    maxLength: validationRules.maxLength(50, 'First name must not exceed 50 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="lastName"
                  label="Last Name"
                  required
                  validation={{
                    required: validationRules.required('Last name is required'),
                    minLength: validationRules.minLength(2, 'Last name must be at least 2 characters'),
                    maxLength: validationRules.maxLength(50, 'Last name must not exceed 50 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="email"
                  label="Email"
                  type="email"
                  required
                  validation={fieldValidations.email}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="password"
                  label={hrUser ? 'New Password (leave blank to keep current)' : 'Password'}
                  type="password"
                  required={!hrUser}
                  validation={hrUser ? {} : fieldValidations.password}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="phone"
                  label="Phone"
                  validation={fieldValidations.phoneOptional}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="mobile"
                  label="Mobile"
                  validation={fieldValidations.phoneOptional}
                />
              </Grid>
              
              <Grid item xs={12}>
                <ValidatedTextField
                  name="address"
                  label="Address"
                  multiline
                  rows={2}
                  validation={{
                    maxLength: validationRules.maxLength(200, 'Address must not exceed 200 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <ValidatedTextField
                  name="city"
                  label="City"
                  validation={{
                    maxLength: validationRules.maxLength(100, 'City must not exceed 100 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <ValidatedTextField
                  name="state"
                  label="State"
                  validation={{
                    maxLength: validationRules.maxLength(50, 'State must not exceed 50 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <ValidatedTextField
                  name="postalCode"
                  label="Postal Code"
                  validation={fieldValidations.postalCode}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  name="country"
                  label="Country"
                  validation={{
                    maxLength: validationRules.maxLength(50, 'Country must not exceed 50 characters')
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="isActive"
                  control={methods.control}
                  defaultValue={hrUser?.isActive ?? true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('common.cancel') || 'Cancel'}</Button>
            <Button type="submit" variant="contained">
              {hrUser ? (t('common.save') || 'Save') : (t('common.add') || 'Add')}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  )
}

export default CompanyManagement
