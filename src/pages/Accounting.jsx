import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { AccountBalance } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const Accounting = () => {
  const { t } = useLanguage()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('accounting.title')}
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <AccountBalance sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Accounting Integration
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Integrate with Logo accounting software for payroll and employee data sync.
        </Typography>
        <Button variant="contained" size="large">
          {t('accounting.syncPayroll')}
        </Button>
      </Paper>
    </Box>
  )
}

export default Accounting
