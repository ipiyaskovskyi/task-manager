'use client';

import { useState, useCallback, useMemo } from 'react';

export interface UseFormValidationResult<T extends Record<string, string>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setTouched: (field: keyof T) => void;
  validateField: (field: keyof T) => string | undefined;
  validateAll: () => boolean;
  reset: () => void;
  isFormValid: boolean;
}

export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  validators: Record<
    keyof T,
    (value: string, allValues?: T) => string | undefined
  >
): UseFormValidationResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<
    Partial<Record<keyof T, boolean>>
  >({});

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      if (touched[field]) {
        const validator = validators[field];
        if (validator) {
          const error = validator(value, {
            ...values,
            [field]: value,
          });
          setErrors((prev) => ({ ...prev, [field]: error }));
        }
      }
    },
    [touched, validators, values]
  );

  const setTouched = useCallback(
    (field: keyof T) => {
      setTouchedState((prev) => ({ ...prev, [field]: true }));
      const validator = validators[field];
      if (validator) {
        const error = validator(values[field], values);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [validators, values]
  );

  const validateField = useCallback(
    (field: keyof T): string | undefined => {
      const validator = validators[field];
      if (!validator) return undefined;
      return validator(values[field], values);
    },
    [validators, values]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const field in validators) {
      const validator = validators[field];
      const error = validator(values[field], values);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setTouchedState(
      Object.keys(validators).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      )
    );
    return isValid;
  }, [validators, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
  }, [initialValues]);

  const isFormValid = useMemo(() => {
    return (
      Object.keys(validators).every((field) => {
        const validator = validators[field as keyof T];
        return !validator(values[field as keyof T], values);
      }) && Object.values(values).every((value) => value.trim() !== '')
    );
  }, [validators, values]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateField,
    validateAll,
    reset,
    isFormValid,
  };
}
