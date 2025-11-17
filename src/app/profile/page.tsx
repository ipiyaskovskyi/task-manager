'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { Person as PersonIcon, Save as SaveIcon } from '@mui/icons-material';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { fetchProfile, updateProfile } from '@/lib/api/profile';
import type { User } from '@/types';
import { countries } from '@/lib/data/countries';

type ProfileFormValues = {
  firstname: string;
  lastname: string;
  email: string;
  mobilePhone: string;
  country: string;
  city: string;
  address: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formState, setFormState] = useState<ProfileFormValues>({
    firstname: '',
    lastname: '',
    email: '',
    mobilePhone: '',
    country: '',
    city: '',
    address: '',
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProfileFormValues, string>>
  >({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profile = await fetchProfile();
        setUser(profile);
        setFormState({
          firstname: profile.firstname,
          lastname: profile.lastname,
          email: profile.email,
          mobilePhone: profile.mobilePhone || '',
          country: profile.country || '',
          city: profile.city || '',
          address: profile.address || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const validateMobilePhone = useCallback(
    (phone: string): string | undefined => {
      if (!phone || phone.trim() === '') {
        return undefined;
      }
      const trimmed = phone.trim();
      const mobilePhoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!mobilePhoneRegex.test(trimmed)) {
        return 'Invalid mobile phone format. Use international format (e.g., +1234567890)';
      }
      return undefined;
    },
    []
  );

  const updateField = useCallback(
    (field: keyof ProfileFormValues, value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));

      if (field === 'mobilePhone' && value.trim() !== '') {
        const error = validateMobilePhone(value);
        if (error) {
          setFieldErrors((prev) => ({ ...prev, mobilePhone: error }));
        } else {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.mobilePhone;
            return newErrors;
          });
        }
      } else if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      setSuccess(null);
    },
    [fieldErrors, validateMobilePhone]
  );

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof ProfileFormValues, string>> = {};

    if (!formState.firstname.trim()) {
      errors.firstname = 'First name is required';
    }

    if (!formState.lastname.trim()) {
      errors.lastname = 'Last name is required';
    }

    if (!formState.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = 'Invalid email address';
    }

    const mobilePhoneError = validateMobilePhone(formState.mobilePhone);
    if (mobilePhoneError) {
      errors.mobilePhone = mobilePhoneError;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState, validateMobilePhone]);

  const hasFormChanged = useCallback(() => {
    if (!user) return false;
    return (
      formState.firstname !== user.firstname ||
      formState.lastname !== user.lastname ||
      formState.email !== user.email ||
      formState.mobilePhone !== (user.mobilePhone || '') ||
      formState.country !== (user.country || '') ||
      formState.city !== (user.city || '') ||
      formState.address !== (user.address || '')
    );
  }, [formState, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await updateProfile({
        firstname: formState.firstname.trim(),
        lastname: formState.lastname.trim(),
        email: formState.email.trim(),
        mobilePhone: formState.mobilePhone.trim() || null,
        country: formState.country || null,
        city: formState.city.trim() || null,
        address: formState.address.trim() || null,
      });
      setUser(updatedUser);
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (firstname: string, lastname: string): string => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Sidebar>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <PersonIcon color="primary" />
              <Typography variant="h4" component="h1">
                Profile
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : user ? (
              <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Box display="flex" justifyContent="center">
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'primary.main',
                        fontSize: '2rem',
                      }}
                    >
                      {getInitials(formState.firstname, formState.lastname)}
                    </Avatar>
                  </Box>

                  <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="First Name"
                        required
                        value={formState.firstname}
                        onChange={(e) =>
                          updateField('firstname', e.target.value)
                        }
                        error={!!fieldErrors.firstname}
                        helperText={fieldErrors.firstname}
                      />

                      <TextField
                        fullWidth
                        label="Last Name"
                        required
                        value={formState.lastname}
                        onChange={(e) =>
                          updateField('lastname', e.target.value)
                        }
                        error={!!fieldErrors.lastname}
                        helperText={fieldErrors.lastname}
                      />

                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        error={!!fieldErrors.email}
                        helperText={fieldErrors.email}
                      />

                      <TextField
                        fullWidth
                        label="Mobile Phone"
                        type="tel"
                        value={formState.mobilePhone}
                        onChange={(e) =>
                          updateField('mobilePhone', e.target.value)
                        }
                        onBlur={() => {
                          if (formState.mobilePhone.trim()) {
                            const error = validateMobilePhone(
                              formState.mobilePhone
                            );
                            if (error) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                mobilePhone: error,
                              }));
                            } else {
                              setFieldErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.mobilePhone;
                                return newErrors;
                              });
                            }
                          }
                        }}
                        error={!!fieldErrors.mobilePhone}
                        helperText={
                          fieldErrors.mobilePhone ||
                          'Use international format (e.g., +1234567890)'
                        }
                        placeholder="+1234567890"
                      />

                      <FormControl fullWidth error={!!fieldErrors.country}>
                        <InputLabel>Country</InputLabel>
                        <Select
                          value={formState.country || ''}
                          onChange={(e) =>
                            updateField('country', e.target.value)
                          }
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
                        {fieldErrors.country && (
                          <FormHelperText>{fieldErrors.country}</FormHelperText>
                        )}
                      </FormControl>

                      <TextField
                        fullWidth
                        label="City"
                        value={formState.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        error={!!fieldErrors.city}
                        helperText={fieldErrors.city}
                        placeholder="e.g., Kyiv, New York"
                      />

                      <TextField
                        fullWidth
                        label="Address"
                        value={formState.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        error={!!fieldErrors.address}
                        helperText={fieldErrors.address}
                        placeholder="Street address, apartment, etc."
                        multiline
                        rows={2}
                      />

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          User ID: {user.id}
                        </Typography>
                        {user.createdAt && (
                          <Typography variant="body2" color="text.secondary">
                            Member since:{' '}
                            {new Date(user.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </Typography>
                        )}
                      </Box>

                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={isSaving || !hasFormChanged()}
                        fullWidth
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Stack>
                  </form>
                </Stack>
              </Paper>
            ) : (
              <Alert severity="warning">Profile not found</Alert>
            )}
          </Stack>
        </Container>
      </Sidebar>
    </Box>
  );
}
