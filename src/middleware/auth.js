import { initializeFirebase } from '../config/firebase.js';

export async function requireFirebaseUser(req, res, next) {
  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'A Firebase Bearer token is required.' });
  }

  try {
    const { admin } = initializeFirebase();
    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Your Firebase session is invalid or expired.' });
  }
}
