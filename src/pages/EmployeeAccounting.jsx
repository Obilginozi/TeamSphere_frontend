import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material'
import {
  AccountBalance,
  AttachMoney,
  Receipt,
  CalendarToday,
  AccountCircle
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { getErrorMessage } from '../utils/errorHandler'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'

const EmployeeAccounting = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [employeeData, setEmployeeData] = useState(null)
  const [paycheckHistory, setPaycheckHistory] = useState([])

  useEffect(() => {
    dayjs.locale(i18n.language === 'tr' ? 'tr' : 'en')
  }, [i18n.language])

  useEffect(() => {
    fetchEmployeeAccountingData()
  }, [])

  const fetchEmployeeAccountingData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch employee data which includes salary information
      const employeeResponse = await api.get('/employee/me')
      const employee = employeeResponse.data?.data || employeeResponse.data
      setEmployeeData(employee)
      
      // TODO: Fetch paycheck history when backend endpoint is available
      // const paycheckResponse = await api.get('/accounting/my-paychecks')
      // setPaycheckHistory(paycheckResponse.data?.data || [])
      
    } catch (err) {
      console.error('Error fetching employee accounting data:', err)
      setError(getErrorMessage(err, t('accounting.failedToLoad') || 'Failed to load accounting information'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return t('common.notAvailable') || 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return t('common.notAvailable') || 'N/A'
    return dayjs(dateString).format('DD MMM YYYY')
  }

  const getPaymentTypeLabel = (paymentType) => {
    if (!paymentType) return t('common.notAvailable') || 'N/A'
    return paymentType === 'NET_PAY' 
      ? (t('accounting.netPay') || 'Net Pay')
      : (t('accounting.grossPay') || 'Gross Pay')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

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
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2}>
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
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t('accounting.myAccounting') || 'My Accounting'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('accounting.viewSalaryAndPaychecks') || 'View your salary information and paycheck history'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Salary Information Card */}
        {employeeData && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.8
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <AttachMoney sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('accounting.salaryInformation') || 'Salary Information'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.paymentType') || 'Payment Type'}
                      </Typography>
                      <Chip
                        label={getPaymentTypeLabel(employeeData.paymentType)}
                        size="small"
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.monthlySalary') || 'Monthly Salary'}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                        {formatCurrency(employeeData.salary)}
                      </Typography>
                    </Box>
                    
                    {employeeData.paymentType === 'GROSS_PAY' && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('accounting.grossPayNote') || '* Gross pay is before deductions (taxes, insurance, etc.)'}
                        </Typography>
                      </Box>
                    )}
                    
                    {employeeData.paymentType === 'NET_PAY' && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('accounting.netPayNote') || '* Net pay is your take-home amount after all deductions'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Employee Information Card */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.8
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <AccountCircle sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('accounting.employeeInfo') || 'Employee Information'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.employeeId') || 'Employee ID'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {employeeData.employeeId || t('common.notAvailable')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.position') || 'Position'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {employeeData.position || t('common.notAvailable')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.hireDate') || 'Hire Date'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatDate(employeeData.hireDate)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Bank Account Information Card */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.8
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <AccountBalance sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('accounting.bankAccountInfo') || 'Bank Account Information'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.bankName') || 'Bank Name'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>
                        {employeeData.bankName || t('common.notAvailable')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.accountHolderName') || 'Account Holder Name'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>
                        {employeeData.accountHolderName || t('common.notAvailable')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.iban') || 'IBAN'}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600, 
                          fontFamily: 'monospace',
                          textAlign: 'right',
                          wordBreak: 'break-word'
                        }}
                      >
                        {employeeData.iban || t('common.notAvailable')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('accounting.swiftBic') || 'SWIFT/BIC'}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          textAlign: 'right',
                          wordBreak: 'break-word'
                        }}
                      >
                        {employeeData.swiftBic || t('common.notAvailable')}
                      </Typography>
                    </Box>
                    
                    {employeeData.accountNumber && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('accounting.accountNumber') || 'Account Number'}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            textAlign: 'right',
                            wordBreak: 'break-word'
                          }}
                        >
                          {employeeData.accountNumber}
                        </Typography>
                      </Box>
                    )}
                    
                    {employeeData.bankBranch && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('accounting.bankBranch') || 'Bank Branch'}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            textAlign: 'right',
                            wordBreak: 'break-word',
                            maxWidth: '60%'
                          }}
                        >
                          {employeeData.bankBranch}
                        </Typography>
                      </Box>
                    )}
                    
                    {employeeData.currency && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('accounting.currency') || 'Currency'}
                        </Typography>
                        <Chip
                          label={employeeData.currency}
                          size="small"
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    )}
                    
                    {!employeeData.bankName && !employeeData.iban && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {t('accounting.bankInfoNotProvided') || 'Bank account information has not been provided. Please contact HR to update your banking details.'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Paycheck History */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.8
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Receipt sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('accounting.paycheckHistory') || 'Paycheck History'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {paycheckHistory.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1" color="text.secondary">
                        {t('accounting.noPaychecks') || 'No paycheck history available'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t('accounting.paychecksWillAppear') || 'Your paycheck records will appear here once they are processed'}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {t('accounting.payPeriod') || 'Pay Period'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {t('accounting.paymentDate') || 'Payment Date'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {t('accounting.amount') || 'Amount'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {t('accounting.status') || 'Status'}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paycheckHistory.map((paycheck, index) => (
                            <TableRow key={index}>
                              <TableCell>{paycheck.payPeriod}</TableCell>
                              <TableCell>{formatDate(paycheck.paymentDate)}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#667eea' }}>
                                {formatCurrency(paycheck.amount)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={paycheck.status}
                                  size="small"
                                  color={paycheck.status === 'PAID' ? 'success' : 'default'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  )
}

export default EmployeeAccounting

