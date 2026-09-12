# API Testing Guide

## Prerequisites
1. Install Node.js (>=20)
2. Install dependencies: `npm install`
3. Set up Supabase database with the schema from `supabase/schema.sql`
4. Add sample data from `sample-data.sql`
5. Configure `.env` file with Supabase credentials

## Start the Server
```bash
npm run dev
```

## Test Endpoints

### 1. Get Filter Options
```bash
curl "http://localhost:3000/api/listings/filters/options"
```

Expected Response:
```json
{
  "data": {
    "cities": ["Khulna", "Dhaka", "Chittagong"],
    "areas": ["Khulna Sadar", "Daulatpur", "Khan Jahan Ali"],
    "priceRange": { "min": 5000, "max": 35000 },
    "propertyTypes": ["Bachelor", "Family", "Seat", "Sublet", "Office"],
    "bedrooms": [1, 2, 3, "4+"],
    "furnishing": ["Furnished", "Unfurnished", "Semi"],
    "amenities": ["generator", "lift", "parking", "gasLine", "water24_7", "wifi"],
    "availability": ["Available now", "From next month"]
  }
}
```

### 2. Filter by City and Price Range (Screen 1 filters)
```bash
curl "http://localhost:3000/api/listings?city=Khulna&minPrice=10000&maxPrice=20000"
```

### 3. Filter by Property Type and Bedrooms
```bash
curl "http://localhost:3000/api/listings?category=Family&bedrooms=2"
```

### 4. Filter by Furnishing and Amenities (Screen 2 filters)
```bash
curl "http://localhost:3000/api/listings?furnishing=Furnished&amenities.lift=true&amenities.parking=true"
```

### 5. Combined Advanced Filters
```bash
curl "http://localhost:3000/api/listings?city=Khulna&category=Bachelor&minPrice=8000&maxPrice=15000&bedrooms=1&furnishing=Furnished&amenities.wifi=true&availability=Available%20now"
```

### 6. Test Pagination
```bash
curl "http://localhost:3000/api/listings?limit=5&offset=0"
```

## Sample Filter Combinations

### Screen 1 Implementation
- Location: Khulna, Bangladesh ✓
- Price Range: ৳10,000 - ৳20,000 ✓
- Property Type: Family ✓  
- Bedrooms: 2 ✓

### Screen 2 Implementation
- Property Type: Family ✓
- Bedrooms: 2 ✓
- Furnishing: Semi ✓
- Amenities: Generator, Lift, Parking ✓
- Availability: Available now ✓

## Error Testing

### Invalid Parameters
```bash
curl "http://localhost:3000/api/listings?minPrice=invalid&category=InvalidType"
```

Expected 400 error with validation details.

## Performance Notes
- The API includes database indexes for commonly filtered fields
- Pagination is implemented to handle large result sets
- Filter options endpoint provides dynamic values for UI dropdowns