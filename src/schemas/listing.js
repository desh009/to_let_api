import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  location: z.string().trim().min(2).max(160),
  price: z.coerce.number().nonnegative().max(10000000),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20),
  squareFeet: z.coerce.number().int().positive().max(1000000).optional(),
  description: z.string().trim().max(4000).default(''),
  contactNumber: z.string().trim().min(6).max(30),
  images: z.array(z.string().url()).min(1).max(8),
  category: z.enum(['Bachelor', 'Family', 'Seat', 'Sublet', 'Office']),
  amenities: z.object({
    lift: z.boolean().default(false),
    parking: z.boolean().default(false),
    gasLine: z.boolean().default(false),
    wifi: z.boolean().default(false),
  }).default({}),
  isDirectOwner: z.boolean().default(true),
});
