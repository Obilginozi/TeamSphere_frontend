import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material'
import {
  Search,
  Email,
  Phone,
  Business,
  LocationOn,
  Language
} from '@mui/icons-material'
import api from '../services/api'
import { useTranslation } from 'react-i18next'

const CompanyDirectory = () => {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState([])
  const [companyInfo, setCompanyInfo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hrContacts, setHrContacts] = useState([])

  useEffect(() => {
    fetchCompanyInfo()
    fetchEmployees()
    fetchHRContacts()
  }, [])

  const fetchCompanyInfo = async () => {
    try {
      const response = await api.get('/companies/my-company')
      setCompanyInfo(response.data.data)
    } catch (error) {
      console.error('Error fetching company info:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employee')
      setEmployees(response.data.data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchHRContacts = async () => {
    try {
      const response = await api.get('/companies/my-company')
      setHrContacts(response.data.data || [])
    } catch (error) {
      console.error('Error fetching HR contacts:', error)
    }
  }

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName} ${emp.position} ${emp.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('pageTitles.companyDirectory')}
      </Typography>

      {/* Company Information Card */}
      {companyInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>
                  {companyInfo.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {companyInfo.address}, {companyInfo.city}, {companyInfo.country}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{companyInfo.phone}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{companyInfo.contactEmail}</Typography>
                </Box>
                {companyInfo.domain && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Language sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{companyInfo.domain}</Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  HR Contacts
                </Typography>
                {hrContacts.map((contact, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">{contact.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contact.position}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contact.email} | {contact.phone}
                    </Typography>
                  </Box>
                ))}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Employee Directory */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('companyDirectory.title')}
        </Typography>

        <TextField
          fullWidth
          placeholder={t('companyDirectory.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <Grid container spacing={2}>
          {filteredEmployees.map((employee) => (
            <Grid item xs={12} sm={6} md={4} key={employee.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
                      {employee.firstName[0]}{employee.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {employee.firstName} {employee.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.position}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{employee.department}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{employee.email}</Typography>
                  </Box>
                  {employee.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{employee.phone}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredEmployees.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No employees found
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default CompanyDirectory

