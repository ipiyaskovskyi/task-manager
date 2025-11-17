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
} from '@mui/material';
import { useFormValidation } from '@/hooks/useFormValidation';
import { validateEmail, validatePassword } from '@/utils/validation';
import { login } from '@/lib/api/auth';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { values, errors, touched, setValue, setTouched, validateAll } =
    useFormValidation(
      { email: '', password: '' },
      {
        email: (value) => validateEmail(value),
        password: (value) => validatePassword(value, 0),
      }
    );

  const isFormValid =
    !errors.email &&
    !errors.password &&
    values.email.trim() !== '' &&
    values.password !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateAll()) {
      return;
    }

    try {
      setIsLoading(true);
      await login({
        email: values.email,
        password: values.password,
      });
      router.push('/board');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
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
            Sign In
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
                onChange={(e) => setValue('password', e.target.value)}
                onBlur={() => setTouched('password')}
                placeholder="••••••••"
                disabled={isLoading}
                error={!!errors.password && !!touched.password}
                helperText={touched.password ? errors.password : ''}
                fullWidth
                required
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
                    <span>Signing in...</span>
                  </Box>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ textDecoration: 'none' }}>
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
