import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  location: z.string().trim().min(2).max(160),
  city: z.string().trim().min(2).max(50).default('Khulna'),
  area: z.string().trim().min(2).max(100).optional(),
  price: z.coerce.number().nonnegative().max(10000000),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20),
  squareFeet: z.coerce.number().int().positive().max(1000000).optional(),
  description: z.string().trim().max(4000).default(''),
  contactNumber: z.string().trim().min(6).max(30),
  images: z.array(z.string().url()).min(1).max(8),
  category: z.enum(['Bachelor', 'Family', 'Seat', 'Sublet', 'Office']),
  furnishing: z.enum(['Furnished', 'Unfurnished', 'Semi']).default('Unfurnished'),
  availability: z.enum(['Available now', 'From next month']).default('Available now'),
  availableFrom: z.string().date().optional(),
  amenities: z.object({
    lift: z.boolean().default(false),
    parking: z.boolean().default(false),
    gasLine: z.boolean().default(false),
    generator: z.boolean().default(false),
    water24_7: z.boolean().default(false),
    wifi: z.boolean().default(false),
  }).default({}),
  isDirectOwner: z.boolean().default(true),
});

export const filterListingsSchema = z.object({
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  category: z.enum(['Bachelor', 'Family', 'Seat', 'Sublet', 'Office']).optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  furnishing: z.enum(['Furnished', 'Unfurnished', 'Semi']).optional(),
  availability: z.enum(['Available now', 'From next month']).optional(),
  amenities: z.object({
    lift: z.boolean().optional(),
    parking: z.boolean().optional(),
    gasLine: z.boolean().optional(),
    generator: z.boolean().optional(),
    water24_7: z.boolean().optional(),
    wifi: z.boolean().optional(),
  }).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
