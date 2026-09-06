import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from '../schemas/auth.js';

const authRouter = Router();
const identityToolkitUrl = 'https://identitytoolkit.googleapis.com/v1';

function firebaseApiKey() {
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) {
    const error = new Error('FIREBASE_WEB_API_KEY is not configured.');
    error.statusCode = 500;
    throw error;
  }
  return key;
}

async function callFirebaseAuth(path, body) {
  const response = await fetch(
    `${identityToolkitUrl}${path}?key=${encodeURIComponent(firebaseApiKey())}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.message || 'Firebase authentication failed.');
    error.firebaseCode = result.error?.message;
    throw error;
  }

  return result;
}

function validationError(res, parsed) {
  return res.status(422).json({
    error: 'Invalid request data.',
    details: parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

function authResponse(result) {
  return {
    user: {
      uid: result.localId,
      email: result.email,
      name: result.displayName || null,
    },
    idToken: result.idToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
  };
}

authRouter.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const createdUser = await callFirebaseAuth('/accounts:signUp', {
      email: parsed.data.email,
      password: parsed.data.password,
      returnSecureToken: true,
    });

    const updatedUser = await callFirebaseAuth('/accounts:update', {
      idToken: createdUser.idToken,
      displayName: parsed.data.name,
      returnSecureToken: true,
    });

    return res.status(201).json({ data: authResponse(updatedUser) });
  } catch (error) {
    if (error.firebaseCode === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: 'An account already exists with this email.' });
    }
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const user = await callFirebaseAuth('/accounts:signInWithPassword', {
      email: parsed.data.email,
      password: parsed.data.password,
      returnSecureToken: true,
    });
    return res.json({ data: authResponse(user) });
  } catch (error) {
    if (['EMAIL_NOT_FOUND', 'INVALID_PASSWORD', 'INVALID_LOGIN_CREDENTIALS'].includes(error.firebaseCode)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    return next(error);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    await callFirebaseAuth('/accounts:sendOobCode', {
      requestType: 'PASSWORD_RESET',
      email: parsed.data.email,
    });
  } catch (error) {
    // Return the same result for every address to avoid exposing account existence.
    if (!error.firebaseCode) return next(error);
  }

  return res.json({
    message: 'If an account exists for this email, a password-reset link has been sent.',
  });
});

export { authRouter };
