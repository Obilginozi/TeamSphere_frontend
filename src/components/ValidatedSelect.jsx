import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';

/**
 * Validated Select component that integrates with react-hook-form
 * Can be used with or without FormProvider
 */
const ValidatedSelect = ({
  name,
  label,
  options = [],
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
    console.warn(`ValidatedSelect "${name}" must be used inside FormProvider or have control prop`);
    return (
      <FormControl fullWidth required={required}>
        <InputLabel>{label}</InputLabel>
        <Select {...props} label={label}>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={validation}
      render={({ field }) => (
        <FormControl fullWidth error={!!errors[name]} required={required}>
          <InputLabel>{label}</InputLabel>
          <Select {...field} {...props} label={label}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {errors[name] && (
            <FormHelperText>{errors[name]?.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default ValidatedSelect;

