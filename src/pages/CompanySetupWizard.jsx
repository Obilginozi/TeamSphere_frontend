import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const CompanySetupWizard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [hrCredentials, setHrCredentials] = useState(null);
  
  // Company information
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'TR',
    address: '',
    taxNumber: '',
    website: '',
    industry: '',
    size: '',
    description: ''
  });
  
  // Departments
  const [departments, setDepartments] = useState([
    { name: 'Human Resources', description: 'HR and people management' },
    { name: 'Information Technology', description: 'IT and technical support' },
    { name: 'Finance', description: 'Accounting and financial management' },
    { name: 'Operations', description: 'Daily operations and administration' }
  ]);
  
  // Settings
  const [settings, setSettings] = useState({
    timezone: 'Europe/Istanbul',
    currency: 'TRY',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    workHours: { start: '09:00', end: '18:00' },
    breakDuration: 60,
    overtimeThreshold: 8,
    leaveTypes: ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY'],
    attendanceMethod: 'NFC'
  });

  const steps = [
    { label: t('companySetupWizard.companyInformation'), icon: <BusinessIcon /> },
    { label: t('companySetupWizard.departments'), icon: <PeopleIcon /> },
    { label: t('companySetupWizard.settings'), icon: <SettingsIcon /> },
    { label: t('companySetupWizard.complete'), icon: <CheckCircleIcon /> }
  ];
  
  // Adjust steps based on whether we're showing credentials
  const displaySteps = hrCredentials ? [...steps, { label: t('companySetupWizard.hrCredentials'), icon: <CheckCircleIcon /> }] : steps;

  const countries = [
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Construction', 'Consulting', 'Government', 'Non-profit', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees',
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  const timezones = [
    'Europe/Istanbul', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
    'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Shanghai'
  ];

  const currencies = [
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
  ];

  const workDays = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' }
  ];

  const leaveTypes = [
    { value: 'ANNUAL', label: 'Annual Leave' },
    { value: 'SICK', label: 'Sick Leave' },
    { value: 'PERSONAL', label: 'Personal Leave' },
    { value: 'MATERNITY', label: 'Maternity Leave' },
    { value: 'PATERNITY', label: 'Paternity Leave' },
    { value: 'BEREAVEMENT', label: 'Bereavement Leave' },
    { value: 'JURY', label: 'Jury Duty' }
  ];

  const attendanceMethods = [
    { value: 'NFC', label: 'NFC Tags', description: 'Tap NFC tags to clock in/out' },
    { value: 'QR', label: 'QR Codes', description: 'Scan QR codes with mobile app' },
    { value: 'MOBILE', label: 'Mobile App', description: 'Use mobile app GPS location' },
    { value: 'WEB', label: 'Web Portal', description: 'Clock in/out via web browser' }
  ];

  useEffect(() => {
    // Pre-fill with user's company info if available
    if (user?.companyName) {
      setCompanyInfo(prev => ({ ...prev, name: user.companyName }));
    }
  }, [user]);

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleDepartmentChange = (index, field, value) => {
    setDepartments(prev => prev.map((dept, i) => 
      i === index ? { ...dept, [field]: value } : dept
    ));
  };

  const addDepartment = () => {
    setDepartments(prev => [...prev, { name: '', description: '' }]);
  };

  const removeDepartment = (index) => {
    setDepartments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkDaysChange = (day) => {
    setSettings(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day]
    }));
  };

  const handleLeaveTypesChange = (leaveType) => {
    setSettings(prev => ({
      ...prev,
      leaveTypes: prev.leaveTypes.includes(leaveType)
        ? prev.leaveTypes.filter(lt => lt !== leaveType)
        : [...prev.leaveTypes, leaveType]
    }));
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      const setupData = {
        companyInfo,
        departments,
        settings
      };

      const response = await api.post('/companies/setup', setupData);
      
      if (response.data && response.data.data) {
        setHrCredentials(response.data.data);
        setActiveStep(activeStep + 1); // Move to credentials display step
      } else {
        setError(t('companySetupWizard.hrCredentialsNotReceived'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('companySetupWizard.setupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyInfo = () => (
    <Box>
      <Typography variant="h6" gutterBottom>{t('companySetupWizard.companyInformation')}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('companySetupWizard.companyName')}
            value={companyInfo.name}
            onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('companySetupWizard.email')}
            type="email"
            value={companyInfo.email}
            onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('companySetupWizard.phoneNumber')}
            value={companyInfo.phone}
            onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t('companySetupWizard.country')}</InputLabel>
            <Select
              value={companyInfo.country}
              onChange={(e) => handleCompanyInfoChange('country', e.target.value)}
            >
              {countries.map(country => (
                <MenuItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('companySetupWizard.address')}
            multiline
            rows={3}
            value={companyInfo.address}
            onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('companySetupWizard.taxNumber')}
            value={companyInfo.taxNumber}
            onChange={(e) => handleCompanyInfoChange('taxNumber', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('companySetupWizard.website')}
            value={companyInfo.website}
            onChange={(e) => handleCompanyInfoChange('website', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t('companySetupWizard.industry')}</InputLabel>
            <Select
              value={companyInfo.industry}
              onChange={(e) => handleCompanyInfoChange('industry', e.target.value)}
            >
              {industries.map(industry => (
                <MenuItem key={industry} value={industry}>{industry}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t('companySetupWizard.companySize')}</InputLabel>
            <Select
              value={companyInfo.size}
              onChange={(e) => handleCompanyInfoChange('size', e.target.value)}
            >
              {companySizes.map(size => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('companySetupWizard.description')}
            multiline
            rows={3}
            value={companyInfo.description}
            onChange={(e) => handleCompanyInfoChange('description', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderDepartments = () => (
    <Box>
      <Typography variant="h6" gutterBottom>{t('companySetupWizard.departments')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('companySetupWizard.setUpOrganizationalStructure')}
      </Typography>
      
      {departments.map((dept, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label={t('companySetupWizard.departmentName')}
                  value={dept.name}
                  onChange={(e) => handleDepartmentChange(index, 'name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label={t('companySetupWizard.description')}
                  value={dept.description}
                  onChange={(e) => handleDepartmentChange(index, 'description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  color="error"
                  onClick={() => removeDepartment(index)}
                  disabled={departments.length <= 1}
                >
                  {t('companySetupWizard.remove')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      
      <Button variant="outlined" onClick={addDepartment} sx={{ mt: 2 }}>
        {t('companySetupWizard.addDepartment')}
      </Button>
    </Box>
  );

  const renderSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>{t('companySetupWizard.settings')}</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t('companySetupWizard.timezone')}</InputLabel>
            <Select
              value={settings.timezone}
              onChange={(e) => handleSettingsChange('timezone', e.target.value)}
            >
              {timezones.map(tz => (
                <MenuItem key={tz} value={tz}>{tz}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t('companySetupWizard.currency')}</InputLabel>
            <Select
              value={settings.currency}
              onChange={(e) => handleSettingsChange('currency', e.target.value)}
            >
              {currencies.map(currency => (
                <MenuItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>{t('companySetupWizard.workDays')}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {workDays.map(day => {
              const isSelected = settings.workDays.includes(day.value);
              return (
                <Chip
                  key={day.value}
                  label={t(`companySetupWizard.${day.value.toLowerCase()}`)}
                  onClick={() => handleWorkDaysChange(day.value)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    ...(isSelected ? {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                        transform: 'translateY(-2px)'
                      }
                    } : {
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#424242',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.08)',
                        borderColor: '#667eea',
                        transform: 'translateY(-1px)'
                      }
                    })
                  }}
                />
              );
            })}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('companySetupWizard.workStartTime')}
            type="time"
            value={settings.workHours.start}
            onChange={(e) => handleSettingsChange('workHours', { ...settings.workHours, start: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('companySetupWizard.workEndTime')}
            type="time"
            value={settings.workHours.end}
            onChange={(e) => handleSettingsChange('workHours', { ...settings.workHours, end: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>{t('companySetupWizard.leaveTypes')}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {leaveTypes.map(leaveType => {
              const isSelected = settings.leaveTypes.includes(leaveType.value);
              return (
                <Chip
                  key={leaveType.value}
                  label={t(`companySetupWizard.${leaveType.value.toLowerCase()}`)}
                  onClick={() => handleLeaveTypesChange(leaveType.value)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    ...(isSelected ? {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                        transform: 'translateY(-2px)'
                      }
                    } : {
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#424242',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.08)',
                        borderColor: '#667eea',
                        transform: 'translateY(-1px)'
                      }
                    })
                  }}
                />
              );
            })}
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>{t('companySetupWizard.attendanceMethod')}</Typography>
          <Grid container spacing={2}>
            {attendanceMethods.map(method => (
              <Grid item xs={12} md={6} key={method.value}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: settings.attendanceMethod === method.value ? '2px solid' : '1px solid',
                    borderColor: settings.attendanceMethod === method.value ? 'primary.main' : 'divider'
                  }}
                  onClick={() => handleSettingsChange('attendanceMethod', method.value)}
                >
                  <CardContent>
                    <Typography variant="h6">{method.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );

  const renderComplete = () => {
    if (hrCredentials) {
      return (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'success.main', fontWeight: 600 }}>
            {t('companySetupWizard.setupComplete')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            {t('companySetupWizard.companyConfiguredSuccessfully')}
          </Typography>
          
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>{t('companySetupWizard.important')}</strong> {t('companySetupWizard.saveHrCredentials')}
            </Typography>
          </Alert>
          
          <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                {t('companySetupWizard.hrAccountCredentials')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">{t('companyManagement.company')}:</Typography>
                  <Typography variant="body1" fontWeight={500}>{hrCredentials.companyName}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">{t('companySetupWizard.hrName')}</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {hrCredentials.hrFirstName} {hrCredentials.hrLastName}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">{t('companySetupWizard.email')}:</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                    {hrCredentials.hrEmail}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">{t('companySetupWizard.password')}</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                    {hrCredentials.hrPassword}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // Copy credentials to clipboard
                const text = `${t('companySetupWizard.hrAccountCredentials')}\n\n${t('companyManagement.company')}: ${hrCredentials.companyName}\n${t('companySetupWizard.email')}: ${hrCredentials.hrEmail}\n${t('companySetupWizard.password')}: ${hrCredentials.hrPassword}`;
                navigator.clipboard.writeText(text);
                alert(t('companySetupWizard.copyCredentials'));
              }}
            >
              {t('companySetupWizard.copyCredentials')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/companies')}
            >
              {t('companySetupWizard.goToCompanyManagement')}
            </Button>
          </Box>
        </Box>
      );
    }
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>{t('companySetupWizard.setupComplete')}</Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {t('companySetupWizard.companyConfiguredSuccessfully')}
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>{t('companySetupWizard.companyInformation')}</Typography>
                <Typography variant="body2">{companyInfo.name}</Typography>
                <Typography variant="body2">{companyInfo.email}</Typography>
                <Typography variant="body2">{companyInfo.phone}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>{t('companySetupWizard.departments')}</Typography>
                {departments.map((dept, index) => (
                  <Typography key={index} variant="body2">• {dept.name}</Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const getStepContent = (step) => {
    if (hrCredentials && step === 4) {
      return renderComplete();
    }
    switch (step) {
      case 0: return renderCompanyInfo();
      case 1: return renderDepartments();
      case 2: return renderSettings();
      case 3: return hrCredentials ? renderComplete() : t('companySetupWizard.reviewYourSetup');
      default: return 'Unknown step';
    }
  };

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
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1000, mx: 'auto' }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          align="center"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 4
          }}
        >
          {t('pageTitles.companySetupWizard')}
        </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {(hrCredentials ? displaySteps : steps).map((step, index) => (
          <Step key={step.label}>
            <StepLabel icon={step.icon}>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper 
        sx={{ 
          p: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ borderRadius: 2 }}
          >
            {t('common.back')}
          </Button>
          
          {activeStep === (hrCredentials ? displaySteps.length - 1 : steps.length - 1) ? (
            hrCredentials ? (
              <Button
                variant="contained"
                onClick={() => navigate('/companies')}
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
                {t('companySetupWizard.goToCompanyManagement')}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleComplete}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
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
                {loading ? t('companySetupWizard.completing') : t('companySetupWizard.completeSetup')}
              </Button>
            )
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
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
              {t('common.next')}
            </Button>
          )}
        </Box>
      </Paper>
      </Box>
    </Box>
  );
};

export default CompanySetupWizard;
