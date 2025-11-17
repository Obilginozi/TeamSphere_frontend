/**
 * Validation utility functions and rules for form validation
 */

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  phoneInternational: /^\+?[1-9]\d{1,14}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  lettersOnly: /^[a-zA-Z\s]+$/,
  numbersOnly: /^\d+$/,
  postalCode: /^[A-Z0-9\s\-]+$/i,
  employeeId: /^[A-Z0-9\-]+$/i,
  cardId: /^[A-Z0-9]+$/i,
  domain: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  taxNumber: /^[A-Z0-9]+$/i,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  cvv: /^\d{3,4}$/,
  expiryDate: /^(0[1-9]|1[0-2])\/\d{2}$/
};

/**
 * Validation rules object for react-hook-form
 */
export const validationRules = {
  required: (message = 'This field is required') => ({
    value: true,
    message
  }),

  email: (message = 'Please enter a valid email address') => ({
    value: patterns.email,
    message
  }),

  minLength: (min, message) => ({
    value: min,
    message: message || `Minimum length is ${min} characters`
  }),

  maxLength: (max, message) => ({
    value: max,
    message: message || `Maximum length is ${max} characters`
  }),

  pattern: (pattern, message) => ({
    value: pattern,
    message
  }),

  phone: (message = 'Please enter a valid phone number') => ({
    value: patterns.phone,
    message
  }),

  phoneInternational: (message = 'Please enter a valid international phone number') => ({
    value: patterns.phoneInternational,
    message
  }),

  url: (message = 'Please enter a valid URL') => ({
    value: patterns.url,
    message
  }),

  alphanumeric: (message = 'Only letters and numbers are allowed') => ({
    value: patterns.alphanumeric,
    message
  }),

  lettersOnly: (message = 'Only letters are allowed') => ({
    value: patterns.lettersOnly,
    message
  }),

  numbersOnly: (message = 'Only numbers are allowed') => ({
    value: patterns.numbersOnly,
    message
  }),

  postalCode: (message = 'Please enter a valid postal code') => ({
    value: patterns.postalCode,
    message
  }),

  employeeId: (message = 'Please enter a valid employee ID') => ({
    value: patterns.employeeId,
    message
  }),

  domain: (message = 'Please enter a valid domain name') => ({
    value: patterns.domain,
    message
  }),

  taxNumber: (message = 'Please enter a valid tax number') => ({
    value: patterns.taxNumber,
    message
  }),

  password: (message = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character') => ({
    value: patterns.password,
    message
  }),

  min: (min, message) => ({
    value: min,
    message: message || `Minimum value is ${min}`
  }),

  max: (max, message) => ({
    value: max,
    message: message || `Maximum value is ${max}`
  }),

  validate: (validateFn, message) => ({
    validate: (value) => validateFn(value) || message
  }),

  date: (message = 'Please enter a valid date') => ({
    validate: (value) => {
      if (!value) return true; // Optional field
      const date = new Date(value);
      return !isNaN(date.getTime()) || message;
    }
  }),

  dateRange: (minDate, maxDate, message) => ({
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Please enter a valid date';
      if (minDate && date < new Date(minDate)) {
        return message || `Date must be after ${minDate}`;
      }
      if (maxDate && date > new Date(maxDate)) {
        return message || `Date must be before ${maxDate}`;
      }
      return true;
    }
  }),

  futureDate: (message = 'Date must be in the future') => ({
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return date > new Date() || message;
    }
  }),

  pastDate: (message = 'Date must be in the past') => ({
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return date < new Date() || message;
    }
  }),

  creditCard: (message = 'Please enter a valid credit card number') => ({
    value: patterns.creditCard,
    message
  }),

  cvv: (message = 'Please enter a valid CVV') => ({
    value: patterns.cvv,
    message
  }),

  expiryDate: (message = 'Please enter a valid expiry date (MM/YY)') => ({
    value: patterns.expiryDate,
    message
  }),

  confirmPassword: (passwordField, message = 'Passwords do not match') => ({
    validate: (value, formValues) => {
      return value === formValues[passwordField] || message;
    }
  }),

  fileSize: (maxSizeMB, message) => ({
    validate: (files) => {
      if (!files || files.length === 0) return true;
      const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
      const file = files[0];
      return file.size <= maxSize || (message || `File size must be less than ${maxSizeMB}MB`);
    }
  }),

  fileType: (allowedTypes, message) => ({
    validate: (files) => {
      if (!files || files.length === 0) return true;
      const file = files[0];
      const fileType = file.type || file.name.split('.').pop().toLowerCase();
      const allowed = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
      return allowed.some(type => fileType.includes(type)) || (message || `File type must be one of: ${allowed.join(', ')}`);
    }
  }),

  positiveNumber: (message = 'Must be a positive number') => ({
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      return (!isNaN(num) && num > 0) || message;
    }
  }),

  nonNegativeNumber: (message = 'Must be a non-negative number') => ({
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      return (!isNaN(num) && num >= 0) || message;
    }
  }),

  percentage: (message = 'Must be a percentage between 0 and 100') => ({
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      return (!isNaN(num) && num >= 0 && num <= 100) || message;
    }
  })
};

/**
 * Common validation schemas for different field types
 */
