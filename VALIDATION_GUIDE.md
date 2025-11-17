# Frontend Validation Guide

This guide explains how to use the validation system implemented in the TeamSphere frontend.

## Overview

The frontend now includes:
- **Validation Utility** (`utils/validation.js`) - Common validation rules and patterns
- **Validated Components** - Reusable form components with built-in validation
- **React Hook Form Integration** - Form validation using react-hook-form

## Validation Components

### ValidatedTextField
A TextField component with built-in validation:

```jsx
import ValidatedTextField from '../components/ValidatedTextField';
import { fieldValidations } from '../utils/validation';

<ValidatedTextField
  name="email"
  label="Email"
  type="email"
  required
  validation={fieldValidations.email}
/>
```

### ValidatedSelect
A Select component with built-in validation:

```jsx
import ValidatedSelect from '../components/ValidatedSelect';

<ValidatedSelect
  name="department"
  label="Department"
  options={[
    { value: '1', label: 'IT' },
    { value: '2', label: 'HR' }
  ]}
  required
  validation={{
    required: validationRules.required('Department is required')
  }}
/>
```

### ValidatedDatePicker
A DatePicker component with built-in validation:

```jsx
import ValidatedDatePicker from '../components/ValidatedDatePicker';

<ValidatedDatePicker
  name="hireDate"
  label="Hire Date"
  required
  validation={fieldValidations.hireDate}
  maxDate={new Date()}
/>
```

## Using React Hook Form

### Basic Form Setup

```jsx
import { useForm, FormProvider } from 'react-hook-form';
import ValidatedTextField from '../components/ValidatedTextField';
import { fieldValidations } from '../utils/validation';

const MyForm = () => {
  const methods = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = (data) => {
    console.log('Form data:', data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <ValidatedTextField
          name="email"
          label="Email"
          validation={fieldValidations.email}
        />
        <ValidatedTextField
          name="password"
          label="Password"
          type="password"
          validation={fieldValidations.password}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
};
```

## Predefined Validation Rules

### Common Field Validations

Available in `fieldValidations` object:

- `email` - Email validation
- `password` - Password with strength requirements
- `phone` - Phone number validation
- `phoneOptional` - Optional phone validation
- `firstName` - First name (2-50 chars, letters only)
- `lastName` - Last name (2-50 chars, letters only)
- `employeeId` - Employee ID format
- `postalCode` - Postal code format
- `domain` - Domain name format
- `url` - URL format
- `taxNumber` - Tax number format
- `salary` - Salary (positive number)
- `date` - Date validation
- `hireDate` - Hire date (past date)
- `birthDate` - Birth date (past, age 16-100)
- `creditCard` - Credit card number
- `cvv` - CVV code
- `expiryDate` - Card expiry date

### Usage Example

```jsx
import { fieldValidations } from '../utils/validation';

<ValidatedTextField
  name="email"
  label="Email"
  validation={fieldValidations.email}
/>

<ValidatedTextField
  name="firstName"
  label="First Name"
  validation={fieldValidations.firstName}
/>
```

## Custom Validation Rules

### Using validationRules

```jsx
import { validationRules } from '../utils/validation';

<ValidatedTextField
  name="customField"
  label="Custom Field"
  validation={{
    required: validationRules.required('This field is required'),
    minLength: validationRules.minLength(5, 'Must be at least 5 characters'),
    maxLength: validationRules.maxLength(20, 'Must not exceed 20 characters'),
    pattern: validationRules.pattern(/^[A-Z]+$/, 'Must be uppercase letters only')
  }}
/>
```

### Custom Validation Function

```jsx
<ValidatedTextField
  name="username"
  label="Username"
  validation={{
    required: validationRules.required('Username is required'),
    validate: validationRules.validate(
      (value) => value.length >= 3 || 'Username must be at least 3 characters'
    )
  }}
/>
```

## Validation Patterns

Available patterns in `patterns` object:

- `email` - Email regex
- `phone` - Phone number regex
- `phoneInternational` - International phone regex
- `url` - URL regex
- `alphanumeric` - Letters and numbers only
- `lettersOnly` - Letters only
- `numbersOnly` - Numbers only
- `postalCode` - Postal code regex
- `employeeId` - Employee ID regex
- `domain` - Domain name regex
- `password` - Strong password regex
- `creditCard` - Credit card regex
- `cvv` - CVV regex
- `expiryDate` - Expiry date regex (MM/YY)

## Complete Form Example

```jsx
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ValidatedTextField from '../components/ValidatedTextField';
import ValidatedSelect from '../components/ValidatedSelect';
import ValidatedDatePicker from '../components/ValidatedDatePicker';
import { fieldValidations, validationRules } from '../utils/validation';

const EmployeeForm = ({ open, onClose, onSave, employee }) => {
  const methods = useForm({
    defaultValues: {
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      departmentId: '',
      hireDate: '',
      salary: ''
    }
  });

  useEffect(() => {
    if (employee) {
      methods.reset({
        employeeId: employee.employeeId || '',
        firstName: employee.firstName || '',
        // ... other fields
      });
    }
  }, [employee, methods]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Employee</DialogTitle>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="employeeId"
                  label="Employee ID"
                  required
                  validation={fieldValidations.employeeId}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="position"
                  label="Position"
                  required
                  validation={{
                    required: validationRules.required('Position is required'),
                    maxLength: validationRules.maxLength(100)
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="firstName"
                  label="First Name"
                  required
                  validation={fieldValidations.firstName}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="lastName"
                  label="Last Name"
                  required
                  validation={fieldValidations.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <ValidatedTextField
                  name="email"
                  label="Email"
                  type="email"
                  required
                  validation={fieldValidations.email}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="phone"
                  label="Phone"
                  validation={fieldValidations.phoneOptional}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedDatePicker
                  name="hireDate"
                  label="Hire Date"
                  required
                  validation={fieldValidations.hireDate}
                />
              </Grid>
              <Grid item xs={6}>
                <ValidatedTextField
                  name="salary"
                  label="Salary"
                  type="number"
                  validation={fieldValidations.salary}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
};
```

## Best Practices

1. **Always use FormProvider** when using validated components
2. **Use predefined validations** from `fieldValidations` when possible
3. **Provide clear error messages** in validation rules
4. **Reset form** when closing dialogs or canceling
5. **Handle form state** properly with `useEffect` when editing existing data

## Migration Guide

### Before (Basic State)

```jsx
const [email, setEmail] = useState('');

<TextField
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### After (With Validation)

```jsx
const methods = useForm({ defaultValues: { email: '' } });

<FormProvider {...methods}>
  <ValidatedTextField
    name="email"
    validation={fieldValidations.email}
  />
</FormProvider>
```

## Error Display

Validation errors are automatically displayed:
- Error state (red border) on invalid fields
- Helper text showing the error message
- Form submission is blocked until all validations pass

## Testing

Forms with validation can be tested by:
1. Submitting empty forms (should show required errors)
2. Entering invalid data (should show format errors)
3. Entering valid data (should submit successfully)

