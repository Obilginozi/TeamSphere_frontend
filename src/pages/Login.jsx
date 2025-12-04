import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Fade,
  Zoom,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Divider
} from '@mui/material'
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Language as LanguageIcon,
  Business as BusinessIcon,
  Login as LoginIcon,
  ArrowForward
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import ValidatedTextField from '../components/ValidatedTextField'
import { fieldValidations } from '../utils/validation'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { changeLanguage } = useLanguage()
  // useTranslation hook automatically re-renders on language change
  const { t, i18n } = useTranslation()
  // Get current language from i18n, which updates automatically
  const currentLanguage = i18n.language || localStorage.getItem('language') || 'en'
  
  const methods = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    const result = await login(data.email, data.password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage)
    // Also update i18n directly to ensure immediate update
    i18n.changeLanguage(newLanguage)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        '@keyframes gradientShift': {
          '0%': {
            backgroundPosition: '0% 50%'
          },
          '50%': {
            backgroundPosition: '100% 50%'
          },
          '100%': {
            backgroundPosition: '0% 50%'
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      {/* Language Selector - Top Right */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 10
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 1)'
              }
            }}
            startAdornment={
              <InputAdornment position="start" sx={{ mr: 1 }}>
                <LanguageIcon fontSize="small" color="primary" />
              </InputAdornment>
            }
          >
            <MenuItem value="en">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">🇬🇧</Typography>
                <Typography variant="body2">English</Typography>
              </Box>
            </MenuItem>
            <MenuItem value="tr">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">🇹🇷</Typography>
                <Typography variant="body2">Türkçe</Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Container component="main" maxWidth="sm">
        <Fade in timeout={800}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <Zoom in timeout={600} style={{ transitionDelay: '200ms' }}>
              <Card
                sx={{
                  width: '100%',
                  maxWidth: 480,
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                  <FormProvider {...methods}>
                    <Box
                      component="form"
                      onSubmit={methods.handleSubmit(onSubmit)}
                      sx={{ width: '100%' }}
                    >
                      {/* Logo/Icon Section */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          mb: 4
                        }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%, 100%': {
                                    transform: 'scale(1)'
                              },
                              '50%': {
                                transform: 'scale(1.05)'
                              }
                            }
                          }}
                        >
                          <BusinessIcon sx={{ fontSize: 40, color: 'white' }} />
                        </Box>
                        <Typography
                          component="h1"
                          variant="h4"
                          align="center"
                          sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            mb: 1
                          }}
                        >
                          {t('common.appName')}
                        </Typography>
                        <Typography
                          variant="body2"
                          align="center"
                          color="text.secondary"
                          sx={{ fontSize: '0.95rem' }}
                        >
                          {t('common.appDescription')}
                        </Typography>
                      </Box>

                      {error && (
                        <Fade in>
                          <Alert
                            severity="error"
                            sx={{
                              mb: 3,
                              borderRadius: 2,
                              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)'
                            }}
                            onClose={() => setError('')}
                          >
                            {error}
                          </Alert>
                        </Fade>
                      )}

                      <Box sx={{ mb: 3 }}>
                        <ValidatedTextField
                          name="email"
                          label={t('auth.email')}
                          type="email"
                          autoComplete="email"
                          autoFocus
                          required
                          validation={fieldValidations.email}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                              },
                              '&.Mui-focused': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                              }
                            }
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon color="action" />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 4 }}>
                        <ValidatedTextField
                          name="password"
                          label={t('auth.password')}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          validation={fieldValidations.passwordLogin}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                              },
                              '&.Mui-focused': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                              }
                            }
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                  size="small"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Box>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                        sx={{
                          mt: 2,
                          mb: 2,
                          py: 1.5,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)'
                          },
                          '&:active': {
                            transform: 'translateY(0)'
                          },
                          '&:disabled': {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            opacity: 0.7
                          }
                        }}
                      >
                        {loading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} color="inherit" />
                            <Typography>{t('auth.loggingIn') || 'Logging in...'}</Typography>
                          </Box>
                        ) : (
                          <Typography>{t('auth.login')}</Typography>
                        )}
                      </Button>

                      {/* Temporarily hidden - Forgot Password section */}
                      {false && (
                        <>
                          <Divider sx={{ my: 3 }}>
                            <Chip
                              label={t('auth.or') || 'OR'}
                              size="small"
                              sx={{ bgcolor: 'transparent' }}
                            />
                          </Divider>

                          <Typography
                            variant="body2"
                            align="center"
                            color="text.secondary"
                            sx={{ fontSize: '0.875rem' }}
                          >
                            {t('auth.forgotPassword')}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </FormProvider>
                </CardContent>
              </Card>
            </Zoom>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}

export default Login
