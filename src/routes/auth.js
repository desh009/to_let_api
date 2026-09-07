import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.js';
import { requireSupabaseUser } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

authRouter.use(authRateLimit);

function validationError(res, parsed) {
  return res.status(422).json({
    error: 'Invalid request data.',
    details: parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

function authResponse(session) {
  return {
    user: {
      uid: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || null,
    },
    idToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
  };
}

function isDuplicateEmailError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  return code === 'email_exists'
    || code === 'user_already_exists'
    || message.includes('already registered')
    || message.includes('already exists');
}

authRouter.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { name: parsed.data.name } },
    });
    if (signUpError || !data.user) {
      throw signUpError || new Error('Unable to create an account.');
    }

    return res.status(201).json({
      data: {
        user: {
          uid: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || null,
        },
        message: 'Check your email and confirm your account before logging in.',
      },
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return res.status(409).json({ error: 'An account already exists with this email.' });
    }
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error || !data.session) throw error || new Error('Unable to create a session.');
    return res.json({ data: authResponse(data.session) });
  } catch (error) {
    if (error.code === 'invalid_credentials') {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    if (error.code === 'email_not_confirmed') {
      return res.status(403).json({ error: 'Please confirm your email before logging in.' });
    }
    return next(error);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const options = process.env.PASSWORD_RESET_REDIRECT_URL
      ? { redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL }
      : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, options);
    if (error) throw error;
  } catch (error) {
    return next(error);
  }

  return res.json({
    message: 'If an account exists for this email, a password-reset link has been sent.',
  });
});

authRouter.post('/reset-password', requireSupabaseUser, async (req, res, next) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: parsed.data.password,
    });
    if (error) throw error;
    return res.json({ message: 'Password has been updated.' });
  } catch (error) {
    return next(error);
  }
});

export { authRouter };
