import { z } from 'zod';

const email = z.string().trim().email().max(254);
const strongPassword = z
  .string()
  .min(12, 'Password must be at least 12 characters long.')
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password: strongPassword,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  password: strongPassword,
});
