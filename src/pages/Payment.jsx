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

  const steps = ['Company Information', 'Select Plan', 'Payment Details', 'Confirmation'];

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

      const response = await api.post('/api/payment/process', paymentData);
      
      if (response.data.success) {
        setSuccess('Payment processed successfully! Your account is being set up...');
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
      <Typography variant="h6" gutterBottom>Company Information</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company Name"
            value={companyInfo.name}
            onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Email"
            type="email"
            value={companyInfo.contactEmail}
            onChange={(e) => handleCompanyInfoChange('contactEmail', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={companyInfo.phone}
            onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Country</InputLabel>
            <Select
              value={companyInfo.country}
              onChange={(e) => handleCompanyInfoChange('country', e.target.value)}
            >
              {countries.map(country => (
                <MenuItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={3}
            value={companyInfo.address}
            onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tax Number"
            value={companyInfo.taxNumber}
            onChange={(e) => handleCompanyInfoChange('taxNumber', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Person"
            value={companyInfo.contactPerson}
            onChange={(e) => handleCompanyInfoChange('contactPerson', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPlanSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Select Your Plan</Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">Billing Cycle</FormLabel>
        <RadioGroup
          row
          value={subscription.billingCycle}
          onChange={(e) => handleSubscriptionChange('billingCycle', e.target.value)}
        >
          <FormControlLabel value="MONTHLY" control={<Radio />} label="Monthly" />
          <FormControlLabel value="ANNUAL" control={<Radio />} label="Annual (Save 20%)" />
          <FormControlLabel value="LIFETIME" control={<Radio />} label="Lifetime (10x Monthly)" />
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
                <Typography variant="h6" gutterBottom>{plan.name}</Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  ${plan.price[subscription.billingCycle.toLowerCase()]}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /{subscription.billingCycle.toLowerCase()}
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Up to {plan.employees} employees
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
      <Typography variant="h6" gutterBottom>Payment Details</Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">Payment Method</FormLabel>
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
                    <Typography variant="body1">{method.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.description}
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
              label="Card Number"
              value={paymentDetails.cardNumber}
              onChange={(e) => handlePaymentDetailsChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Expiry Date"
              value={paymentDetails.expiryDate}
              onChange={(e) => handlePaymentDetailsChange('expiryDate', e.target.value)}
              placeholder="MM/YY"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CVV"
              value={paymentDetails.cvv}
              onChange={(e) => handlePaymentDetailsChange('cvv', e.target.value)}
              placeholder="123"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Cardholder Name"
              value={paymentDetails.cardholderName}
              onChange={(e) => handlePaymentDetailsChange('cardholderName', e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>Order Summary</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Plan: {subscriptionPlans.find(p => p.id === subscription.plan)?.name}</Typography>
          <Typography>${calculatePrice()}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Billing: {subscription.billingCycle}</Typography>
          <Typography>-</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Total</Typography>
          <Typography variant="h6">${calculatePrice()}</Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderConfirmation = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Confirm Your Order</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Company Information</Typography>
            <Typography variant="body2">{companyInfo.name}</Typography>
            <Typography variant="body2">{companyInfo.contactEmail}</Typography>
            <Typography variant="body2">{companyInfo.phone}</Typography>
            <Typography variant="body2">{companyInfo.address}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Subscription Details</Typography>
            <Typography variant="body2">
              Plan: {subscriptionPlans.find(p => p.id === subscription.plan)?.name}
            </Typography>
            <Typography variant="body2">
              Billing: {subscription.billingCycle}
            </Typography>
            <Typography variant="body2">
              Total: ${calculatePrice()}
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Get Started with TeamSphere
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
            >
              {loading ? 'Processing...' : 'Complete Payment'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
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
