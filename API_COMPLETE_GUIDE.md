# To-Let API - Complete Guide
## সম্পূর্ণ API ডকুমেন্টেশন

এই প্রজেক্টে তিনটি প্রধান স্ক্রিনের জন্য API তৈরি করা হয়েছে:

1. **Filter Screen** - Property খোঁজার জন্য
2. **Post Listing Screen** - নতুন property যোগ করার জন্য
3. **Listing Management** - Edit, Delete করার জন্য

---

## 🌐 Base URL
```
http://localhost:3000/api
```

Production এ আপনার domain ব্যবহার করুন।

---

## 📚 API Categories

### 1. Authentication (`/api/auth`)
User authentication এর জন্য (ইতিমধ্যে আছে)

### 2. Listings (`/api/listings`)
Property listing management

### 3. Upload (`/api/upload`)
Image upload functionality

---

## 🔍 Filter & Search APIs

### GET `/api/listings`
Filter এবং search করে listings পাওয়ার জন্য।

**Query Parameters:**
```
city, area, minPrice, maxPrice, category, bedrooms, 
furnishing, availability, amenities.*, limit, offset
```

**Example:**
```
GET /api/listings?city=Khulna&category=Family&bedrooms=2&minPrice=10000&maxPrice=20000&amenities.lift=true
```

**Response:**
```json
{
  "data": [...listings...],
  "pagination": {
    "total": 45,
    "offset": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

### GET `/api/listings/filters/options`
Available filter options পাওয়ার জন্য (dynamic dropdowns)।

**Response:**
```json
{
  "data": {
    "cities": ["Khulna", "Dhaka"],
    "areas": ["Khulna Sadar", "Daulatpur"],
    "priceRange": {"min": 5000, "max": 50000},
    "propertyTypes": ["Bachelor", "Family", "Seat", "Sublet"],
    "bedrooms": [1, 2, 3, "4+"],
    "furnishing": ["Furnished", "Unfurnished", "Semi"],
    "amenities": ["generator", "lift", "parking", "gasLine", "water24_7", "wifi"],
    "availability": ["Available now", "From next month"]
  }
}
```

---

## 📝 Create Listing APIs

### POST `/api/upload/images` 🔒
Image upload করার জন্য।

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 image(s) uploaded successfully.",
  "data": {
    "urls": [
      "https://supabase.co/.../image1.jpg",
      "https://supabase.co/.../image2.jpg"
    ]
  }
}
```

### POST `/api/listings` 🔒
নতুন listing তৈরি করার জন্য।

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Beautiful 2BHK Family Apartment",
  "location": "Khulna Sadar, Khulna",
  "city": "Khulna",
  "category": "Family",
  "price": 18000,
  "bedrooms": 2,
  "bathrooms": 2,
  "description": "Spacious apartment with modern amenities",
  "images": [
    "https://supabase.co/.../image1.jpg",
    "https://supabase.co/.../image2.jpg"
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
  "availability": "Available now"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Listing created successfully. It will be reviewed and live within 2 hours.",
  "data": {
    "id": 123,
    "title": "Beautiful 2BHK Family Apartment",
    ...
  }
}
```

---

## ✏️ Update & Delete APIs

### PATCH `/api/listings/:id` 🔒
Existing listing আপডেট করার জন্য (শুধু owner পারবে)।

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (partial update allowed):**
```json
{
  "price": 20000,
  "description": "Updated description",
  "amenities": {
    "lift": true,
    "wifi": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Listing updated successfully.",
  "data": {...}
}
```

### DELETE `/api/listings/:id` 🔒
Listing মুছে ফেলার জন্য (শুধু owner পারবে)।

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Listing deleted successfully."
}
```

### GET `/api/listings/my/listings` 🔒
নিজের সব listings দেখার জন্য।

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
limit (1-50, default: 20)
offset (default: 0)
```

**Response:**
```json
{
  "data": [...user's listings...],
  "pagination": {...}
}
```

---

## 📄 View Listing API

### GET `/api/listings/:id`
একটি specific listing এর details দেখার জন্য।

**Example:**
```
GET /api/listings/123
```

**Response:**
```json
{
  "data": {
    "id": 123,
    "title": "Beautiful 2BHK",
    "location": "Khulna Sadar",
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
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🗺️ Screen-to-API Mapping

### Filter Screen (2 screens)
| Screen | Endpoint | Method |
|--------|----------|--------|
| Load filter options | `/api/listings/filters/options` | GET |
| Apply filters | `/api/listings?...params` | GET |

### Post Listing Screen (2 screens)
| Action | Endpoint | Method |
|--------|----------|--------|
| Upload images | `/api/upload/images` | POST 🔒 |
| Create listing | `/api/listings` | POST 🔒 |

### My Listings Screen
| Action | Endpoint | Method |
|--------|----------|--------|
| View my listings | `/api/listings/my/listings` | GET 🔒 |
| Edit listing | `/api/listings/:id` | PATCH 🔒 |
| Delete listing | `/api/listings/:id` | DELETE 🔒 |

### Listing Detail Screen
| Action | Endpoint | Method |
|--------|----------|--------|
| View details | `/api/listings/:id` | GET |
| Contact owner | Use `contact_number` from response | - |

---

## 🔐 Authentication

🔒 মার্ক করা endpoints এর জন্য authentication লাগবে।

**Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token টি Supabase authentication থেকে পাবেন।

---

## 📊 Complete Field Reference

### Listing Object Schema

```typescript
{
  // Basic Info
  id: number,                    // Auto-generated
  title: string,                 // 3-120 chars, required
  location: string,              // 2-160 chars, required
  city: string,                  // e.g., "Khulna"
  area: string,                  // e.g., "Khulna Sadar"
  
  // Property Details
  category: enum,                // Bachelor, Family, Seat, Sublet, Office
  price: number,                 // Monthly rent (0-10,000,000)
  bedrooms: number,              // 0-20
  bathrooms: number,             // 0-20
  square_feet: number,           // Optional
  description: string,           // Max 4000 chars
  
  // Media
  images: array,                 // 1-8 URLs, required
  image_url: string,             // First image (auto-set)
  
  // Additional Info
  furnishing: enum,              // Furnished, Unfurnished, Semi
  availability: enum,            // Available now, From next month
  available_from: date,          // YYYY-MM-DD (optional)
  
  // Amenities
  amenities: {
    lift: boolean,
    parking: boolean,
    gasLine: boolean,
    generator: boolean,
    water24_7: boolean,
    wifi: boolean
  },
  
  // Contact & Owner
  contact_number: string,        // 6-30 chars, required
  is_direct_owner: boolean,      // Default: true
  owner_id: uuid,                // Auto from auth
  owner_name: string,            // Auto from auth
  owner_email: string,           // Auto from auth
  
  // Metadata
  created_at: timestamp,         // Auto-generated
  updated_at: timestamp          // Auto-updated
}
```

---

## 🚀 Quick Start Guide

### 1. Setup Database
```sql
-- Run in Supabase Dashboard
\i supabase/schema.sql
\i sample-data.sql
```

### 2. Configure Environment
```bash
# .env file
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
APP_ORIGINS=http://localhost:3000,https://your-app.com
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Test APIs
```bash
# Get filter options
curl http://localhost:3000/api/listings/filters/options

# Search listings
curl "http://localhost:3000/api/listings?city=Khulna&category=Family"

# Create listing (requires auth token)
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @listing-data.json
```

---

## 📱 Mobile App Integration

### React Native Example

```javascript
import { useState } from 'react';

// API Base URL
const API_URL = 'http://localhost:3000/api';

// 1. Get Filtered Listings
const getListings = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_URL}/listings?${params}`);
  return response.json();
};

// 2. Upload Images
const uploadImages = async (base64Images, token) => {
  const response = await fetch(`${API_URL}/upload/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images: base64Images })
  });
  return response.json();
};

