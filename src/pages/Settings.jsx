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
import { useTranslation } from 'react-i18next'
import api from '../services/api'

const Settings = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Paper>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Person />} label={t('settings.profile')} />
          <Tab icon={<Security />} label={t('settings.security')} />
          <Tab icon={<Palette />} label={t('settings.appearance')} />
          <Tab icon={<Notifications />} label={t('settings.notifications')} />
          <Tab icon={<Language />} label={t('settings.language')} />
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
  const { t } = useTranslation()
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
      await api.put('/users/profile', formData)
      showSnackbar(t('settings.profileUpdatedSuccessfully'), 'success')
    } catch (error) {
      showSnackbar(t('settings.failedToUpdateProfile'), 'error')
    }
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('settings.profileInformation')}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ width: 100, height: 100, mr: 2 }}>
          {formData.firstName[0]}{formData.lastName[0]}
        </Avatar>
        <Button variant="outlined" startIcon={<PhotoCamera />}>
          {t('settings.uploadPhoto')}
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('settings.firstName')}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('settings.lastName')}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('settings.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('settings.phoneNumber')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('settings.mobileNumber')}
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave}>
          {t('settings.saveChanges')}
        </Button>
      </Box>
    </Box>
  )
}

const SecuritySettings = ({ showSnackbar }) => {
  const { t } = useTranslation()
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      showSnackbar(t('settings.passwordsDoNotMatch'), 'error')
      return
    }
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwords.current,
        newPassword: passwords.new
      })
      showSnackbar(t('settings.passwordChangedSuccessfully'), 'success')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error) {
      showSnackbar(t('settings.failedToChangePassword'), 'error')
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
            label={t('settings.currentPassword')}
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
            label={t('settings.newPassword')}
            type={showPassword ? 'text' : 'password'}
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('settings.confirmNewPassword')}
            type={showPassword ? 'text' : 'password'}
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          />
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 2, maxWidth: 600 }}>
        {t('settings.passwordRequirements')}
      </Alert>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleChangePassword}>
          {t('settings.changePassword')}
        </Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        {t('settings.twoFactorAuthentication')}
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        {t('settings.addExtraSecurity')}
      </Typography>
      <Button variant="outlined">
        {t('settings.enable2FA')}
      </Button>
    </Box>
  )
}

const AppearanceSettings = ({ showSnackbar }) => {
  const { t } = useTranslation()
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
        {t('settings.appearance')}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3} maxWidth={600}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.theme')}</InputLabel>
            <Select
              value={theme}
              label={t('settings.theme')}
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
            <InputLabel>{t('settings.fontSize')}</InputLabel>
            <Select
              value={fontSize}
              label={t('settings.fontSize')}
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
            label={t('settings.highContrastMode')}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label={t('settings.smoothAnimations')}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave}>
          {t('settings.savePreferences')}
        </Button>
      </Box>
    </Box>
  )
}

const NotificationSettings = ({ showSnackbar }) => {
  const { t } = useTranslation()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    leaveRequests: true,
    attendanceAlerts: true,
    systemUpdates: false,
    weeklyReports: true
  })

  const handleSave = () => {
    showSnackbar(t('settings.notificationSettingsSaved'), 'success')
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('settings.notifications')}
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
          label={t('settings.emailNotifications')}
        />
        <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
          {t('settings.receiveNotificationsViaEmail')}
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={settings.pushNotifications}
              onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
            />
          }
          label={t('settings.pushNotifications')}
        />
        <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
          {t('settings.receivePushNotifications')}
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          {t('settings.notificationTypes')}
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={settings.leaveRequests}
              onChange={(e) => setSettings({ ...settings, leaveRequests: e.target.checked })}
            />
          }
          label={t('settings.leaveRequestUpdates')}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.attendanceAlerts}
              onChange={(e) => setSettings({ ...settings, attendanceAlerts: e.target.checked })}
            />
          }
          label={t('settings.attendanceAlerts')}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.systemUpdates}
              onChange={(e) => setSettings({ ...settings, systemUpdates: e.target.checked })}
            />
          }
          label={t('settings.systemUpdates')}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.weeklyReports}
              onChange={(e) => setSettings({ ...settings, weeklyReports: e.target.checked })}
            />
          }
          label={t('settings.weeklyReports')}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave}>
          {t('settings.savePreferences')}
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
    showSnackbar(t('settings.languageSettingsSaved'), 'success')
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
            <InputLabel>{t('settings.language')}</InputLabel>
            <Select
              value={language}
              label={t('settings.language')}
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
            <InputLabel>{t('settings.timezone')}</InputLabel>
            <Select
              value={timezone}
              label={t('settings.timezone')}
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
            <InputLabel>{t('settings.dateFormat')}</InputLabel>
            <Select
              value={dateFormat}
              label={t('settings.dateFormat')}
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
          {t('settings.savePreferences')}
        </Button>
      </Box>
    </Box>
  )
}

export default Settings

