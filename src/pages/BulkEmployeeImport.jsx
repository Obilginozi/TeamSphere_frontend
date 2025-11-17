import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import * as XLSX from 'xlsx';

const BulkEmployeeImport = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  const steps = ['Upload File', 'Validate Data', 'Import Employees', 'Complete'];

  const requiredFields = [
    'firstName', 'lastName', 'email', 'department', 'position', 'hireDate', 'mobile', 'address', 'idCardNumber', 'birthDate', 'emergencyContact'
  ];

  const optionalFields = [
    'phone', 'salary', 'manager'
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });

        if (jsonData.length === 0) {
          setError('The Excel file is empty or has no data');
          return;
        }

        // Normalize date fields to YYYY-MM-DD format
        const normalizedData = jsonData.map(row => {
          const normalized = { ...row };
          // Convert hireDate if it exists
          if (normalized.hireDate) {
            const date = new Date(normalized.hireDate);
            if (!isNaN(date.getTime())) {
              normalized.hireDate = date.toISOString().split('T')[0];
            }
          }
          // Convert birthDate if it exists
          if (normalized.birthDate) {
            const date = new Date(normalized.birthDate);
            if (!isNaN(date.getTime())) {
              normalized.birthDate = date.toISOString().split('T')[0];
            }
          }
          // Convert salary to number if it's a string
          if (normalized.salary && typeof normalized.salary === 'string') {
            normalized.salary = parseFloat(normalized.salary.replace(/[^0-9.-]/g, ''));
          }
          return normalized;
        });

        setFileData({
          fileName: file.name,
          data: normalizedData,
          totalRows: normalizedData.length
        });

        setPreviewData(normalizedData.slice(0, 5)); // Show first 5 rows for preview
        setActiveStep(1);
        setError(null);
      } catch (err) {
        setError('Error reading Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/employee/validate-bulk-import', {
        employees: fileData.data
      });

      setValidationResults(response.data.data);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const importEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/employee/bulk-import', {
        employees: fileData.data,
        generatePasswords: true,
        sendEmails: true
      });

      setImportResults(response.data.data);
      setActiveStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+905551234567',
        mobile: '+905551234567',
        department: 'IT',
        position: 'Software Developer',
        hireDate: '2024-01-15',
        birthDate: '1990-05-15',
        address: '123 Main St, Istanbul',
        idCardNumber: '12345678901',
        salary: 50000,
        emergencyContact: 'Jane Doe',
        manager: 'Jane Smith'
      },
      {
        employeeId: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+905551234568',
        mobile: '+905551234568',
        department: 'HR',
        position: 'HR Manager',
        hireDate: '2024-01-10',
        birthDate: '1988-03-20',
        address: '456 Oak Ave, Istanbul',
        idCardNumber: '12345678902',
        salary: 60000,
        emergencyContact: 'John Smith',
        manager: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    
    XLSX.writeFile(wb, 'employee_import_template.xlsx');
  };

  const resetImport = () => {
    setActiveStep(0);
    setFileData(null);
    setValidationResults(null);
    setImportResults(null);
    setPreviewData([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderUploadStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Upload Employee Data</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload an Excel file containing employee information. Download the template below to see the required format.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Required Fields</Typography>
              {requiredFields.map(field => (
                <Chip key={field} label={field} color="primary" sx={{ m: 0.5 }} />
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Optional Fields</Typography>
              {optionalFields.map(field => (
                <Chip key={field} label={field} variant="outlined" sx={{ m: 0.5 }} />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={downloadTemplate}
          sx={{ mr: 2 }}
        >
          Download Template
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose File
        </Button>
      </Box>

      {fileData && (
        <Alert severity="success" sx={{ mt: 3 }}>
          File uploaded successfully: {fileData.fileName} ({fileData.totalRows} employees)
        </Alert>
      )}
    </Box>
  );

  const renderValidationStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Data Preview & Validation</Typography>
      
      {previewData.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Preview (First 5 rows):</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(previewData[0]).map(key => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <TableCell key={cellIndex}>{String(value)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={validateData}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
      >
        {loading ? t('bulkImport.validating') : t('bulkImport.validateData')}
      </Button>
    </Box>
  );

  const renderImportStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>{t('bulkImport.importEmployees')}</Typography>
      
      {validationResults && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {validationResults.validCount}
                  </Typography>
                  <Typography variant="body2">{t('bulkImport.validRecords')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">
                    {validationResults.errorCount}
                  </Typography>
                  <Typography variant="body2">{t('bulkImport.errors')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {validationResults.warningCount}
                  </Typography>
                  <Typography variant="body2">{t('bulkImport.warnings')}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {validationResults.errors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>{t('excelImport.validationErrors')}:</Typography>
              {validationResults.errors.slice(0, 5).map((error, index) => (
                <Typography key={index} variant="body2">
                  {t('excelImport.row')} {error.row}: {error.message}
                </Typography>
              ))}
              {validationResults.errors.length > 5 && (
                <Typography variant="body2">
                  {t('excelImport.moreErrors', { count: validationResults.errors.length - 5 })}
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      )}

      <Button
        variant="contained"
        onClick={importEmployees}
        disabled={loading || validationResults?.errorCount > 0}
        startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
      >
        {loading ? 'Importing...' : 'Import Employees'}
      </Button>
    </Box>
  );

  const renderCompleteStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Import Complete!</Typography>
      
      {importResults && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {importResults.successCount}
                  </Typography>
                  <Typography variant="body2">Successfully Imported</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {importResults.passwordGeneratedCount}
                  </Typography>
                  <Typography variant="body2">Passwords Generated</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {importResults.emailSentCount}
                  </Typography>
                  <Typography variant="body2">Emails Sent</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Import Summary:</Typography>
            <Typography variant="body2">
              • {importResults.successCount} employees imported successfully
            </Typography>
            <Typography variant="body2">
              • {importResults.passwordGeneratedCount} passwords generated automatically
            </Typography>
            <Typography variant="body2">
              • {importResults.emailSentCount} welcome emails sent to employees
            </Typography>
          </Alert>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={resetImport}>
          Import More Employees
        </Button>
        <Button variant="outlined" onClick={() => window.location.href = '/employees'}>
          View Employees
        </Button>
      </Box>
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0: return renderUploadStep();
      case 1: return renderValidationStep();
      case 2: return renderImportStep();
      case 3: return renderCompleteStep();
      default: return 'Unknown step';
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bulk Employee Import
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {getStepContent(activeStep)}
      </Paper>
    </Box>
  );
};

export default BulkEmployeeImport;
