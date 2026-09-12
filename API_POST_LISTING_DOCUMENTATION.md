# Post Listing API Documentation

## Overview
This API allows authenticated users to create, update, and delete property listings. It includes image upload functionality using Supabase Storage.

## Base URLs
```
/api/listings  - Listing management
/api/upload    - Image upload
```

---

## Image Upload Endpoints

### 1. Upload Images (Base64)
Upload multiple property images as base64 encoded data.

```
POST /api/upload/images
Authorization: Bearer {token}
```

#### Request Body
```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

#### Validation
- Maximum 8 images per listing
- Supported formats: JPEG, PNG
- Images are stored in Supabase Storage

#### Response (200 OK)
```json
{
  "success": true,
  "message": "2 image(s) uploaded successfully.",
  "data": {
    "urls": [
      "https://your-supabase-url.supabase.co/storage/v1/object/public/property-images/user123/1234567890-0-abc123.jpg",
      "https://your-supabase-url.supabase.co/storage/v1/object/public/property-images/user123/1234567890-1-xyz789.jpg"
    ]
  }
}
```

#### Error Response (400)
```json
{
  "error": "Maximum 8 images allowed per listing."
}
```

---

### 2. Get Presigned Upload URL (Alternative Method)
Generate a presigned URL for direct upload from mobile app (more efficient for large images).

```
POST /api/upload/images/presigned-url
Authorization: Bearer {token}
```

#### Request Body
```json
{
  "fileName": "property-photo.jpg",
  "contentType": "image/jpeg"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://your-supabase-url.supabase.co/storage/v1/object/upload/...",
    "publicUrl": "https://your-supabase-url.supabase.co/storage/v1/object/public/property-images/...",
    "path": "user123/1234567890-abc123-property-photo.jpg",
    "token": "upload-token-here"
  }
}
```

**Usage:** Upload the image directly to `uploadUrl` using PUT request, then use `publicUrl` in listing creation.

---

### 3. Delete Images
Delete uploaded images from storage.

```
DELETE /api/upload/images
Authorization: Bearer {token}
```

#### Request Body
```json
{
  "urls": [
    "https://your-supabase-url.supabase.co/storage/v1/object/public/property-images/user123/image1.jpg",
    "https://your-supabase-url.supabase.co/storage/v1/object/public/property-images/user123/image2.jpg"
  ]
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "2 image(s) deleted successfully."
}
```

---

## Listing Management Endpoints

### 4. Create New Listing (Post Listing)
Create a new property listing.

```
POST /api/listings
Authorization: Bearer {token}
```

#### Request Body
```json
{
  "title": "Beautiful 2BHK Family Apartment",
  "location": "Khulna Sadar, Khulna",
  "city": "Khulna",
  "area": "Khulna Sadar",
  "category": "Family",
  "price": 18000,
  "bedrooms": 2,
  "bathrooms": 2,
  "description": "Spacious apartment with modern amenities...",
  "images": [
    "https://your-supabase-url.supabase.co/storage/v1/object/public/property-images/user123/image1.jpg",
    "https://your-supabase-url.supabase.co/storage/v1/object/public/property-images/user123/image2.jpg"
  ],
  "contactNumber": "+8801712345678",
  "amenities": {
    "lift": true,
    "parking": true,
    "gasLine": true,
    "wifi": false
  },
  "isDirectOwner": true,
  "furnishing": "Semi",
  "availability": "Available now",
  "squareFeet": 1200
}
```

#### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | 3-120 characters |
| `location` | string | ✅ | Full address (2-160 chars) |
| `city` | string | ❌ | City name (default: 'Khulna') |
| `area` | string | ❌ | Area/locality |
| `category` | enum | ✅ | Bachelor, Family, Seat, Sublet, Office |
| `price` | number | ✅ | Monthly rent (0-10,000,000) |
| `bedrooms` | number | ✅ | 0-20 |
| `bathrooms` | number | ✅ | 0-20 |
| `description` | string | ❌ | Up to 4000 characters |
| `images` | array | ✅ | 1-8 image URLs |
| `contactNumber` | string | ✅ | 6-30 characters |
| `amenities` | object | ❌ | See amenities schema below |
| `isDirectOwner` | boolean | ❌ | Default: true |
| `furnishing` | enum | ❌ | Furnished, Unfurnished, Semi |
| `availability` | enum | ❌ | Available now, From next month |
| `availableFrom` | string | ❌ | Date (YYYY-MM-DD) |
| `squareFeet` | number | ❌ | 1-1,000,000 |

#### Amenities Schema
```json
{
  "lift": false,
  "parking": false,
  "gasLine": false,
  "generator": false,
  "water24_7": false,
  "wifi": false
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Listing created successfully. It will be reviewed and live within 2 hours.",
  "data": {
    "id": 123,
    "title": "Beautiful 2BHK Family Apartment",
    "location": "Khulna Sadar, Khulna",
    "price": 18000,
    "bedrooms": 2,
    "bathrooms": 2,
    "category": "Family",
    "images": [...],
    "amenities": {...},
    "owner_id": "user-uuid",
    "owner_name": "John Doe",
    "owner_email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Response (422 Unprocessable Entity)
```json
{
  "error": "Invalid listing data.",
  "details": [
    {
      "field": "title",
      "message": "String must contain at least 3 character(s)"
    },
    {
      "field": "images",
      "message": "Array must contain at least 1 element(s)"
    }
  ]
}
```

---

### 5. Update Listing
Update an existing listing (only owner can update).

```
PATCH /api/listings/:id
Authorization: Bearer {token}
```

#### Request Body (All fields optional)
```json
{
  "title": "Updated Title",
  "price": 20000,
  "description": "Updated description",
  "amenities": {
    "lift": true,
    "parking": true,
    "wifi": true
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Listing updated successfully.",
  "data": {
    "id": 123,
    "title": "Updated Title",
    "price": 20000,
    ...
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "error": "Listing not found or you do not have permission to edit it."
}
```

---

### 6. Delete Listing
Delete a listing (only owner can delete).

```
DELETE /api/listings/:id
Authorization: Bearer {token}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Listing deleted successfully."
}
```

---

### 7. Get My Listings
Get all listings created by the authenticated user.

```
GET /api/listings/my/listings
Authorization: Bearer {token}
```

#### Query Parameters
- `limit` (optional): Results per page (1-50, default: 20)
- `offset` (optional): Pagination offset (default: 0)

#### Example
```
GET /api/listings/my/listings?limit=10&offset=0
```

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": 123,
      "title": "Beautiful 2BHK Family Apartment",
      "location": "Khulna Sadar, Khulna",
      "price": 18000,
      "bedrooms": 2,
      "bathrooms": 2,
      "category": "Family",
      "images": [...],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "offset": 0,
    "limit": 10,
    "hasMore": false
  }
}
```

---

### 8. Get Single Listing
Get details of a specific listing.

```
GET /api/listings/:id
```

#### Response (200 OK)
```json
{
  "data": {
    "id": 123,
    "title": "Beautiful 2BHK Family Apartment",
    "location": "Khulna Sadar, Khulna",
    "city": "Khulna",
    "area": "Khulna Sadar",
    "price": 18000,
    "bedrooms": 2,
    "bathrooms": 2,
    "category": "Family",
    "furnishing": "Semi",
    "availability": "Available now",
    "description": "Spacious apartment...",
    "images": [...],
    "amenities": {...},
    "contact_number": "+8801712345678",
    "is_direct_owner": true,
    "owner_name": "John Doe",
    "square_feet": 1200,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "error": "Listing not found."
}
```

---

## Complete Workflow: Post Listing

### Step-by-Step Process

#### Step 1: Pick Images (Mobile App)
```javascript
const result = await ImagePicker.launchImageLibraryAsync({
  allowsMultipleSelection: true,
  base64: true,
  quality: 0.8
});
```

#### Step 2: Upload Images to Server
```javascript
const base64Images = result.assets.map(asset => 
  `data:image/jpeg;base64,${asset.base64}`
);

const uploadResponse = await fetch('/api/upload/images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ images: base64Images })
});

