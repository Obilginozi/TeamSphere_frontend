import React from 'react';
import { TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormContext, Controller } from 'react-hook-form';
import dayjs from 'dayjs';

/**
 * Validated DatePicker component that integrates with react-hook-form
 */
const ValidatedDatePicker = ({
  name,
  label,
  required = false,
  validation = {},
  maxDate,
  minDate,
  ...props
}) => {
  const {
    control,
    formState: { errors }
  } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={validation}
      render={({ field }) => (
        <DatePicker
          {...props}
          label={label}
          maxDate={maxDate ? dayjs(maxDate) : undefined}
          minDate={minDate ? dayjs(minDate) : undefined}
          value={field.value ? dayjs(field.value) : null}
          onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
          renderInput={(params) => (
            <TextField
              {...params}
              required={required}
              error={!!errors[name]}
              helperText={errors[name]?.message || props.helperText}
              fullWidth
            />
          )}
        />
      )}
    />
  );
};

export default ValidatedDatePicker;

