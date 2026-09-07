import { z } from 'zod';

const email = z.string().trim().email().max(254);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});
