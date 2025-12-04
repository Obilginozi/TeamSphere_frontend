import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const Payment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Company information
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'TR',
    address: '',
    taxNumber: '',
    contactPerson: '',
    contactEmail: ''
  });
  
  // Subscription details
  const [subscription, setSubscription] = useState({
    plan: 'STARTER_20',
    billingCycle: 'MONTHLY',
    employeeCount: 20
  });
  
  // Payment details
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: ''
  });

  const subscriptionPlans = [
    {
      id: 'STARTER_20',
      name: 'Starter',
      employees: 20,
      price: { monthly: 49, annual: 39, lifetime: 490 },
      features: ['Basic attendance tracking', 'Leave management', 'Employee directory', 'Basic reports']
    },
    {
      id: 'GROWTH_50',
      name: 'Growth',
      employees: 50,
      price: { monthly: 99, annual: 79, lifetime: 990 },
      features: ['All Starter features', 'Advanced reporting', 'Department management', 'Email notifications']
    },
    {
      id: 'BUSINESS_100',
      name: 'Business',
      employees: 100,
      price: { monthly: 179, annual: 143, lifetime: 1790 },
      features: ['All Growth features', 'Custom fields', 'API access', 'Priority support']
    },
    {
      id: 'ENTERPRISE_150',
      name: 'Enterprise',
      employees: 150,
      price: { monthly: 249, annual: 199, lifetime: 2490 },
      features: ['All Business features', 'SSO integration', 'Custom branding', 'Dedicated support']
    },
    {
      id: 'UNLIMITED',
      name: 'Unlimited',
      employees: 'Unlimited',
      price: { monthly: 399, annual: 319, lifetime: 3990 },
      features: ['All Enterprise features', 'White-label option', 'Custom development', '24/7 support']
    }
  ];

  const paymentMethods = [
    { id: 'STRIPE', name: 'Credit Card', icon: <CreditCardIcon />, description: 'Visa, Mastercard, American Express' },
    { id: 'IYZICO', name: 'iyzico', icon: <AccountBalanceIcon />, description: 'Turkish payment gateway with installments' },
    { id: 'PAYTR', name: 'PayTR', icon: <AccountBalanceIcon />, description: 'Turkish online payment system' },
    { id: 'PAYPAL', name: 'PayPal', icon: <CreditCardIcon />, description: 'PayPal account payment' }
  ];

  const countries = [
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' }
  ];

  const steps = [t('payment.companyInformation'), t('payment.selectPlan'), t('payment.paymentDetails'), t('payment.confirmation')];

  useEffect(() => {
    // Pre-fill company info from URL params if available
    const companyName = searchParams.get('company');
    const email = searchParams.get('email');
    if (companyName) setCompanyInfo(prev => ({ ...prev, name: companyName }));
    if (email) setCompanyInfo(prev => ({ ...prev, email, contactEmail: email }));
  }, [searchParams]);

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubscriptionChange = (field, value) => {
    setSubscription(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentDetailsChange = (field, value) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const calculatePrice = () => {
    const plan = subscriptionPlans.find(p => p.id === subscription.plan);
    if (!plan) return 0;
    
    const basePrice = plan.price[subscription.billingCycle.toLowerCase()];
    return basePrice;
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        companyInfo,
        subscription,
        paymentMethod,
        paymentDetails,
        totalAmount: calculatePrice()
      };

      const response = await api.post('/payment/process', paymentData);
      
      if (response.data.success) {
        setSuccess(t('payment.paymentProcessedSuccessfully'));
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account created successfully! Please login with your credentials.',
              email: companyInfo.contactEmail 
            }
          });
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyInfo = () => (
    <Box>
      <Typography variant="h6" gutterBottom>{t('payment.companyInformation')}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('payment.companyName')}
            value={companyInfo.name}
            onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('payment.contactEmail')}
            type="email"
            value={companyInfo.contactEmail}
            onChange={(e) => handleCompanyInfoChange('contactEmail', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('payment.phoneNumber')}
            value={companyInfo.phone}
            onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t('payment.country')}</InputLabel>
            <Select
              value={companyInfo.country}
              onChange={(e) => handleCompanyInfoChange('country', e.target.value)}
            >
              {countries.map(country => (
                <MenuItem key={country.code} value={country.code}>
                  {country.flag} {t(`payment.${country.code === 'TR' ? 'turkey' : country.code === 'US' ? 'unitedStates' : country.code === 'GB' ? 'unitedKingdom' : country.code === 'DE' ? 'germany' : country.code === 'FR' ? 'france' : country.code === 'IT' ? 'italy' : country.code === 'ES' ? 'spain' : country.code === 'NL' ? 'netherlands' : country.code === 'CA' ? 'canada' : country.code === 'AU' ? 'australia' : country.name.toLowerCase()}`) || country.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('payment.address')}
            multiline
            rows={3}
            value={companyInfo.address}
            onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('payment.taxNumber')}
            value={companyInfo.taxNumber}
            onChange={(e) => handleCompanyInfoChange('taxNumber', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('payment.contactPerson')}
            value={companyInfo.contactPerson}
            onChange={(e) => handleCompanyInfoChange('contactPerson', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPlanSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>{t('payment.selectYourPlan')}</Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">{t('payment.billingCycle')}</FormLabel>
        <RadioGroup
          row
          value={subscription.billingCycle}
          onChange={(e) => handleSubscriptionChange('billingCycle', e.target.value)}
        >
          <FormControlLabel value="MONTHLY" control={<Radio />} label={t('payment.monthly')} />
          <FormControlLabel value="ANNUAL" control={<Radio />} label={t('payment.annual')} />
          <FormControlLabel value="LIFETIME" control={<Radio />} label={t('payment.lifetime')} />
        </RadioGroup>
      </FormControl>

      <Grid container spacing={3}>
        {subscriptionPlans.map(plan => (
          <Grid item xs={12} md={6} lg={4} key={plan.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: subscription.plan === plan.id ? '2px solid' : '1px solid',
                borderColor: subscription.plan === plan.id ? 'primary.main' : 'divider',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => handleSubscriptionChange('plan', plan.id)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>{t(`payment.${plan.name.toLowerCase()}`) || plan.name}</Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  ${plan.price[subscription.billingCycle.toLowerCase()]}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /{subscription.billingCycle.toLowerCase()}
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {plan.employees === 'Unlimited' ? t('payment.unlimitedEmployees') : t('payment.upToEmployees', { count: plan.employees })}
                </Typography>
                <Divider sx={{ my: 2 }} />
                {plan.features.map((feature, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    ✓ {feature}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderPaymentDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>{t('payment.paymentDetails')}</Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">{t('payment.paymentMethod')}</FormLabel>
        <RadioGroup
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          {paymentMethods.map(method => (
            <FormControlLabel
              key={method.id}
              value={method.id}
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {method.icon}
                  <Box>
                    <Typography variant="body1">{method.id === 'STRIPE' ? t('payment.creditCard') : method.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.id === 'STRIPE' ? t('payment.visaMastercardAmex') : 
                       method.id === 'IYZICO' ? t('payment.turkishPaymentGateway') :
                       method.id === 'PAYTR' ? t('payment.turkishOnlinePayment') :
                       method.id === 'PAYPAL' ? t('payment.paypalAccountPayment') : method.description}
                    </Typography>
                  </Box>
                </Box>
              }
            />
          ))}
        </RadioGroup>
      </FormControl>

      {paymentMethod === 'STRIPE' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('payment.cardNumber')}
              value={paymentDetails.cardNumber}
              onChange={(e) => handlePaymentDetailsChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('payment.expiryDate')}
              value={paymentDetails.expiryDate}
              onChange={(e) => handlePaymentDetailsChange('expiryDate', e.target.value)}
              placeholder="MM/YY"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('payment.cvv')}
              value={paymentDetails.cvv}
              onChange={(e) => handlePaymentDetailsChange('cvv', e.target.value)}
              placeholder="123"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('payment.cardholderName')}
              value={paymentDetails.cardholderName}
              onChange={(e) => handlePaymentDetailsChange('cardholderName', e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>{t('payment.orderSummary')}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>{t('payment.plan')}: {subscriptionPlans.find(p => p.id === subscription.plan)?.name}</Typography>
          <Typography>${calculatePrice()}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>{t('payment.billingCycle')}: {subscription.billingCycle}</Typography>
          <Typography>-</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">{t('payment.total')}</Typography>
          <Typography variant="h6">${calculatePrice()}</Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderConfirmation = () => (
    <Box>
      <Typography variant="h6" gutterBottom>{t('payment.confirmYourOrder')}</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>{t('payment.companyInformation')}</Typography>
            <Typography variant="body2">{companyInfo.name}</Typography>
            <Typography variant="body2">{companyInfo.contactEmail}</Typography>
            <Typography variant="body2">{companyInfo.phone}</Typography>
            <Typography variant="body2">{companyInfo.address}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>{t('payment.subscriptionDetails')}</Typography>
            <Typography variant="body2">
              {t('payment.plan')}: {subscriptionPlans.find(p => p.id === subscription.plan)?.name}
            </Typography>
            <Typography variant="body2">
              {t('payment.billingCycle')}: {subscription.billingCycle}
            </Typography>
            <Typography variant="body2">
              {t('payment.total')}: ${calculatePrice()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="success" />
          <Typography variant="body2">
            Your payment is secured with SSL encryption. We never store your payment information.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0: return renderCompanyInfo();
      case 1: return renderPlanSelection();
      case 2: return renderPaymentDetails();
      case 3: return renderConfirmation();
      default: return 'Unknown step';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        {t('pageTitles.payment')}
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
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handlePayment}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
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
              {loading ? t('payment.processing') : t('payment.completePayment')}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
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
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Payment;
