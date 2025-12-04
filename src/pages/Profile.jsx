import React, { useState, useEffect, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { getErrorMessage } from '../utils/errorHandler'
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
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
import { Person, Edit, Save, Cancel, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import ValidatedTextField from '../components/ValidatedTextField'
import ValidatedDatePicker from '../components/ValidatedDatePicker'
import { fieldValidations, validationRules } from '../utils/validation'

const Profile = () => {
  const { user, setUser, selectedCompanyId } = useAuth()
  const { t, i18n } = useTranslation()
  const [openDialog, setOpenDialog] = useState(false)
  
  // Wrapper for setOpenDialog to prevent accidental closes
  const setOpenDialogSafe = (value) => {
    if (value === false && shouldKeepDialogOpenRef.current) {
      // Don't close if ref says it should stay open (unless explicitly cancelled)
      return
    }
    setOpenDialog(value)
  }
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [companyTab, setCompanyTab] = useState(0)
  const [company, setCompany] = useState(null)
  const [hrUsers, setHrUsers] = useState([])
  const [hrFormData, setHrFormData] = useState({
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
    country: ''
  })
  const [hrLoading, setHrLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    description: ''
  })
  const [departmentLoading, setDepartmentLoading] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [companyLogo, setCompanyLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [employeeData, setEmployeeData] = useState(null)
  const [employeeLoading, setEmployeeLoading] = useState(false)
  const [hasFetchedEmployee, setHasFetchedEmployee] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [profilePictureObjectUrl, setProfilePictureObjectUrl] = useState(null)
  
  // Use ref to track if dialog should stay open (prevents state loss during re-renders)
  const shouldKeepDialogOpenRef = useRef(false)
  
  const methods = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      position: '',
      department: '',
      hireDate: '',
      idCardNumber: '',
      birthDate: '',
      emergencyContact: ''
    }
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

  const [hasFetchedProfile, setHasFetchedProfile] = useState(false)
  const [hasFetchedCompany, setHasFetchedCompany] = useState(false)

  useEffect(() => {
    // Fetch full user profile from backend (only once)
    if (user && !hasFetchedProfile) {
      fetchUserProfile(true) // Skip form reset on initial load
      setHasFetchedProfile(true)
    }
    
    // Fetch company data for HR users only (not admins)
    if (user && user.role === 'HR' && !hasFetchedCompany) {
      fetchCompany(true) // Skip form reset on initial load
      setHasFetchedCompany(true)
    }
    
    // Fetch employee data for employees (only once)
    if (user && user.role === 'EMPLOYEE' && !hasFetchedEmployee) {
      fetchEmployeeData()
      setHasFetchedEmployee(true)
    }
    
    // Fetch profile picture as blob if user has one
    if (user?.profilePictureUrl) {
      fetchProfilePictureAsBlob(user.profilePictureUrl)
    }
    
    // Cleanup function
    return () => {
      setProfilePictureObjectUrl(prevUrl => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl)
        }
        return null
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, user?.profilePictureUrl])
  
  // Debug: Log when dialog state changes
  useEffect(() => {
    // CRITICAL: If dialog closed but ref says it should be open, restore it
    // Don't check loading state - restore immediately if ref says it should be open
    if (!openDialog && shouldKeepDialogOpenRef.current) {
      // Use multiple strategies to ensure restoration
      setOpenDialogSafe(true)
      setTimeout(() => {
        if (shouldKeepDialogOpenRef.current) {
          setOpenDialogSafe(true)
        }
      }, 0)
    }
  }, [openDialog, loading, error, user?.role])
  
  const fetchUserProfile = async (skipFormReset = false) => {
    try {
      const response = await api.get('/users/profile')
      const userData = response.data.data
      
      // Fetch profile picture as blob if user has one
      if (userData?.profilePictureUrl) {
        await fetchProfilePictureAsBlob(userData.profilePictureUrl)
      }
      
      // Update user context with full profile data only if it actually changed
      // Use a ref to track if we're in the middle of editing to prevent dialog from closing
      const wasEditing = openDialog
      
      setUser(prevUser => {
        // Check if data actually changed to avoid infinite loops
        if (prevUser && 
            prevUser.firstName === userData?.firstName && 
            prevUser.lastName === userData?.lastName &&
            prevUser.email === userData?.email) {
          return prevUser // No change, return previous user to avoid re-render
        }
        return {
          ...prevUser,
          ...userData
        }
      })
      
      // Ensure dialog stays open after user update
      if (wasEditing) {
        // Use setTimeout to ensure this runs after the state update
        setTimeout(() => {
          setOpenDialog(true)
        }, 0)
      }
      
      // Only reset form if dialog is not open and skipFormReset is false
      // We check openDialog state directly - if it's true, the form was already populated in handleEditClick
      if (!skipFormReset && !openDialog) {
        // For employees, also use employee data if available
        let resetEmployeeFields = {}
        if (user?.role === 'EMPLOYEE' && employeeData) {
          resetEmployeeFields = {
            idCardNumber: employeeData?.idCardNumber || '',
            birthDate: employeeData?.birthDate || '',
            emergencyContact: employeeData?.emergencyContact || '',
            mobile: employeeData?.mobile || userData?.mobile || '',
            address: employeeData?.address || userData?.address || '',
            position: employeeData?.position || userData?.position || '',
            department: employeeData?.department?.name || userData?.department || '',
            hireDate: employeeData?.hireDate || userData?.hireDate || ''
          }
        }
        methods.reset({
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
          mobile: resetEmployeeFields.mobile || userData?.mobile || '',
          address: resetEmployeeFields.address || userData?.address || '',
          city: userData?.city || '',
          state: userData?.state || '',
          postalCode: userData?.postalCode || '',
          country: userData?.country || '',
          position: resetEmployeeFields.position || userData?.position || '',
          department: resetEmployeeFields.department || userData?.department || '',
          hireDate: resetEmployeeFields.hireDate || userData?.hireDate || '',
          idCardNumber: resetEmployeeFields.idCardNumber || '',
          birthDate: resetEmployeeFields.birthDate || '',
          emergencyContact: resetEmployeeFields.emergencyContact || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      // Fallback to basic user data from context
      if (user && !skipFormReset && !openDialog) {
        methods.reset({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          mobile: user?.mobile || '',
          address: user?.address || '',
          city: user?.city || '',
          state: user?.state || '',
          postalCode: user?.postalCode || '',
          country: user?.country || '',
          position: user?.position || '',
          department: user?.department || '',
          hireDate: user?.hireDate || '',
          idCardNumber: '',
          birthDate: '',
          emergencyContact: ''
        })
      }
    }
  }

  const fetchEmployeeData = async () => {
    // Only fetch employee data if user is an EMPLOYEE
    if (user?.role !== 'EMPLOYEE') {
      setEmployeeLoading(false)
      return
    }
    
    try {
      setEmployeeLoading(true)
      const response = await api.get('/employee/me')
      if (response.data && response.data.data) {
        setEmployeeData(response.data.data)
        if (process.env.NODE_ENV === 'development') {
        }
      }
    } catch (error) {
      // Only log error if it's not a 404 or "not found" error
      if (error.response?.status !== 404 && !error.message?.includes('not found')) {
        console.error('Failed to fetch employee data:', error)
      }
      // Don't show error to user, just log it - user might not have an employee record yet
      setEmployeeData(null)
    } finally {
      setEmployeeLoading(false)
    }
  }

  const fetchCompany = async (skipFormReset = false) => {
    try {
      setCompanyLoading(true)
      setError(null)
      // The backend will use the selected company ID from X-Company-Id header (set in api.js interceptor)
      const response = await api.get('/companies/my-company')
      
      if (response.data && response.data.data) {
        setCompany(response.data.data)
        
        // Only reset form if dialog is not open and skipFormReset is false
        if (!skipFormReset && !openCompanyDialog) {
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
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
        }
        setError(t('profile.invalidResponseFormat'))
        setCompany(null)
      }
    } catch (error) {
      // getErrorMessage already logs detailed error info, so we don't need to log again here
      const errorMessage = getErrorMessage(error, t('profile.failedToLoadCompany'), '', t)
      setError(errorMessage)
      // Set company to null to show error state
      setCompany(null)
    } finally {
      setCompanyLoading(false)
    }
  }

  const handleEditCompanyClick = async () => {
    setError(null)
    setCompanyTab(0) // Reset to first tab
    
    // Fetch latest company data to ensure we have all fields
    // The backend will use the selected company ID from X-Company-Id header (set in api.js interceptor)
    try {
      const response = await api.get('/companies/my-company')
      const companyData = response.data.data
      setCompany(companyData)
      
      // Populate form with fetched company data
      companyMethods.reset({
        name: companyData?.name || '',
        description: companyData?.description || '',
        domain: companyData?.domain || '',
        contactEmail: companyData?.contactEmail || '',
        phone: companyData?.phone || '',
        address: companyData?.address || '',
        city: companyData?.city || '',
        state: companyData?.state || '',
        postalCode: companyData?.postalCode || '',
        country: companyData?.country || '',
        isActive: companyData?.isActive ?? true
      })
    } catch (error) {
      console.error('Failed to fetch company:', error)
      // Fallback to current company data
      if (company) {
        companyMethods.reset({
          name: company?.name || '',
          description: company?.description || '',
          domain: company?.domain || '',
          contactEmail: company?.contactEmail || '',
          phone: company?.phone || '',
          address: company?.address || '',
          city: company?.city || '',
          state: company?.state || '',
          postalCode: company?.postalCode || '',
          country: company?.country || '',
          isActive: company?.isActive ?? true
        })
      }
    }
    
    // Fetch HR users and departments when dialog opens
    fetchHRUsers()
    fetchDepartments()
    
    setOpenCompanyDialog(true)
    // Reset logo state
    setCompanyLogo(null)
    setLogoPreview(null)
    if (company?.logoUrl) {
      setLogoPreview(getLogoUrl(company.logoUrl))
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

  const handleAddDepartment = async () => {
    if (!departmentFormData.name.trim()) {
      setError(t('profile.departmentNameRequired'))
      return
    }

    try {
      setDepartmentLoading(true)
      setError(null)
      await api.post('/department', departmentFormData)
      setSuccess(t('profile.departmentCreated'))
      setDepartmentFormData({ name: '', description: '' })
      await fetchDepartments()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToCreateDepartment'), '', t))
    } finally {
      setDepartmentLoading(false)
    }
  }

  const handleEditDepartment = async () => {
    if (!departmentFormData.name.trim()) {
      setError(t('profile.departmentNameRequired'))
      return
    }

    try {
      setDepartmentLoading(true)
      setError(null)
      await api.put(`/department/${editingDepartment.id}`, departmentFormData)
      setSuccess(t('profile.departmentUpdated'))
      setDepartmentFormData({ name: '', description: '' })
      setEditingDepartment(null)
      await fetchDepartments()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToUpdateDepartment'), '', t))
    } finally {
      setDepartmentLoading(false)
    }
  }

  const handleDeleteDepartment = async (id) => {
    if (window.confirm(t('profile.confirmDeleteDepartment'))) {
      try {
        setError(null)
        await api.delete(`/department/${id}`)
        setSuccess(t('profile.departmentDeleted'))
        await fetchDepartments()
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(getErrorMessage(err, t('profile.failedToDeleteDepartment'), '', t))
      }
    }
  }

  const handleAddHRUser = async () => {
    try {
      if (!hrFormData.firstName || !hrFormData.lastName || !hrFormData.email || !hrFormData.password) {
        setError(t('profile.pleaseFillRequiredFields'))
        return
      }

      setHrLoading(true)
      setError(null)

      const response = await api.post('/users/hr-users', hrFormData)
      setSuccess(t('profile.hrUserAddedSuccessfully'))
      
      // Reset form
      setHrFormData({
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
        country: ''
      })
      
      // Refresh HR users list
      await fetchHRUsers()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToAddHR'), '', t))
    } finally {
      setHrLoading(false)
    }
  }

  const onCompanySubmit = async (data) => {
    try {
      setCompanyLoading(true)
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
      
      // The backend will use the selected company ID from X-Company-Id header (set in api.js interceptor)
      const response = await api.put('/companies/my-company', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setCompany(response.data.data)
      setSuccess(t('profile.companyUpdatedSuccessfully'))
      setOpenCompanyDialog(false)
      setCompanyLogo(null)
      setLogoPreview(null)
      
      // Fetch updated company data after dialog closes
      await fetchCompany(true)
      
      // Dispatch event to notify other components (like Layout) that company was updated
      window.dispatchEvent(new CustomEvent('companyUpdated'))
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToUpdateCompany'), '', t))
    } finally {
      setCompanyLoading(false)
    }
  }
  
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setCompanyLogo(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setLogoPreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setError(t('profile.pleaseSelectImageFile'))
      }
    }
  }
  
  const getLogoUrl = (logoUrl) => {
    if (!logoUrl) return null
    if (logoUrl.startsWith('uploads/')) {
      return `/api/companies/logo?path=${encodeURIComponent(logoUrl)}`
    }
    return logoUrl
  }

  // Fetch profile picture as blob to handle authentication
  const fetchProfilePictureAsBlob = async (pictureUrl) => {
    // Clean up old object URL
    setProfilePictureObjectUrl(prevUrl => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl)
      }
      return null
    })
    
    if (pictureUrl && pictureUrl.startsWith('uploads/')) {
      const url = `/users/profile/picture?path=${encodeURIComponent(pictureUrl)}`
      try {
        const response = await api.get(url, {
          responseType: 'blob'
        })
        if (response.data && response.data.size > 0) {
          const blob = new Blob([response.data], { type: response.data.type || 'image/png' })
          const objectUrl = URL.createObjectURL(blob)
          setProfilePictureObjectUrl(objectUrl)
        }
      } catch (fetchError) {
        console.error('Failed to fetch profile picture as blob:', fetchError)
        // Don't set profilePictureObjectUrl, will show initials instead
      }
    }
  }

  const getProfilePictureUrl = (pictureUrl) => {
    // Return blob URL if available, otherwise return null (will show initials)
    if (profilePictureObjectUrl) {
      return profilePictureObjectUrl
    }
    // Don't return direct URL as it won't work with authentication
    return null
  }

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('profile.pleaseSelectImageFile'))
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('profile.imageSizeMustBeLessThan5MB'))
        return
      }
      
      setProfilePicture(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result)
      }
      reader.readAsDataURL(file)
      
      // Upload immediately
      try {
        setUploadingPicture(true)
        setError(null)
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await api.post('/users/profile/picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.data && response.data.data) {
          const newPictureUrl = response.data.data
          // Update user context with new profile picture URL
          setUser(prevUser => ({
            ...prevUser,
            profilePictureUrl: newPictureUrl
          }))
          // Fetch the new picture as blob
          await fetchProfilePictureAsBlob(newPictureUrl)
          setSuccess(t('profile.profilePictureUploadedSuccessfully'))
          setTimeout(() => setSuccess(null), 3000)
          
          // Dispatch event to notify other components (like Layout) to refresh profile picture
          window.dispatchEvent(new CustomEvent('profilePictureUpdated'))
        }
      } catch (err) {
        setError(getErrorMessage(err, t('profile.failedToUploadProfilePicture'), '', t))
        setProfilePicture(null)
        setProfilePicturePreview(null)
      } finally {
        setUploadingPicture(false)
      }
    }
  }

  const handleCompanyCancel = () => {
    if (company) {
      companyMethods.reset({
        name: company?.name || '',
        description: company?.description || '',
        domain: company?.domain || '',
        contactEmail: company?.contactEmail || '',
        phone: company?.phone || '',
        address: company?.address || '',
        city: company?.city || '',
        state: company?.state || '',
        postalCode: company?.postalCode || '',
        country: company?.country || '',
        isActive: company?.isActive ?? true
      })
    }
    setCompanyTab(0)
    setOpenCompanyDialog(false)
    setError(null)
    setHrFormData({
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
      country: ''
    })
  }

  const handleEditClick = async () => {
    // Reset to first tab
    setActiveTab(0)
    setError(null)
    setProfilePicture(null)
    setProfilePicturePreview(null)
    
    // Open dialog immediately so user sees it's loading
    // This must be called synchronously before any async operations
    shouldKeepDialogOpenRef.current = true
    setOpenDialogSafe(true)
    setLoading(true)
    
    try {
      // Fetch latest user profile to ensure we have all fields
      const response = await api.get('/users/profile')
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from server')
      }
      const userData = response.data.data
      
      // For employees, fetch employee data if not already available
      let currentEmployeeData = employeeData
      if (user?.role === 'EMPLOYEE' && !currentEmployeeData) {
        try {
          const empResponse = await api.get('/employee/me')
          if (empResponse.data && empResponse.data.data) {
            currentEmployeeData = empResponse.data.data
            setEmployeeData(currentEmployeeData)
          }
        } catch (empError) {
          // Only log error if it's not a 404 or "not found" error
          if (empError.response?.status !== 404 && !empError.message?.includes('not found')) {
            console.error('Failed to fetch employee data:', empError)
          }
          // Continue without employee data - user might not have an employee record yet
          currentEmployeeData = null
        }
      }
      
      // Build employee fields if user is an employee
      let employeeFields = {}
      if (user?.role === 'EMPLOYEE') {
        if (currentEmployeeData) {
          employeeFields = {
            idCardNumber: currentEmployeeData?.idCardNumber || '',
            birthDate: currentEmployeeData?.birthDate || '',
            emergencyContact: currentEmployeeData?.emergencyContact || '',
            mobile: currentEmployeeData?.mobile || userData?.mobile || '',
            address: currentEmployeeData?.address || userData?.address || '',
            position: currentEmployeeData?.position || userData?.position || '',
            department: currentEmployeeData?.department?.name || userData?.department || '',
            hireDate: currentEmployeeData?.hireDate || userData?.hireDate || ''
          }
        } else {
          // If no employee data, use user data as fallback
          employeeFields = {
            idCardNumber: '',
            birthDate: '',
            emergencyContact: '',
            mobile: userData?.mobile || '',
            address: userData?.address || '',
            position: userData?.position || '',
            department: userData?.department || '',
            hireDate: userData?.hireDate || ''
          }
        }
      }
      
      // Populate form with fetched user data
      const formData = {
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        mobile: employeeFields.mobile || userData?.mobile || '',
        address: employeeFields.address || userData?.address || '',
        city: userData?.city || '',
        state: userData?.state || '',
        postalCode: userData?.postalCode || '',
        country: userData?.country || '',
        position: employeeFields.position || userData?.position || '',
        department: employeeFields.department || userData?.department || '',
        hireDate: employeeFields.hireDate || userData?.hireDate || '',
        idCardNumber: employeeFields.idCardNumber || '',
        birthDate: employeeFields.birthDate || '',
        emergencyContact: employeeFields.emergencyContact || ''
      }
      methods.reset(formData)
      
      // Fetch profile picture as blob if user has one
      if (userData?.profilePictureUrl) {
        await fetchProfilePictureAsBlob(userData.profilePictureUrl)
      }
      
      // CRITICAL: DO NOT call setUser here in handleEditClick!
      // setUser triggers useEffect([user, user?.profilePictureUrl]) which can cause re-renders
      // that reset the dialog state. The form is already populated with the latest data,
      // so we don't need to update user context here. We'll update it only when form is submitted.
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      // Ensure dialog stays open even on error
      shouldKeepDialogOpenRef.current = true
      setOpenDialogSafe(true)
      setError(t('profile.failedToLoadProfileData'))
      
      // Fallback to current user data from context
      let fallbackEmployeeFields = {}
      if (user?.role === 'EMPLOYEE') {
        if (employeeData) {
          fallbackEmployeeFields = {
            idCardNumber: employeeData?.idCardNumber || '',
            birthDate: employeeData?.birthDate || '',
            emergencyContact: employeeData?.emergencyContact || '',
            mobile: employeeData?.mobile || user?.mobile || '',
            address: employeeData?.address || user?.address || '',
            position: employeeData?.position || user?.position || '',
            department: employeeData?.department?.name || user?.department || '',
            hireDate: employeeData?.hireDate || user?.hireDate || ''
          }
        } else {
          // If no employee data, use empty values for employee-specific fields
          fallbackEmployeeFields = {
            idCardNumber: '',
            birthDate: '',
            emergencyContact: '',
            mobile: user?.mobile || '',
            address: user?.address || '',
            position: user?.position || '',
            department: user?.department || '',
            hireDate: user?.hireDate || ''
          }
        }
      }
      
      // Ensure we have user data before resetting form
      if (user) {
        methods.reset({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          mobile: fallbackEmployeeFields.mobile || user?.mobile || '',
          address: fallbackEmployeeFields.address || user?.address || '',
          city: user?.city || '',
          state: user?.state || '',
          postalCode: user?.postalCode || '',
          country: user?.country || '',
          position: fallbackEmployeeFields.position || user?.position || '',
          department: fallbackEmployeeFields.department || user?.department || '',
          hireDate: fallbackEmployeeFields.hireDate || user?.hireDate || '',
          idCardNumber: fallbackEmployeeFields.idCardNumber || '',
          birthDate: fallbackEmployeeFields.birthDate || '',
          emergencyContact: fallbackEmployeeFields.emergencyContact || ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError(null)
      
      // For employees, include employee-specific fields
      // For non-employees, remove position, department, hireDate, and employee fields
      let userData
      if (user?.role === 'EMPLOYEE') {
        // Include employee fields: idCardNumber, birthDate, emergencyContact
        const { position, department, hireDate, ...rest } = data
        userData = rest // Keep idCardNumber, birthDate, emergencyContact
      } else {
        // Remove position, department, hireDate, and employee fields
        const { position, department, hireDate, idCardNumber, birthDate, emergencyContact, ...rest } = data
        userData = rest
      }
      
      const response = await api.put('/users/profile', userData)
      
      // For employees, check if a pending change request was created
      if (user?.role === 'EMPLOYEE' && response.data && response.data.message && 
          response.data.message.includes('reviewed by HR')) {
        setSuccess(t('profile.changeRequestSubmitted') || 'Profile change request submitted successfully. It will be reviewed by HR.')
        shouldKeepDialogOpenRef.current = false
        setOpenDialogSafe(false)
        setActiveTab(0)
      } else {
        // For HR/Admin, update directly
        // Fetch updated profile and employee data to get all fields (skip form reset since dialog is closing)
        await fetchUserProfile(true)
        if (user?.role === 'EMPLOYEE') {
          await fetchEmployeeData()
        }
        
        setSuccess(t('profile.profileUpdatedSuccessfully'))
        shouldKeepDialogOpenRef.current = false
        setOpenDialogSafe(false)
        setActiveTab(0)
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToUpdate'), '', t))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    shouldKeepDialogOpenRef.current = false
    // Reset form to current user data
    if (user) {
      // For employees, also use employee data if available
      let cancelEmployeeFields = {}
      if (user?.role === 'EMPLOYEE' && employeeData) {
        cancelEmployeeFields = {
          idCardNumber: employeeData?.idCardNumber || '',
          birthDate: employeeData?.birthDate || '',
          emergencyContact: employeeData?.emergencyContact || '',
          mobile: employeeData?.mobile || user?.mobile || '',
          address: employeeData?.address || user?.address || '',
          position: employeeData?.position || user?.position || '',
          department: employeeData?.department?.name || user?.department || '',
          hireDate: employeeData?.hireDate || user?.hireDate || ''
        }
      }
      methods.reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      mobile: cancelEmployeeFields.mobile || user?.mobile || '',
      address: cancelEmployeeFields.address || user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      postalCode: user?.postalCode || '',
      country: user?.country || '',
      position: cancelEmployeeFields.position || user?.position || '',
      department: cancelEmployeeFields.department || user?.department || '',
      hireDate: cancelEmployeeFields.hireDate || user?.hireDate || '',
      idCardNumber: cancelEmployeeFields.idCardNumber || '',
      birthDate: cancelEmployeeFields.birthDate || '',
      emergencyContact: cancelEmployeeFields.emergencyContact || ''
    })
    }
    setActiveTab(0)
    shouldKeepDialogOpenRef.current = false
    setOpenDialogSafe(false)
    setError(null)
    setPasswordFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleChangePassword = async () => {
    try {
      if (!passwordFormData.oldPassword || !passwordFormData.newPassword) {
        setError(t('profile.pleaseFillInAllRequiredFields'))
        return
      }

      if (passwordFormData.newPassword.length < 8) {
        setError(t('profile.newPasswordMustBeAtLeast8'))
        return
      }

      if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
        setError(t('profile.newPasswordAndConfirmDoNotMatch'))
        return
      }

      setPasswordLoading(true)
      setError(null)

      const response = await api.post('/auth/change-password', {
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword
      })

      setSuccess(t('profile.passwordChangedSuccessfully'))
      
      // Reset password form
      setPasswordFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(getErrorMessage(err, t('profile.failedToChangePassword'), '', t))
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
      <Box key={`profile-${i18n.language}`}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('pageTitles.profile')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={handleEditClick}
        >
          {t('profile.editProfile')}
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
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar 
                  sx={{ width: 100, height: 100, mx: 'auto' }}
                  src={user?.profilePictureUrl ? getProfilePictureUrl(user.profilePictureUrl) : null}
                >
                  {!user?.profilePictureUrl && `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`}
                </Avatar>
                {openDialog && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 'calc(50% - 50px)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                    size="small"
                    onClick={() => document.getElementById('profile-picture-input')?.click()}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography variant="h5" gutterBottom>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t(`roles.${user?.role?.toLowerCase()}`)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {/* Company Information Section (for HR only) */}
          {user && user.role === 'HR' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('profile.companyInfo')}
              </Typography>
              {companyLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {t('profile.loadingCompanyInformation')}
                  </Typography>
                </Box>
              ) : company ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.companyName')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.name || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.description')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.description || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.contactEmail')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.contactEmail || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.phone')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.phone || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.address')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.address || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.city')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.city || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.state')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.state || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.postalCode')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.postalCode || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.country')}
                    </Typography>
                    <Typography variant="body1">
                      {company?.country || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {t('profile.companyInformationNotAvailable')}
                  </Typography>
                </Alert>
              )}
            </Paper>
          )}
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('profile.userInfo')}
            </Typography>
            {user?.role === 'EMPLOYEE' && employeeLoading && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('profile.loadingEmployeeInformation')}
                </Typography>
              </Box>
            )}
            <Grid container spacing={2}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  {t('profile.personalInfo')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.firstName')}
                </Typography>
                <Typography variant="body1">
                  {user?.firstName || t('profile.notProvided')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.lastName')}
                </Typography>
                <Typography variant="body1">
                  {user?.lastName || t('profile.notProvided')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.email')}
                </Typography>
                <Typography variant="body1">
                  {user?.email || t('profile.notProvided')}
                </Typography>
              </Grid>
              {user?.role === 'EMPLOYEE' && employeeData && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('profile.employeeId')}
                  </Typography>
                  <Typography variant="body1">
                    {employeeData?.employeeId || t('profile.notProvided')}
                  </Typography>
                </Grid>
              )}
              {user?.role === 'EMPLOYEE' && employeeData && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('profile.idCardNumber')}
                  </Typography>
                  <Typography variant="body1">
                    {employeeData?.idCardNumber || t('profile.notProvided')}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.phone')}
                </Typography>
                <Typography variant="body1">
                  {user?.phone || (user?.role === 'EMPLOYEE' && employeeData?.phone) || t('profile.notProvided')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.mobile')}
                </Typography>
                <Typography variant="body1">
                  {(user?.role === 'EMPLOYEE' && employeeData?.mobile) || user?.mobile || t('profile.notProvided')}
                </Typography>
              </Grid>
              {user?.role === 'EMPLOYEE' && employeeData && employeeData.birthDate && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('profile.birthDate')}
                  </Typography>
                  <Typography variant="body1">
                    {new Date(employeeData.birthDate).toLocaleDateString() || t('profile.notProvided')}
                  </Typography>
                </Grid>
              )}
              {user?.role === 'EMPLOYEE' && employeeData && employeeData.emergencyContact && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('profile.emergencyContact')}
                  </Typography>
                  <Typography variant="body1">
                    {employeeData.emergencyContact || t('profile.notProvided')}
                  </Typography>
                </Grid>
              )}

              {/* Address Information - Hidden for HR users */}
              {user?.role !== 'HR' && (
                <>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                      {t('profile.addressInformation')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.address')}
                    </Typography>
                    <Typography variant="body1">
                      {(user?.role === 'EMPLOYEE' && employeeData?.address) || user?.address || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.city')}
                    </Typography>
                    <Typography variant="body1">
                      {user?.city || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.state')}
                    </Typography>
                    <Typography variant="body1">
                      {user?.state || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.postalCode')}
                    </Typography>
                    <Typography variant="body1">
                      {user?.postalCode || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('profile.country')}
                    </Typography>
                    <Typography variant="body1">
                      {user?.country || t('profile.notProvided')}
                    </Typography>
                  </Grid>
                </>
              )}

              {/* Work Information - Hidden for HR and Admin users */}
              {user?.role !== 'HR' && user?.role !== 'ADMIN' && (
                <>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                      {t('profile.workInfo')}
                    </Typography>
                  </Grid>
                  {/* Position and Department - Hidden for HR users */}
                  {user?.role !== 'HR' && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          {t('profile.position')}
                        </Typography>
                        <Typography variant="body1">
                          {(user?.role === 'EMPLOYEE' && employeeData?.position) || user?.position || t('profile.notProvided')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          {t('profile.department')}
                        </Typography>
                        <Typography variant="body1">
                          {(user?.role === 'EMPLOYEE' && employeeData?.department?.name) || user?.department || t('profile.notProvided')}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  {user?.role !== 'HR' && user?.role !== 'ADMIN' && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('profile.hireDate')}
                      </Typography>
                      <Typography variant="body1">
                        {(user?.role === 'EMPLOYEE' && employeeData?.hireDate ? new Date(employeeData.hireDate).toLocaleDateString() : null) || (user?.hireDate ? new Date(user.hireDate).toLocaleDateString() : null) || t('profile.notProvided')}
                      </Typography>
                    </Grid>
                  )}
                </>
              )}
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.role')}
                </Typography>
                <Typography variant="body1">
                  {t(`roles.${user?.role?.toLowerCase()}`)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={(event, reason) => {
          // Don't close if we're still loading
          if (loading) {
            return
          }
          // Only close if user explicitly wants to close (click outside or ESC key)
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            handleCancel()
          }
        }}
        disableEscapeKeyDown={loading}
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
        <FormProvider {...methods}>
          <Box 
            component="form" 
            onSubmit={(e) => {
              e.preventDefault()
              methods.handleSubmit(onSubmit)(e)
            }}
            onKeyDown={(e) => {
              // Prevent ESC key from closing dialog during loading
              if (e.key === 'Escape' && loading) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700,
                fontSize: '1.5rem',
                pb: 2
              }}
            >
              <Edit sx={{ mr: 1, color: '#667eea' }} />
                {t('profile.editUserInformation')}
            </DialogTitle>
            <DialogContent>
              {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>{t('profile.loadingProfileData')}</Typography>
                </Box>
              ) : (
          <Box sx={{ pt: 1 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)} 
                  sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                  indicatorColor="primary"
                  textColor="primary"
                  key={`profile-tabs-${i18n.language}`}
                >
              <Tab label={t('profile.personalInfo')} />
              {user?.role !== 'HR' && user?.role !== 'ADMIN' && <Tab label={t('profile.addressTab')} />}
              {user?.role !== 'HR' && user?.role !== 'ADMIN' && <Tab label={t('profile.workInfo')} />}
              <Tab label={t('profile.changePassword')} />
            </Tabs>

            {/* Personal Information Tab */}
            {activeTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar 
                        sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                        src={profilePicturePreview || (user?.profilePictureUrl ? getProfilePictureUrl(user.profilePictureUrl) : null)}
                      >
                        {!profilePicturePreview && !user?.profilePictureUrl && `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`}
                      </Avatar>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-picture-input"
                        type="file"
                        onChange={handleProfilePictureChange}
                      />
                      <Button
                        variant="outlined"
                        component="label"
                        htmlFor="profile-picture-input"
                        startIcon={<Edit />}
                        size="small"
                        disabled={uploadingPicture}
                      >
                        {uploadingPicture ? t('profile.uploading') : profilePicture ? t('profile.changePicture') : t('profile.uploadPicture')}
                      </Button>
                      {profilePicture && (
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={() => {
                            setProfilePicture(null)
                            setProfilePicturePreview(null)
                          }}
                          sx={{ ml: 1 }}
                        >
                          {t('profile.remove')}
                        </Button>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="firstName"
                      label={t('profile.firstName')}
                      required
                        validation={fieldValidations.firstName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="lastName"
                      label={t('profile.lastName')}
                      required
                        validation={fieldValidations.lastName}
                    />
                  </Grid>
                  <Grid item xs={12}>
                      <ValidatedTextField
                        name="email"
                      label={t('profile.email')}
                      type="email"
                      required
                        validation={fieldValidations.email}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="phone"
                      label={t('profile.phone')}
                        validation={fieldValidations.phoneOptional}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="mobile"
                      label={t('profile.mobile')}
                      required
                        validation={fieldValidations.phone}
                    />
                  </Grid>
                  {user?.role === 'EMPLOYEE' && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <ValidatedTextField
                          name="idCardNumber"
                          label={t('profile.idCardNumber')}
                          required
                          validation={{
                            required: validationRules.required(t('validation.idCardNumberRequired')),
                            maxLength: validationRules.maxLength(20, t('validation.idCardNumberMaxLength'))
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ValidatedDatePicker
                          name="birthDate"
                          label={t('profile.birthDate')}
                          required
                          validation={{
                            required: validationRules.required(t('validation.birthDate'))
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <ValidatedTextField
                          name="emergencyContact"
                          label={t('profile.emergencyContact')}
                          required
                          validation={{
                            required: validationRules.required(t('validation.emergencyContactRequired')),
                            maxLength: validationRules.maxLength(100, t('validation.emergencyContactMaxLength'))
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
            )}

            {/* Address Information Tab - Hidden for HR and Admin users */}
            {activeTab === 1 && user?.role !== 'HR' && user?.role !== 'ADMIN' && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                      <ValidatedTextField
                        name="address"
                      label={t('profile.address')}
                      multiline
                      rows={2}
                      required
                        validation={{
                          required: validationRules.required(t('validation.addressRequired')),
                          maxLength: validationRules.maxLength(200, t('validation.addressMaxLength'))
                        }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="city"
                      label={t('profile.city')}
                        validation={{
                          maxLength: validationRules.maxLength(100, t('validation.cityMaxLength')),
                          lettersOnly: validationRules.lettersOnly(t('validation.cityLettersOnly'))
                        }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="state"
                      label={t('profile.state')}
                        validation={{
                          maxLength: validationRules.maxLength(50, t('validation.stateMaxLength'))
                        }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="postalCode"
                      label={t('profile.postalCode')}
                        validation={fieldValidations.postalCode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="country"
                      label={t('profile.country')}
                        validation={{
                          maxLength: validationRules.maxLength(50, t('validation.countryMaxLength')),
                          lettersOnly: validationRules.lettersOnly(t('validation.countryLettersOnly'))
                        }}
                    />
                  </Grid>
                </Grid>
            )}

            {/* Work Information Tab - Hidden for HR and Admin */}
            {user?.role !== 'HR' && user?.role !== 'ADMIN' && activeTab === 2 && (
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {user?.role === 'HR' 
                          ? t('profile.roleInformationCannotBeChanged')
                          : t('profile.workInformationManaged')}
                      </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="role"
                      label={t('profile.role')}
                      value={t(`roles.${user?.role?.toLowerCase()}`)}
                      disabled
                      helperText={t('profile.roleCannotBeChanged')}
                        validation={{}}
                    />
                  </Grid>
                </Grid>
                )}

            {/* Change Password Tab */}
            {((user?.role === 'HR' && activeTab === 1) || (user?.role === 'ADMIN' && activeTab === 1) || (user?.role !== 'HR' && user?.role !== 'ADMIN' && activeTab === 3)) && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {t('profile.enterCurrentPassword')}
                    </Alert>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('profile.oldPassword')}
                      type="password"
                      required
                      value={passwordFormData.oldPassword}
                      onChange={(e) => setPasswordFormData({ ...passwordFormData, oldPassword: e.target.value })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('profile.newPassword')}
                      type="password"
                      required
                      value={passwordFormData.newPassword}
                      onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                      margin="normal"
                      helperText={t('profile.passwordMustBeAtLeast8')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('profile.confirmNewPassword')}
                      type="password"
                      required
                      value={passwordFormData.confirmPassword}
                      onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                      margin="normal"
                      error={passwordFormData.confirmPassword !== '' && passwordFormData.newPassword !== passwordFormData.confirmPassword}
                      helperText={passwordFormData.confirmPassword !== '' && passwordFormData.newPassword !== passwordFormData.confirmPassword 
                        ? t('profile.passwordsDoNotMatch') 
                        : t('profile.reEnterNewPassword')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleChangePassword}
                      disabled={passwordLoading || !passwordFormData.oldPassword || !passwordFormData.newPassword || passwordFormData.newPassword !== passwordFormData.confirmPassword}
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
                      {passwordLoading ? t('profile.changingPassword') : t('profile.changePassword')}
                    </Button>
                  </Grid>
                </Grid>
                )}
              </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button 
                onClick={handleCancel} 
                startIcon={<Cancel />}
                sx={{ borderRadius: 2 }}
              >
                {t('common.cancel')}
              </Button>
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
                {loading ? t('profile.saving') : t('common.save')}
              </Button>
            </DialogActions>
          </Box>
        </FormProvider>
      </Dialog>

      {/* Edit Company Dialog (for HR only) */}
      {user && user.role === 'HR' && (
        <Dialog 
          open={openCompanyDialog} 
          onClose={handleCompanyCancel} 
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
          <FormProvider {...companyMethods}>
            <Box component="form" onSubmit={companyMethods.handleSubmit(onCompanySubmit)}>
              <DialogTitle
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  pb: 2
                }}
              >
                <Edit sx={{ mr: 1, color: '#667eea' }} />
                  {t('profile.editCompanyInformation')}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 1 }}>
                  <Tabs 
                    value={companyTab} 
                    onChange={(e, newValue) => setCompanyTab(newValue)} 
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                    indicatorColor="primary"
                    textColor="primary"
                    key={`company-tabs-${i18n.language}`}
                  >
                    <Tab label={t('profile.companyInfo')} />
                    <Tab label={t('profile.hrManagement')} />
                    <Tab label={t('profile.departmentManagement')} />
                  </Tabs>

                  {/* Company Information Tab */}
                  {companyTab === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {t('profile.companyLogo')}
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
                              {company?.logoUrl ? t('profile.changeLogo') : t('profile.uploadLogo')}
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
                              {t('profile.remove')}
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <ValidatedTextField
                        name="name"
                        label={t('profile.companyName')}
                        required
                        validation={fieldValidations.companyName}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ValidatedTextField
                        name="description"
                        label={t('profile.description')}
                        multiline
                        rows={3}
                        validation={{
                          maxLength: validationRules.maxLength(500, t('profile.descriptionMaxLength'))
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="domain"
                        label={t('profile.domain')}
                        validation={{
                          maxLength: validationRules.maxLength(100, t('profile.domainMaxLength'))
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="contactEmail"
                        label={t('profile.contactEmail')}
                        type="email"
                        required
                        validation={fieldValidations.email}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="phone"
                        label={t('profile.phone')}
                        validation={fieldValidations.phoneOptional}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ValidatedTextField
                        name="address"
                        label={t('profile.address')}
                        multiline
                        rows={2}
                        required
                        validation={{
                          required: validationRules.required(t('validation.addressRequired')),
                          maxLength: validationRules.maxLength(200, t('validation.addressMaxLength'))
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="city"
                        label={t('profile.city')}
                        validation={{
                          maxLength: validationRules.maxLength(100, t('validation.cityMaxLength'))
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="state"
                        label={t('profile.state')}
                        validation={{
                          maxLength: validationRules.maxLength(50, t('validation.stateMaxLength'))
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="postalCode"
                        label={t('profile.postalCode')}
                        validation={fieldValidations.postalCode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        name="country"
                        label={t('profile.country')}
                        validation={{
                          maxLength: validationRules.maxLength(50, t('validation.countryMaxLength'))
                        }}
                      />
                    </Grid>
                  </Grid>
                  )}

                  {/* HR Management Tab */}
                  {companyTab === 1 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {t('profile.addNewHR')}
                      </Typography>
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('profile.firstName')}
                            required
                            value={hrFormData.firstName}
                            onChange={(e) => setHrFormData({ ...hrFormData, firstName: e.target.value })}
                            margin="normal"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('profile.lastName')}
                            required
                            value={hrFormData.lastName}
                            onChange={(e) => setHrFormData({ ...hrFormData, lastName: e.target.value })}
                            margin="normal"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('profile.email')}
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
                            label={t('profile.hrPassword')}
                            type="password"
                            required
                            value={hrFormData.password}
                            onChange={(e) => setHrFormData({ ...hrFormData, password: e.target.value })}
                            margin="normal"
                            helperText={t('profile.passwordForNewHR')}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('profile.phone')}
                            value={hrFormData.phone}
                            onChange={(e) => setHrFormData({ ...hrFormData, phone: e.target.value })}
                            margin="normal"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('profile.mobile')}
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
                            {hrLoading ? t('profile.adding') : t('profile.addHR')}
                          </Button>
                        </Grid>
                      </Grid>

                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        {t('profile.existingHRUsers')} ({hrUsers.length})
                      </Typography>
                      {hrUsers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          {t('profile.noHRUsersFound')}
                        </Typography>
                      ) : (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>{t('profile.name')}</TableCell>
                                <TableCell>{t('profile.email')}</TableCell>
                                <TableCell>{t('profile.status')}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {hrUsers.map((hrUser) => (
                                <TableRow key={hrUser.id}>
                                  <TableCell>{hrUser.firstName} {hrUser.lastName}</TableCell>
                                  <TableCell>{hrUser.email}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={hrUser.isActive ? t('profile.active') : t('profile.inactive')} 
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
                  {companyTab === 2 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {editingDepartment ? t('profile.editDepartment') : t('profile.addNewDepartment')}
                      </Typography>
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label={t('profile.departmentName')}
                            required
                            value={departmentFormData.name}
                            onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
                            margin="normal"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label={t('profile.description')}
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
                              {departmentLoading ? (editingDepartment ? t('profile.updating') : t('profile.adding')) : (editingDepartment ? t('profile.updateDepartment') : t('profile.addDepartment'))}
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
                                {t('profile.cancel')}
                              </Button>
                            )}
                          </Box>
                        </Grid>
                      </Grid>

                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        {t('profile.existingDepartments')} ({departments.length})
                      </Typography>
                      {departments.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          {t('profile.noDepartmentsFound')}
                        </Typography>
                      ) : (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>{t('profile.name')}</TableCell>
                                <TableCell>{t('profile.description')}</TableCell>
                                <TableCell>{t('profile.status')}</TableCell>
                                <TableCell align="right">{t('profile.actions')}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {departments.map((dept) => (
                                <TableRow key={dept.id}>
                                  <TableCell>{dept.name}</TableCell>
                                  <TableCell>{dept.description || '-'}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={dept.isActive ? t('profile.active') : t('profile.inactive')} 
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
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2.5, pt: 1 }}>
                <Button 
                  onClick={handleCompanyCancel} 
                  startIcon={<Cancel />}
                  sx={{ borderRadius: 2 }}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={companyLoading}
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
                  {companyLoading ? t('common.saving') : t('common.saveChanges')}
                </Button>
              </DialogActions>
            </Box>
          </FormProvider>
        </Dialog>
      )}
    </Box>
  )
}

export default Profile
