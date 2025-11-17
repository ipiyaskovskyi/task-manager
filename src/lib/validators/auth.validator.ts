import { z } from 'zod';

const mobilePhoneRegex = /^\+?[1-9]\d{1,14}$/;

export const registerSchema = z.object({
  firstname: z
    .string()
    .min(2, 'Firstname must be at least 2 characters')
    .trim(),
  lastname: z.string().min(2, 'Lastname must be at least 2 characters').trim(),
  email: z.string().email('Please enter a valid email address').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobilePhone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === '' || mobilePhoneRegex.test(val.trim()),
      {
        message:
          'Invalid mobile phone format. Use international format (e.g., +1234567890)',
      }
    ),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim(),
  password: z.string().min(1, 'Password is required'),
});
