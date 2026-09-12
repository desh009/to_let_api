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

// Create a new listing (Post Listing)
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
      title: parsed.data.title,
      location: parsed.data.location,
      city: parsed.data.city || 'Khulna',
      area: parsed.data.area || null,
      price: parsed.data.price,
      bedrooms: parsed.data.bedrooms,
      bathrooms: parsed.data.bathrooms,
      description: parsed.data.description || '',
      contact_number: parsed.data.contactNumber,
      images: parsed.data.images,
      image_url: parsed.data.images[0],
      category: parsed.data.category,
      furnishing: parsed.data.furnishing || 'Unfurnished',
      availability: parsed.data.availability || 'Available now',
      available_from: parsed.data.availableFrom || null,
      square_feet: parsed.data.squareFeet || null,
      amenities: parsed.data.amenities || {},
      is_direct_owner: parsed.data.isDirectOwner !== false, // Default true from screen
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
      success: true,
      message: 'Listing created successfully. It will be reviewed and live within 2 hours.',
      data,
    });
  } catch (error) {
    return next(error);
  }
});

// Update an existing listing
listingsRouter.patch('/:id', requireSupabaseUser, async (req, res, next) => {
  try {
    // First, check if the listing exists and belongs to the user
    const { data: existing, error: fetchError } = await supabase
      .from(flatsTable)
      .select('*')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing) {
      return res.status(404).json({ 
        error: 'Listing not found or you do not have permission to edit it.' 
      });
    }

    const parsed = createListingSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        error: 'Invalid listing data.',
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const updates = {};
    
    if (parsed.data.title) updates.title = parsed.data.title;
    if (parsed.data.location) updates.location = parsed.data.location;
    if (parsed.data.city) updates.city = parsed.data.city;
    if (parsed.data.area) updates.area = parsed.data.area;
    if (parsed.data.price !== undefined) updates.price = parsed.data.price;
    if (parsed.data.bedrooms !== undefined) updates.bedrooms = parsed.data.bedrooms;
    if (parsed.data.bathrooms !== undefined) updates.bathrooms = parsed.data.bathrooms;
    if (parsed.data.description) updates.description = parsed.data.description;
    if (parsed.data.contactNumber) updates.contact_number = parsed.data.contactNumber;
    if (parsed.data.images) {
      updates.images = parsed.data.images;
      updates.image_url = parsed.data.images[0];
    }
    if (parsed.data.category) updates.category = parsed.data.category;
    if (parsed.data.furnishing) updates.furnishing = parsed.data.furnishing;
    if (parsed.data.availability) updates.availability = parsed.data.availability;
    if (parsed.data.availableFrom) updates.available_from = parsed.data.availableFrom;
    if (parsed.data.squareFeet) updates.square_feet = parsed.data.squareFeet;
    if (parsed.data.amenities) updates.amenities = parsed.data.amenities;
    if (parsed.data.isDirectOwner !== undefined) updates.is_direct_owner = parsed.data.isDirectOwner;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(flatsTable)
      .update(updates)
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Listing updated successfully.',
      data,
    });
  } catch (error) {
    return next(error);
  }
});

// Delete a listing
listingsRouter.delete('/:id', requireSupabaseUser, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from(flatsTable)
      .delete()
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ 
        error: 'Listing not found or you do not have permission to delete it.' 
      });
    }

    return res.json({
      success: true,
      message: 'Listing deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
});

// Get user's own listings
listingsRouter.get('/my/listings', requireSupabaseUser, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const { data, error, count } = await supabase
      .from(flatsTable)
      .select('*', { count: 'exact' })
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.json({
      data,
      pagination: {
        total: count,
        offset,
        limit,
        hasMore: count > offset + limit
      }
    });
  } catch (error) {
    return next(error);
  }
});

export { listingsRouter };
