import { Router } from 'express';
import { flatsTable, supabase } from '../config/supabase.js';
import { requireSupabaseUser } from '../middleware/auth.js';
import { createListingSchema } from '../schemas/listing.js';

const listingsRouter = Router();

listingsRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const { data, error } = await supabase
      .from(flatsTable)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return res.json({
      data,
    });
  } catch (error) {
    return next(error);
  }
});

listingsRouter.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from(flatsTable)
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

listingsRouter.post('/', requireSupabaseUser, async (req, res, next) => {
  const parsed = createListingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({
      error: 'Invalid listing data.',
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const listing = {
      ...parsed.data,
      image_url: parsed.data.images[0],
      owner_id: req.user.id,
      owner_name: req.user.user_metadata?.name || null,
      owner_email: req.user.email || null,
    };
    const { data, error } = await supabase
      .from(flatsTable)
      .insert(listing)
      .select()
      .single();
    if (error) throw error;

    return res.status(201).json({
      data,
    });
  } catch (error) {
    return next(error);
  }
});

export { listingsRouter };
