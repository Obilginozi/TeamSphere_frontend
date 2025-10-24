import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Avatar,
  IconButton,
  InputAdornment
} from '@mui/material'
import {
  Person,
  Security,
  Palette,
  Notifications,
  Language,
  Visibility,
  VisibilityOff,
  PhotoCamera
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Settings = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Person />} label="Profile" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Palette />} label="Appearance" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Language />} label="Language" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <ProfileSettings showSnackbar={showSnackbar} />}
          {activeTab === 1 && <SecuritySettings showSnackbar={showSnackbar} />}
          {activeTab === 2 && <AppearanceSettings showSnackbar={showSnackbar} />}
          {activeTab === 3 && <NotificationSettings showSnackbar={showSnackbar} />}
          {activeTab === 4 && <LanguageSettings showSnackbar={showSnackbar} />}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

const ProfileSettings = ({ showSnackbar }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    mobile: ''
  })

  const handleSave = async () => {
    try {
      await api.put('/api/profile', formData)
      showSnackbar('Profile updated successfully', 'success')
    } catch (error) {
      showSnackbar('Failed to update profile', 'error')
    }
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Profile Information
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ width: 100, height: 100, mr: 2 }}>
          {formData.firstName[0]}{formData.lastName[0]}
        </Avatar>
        <Button variant="outlined" startIcon={<PhotoCamera />}>
          Upload Photo
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Mobile Number"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Box>
  )
}

const SecuritySettings = ({ showSnackbar }) => {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      showSnackbar('Passwords do not match', 'error')
      return
    }
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwords.current,
        newPassword: passwords.new
      })
      showSnackbar('Password changed successfully', 'success')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error) {
      showSnackbar('Failed to change password', 'error')
    }
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2} maxWidth={600}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Current Password"
            type={showPassword ? 'text' : 'password'}
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          />
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 2, maxWidth: 600 }}>
        Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.
      </Alert>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleChangePassword}>
          Change Password
        </Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        Two-Factor Authentication
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Add an extra layer of security to your account
      </Typography>
      <Button variant="outlined">
        Enable 2FA
      </Button>
    </Box>
  )
}

const AppearanceSettings = ({ showSnackbar }) => {
  const [theme, setTheme] = useState('light')
  const [fontSize, setFontSize] = useState('medium')

  const handleSave = () => {
    // Save theme preferences
    localStorage.setItem('theme', theme)
    localStorage.setItem('fontSize', fontSize)
    showSnackbar('Appearance settings saved', 'success')
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Appearance
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3} maxWidth={600}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Theme</InputLabel>
            <Select
              value={theme}
              label="Theme"
              onChange={(e) => setTheme(e.target.value)}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="dim">Dim</MenuItem>
              <MenuItem value="auto">Auto (System)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Font Size</InputLabel>
            <Select
              value={fontSize}
              label="Font Size"
              onChange={(e) => setFontSize(e.target.value)}
            >
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch />}
            label="High Contrast Mode"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Smooth Animations"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Preferences
        </Button>
      </Box>
    </Box>
  )
}

const NotificationSettings = ({ showSnackbar }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    leaveRequests: true,
    attendanceAlerts: true,
    systemUpdates: false,
    weeklyReports: true
  })

  const handleSave = () => {
    showSnackbar('Notification settings saved', 'success')
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notifications
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Box maxWidth={600}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
            />
          }
          label="Email Notifications"
        />
        <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
          Receive notifications via email
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={settings.pushNotifications}
              onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
            />
          }
          label="Push Notifications"
        />
        <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
          Receive push notifications in your browser
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          Notification Types
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={settings.leaveRequests}
              onChange={(e) => setSettings({ ...settings, leaveRequests: e.target.checked })}
            />
          }
          label="Leave Request Updates"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.attendanceAlerts}
              onChange={(e) => setSettings({ ...settings, attendanceAlerts: e.target.checked })}
            />
          }
          label="Attendance Alerts"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.systemUpdates}
              onChange={(e) => setSettings({ ...settings, systemUpdates: e.target.checked })}
            />
          }
          label="System Updates"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.weeklyReports}
              onChange={(e) => setSettings({ ...settings, weeklyReports: e.target.checked })}
            />
          }
          label="Weekly Reports"
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Preferences
        </Button>
      </Box>
    </Box>
  )
}

const LanguageSettings = ({ showSnackbar }) => {
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')

  const handleSave = () => {
    showSnackbar('Language settings saved', 'success')
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Language & Region
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3} maxWidth={600}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Language</InputLabel>
            <Select
              value={language}
              label="Language"
              onChange={(e) => setLanguage(e.target.value)}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="tr">Turkish</MenuItem>
              <MenuItem value="de">German</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={timezone}
              label="Timezone"
              onChange={(e) => setTimezone(e.target.value)}
            >
              <MenuItem value="UTC">UTC</MenuItem>
              <MenuItem value="Europe/Istanbul">Istanbul (GMT+3)</MenuItem>
              <MenuItem value="America/New_York">New York (GMT-5)</MenuItem>
              <MenuItem value="Europe/London">London (GMT+0)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Date Format</InputLabel>
            <Select
              value={dateFormat}
              label="Date Format"
              onChange={(e) => setDateFormat(e.target.value)}
            >
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Preferences
        </Button>
      </Box>
    </Box>
  )
}

export default Settings