export const fieldValidations = {
  email: {
    required: validationRules.required('Email is required'),
    email: validationRules.email()
  },

  password: {
    required: validationRules.required('Password is required'),
    minLength: validationRules.minLength(6, 'Password must be at least 6 characters'),
    password: validationRules.password()
  },

  passwordLogin: {
    required: validationRules.required('Password is required'),
    minLength: validationRules.minLength(6, 'Password must be at least 6 characters')
  },

  phone: {
    required: validationRules.required('Phone number is required'),
    phone: validationRules.phone()
  },

  phoneOptional: {
    phone: validationRules.phone()
  },

  name: {
    required: validationRules.required('Name is required'),
    minLength: validationRules.minLength(2, 'Name must be at least 2 characters'),
    maxLength: validationRules.maxLength(50, 'Name must not exceed 50 characters'),
    lettersOnly: validationRules.lettersOnly()
  },

  firstName: {
    required: validationRules.required('First name is required'),
    minLength: validationRules.minLength(2, 'First name must be at least 2 characters'),
    maxLength: validationRules.maxLength(50, 'First name must not exceed 50 characters'),
    lettersOnly: validationRules.lettersOnly()
  },

  lastName: {
    required: validationRules.required('Last name is required'),
    minLength: validationRules.minLength(2, 'Last name must be at least 2 characters'),
    maxLength: validationRules.maxLength(50, 'Last name must not exceed 50 characters'),
    lettersOnly: validationRules.lettersOnly()
  },

  employeeId: {
    required: validationRules.required('Employee ID is required'),
    employeeId: validationRules.employeeId(),
    minLength: validationRules.minLength(3, 'Employee ID must be at least 3 characters'),
    maxLength: validationRules.maxLength(20, 'Employee ID must not exceed 20 characters')
  },

  postalCode: {
    required: validationRules.required('Postal code is required'),
    postalCode: validationRules.postalCode(),
    maxLength: validationRules.maxLength(20, 'Postal code must not exceed 20 characters')
  },

  domain: {
    required: validationRules.required('Domain is required'),
    domain: validationRules.domain(),
    maxLength: validationRules.maxLength(100, 'Domain must not exceed 100 characters')
  },

  companyName: {
    required: validationRules.required('Company name is required'),
    minLength: validationRules.minLength(2, 'Company name must be at least 2 characters'),
    maxLength: validationRules.maxLength(100, 'Company name must not exceed 100 characters')
  },

  url: {
    required: validationRules.required('URL is required'),
    url: validationRules.url()
  },

  taxNumber: {
    required: validationRules.required('Tax number is required'),
    taxNumber: validationRules.taxNumber(),
    maxLength: validationRules.maxLength(50, 'Tax number must not exceed 50 characters')
  },

  salary: {
    required: validationRules.required('Salary is required'),
    positiveNumber: validationRules.positiveNumber('Salary must be a positive number'),
    max: validationRules.max(999999999, 'Salary must not exceed 999,999,999')
  },

  date: {
    required: validationRules.required('Date is required'),
    date: validationRules.date()
  },

  dateOptional: {
    date: validationRules.date()
  },

  hireDate: {
    required: validationRules.required('Hire date is required'),
    date: validationRules.date(),
    pastDate: validationRules.pastDate('Hire date must be in the past')
  },

  birthDate: {
    required: validationRules.required('Birth date is required'),
    date: validationRules.date(),
    pastDate: validationRules.pastDate('Birth date must be in the past'),
    validate: validationRules.validate((value) => {
      const date = new Date(value);
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 16 && age <= 100 || 'Age must be between 16 and 100 years';
    }, 'Age must be between 16 and 100 years')
  },

  creditCard: {
    required: validationRules.required('Credit card number is required'),
    creditCard: validationRules.creditCard()
  },

  cvv: {
    required: validationRules.required('CVV is required'),
    cvv: validationRules.cvv()
  },

  expiryDate: {
    required: validationRules.required('Expiry date is required'),
    expiryDate: validationRules.expiryDate(),
    validate: validationRules.validate((value) => {
      if (!value) return true;
      const [month, year] = value.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      return expiry > new Date() || 'Card has expired';
    }, 'Card has expired')
  }
};

/**
 * Helper function to combine multiple validation rules
 */
export const combineValidations = (...rules) => {
  return rules.reduce((acc, rule) => ({ ...acc, ...rule }), {});
};

/**
 * Custom validation functions
 */
export const validators = {
  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    return patterns.email.test(email);
  },

  /**
   * Validate phone number
   */
  isValidPhone: (phone) => {
    return patterns.phone.test(phone);
  },

  /**
   * Validate URL
   */
  isValidUrl: (url) => {
    return patterns.url.test(url);
  },

  /**
   * Validate password strength
   */
  isStrongPassword: (password) => {
    return patterns.password.test(password);
  },

  /**
   * Validate date is in the past
   */
  isPastDate: (date) => {
    return new Date(date) < new Date();
  },

  /**
   * Validate date is in the future
   */
  isFutureDate: (date) => {
    return new Date(date) > new Date();
  },

  /**
   * Validate age is within range
   */
  isValidAge: (birthDate, minAge = 16, maxAge = 100) => {
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return age >= minAge && age <= maxAge;
  },

  /**
   * Validate file size
   */
  isValidFileSize: (file, maxSizeMB) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    return file.size <= maxSize;
  },

  /**
   * Validate file type
   */
  isValidFileType: (file, allowedTypes) => {
    const fileType = file.type || file.name.split('.').pop().toLowerCase();
    const allowed = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    return allowed.some(type => fileType.includes(type));
  }
};

