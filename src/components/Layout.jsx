import React, { useState } from 'react'
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
  MonitorHeart
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

const drawerWidth = 240

const Layout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, company, logout } = useAuth()
  const { t, language, changeLanguage } = useLanguage()

  const menuItems = [
    { text: t('navigation.dashboard'), icon: <Dashboard />, path: '/dashboard' },
    { text: t('navigation.employees'), icon: <People />, path: '/employees', roles: ['ADMIN', 'HR'] },
    { 
      text: user?.role === 'HR' ? 'Attendance Management' : t('navigation.timeLogs'), 
      icon: <AccessTime />, 
      path: user?.role === 'HR' ? '/attendance' : '/time-logs' 
    },
    { text: 'Workday Reports', icon: <Assessment />, path: '/workday-reports', roles: ['ADMIN', 'HR'] },
    { text: t('navigation.leaveRequests'), icon: <EventNote />, path: '/leave-requests' },
    { 
      text: user?.role === 'ADMIN' ? t('adminTickets.title') : t('navigation.tickets'), 
      icon: <Support />, 
      path: user?.role === 'ADMIN' ? '/admin-tickets' : '/tickets' 
    },
    { text: t('navigation.accessControl'), icon: <Security />, path: '/access-control', roles: ['ADMIN', 'HR'] },
    { text: t('navigation.accounting'), icon: <AccountBalance />, path: '/accounting', roles: ['ADMIN', 'HR'] },
    { text: t('navigation.account'), icon: <Person />, path: '/account' },
    { text: 'System Monitoring', icon: <MonitorHeart />, path: '/system-monitoring', roles: ['ADMIN'] },
    { text: 'Company Setup', icon: <Business />, path: '/company-setup', roles: ['ADMIN', 'HR'] },
    { text: 'Bulk Import', icon: <Assessment />, path: '/bulk-import', roles: ['ADMIN', 'HR'] },
    { text: 'Company Management', icon: <Business />, path: '/companies', roles: ['ADMIN'] },
    { text: 'Switch Company', icon: <BusinessCenter />, path: '/company-selector', roles: ['ADMIN'] },
  ]

  const handleDrawerToggle = () => {
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

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user?.role)
  })

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          {t('common.appName')}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                if (isMobile) setMobileOpen(false)
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('common.appDescription')}
            {company && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                - {company.name}
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
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
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
