import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import ValidatedTextField from '../components/ValidatedTextField'
import { fieldValidations } from '../utils/validation'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()
  
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

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <FormProvider {...methods}>
              <Box
                component="form"
                onSubmit={methods.handleSubmit(onSubmit)}
                sx={{ mt: 1 }}
              >
                <Typography component="h1" variant="h4" align="center" gutterBottom>
                  {t('common.appName')}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                  {t('common.appDescription')}
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <ValidatedTextField
                  name="email"
                  label={t('auth.email')}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  margin="normal"
                  required
                  validation={fieldValidations.email}
                />
                
                <ValidatedTextField
                  name="password"
                  label={t('auth.password')}
                  type="password"
                  autoComplete="current-password"
                  margin="normal"
                  required
                  validation={fieldValidations.passwordLogin}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : t('auth.login')}
                </Button>
              </Box>
            </FormProvider>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default Login
