import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.js';
import { requireSupabaseUser } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const authRouter = Router();

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

authRouter.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { error: createError } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { name: parsed.data.name },
    });
    if (createError) throw createError;

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (loginError || !data.session) throw loginError || new Error('Unable to create a session.');

    return res.status(201).json({ data: authResponse(data.session) });
  } catch (error) {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
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
    await supabase.auth.resetPasswordForEmail(parsed.data.email, options);
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
