import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { Support } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const Tickets = () => {
  const { t } = useLanguage()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('tickets.title')}
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Support sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Support Ticket System
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create and manage support tickets for IT and HR requests.
        </Typography>
        <Button variant="contained" size="large">
          {t('tickets.createTicket')}
        </Button>
      </Paper>
    </Box>
  )
}

export default Tickets