const uploadResult = await uploadResponse.json();
const imageUrls = uploadResult.data.urls;
```

#### Step 3: Create Listing with Uploaded Images
```javascript
const listingData = {
  title: 'Beautiful 2BHK Apartment',
  location: 'Khulna Sadar, Khulna',
  category: 'Family',
  price: 18000,
  bedrooms: 2,
  bathrooms: 2,
  description: 'Spacious apartment...',
  images: imageUrls, // URLs from Step 2
  contactNumber: '+8801712345678',
  amenities: {
    lift: true,
    parking: true,
    gasLine: true,
    wifi: false
  },
  isDirectOwner: true
};

const response = await fetch('/api/listings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(listingData)
});

const result = await response.json();
console.log(result.message); 
// "Listing created successfully. It will be reviewed and live within 2 hours."
```

---

## Screen Mapping

### Post Listing Screen 1
| UI Element | API Field | Type |
|------------|-----------|------|
| Property Photos (0/8) | `images` | array |
| Title input | `title` | string |
| Location input with 📍 | `location` | string |
| Bachelor/Family/Seat/Sublet buttons | `category` | enum |
| Monthly Rent with ৳ | `price` | number |
| Bedrooms counter (2 BHK) | `bedrooms` | number |
| Bathrooms counter (2 Bath) | `bathrooms` | number |

### Post Listing Screen 2
| UI Element | API Field | Type |
|------------|-----------|------|
| Description textarea | `description` | string |
| Lift toggle | `amenities.lift` | boolean |
| Parking toggle | `amenities.parking` | boolean |
| Gas Line toggle | `amenities.gasLine` | boolean |
| Wi-Fi Included toggle | `amenities.wifi` | boolean |
| "No brokerage • Direct owner" checkbox | `isDirectOwner` | boolean |
| "Publish Listing" button | Triggers POST request | - |

---

## Supabase Setup Required

### 1. Create Storage Bucket
In Supabase Dashboard:
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true);

-- Set storage policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 2. Database Schema
Already included in `supabase/schema.sql`. Run the updated schema.

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - No permission to perform action |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error |

---

## Testing with cURL

### Upload Images
```bash
curl -X POST http://localhost:3000/api/upload/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRg..."]
  }'
```

### Create Listing
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beautiful 2BHK",
    "location": "Khulna Sadar",
    "category": "Family",
    "price": 18000,
    "bedrooms": 2,
    "bathrooms": 2,
    "contactNumber": "+8801712345678",
    "images": ["https://..."],
    "amenities": {"lift": true, "parking": true},
    "isDirectOwner": true
  }'
```

### Get My Listings
```bash
curl http://localhost:3000/api/listings/my/listings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

1. **Image Upload**: The API accepts base64 encoded images. For production, consider using presigned URLs for better performance with large images.

2. **Authentication**: All POST, PATCH, DELETE endpoints require authentication. The `requireSupabaseUser` middleware validates the JWT token.

3. **Review Process**: The success message mentions "reviewed and live within 2 hours" - you can implement this using a `status` field in the database (e.g., 'pending', 'approved', 'rejected').

4. **Direct Owner**: The checkbox "No brokerage • Direct owner" maps to `isDirectOwner: true`, which is the default value.

5. **Phone Number**: The `contactNumber` should come from the authenticated user's profile or be entered during listing creation.

6. **Image Limits**: Maximum 8 images per listing as shown in the UI (0/8), minimum 3 photos required as per the screen.
