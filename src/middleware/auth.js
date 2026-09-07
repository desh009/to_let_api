import { supabase } from '../config/supabase.js';

export async function requireSupabaseUser(req, res, next) {
  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'A Supabase Bearer token is required.' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw error || new Error('User not found.');
    req.user = data.user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Your Supabase session is invalid or expired.' });
  }
}
