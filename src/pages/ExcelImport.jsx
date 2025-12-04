import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Grid
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

const ExcelImport = () => {
  const { t } = useTranslation()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/excel/template/employees', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'employee_import_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError(t('excelImport.failedToDownloadTemplate'))
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError(t('excelImport.pleaseSelectFile'))
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      setError(null)
      const response = await api.post('/excel/import/employees', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setResult(response.data.data)
      setFile(null)
      // Clear the file input
      document.getElementById('file-input').value = ''
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('pageTitles.excelImport')}
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Upload an Excel file to import employee data into the system.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Step 1: Download Template
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Download the Excel template with the correct format and sample data.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                fullWidth
              >
                Download Template
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Step 2: Upload Filled Template
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Fill in the template with your employee data and upload it here.
              </Typography>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Select File
                </Button>
              </label>
              {file && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Selected: {file.name}
                </Alert>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!file || uploading}
                fullWidth
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
                {uploading ? 'Uploading...' : 'Upload & Import'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {uploading && (
        <Box sx={{ mt: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
            Processing your file...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {result && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import Results
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {result.totalRows}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Rows
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                  <Typography variant="h4" color="success.dark">
                    {result.successCount}
                  </Typography>
                  <Typography variant="body2" color="success.dark">
                    Successful
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                  <Typography variant="h4" color="error.dark">
                    {result.failureCount}
                  </Typography>
                  <Typography variant="body2" color="error.dark">
                    Failed
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {result.errors && result.errors.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" color="error" gutterBottom>
                  <ErrorIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  {t('excelImport.errors')} ({result.errors.length})
                </Typography>
                <List dense>
                  {result.errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={error}
                        primaryTypographyProps={{ color: 'error', variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {result.warnings && result.warnings.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" color="warning.main" gutterBottom>
                  {t('excelImport.warnings')} ({result.warnings.length})
                </Typography>
                <List dense>
                  {result.warnings.map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={warning}
                        primaryTypographyProps={{ color: 'warning.main', variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {result.successCount > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <AlertTitle>{t('excelImport.importCompletedSuccessfully')}</AlertTitle>
                {t('excelImport.employeesImported', { count: result.successCount })}
                {t('excelImport.defaultPassword')} <strong>Welcome123!</strong>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Template Format
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            The Excel template should contain the following columns:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Employee ID"
                secondary="Unique identifier for the employee (required)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="First Name, Last Name"
                secondary="Employee's name (required)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Email"
                secondary="Employee's email address (required, must be unique)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Position"
                secondary="Job title or position"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Department"
                secondary="Department name (will be created if doesn't exist)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Phone, Hire Date, Salary"
                secondary="Additional employee information (optional)"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ExcelImport

