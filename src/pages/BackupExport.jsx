import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Download as DownloadIcon,
  FolderZip as FolderZipIcon,
  InsertDriveFile as FileIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const BackupExport = () => {
  const { t } = useTranslation()
  const { company } = useAuth()
  const [selectedFormat, setSelectedFormat] = useState('zip')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleExport = async () => {
    if (!company || !company.id) {
      setError(t('backupExport.companyInfoNotAvailable'))
      return
    }

    try {
      setLoading(true)
      setError(null)

      let endpoint = ''
      let filename = ''

      switch (selectedFormat) {
        case 'zip':
          endpoint = `/admin/backup/company/${company.id}/zip`
          filename = `company_${company.id}_backup_${Date.now()}.zip`
          break
        case 'json':
          endpoint = `/admin/backup/company/${company.id}/json`
          filename = `company_${company.id}_backup_${Date.now()}.json`
          break
        case 'excel':
          endpoint = `/admin/backup/company/${company.id}/excel`
          filename = `company_${company.id}_export_${Date.now()}.xlsx`
          break
        default:
          throw new Error('Invalid format selected')
      }

      const response = await api.get(endpoint, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const exportFormats = [
    {
      value: 'zip',
      label: 'ZIP Archive',
      description: 'Complete backup with JSON and Excel files',
      icon: <FolderZipIcon sx={{ fontSize: 48 }} />,
      color: 'primary.main'
    },
    {
      value: 'json',
      label: 'JSON File',
      description: 'All data in a single JSON file',
      icon: <FileIcon sx={{ fontSize: 48 }} />,
      color: 'info.main'
    },
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Company data in Excel format',
      icon: <TableChartIcon sx={{ fontSize: 48 }} />,
      color: 'success.main'
    }
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('pageTitles.backupExport')}
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Export complete company data including employees, time logs, departments, and more.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Format Selection Cards */}
        {exportFormats.map((format) => (
          <Grid item xs={12} md={4} key={format.value}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedFormat === format.value ? 2 : 1,
                borderColor: selectedFormat === format.value ? format.color : 'grey.300',
                '&:hover': {
                  borderColor: format.color,
                  boxShadow: 3
                }
              }}
              onClick={() => setSelectedFormat(format.value)}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: format.color, mb: 2 }}>
                  {format.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {format.label}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {format.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Export Details */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Company: <strong>{company?.name || 'N/A'}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Export Date: <strong>{new Date().toLocaleDateString()}</strong>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Export Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            What's Included
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">✓ Company Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">✓ User Accounts</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">✓ Employee Data</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">✓ Departments</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">✓ Time Logs</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">✓ Leave Requests</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">✓ Attendance Records</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">✓ Export Metadata</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={loading || !company}
          sx={{
            minWidth: 200,
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
          {loading ? 'Exporting...' : 'Export Data'}
        </Button>
      </Box>

      {/* Warning */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>Important:</strong> Exported data contains sensitive information. Store it securely and follow your organization's data protection policies.
      </Alert>
    </Box>
  )
}

export default BackupExport

