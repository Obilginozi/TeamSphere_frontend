import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  AccessTime,
  EventNote,
  Support,
  Security,
  AccountBalance,
  Person,
  Logout,
  Language,
  Business,
  BusinessCenter,
  Assessment,
  MonitorHeart,
  Campaign,
  MenuBook
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'
import api from '../services/api'

const drawerWidth = 240
const collapsedDrawerWidth = 64

const Layout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const saved = localStorage.getItem('drawerCollapsed')
    return saved === null || saved === 'false'
  })
  const [anchorEl, setAnchorEl] = useState(null)
  const [companyData, setCompanyData] = useState(null)
  const [logoTimestamp, setLogoTimestamp] = useState(null)
  const [logoObjectUrl, setLogoObjectUrl] = useState(null)
  const [adminLogoUrl, setAdminLogoUrl] = useState(null)
  const [profilePictureObjectUrl, setProfilePictureObjectUrl] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUser, company, logout, selectedCompanyId } = useAuth()
  const { t, language, changeLanguage } = useLanguage()
  
  // Refs to prevent infinite loops
  const hasFetchedCompany = useRef(false)
  const lastFetchedCompanyId = useRef(null)
  const lastFetchedLogoUrl = useRef(null)

  useEffect(() => {
    // Fetch profile picture as authenticated blob
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
    
    // Fetch full user profile if user exists but profilePictureUrl is missing
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/users/profile')
        if (response.data && response.data.data) {
          const userData = response.data.data
          // Update user context with full profile data including profilePictureUrl
          if (setUser) {
            setUser(prevUser => ({
              ...prevUser,
              ...userData
            }))
          }
          // Fetch profile picture if available
          if (userData.profilePictureUrl) {
            await fetchProfilePictureAsBlob(userData.profilePictureUrl)
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // If profile fetch fails but user has profilePictureUrl, try to fetch it
        if (user?.profilePictureUrl) {
          await fetchProfilePictureAsBlob(user.profilePictureUrl)
        }
      }
    }
    
    // If user exists but profilePictureUrl is missing, fetch full profile
    if (user && !user.profilePictureUrl) {
      fetchUserProfile()
    } else if (user?.profilePictureUrl) {
      // If user already has profilePictureUrl, just fetch the picture
      fetchProfilePictureAsBlob(user.profilePictureUrl)
    }
    
    // Fetch logo as authenticated blob
    const fetchLogoAsBlob = async (logoUrl) => {
      // Clean up old object URL
      setLogoObjectUrl(prevUrl => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl)
        }
        return null
      })
      
      if (!logoUrl) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No logo URL provided')
        }
        return
      }
      
      // Handle different logo URL formats
      let urlPath = logoUrl
      if (!logoUrl.startsWith('uploads/')) {
        // If logoUrl doesn't start with 'uploads/', try to extract it or use as-is
        if (logoUrl.includes('uploads/')) {
          urlPath = logoUrl.substring(logoUrl.indexOf('uploads/'))
        } else {
          // Assume it's a filename and prepend the uploads path
          urlPath = `uploads/companies/${logoUrl}`
        }
      }
      
      const url = `/companies/logo?path=${encodeURIComponent(urlPath)}`
      
      console.log('Fetching logo from:', url, 'Original logoUrl:', logoUrl, 'Processed urlPath:', urlPath)
      
      try {
        const response = await api.get(url, {
          responseType: 'blob'
        })
        if (response.data && response.data.size > 0) {
          const blob = new Blob([response.data], { type: response.data.type || 'image/png' })
          const objectUrl = URL.createObjectURL(blob)
          setLogoObjectUrl(objectUrl)
          console.log('✅ Logo fetched successfully as blob, size:', response.data.size, 'bytes', 'Object URL:', objectUrl)
          // Update timestamp to force re-render
          setLogoTimestamp(Date.now())
        } else {
          console.warn('Logo blob is empty or invalid')
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch logo as blob:', fetchError)
        if (fetchError.response) {
          console.error('Response status:', fetchError.response.status)
          console.error('Response data:', fetchError.response.data)
        }
        // Don't set logoObjectUrl, will show app name instead
      }
    }
    
    // Fetch company data with logo
    const fetchCompany = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('Fetching company data for user role:', user?.role)
        }
        
        const response = await api.get('/companies/my-company')
        if (response.data && response.data.data) {
          const companyData = response.data.data
          const companyId = companyData.id
          const logoUrl = companyData.logoUrl
          
          // Check if we've already fetched this company with the same logo
          if (hasFetchedCompany.current && 
              lastFetchedCompanyId.current === companyId && 
              lastFetchedLogoUrl.current === logoUrl) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Company data already fetched, skipping...')
            }
            return
          }
          
          setCompanyData(companyData)
          hasFetchedCompany.current = true
          lastFetchedCompanyId.current = companyId
          lastFetchedLogoUrl.current = logoUrl
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Company data fetched in Layout:', companyData)
            console.log('Logo URL:', logoUrl)
            console.log('Company ID:', companyId)
          }
          
          // Fetch logo as blob if logoUrl exists
          if (logoUrl) {
            await fetchLogoAsBlob(logoUrl)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('No logo URL in company data')
            }
            // Clean up old object URL if no logo
            setLogoObjectUrl(prevUrl => {
              if (prevUrl) {
                URL.revokeObjectURL(prevUrl)
              }
              return null
            })
          }
        } else {
          console.warn('Unexpected company response structure:', response.data)
        }
      } catch (error) {
        console.error('Failed to fetch company data in Layout:', error)
        if (error.response) {
          console.error('Response status:', error.response.status)
          console.error('Response data:', error.response.data)
        }
        // Clear company data on error
        setCompanyData(null)
        hasFetchedCompany.current = false
        lastFetchedCompanyId.current = null
        lastFetchedLogoUrl.current = null
        setLogoObjectUrl(prevUrl => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl)
          }
          return null
        })
      }
    }
    
    // For admins: only fetch company if a company is selected
    // For HR/Employee: always fetch their company
    if (user) {
      if (user.role === 'ADMIN') {
        if (selectedCompanyId) {
          // Reset fetch flag if company changed
          if (lastFetchedCompanyId.current !== selectedCompanyId) {
            hasFetchedCompany.current = false
          }
          fetchCompany()
        } else {
          // Clear company data if admin hasn't selected a company
          setCompanyData(null)
          hasFetchedCompany.current = false
          lastFetchedCompanyId.current = null
          lastFetchedLogoUrl.current = null
          setLogoObjectUrl(prevUrl => {
            if (prevUrl) {
              URL.revokeObjectURL(prevUrl)
            }
            return null
          })
          // Load admin logo
          const fetchAdminLogo = async () => {
            try {
              const adminLogoPath = 'uploads/companies/mock_admin_logo.svg'
              const url = `/companies/logo?path=${encodeURIComponent(adminLogoPath)}`
              const response = await api.get(url, { responseType: 'blob' })
              if (response.data && response.data.size > 0) {
                const blob = new Blob([response.data], { type: response.data.type || 'image/svg+xml' })
                const objectUrl = URL.createObjectURL(blob)
                setAdminLogoUrl(objectUrl)
              }
            } catch (error) {
              console.error('Failed to fetch admin logo:', error)
              setAdminLogoUrl(null)
            }
          }
          fetchAdminLogo()
        }
      } else if (user.role === 'HR' || user.role === 'EMPLOYEE') {
        // HR and Employee users are always tied to a company
        // Only fetch if we haven't fetched yet or if user changed
        if (!hasFetchedCompany.current || lastFetchedCompanyId.current === null) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Fetching company for', user.role, 'user')
          }
          fetchCompany()
        }
      }
    }

    // Listen for company update events
    const handleCompanyUpdate = () => {
      if (user) {
        // Reset fetch flag to allow re-fetching on company update
        hasFetchedCompany.current = false
        lastFetchedCompanyId.current = null
        lastFetchedLogoUrl.current = null
        
        if (user.role === 'ADMIN' && selectedCompanyId) {
          setLogoTimestamp(Date.now()) // Update timestamp to force logo reload
          fetchCompany()
        } else if (user.role !== 'ADMIN') {
          // HR and Employee users are always tied to a company
          setLogoTimestamp(Date.now()) // Update timestamp to force logo reload
          fetchCompany()
        }
      }
    }
    
    // Listen for profile picture update events
    const handleProfilePictureUpdate = async () => {
      // Fetch latest user profile to get updated profilePictureUrl
      try {
        const response = await api.get('/users/profile')
        if (response.data && response.data.data && response.data.data.profilePictureUrl) {
          await fetchProfilePictureAsBlob(response.data.data.profilePictureUrl)
        }
      } catch (error) {
        console.error('Failed to fetch user profile for profile picture update:', error)
        // Fallback to current user profilePictureUrl if available
        if (user?.profilePictureUrl) {
          await fetchProfilePictureAsBlob(user.profilePictureUrl)
        }
      }
    }

    window.addEventListener('companyUpdated', handleCompanyUpdate)
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate)
    
      return () => {
        window.removeEventListener('companyUpdated', handleCompanyUpdate)
        window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate)
        // Clean up object URLs on unmount
        setLogoObjectUrl(prevUrl => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl)
          }
          return null
        })
        setProfilePictureObjectUrl(prevUrl => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl)
          }
          return null
        })
      }
    }, [user?.id, user?.role, user?.profilePictureUrl, selectedCompanyId]) // Use user.id and user.role instead of user object to prevent infinite loops
    
    // Separate effect to handle company switching for admins - re-fetch when selectedCompanyId changes
    useEffect(() => {
      if (user?.role === 'ADMIN' && selectedCompanyId) {
        // Check if we need to re-fetch (company changed)
        if (lastFetchedCompanyId.current !== selectedCompanyId) {
          hasFetchedCompany.current = false
          lastFetchedCompanyId.current = null
          lastFetchedLogoUrl.current = null
          
          // Fetch new company data
          const fetchNewCompany = async () => {
            try {
              const response = await api.get('/companies/my-company')
              if (response.data && response.data.data) {
                const newCompanyData = response.data.data
                setCompanyData(newCompanyData)
                hasFetchedCompany.current = true
                lastFetchedCompanyId.current = newCompanyData.id
                lastFetchedLogoUrl.current = newCompanyData.logoUrl
                
                // Clear admin logo when company is selected
                setAdminLogoUrl(prevUrl => {
                  if (prevUrl) URL.revokeObjectURL(prevUrl)
                  return null
                })
                
                // Fetch logo if exists
                if (newCompanyData.logoUrl) {
                  await fetchLogoAsBlob(newCompanyData.logoUrl)
                  // Update timestamp to force re-render
                  setLogoTimestamp(Date.now())
                } else {
                  setLogoObjectUrl(prevUrl => {
                    if (prevUrl) URL.revokeObjectURL(prevUrl)
                    return null
                  })
                }
              }
            } catch (error) {
              console.error('Failed to fetch company after switch:', error)
            }
          }
          
          fetchNewCompany()
        }
      } else if (user?.role === 'ADMIN' && !selectedCompanyId) {
        // Clear company data if admin deselects company
        setCompanyData(null)
        hasFetchedCompany.current = false
        lastFetchedCompanyId.current = null
        lastFetchedLogoUrl.current = null
        setLogoObjectUrl(prevUrl => {
          if (prevUrl) URL.revokeObjectURL(prevUrl)
          return null
        })
        // Load admin logo
        const fetchAdminLogo = async () => {
          try {
            const adminLogoPath = 'uploads/companies/mock_admin_logo.svg'
            const url = `/companies/logo?path=${encodeURIComponent(adminLogoPath)}`
            const response = await api.get(url, { responseType: 'blob' })
            if (response.data && response.data.size > 0) {
              const blob = new Blob([response.data], { type: response.data.type || 'image/svg+xml' })
              const objectUrl = URL.createObjectURL(blob)
              setAdminLogoUrl(prevUrl => {
                if (prevUrl) URL.revokeObjectURL(prevUrl)
                return objectUrl
              })
            }
          } catch (error) {
            console.error('Failed to fetch admin logo:', error)
            setAdminLogoUrl(prevUrl => {
              if (prevUrl) URL.revokeObjectURL(prevUrl)
              return null
            })
          }
        }
        fetchAdminLogo()
      }
    }, [selectedCompanyId, user?.role])

  const getLogoUrl = (logoUrl, timestamp) => {
    // Use object URL if available (for authenticated blob)
    if (logoObjectUrl) {
      return logoObjectUrl
    }
    if (!logoUrl) return null
    if (logoUrl.startsWith('uploads/')) {
      // Note: This URL is used for <img> tags which don't send auth headers
      // The blob fetch above handles authenticated requests
      // Vite proxy forwards /api to backend, and backend has context-path: /api
      // So we need: /api/companies/logo (Vite will proxy /api to backend)
      // Backend will receive: /api/companies/logo (matches context-path + controller mapping)
      const url = `/api/companies/logo?path=${encodeURIComponent(logoUrl)}`
      return timestamp ? `${url}&t=${timestamp}` : url
    }
    return logoUrl
  }

  const handleDrawerToggle = () => {
    const newState = !drawerOpen
    setDrawerOpen(newState)
    localStorage.setItem('drawerCollapsed', !newState)
  }

  const currentDrawerWidth = drawerOpen ? drawerWidth : collapsedDrawerWidth

  // Define menu items with proper ordering for ADMIN
  // Items that don't require company selection for ADMIN
  const alwaysAvailableForAdmin = [
    { text: t('navigation.dashboard'), icon: <Dashboard />, path: '/dashboard' },
    { 
      text: t('adminTickets.title'), 
      icon: <Support />, 
      path: '/admin-tickets',
      roles: ['ADMIN']
    },
    { text: t('navigation.companySetup'), icon: <Business />, path: '/company-setup', roles: ['ADMIN'] },
    { text: t('navigation.companyManagement'), icon: <Business />, path: '/companies', roles: ['ADMIN'] },
    { text: 'Feature Flags', icon: <Security />, path: '/company-feature-flags', roles: ['ADMIN'] },
    { text: t('navigation.switchCompany'), icon: <BusinessCenter />, path: '/company-selector', roles: ['ADMIN'] },
  ]
  
  // Items that require company selection for ADMIN
  const companyDependentItems = [
    { text: t('navigation.employees'), icon: <People />, path: '/employees', roles: ['ADMIN', 'HR'] },
    { 
      text: user?.role === 'HR' ? t('navigation.attendanceManagement') : t('navigation.timeLogs'), 
      icon: <AccessTime />, 
      path: user?.role === 'HR' ? '/attendance' : '/time-logs' 
    },
    { text: t('navigation.workdayReports'), icon: <Assessment />, path: '/workday-reports', roles: ['ADMIN', 'HR'] },
    { text: t('navigation.leaveRequests'), icon: <EventNote />, path: '/leave-requests' },
    { text: t('navigation.announcements'), icon: <Campaign />, path: '/announcements', roles: ['ADMIN', 'HR'] },
    { 
      text: t('navigation.tickets'), 
      icon: <Support />, 
      path: '/tickets',
      roles: ['HR']
    },
    { 
      text: t('navigation.generalTickets') || 'General Tickets', 
      icon: <Support />, 
      path: '/general-tickets',
      roles: ['HR', 'EMPLOYEE']
    },
    { text: t('navigation.editCompany'), icon: <Business />, path: '/company-edit', roles: ['HR', 'ADMIN'] },
    { text: t('navigation.accessControl'), icon: <Security />, path: '/access-control', roles: ['ADMIN', 'HR'] },
    { text: t('navigation.accounting'), icon: <AccountBalance />, path: '/accounting', roles: ['ADMIN', 'HR'] },
    { text: t('navigation.account'), icon: <Person />, path: '/account' },
    { text: t('navigation.bulkImport'), icon: <Assessment />, path: '/bulk-import', roles: ['ADMIN', 'HR'] },
  ]
  
  // Combine menu items in the correct order for ADMIN
  const menuItems = [
    ...alwaysAvailableForAdmin,
    ...companyDependentItems
  ]

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleProfileMenuClose()
  }

  const handleLanguageChange = (lang) => {
    changeLanguage(lang)
    handleProfileMenuClose()
  }

  const { isPageEnabled } = useFeatureFlags()
  
  const filteredMenuItems = menuItems.filter(item => {
    // Check role-based access
    if (item.roles && !item.roles.includes(user?.role)) {
      return false
    }
    // Check feature flag access
    if (item.path && !isPageEnabled(item.path)) {
      return false
    }
    return true
  })

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ 
        display: 'flex', 
        flexDirection: drawerOpen ? 'row' : 'column',
        justifyContent: drawerOpen ? 'flex-start' : 'center', 
        alignItems: 'center', 
        minHeight: '64px !important', 
        px: drawerOpen ? 2 : 1,
        py: drawerOpen ? 0 : 1
      }}>
        {drawerOpen ? (
          <>
            {((user?.role === 'ADMIN' && !selectedCompanyId && adminLogoUrl) || (companyData?.logoUrl && logoObjectUrl)) ? (
              <Box
                component="img"
                src={user?.role === 'ADMIN' && !selectedCompanyId && adminLogoUrl ? adminLogoUrl : logoObjectUrl}
                alt={user?.role === 'ADMIN' && !selectedCompanyId ? "Admin Logo" : "Company Logo"}
                key={user?.role === 'ADMIN' && !selectedCompanyId ? 'admin-logo' : `${companyData?.logoUrl}-${logoTimestamp}`}
                sx={{
                  width: '100%',
                  maxWidth: drawerWidth - 32, // Full width minus padding (16px on each side)
                  height: 'auto',
                  maxHeight: 120, // Increased from 50 to allow bigger logo while maintaining aspect ratio
                  objectFit: 'contain', // Maintains aspect ratio
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={() => navigate('/dashboard')}
                onError={(e) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to load logo image:', user?.role === 'ADMIN' && !selectedCompanyId ? adminLogoUrl : logoObjectUrl)
                  }
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <Typography variant="h6" noWrap component="div" onClick={() => navigate('/dashboard')} sx={{ cursor: 'pointer', width: '100%' }}>
          {t('common.appName')}
        </Typography>
            )}
          </>
        ) : (
          <>
            {((user?.role === 'ADMIN' && !selectedCompanyId && adminLogoUrl) || (companyData?.logoUrl && logoObjectUrl)) ? (
              <Box
                component="img"
                src={user?.role === 'ADMIN' && !selectedCompanyId && adminLogoUrl ? adminLogoUrl : logoObjectUrl}
                alt={user?.role === 'ADMIN' && !selectedCompanyId ? "Admin Logo" : "Company Logo"}
                key={user?.role === 'ADMIN' && !selectedCompanyId ? 'admin-logo' : `${companyData?.logoUrl}-${logoTimestamp}`}
                sx={{
                  width: 40,
                  height: 40,
                  maxWidth: 40,
                  maxHeight: 40,
                  objectFit: 'contain', // Maintains aspect ratio (square when collapsed)
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={() => navigate('/dashboard')}
                onError={(e) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to load logo image:', user?.role === 'ADMIN' && !selectedCompanyId ? adminLogoUrl : logoObjectUrl)
                  }
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <Typography variant="h6" component="div" sx={{ fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                {t('common.appName').charAt(0)}
              </Typography>
            )}
          </>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1 }}>
          {filteredMenuItems.map((item) => {
            // For ADMIN users, disable company-dependent items if no company is selected
            const isAdmin = user?.role === 'ADMIN'
            const requiresCompany = isAdmin && companyDependentItems.some(depItem => depItem.path === item.path)
            const isDisabled = requiresCompany && !selectedCompanyId
            
            return (
            <ListItem key={item.text} disablePadding>
              <Tooltip 
                title={!drawerOpen ? (isDisabled ? `${item.text} (Select a company first)` : item.text) : ''} 
                placement="right"
              >
              <ListItemButton
                selected={location.pathname === item.path}
                  disabled={isDisabled}
                onClick={() => {
                    if (!isDisabled) {
                  navigate(item.path)
                  if (isMobile) setMobileOpen(false)
                    }
                  }}
                  sx={{
                    minHeight: 48,
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: drawerOpen ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                  {item.icon}
                </ListItemIcon>
                  {drawerOpen && <ListItemText primary={item.text} />}
              </ListItemButton>
              </Tooltip>
            </ListItem>
            )
          })}
        </Box>
        
        {/* Wiki section at the bottom, separated for ADMIN only */}
        {user?.role === 'ADMIN' && isPageEnabled('/wiki') && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <Tooltip 
                title={!drawerOpen ? 'Wiki Documentation' : ''} 
                placement="right"
              >
                <ListItemButton
                  selected={location.pathname === '/wiki'}
                  onClick={() => {
                    navigate('/wiki')
                    if (isMobile) setMobileOpen(false)
                  }}
                  sx={{
                    minHeight: 48,
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: drawerOpen ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    <MenuBook />
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary="Wiki" />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleMobileDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('common.appDescription')}
            {companyData && !(user?.role === 'ADMIN' && !selectedCompanyId) && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                - {companyData.name}
              </Typography>
            )}
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar 
              sx={{ width: 32, height: 32 }}
              src={profilePictureObjectUrl || null}
            >
              {!profilePictureObjectUrl && `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: currentDrawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleMobileDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
          open={drawerOpen}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          {t('navigation.profile')}
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange(language === 'en' ? 'tr' : 'en')}>
          <ListItemIcon>
            <Language fontSize="small" />
          </ListItemIcon>
          {language === 'en' ? 'Türkçe' : 'English'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          {t('auth.logout')}
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Layout
