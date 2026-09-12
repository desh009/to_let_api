import { Router } from 'express';
import { flatsTable, supabase } from '../config/supabase.js';
import { requireSupabaseUser } from '../middleware/auth.js';
import { createListingSchema, filterListingsSchema } from '../schemas/listing.js';

const listingsRouter = Router();

// Get all listings with advanced filtering
listingsRouter.get('/', async (req, res, next) => {
  try {
    const parsed = filterListingsSchema.safeParse(req.query);
    
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid filter parameters',
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const filters = parsed.data;
    let query = supabase
      .from(flatsTable)
      .select('*', { count: 'exact' });

    // Location filters
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.area) {
      query = query.ilike('area', `%${filters.area}%`);
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    // Property type filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Bedrooms filter
    if (filters.bedrooms !== undefined) {
      if (filters.bedrooms >= 4) {
        query = query.gte('bedrooms', 4);
      } else {
        query = query.eq('bedrooms', filters.bedrooms);
      }
    }

    // Furnishing filter
    if (filters.furnishing) {
      query = query.eq('furnishing', filters.furnishing);
    }

    // Availability filter
    if (filters.availability) {
      query = query.eq('availability', filters.availability);
    }

    // Amenities filters
    if (filters.amenities) {
      Object.entries(filters.amenities).forEach(([key, value]) => {
        if (value === true) {
          query = query.eq(`amenities->${key}`, true);
        }
      });
    }

    // Apply ordering, limit and offset
    query = query
      .order('created_at', { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error, count } = await query;
    
    if (error) throw error;

    return res.json({
      data,
      pagination: {
        total: count,
        offset: filters.offset,
        limit: filters.limit,
        hasMore: count > filters.offset + filters.limit
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Get filter options for dropdowns
listingsRouter.get('/filters/options', async (req, res, next) => {
  try {
    // Get unique cities
    const { data: cities } = await supabase
      .from(flatsTable)
      .select('city')
      .not('city', 'is', null);

    // Get unique areas
    const { data: areas } = await supabase
      .from(flatsTable)
      .select('area')
      .not('area', 'is', null);

    // Get price range
    const { data: priceRange } = await supabase
      .from(flatsTable)
      .select('price')
      .order('price', { ascending: true });

    const uniqueCities = [...new Set(cities?.map(item => item.city) || [])];
    const uniqueAreas = [...new Set(areas?.map(item => item.area) || [])];
    
    const minPrice = priceRange?.[0]?.price || 0;
    const maxPrice = priceRange?.[priceRange.length - 1]?.price || 100000;

    return res.json({
      data: {
        cities: uniqueCities,
        areas: uniqueAreas,
        priceRange: { min: minPrice, max: maxPrice },
        propertyTypes: ['Bachelor', 'Family', 'Seat', 'Sublet', 'Office'],
        bedrooms: [1, 2, 3, '4+'],
        furnishing: ['Furnished', 'Unfurnished', 'Semi'],
        amenities: ['generator', 'lift', 'parking', 'gasLine', 'water24_7', 'wifi'],
        availability: ['Available now', 'From next month']
      }
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
      available_from: parsed.data.availableFrom || null,
      square_feet: parsed.data.squareFeet || null,
      contact_number: parsed.data.contactNumber,
      is_direct_owner: parsed.data.isDirectOwner,
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
