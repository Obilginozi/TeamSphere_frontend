import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { Security } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const AccessControl = () => {
  const { t } = useLanguage()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('accessControl.title')}
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Security sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Access Control System
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage QR code and ID card access, view access logs and control entry.
        </Typography>
        <Button variant="contained" size="large">
          {t('accessControl.generateQR')}
        </Button>
      </Paper>
    </Box>
  )
}

export default AccessControl
