import React from 'react';
import { TextField } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';

/**
 * Validated TextField component that integrates with react-hook-form
 * Can be used with or without FormProvider
 */
const ValidatedTextField = ({
  name,
  label,
  type = 'text',
  required = false,
  validation = {},
  control: externalControl,
  ...props
}) => {
  let control, errors;
  
  try {
    const formContext = useFormContext();
    control = formContext.control;
    errors = formContext.formState.errors;
  } catch {
    // Not inside FormProvider, use external control
    control = externalControl;
    errors = {};
  }

  if (!control) {
    console.warn(`ValidatedTextField "${name}" must be used inside FormProvider or have control prop`);
    return <TextField {...props} label={label} type={type} required={required} fullWidth />;
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={validation}
      render={({ field: { onChange, onBlur, value, ref, ...field } }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          type={type}
          required={required}
          error={!!errors[name]}
          helperText={errors[name]?.message || props.helperText}
          fullWidth
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          inputRef={ref}
        />
      )}
    />
  );
};

export default ValidatedTextField;

