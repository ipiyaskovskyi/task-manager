'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { useFormValidation } from '@/hooks/useFormValidation';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
} from '@/utils/validation';
import { register } from '@/lib/api/auth';
import { countries } from '@/lib/data/countries';

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { values, errors, touched, setValue, setTouched, validateAll } =
    useFormValidation(
      {
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobilePhone: '',
        country: '',
        city: '',
        address: '',
      },
      {
        firstname: (value) => validateName(value, 'Firstname'),
        lastname: (value) => validateName(value, 'Lastname'),
        email: (value) => validateEmail(value),
        password: (value) => validatePassword(value, 6),
        confirmPassword: (value, allValues) => {
          if (!allValues) return 'Please confirm your password';
          return validateConfirmPassword(allValues.password, value);
        },
        mobilePhone: () => '',
        country: () => '',
        city: () => '',
        address: () => '',
      }
    );

  const isFormValid =
    !errors.firstname &&
    !errors.lastname &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword &&
    values.firstname.trim() !== '' &&
    values.lastname.trim() !== '' &&
    values.email.trim() !== '' &&
    values.password !== '' &&
    values.confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateAll()) {
      return;
    }

    try {
      setIsLoading(true);
      await register({
        email: values.email,
        password: values.password,
        firstname: values.firstname,
        lastname: values.lastname,
        mobilePhone: values.mobilePhone.trim() || null,
        country: values.country || null,
        city: values.city.trim() || null,
        address: values.address.trim() || null,
      });
      router.push('/board');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to sign up. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setValue('password', value);
    if (touched.confirmPassword) {
      setTouched('confirmPassword');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Sign Up
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <TextField
                id="firstname"
                label="Firstname"
                type="text"
                value={values.firstname}
                onChange={(e) => setValue('firstname', e.target.value)}
                onBlur={() => setTouched('firstname')}
                placeholder="Your firstname"
                disabled={isLoading}
                error={!!errors.firstname && !!touched.firstname}
                helperText={touched.firstname ? errors.firstname : ''}
                fullWidth
                required
              />

              <TextField
                id="lastname"
                label="Lastname"
                type="text"
                value={values.lastname}
                onChange={(e) => setValue('lastname', e.target.value)}
                onBlur={() => setTouched('lastname')}
                placeholder="Your lastname"
                disabled={isLoading}
                error={!!errors.lastname && !!touched.lastname}
                helperText={touched.lastname ? errors.lastname : ''}
                fullWidth
                required
              />

              <TextField
                id="email"
                label="Email"
                type="email"
                value={values.email}
                onChange={(e) => setValue('email', e.target.value)}
                onBlur={() => setTouched('email')}
                placeholder="your@email.com"
                disabled={isLoading}
                error={!!errors.email && !!touched.email}
                helperText={touched.email ? errors.email : ''}
                fullWidth
                required
              />

              <TextField
                id="password"
                label="Password"
                type="password"
                value={values.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => setTouched('password')}
                placeholder="••••••••"
                disabled={isLoading}
                error={!!errors.password && !!touched.password}
                helperText={touched.password ? errors.password : ''}
                fullWidth
                required
              />

              <TextField
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={values.confirmPassword}
                onChange={(e) => setValue('confirmPassword', e.target.value)}
                onBlur={() => setTouched('confirmPassword')}
                placeholder="••••••••"
                disabled={isLoading}
                error={!!errors.confirmPassword && !!touched.confirmPassword}
                helperText={
                  touched.confirmPassword ? errors.confirmPassword : ''
                }
                fullWidth
                required
              />

              <TextField
                id="mobilePhone"
                label="Mobile Phone"
                type="tel"
                value={values.mobilePhone}
                onChange={(e) => setValue('mobilePhone', e.target.value)}
                onBlur={() => setTouched('mobilePhone')}
                placeholder="+1234567890"
                disabled={isLoading}
                error={!!errors.mobilePhone && !!touched.mobilePhone}
                helperText={touched.mobilePhone ? errors.mobilePhone : ''}
                fullWidth
              />

              <FormControl
                fullWidth
                error={!!errors.country && !!touched.country}
                disabled={isLoading}
              >
                <InputLabel id="country-label">Country</InputLabel>
                <Select
                  id="country"
                  labelId="country-label"
                  value={values.country || ''}
                  onChange={(e) => setValue('country', e.target.value)}
                  onBlur={() => setTouched('country')}
                  label="Country"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
                {touched.country && errors.country && (
                  <FormHelperText>{errors.country}</FormHelperText>
                )}
              </FormControl>

              <TextField
                id="city"
                label="City"
                type="text"
                value={values.city}
                onChange={(e) => setValue('city', e.target.value)}
                onBlur={() => setTouched('city')}
                placeholder="e.g., Kyiv, New York"
                disabled={isLoading}
                error={!!errors.city && !!touched.city}
                helperText={touched.city ? errors.city : ''}
                fullWidth
              />

              <TextField
                id="address"
                label="Address"
                type="text"
                value={values.address}
                onChange={(e) => setValue('address', e.target.value)}
                onBlur={() => setTouched('address')}
                placeholder="Street address, apartment, etc."
                disabled={isLoading}
                error={!!errors.address && !!touched.address}
                helperText={touched.address ? errors.address : ''}
                fullWidth
                multiline
                rows={2}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading || !isFormValid}
                sx={{ mt: 1 }}
              >
                {isLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={16} color="inherit" />
                    <span>Signing up...</span>
                  </Box>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link href="/login" style={{ textDecoration: 'none' }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
