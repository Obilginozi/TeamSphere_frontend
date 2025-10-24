import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { AccessTime } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const TimeLogs = () => {
  const { t } = useLanguage()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('timeLogs.title')}
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <AccessTime sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Time & Attendance Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Track employee working hours, manage check-in/check-out, and monitor attendance.
        </Typography>
        <Button variant="contained" size="large">
          {t('timeLogs.checkIn')}
        </Button>
      </Paper>
    </Box>
  )
}

export default TimeLogs