// 3. Create Listing
const createListing = async (listingData, token) => {
  const response = await fetch(`${API_URL}/listings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(listingData)
  });
  return response.json();
};

// 4. Update Listing
const updateListing = async (id, updates, token) => {
  const response = await fetch(`${API_URL}/listings/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// 5. Delete Listing
const deleteListing = async (id, token) => {
  const response = await fetch(`${API_URL}/listings/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

---

## ⚠️ Error Handling

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Provide valid auth token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Validation Failed | Fix validation errors in request |
| 500 | Server Error | Contact support |

### Error Response Format
```json
{
  "error": "Invalid listing data.",
  "details": [
    {
      "field": "title",
      "message": "String must contain at least 3 character(s)"
    }
  ]
}
```

---

## 📖 Additional Documentation

- **Filter API Details:** `API_FILTER_DOCUMENTATION.md`
- **Post Listing API Details:** `API_POST_LISTING_DOCUMENTATION.md`
- **Testing Guide:** `test-api.md`
- **React Native Components:**
  - `FilterScreen.jsx` - Filter implementation
  - `PostListingScreen.jsx` - Post listing implementation

---

## 🎯 Feature Checklist

### ✅ Implemented
- [x] Filter listings by multiple criteria
- [x] Get dynamic filter options
- [x] Upload multiple images (base64)
- [x] Create new listings
- [x] Update existing listings
- [x] Delete listings
- [x] Get user's own listings
- [x] View single listing details
- [x] Supabase Storage integration
- [x] Authentication & authorization
- [x] Comprehensive validation
- [x] Pagination support

### 🔜 Future Enhancements (Optional)
- [ ] Image compression on server
- [ ] Listing status (pending/approved/rejected)
- [ ] Draft listings
- [ ] Favorite/bookmark listings
- [ ] View count tracking
- [ ] Search by keywords
- [ ] Advanced sorting options
- [ ] Listing analytics for owners

---

## 💡 Best Practices

1. **Image Upload:**
   - Compress images before upload
   - Use presigned URLs for large images
   - Implement client-side validation

2. **Performance:**
   - Use pagination for large result sets
   - Cache filter options
   - Implement lazy loading for images

3. **Security:**
   - Always validate auth tokens
   - Sanitize user inputs
   - Implement rate limiting

4. **User Experience:**
   - Show loading states
   - Handle errors gracefully
   - Provide clear error messages

---

## 🆘 Support & Troubleshooting

### Common Issues

**1. Images not uploading**
- Check Supabase Storage bucket exists: `property-images`
- Verify storage policies are set correctly
- Check file size limit (10MB max)

**2. Unauthorized errors**
- Verify auth token is valid and not expired
- Check Authorization header format
- Ensure user is authenticated in Supabase

**3. Validation errors**
- Review field requirements in schema
- Check data types match expected format
- Ensure required fields are provided

---

**Happy Coding! 🎉**

এই API দিয়ে আপনি একটি সম্পূর্ণ property rental app তৈরি করতে পারবেন।