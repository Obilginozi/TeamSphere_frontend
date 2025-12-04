import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { AccountBalance } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const Accounting = () => {
  const { t } = useLanguage()

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
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
            }}
          >
            <AccountBalance sx={{ fontSize: 28, color: 'white' }} />
          </Box>
    <Box>
            <Typography 
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
        {t('accounting.title')}
      </Typography>
          </Box>
        </Box>
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)'
            }
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
              margin: '0 auto',
              mb: 3,
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
            }}
          >
            <AccountBalance sx={{ fontSize: 48, color: 'white' }} />
          </Box>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: 2
            }}
          >
          {t('accounting.integrationTitle')}
        </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
          {t('accounting.integrationDescription')}
        </Typography>
          <Button 
            variant="contained" 
            size="large"
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
          {t('accounting.syncPayroll')}
        </Button>
      </Paper>
      </Box>
    </Box>
  )
}

export default Accounting
