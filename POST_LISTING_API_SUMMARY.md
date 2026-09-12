# Post Listing API - Summary

## ✅ সম্পন্ন কাজ

আপনার দেখানো "Post Listing" স্ক্রিনের জন্য সম্পূর্ণ API তৈরি করা হয়েছে।

### 1. নতুন API Endpoints যোগ করা হয়েছে

#### Image Upload Endpoints (`src/routes/upload.js`)
```
POST   /api/upload/images                    - Upload multiple images (base64)
POST   /api/upload/images/presigned-url      - Get presigned URL for direct upload
DELETE /api/upload/images                    - Delete uploaded images
```

#### Listing Management Endpoints (Enhanced `src/routes/listings.js`)
```
POST   /api/listings              - Create new listing ✅
PATCH  /api/listings/:id          - Update listing ✅
DELETE /api/listings/:id          - Delete listing ✅
GET    /api/listings/my/listings  - Get my listings ✅
GET    /api/listings/:id          - Get single listing ✅
```

### 2. ফাইল আপডেট

#### নতুন ফাইল:
- ✅ `src/routes/upload.js` - Image upload routes
- ✅ `PostListingScreen.jsx` - React Native component
- ✅ `API_POST_LISTING_DOCUMENTATION.md` - সম্পূর্ণ API ডকুমেন্টেশন

#### আপডেট করা ফাইল:
- ✅ `src/app.js` - Upload router যোগ, JSON limit বাড়ানো (10MB)
- ✅ `src/routes/listings.js` - Enhanced POST, নতুন PATCH, DELETE endpoints

---

## 📱 Screen 1 Mapping

| UI Element | API Field | Endpoint |
|------------|-----------|----------|
| **Property Photos (0/8)** | `images` array | POST `/api/upload/images` |
| Min 3 photos | Validation | 1-8 images allowed |
| Add photo button | Image picker → base64 → upload | - |
| **TITLE** | `title` string | Required, 3-120 chars |
| **LOCATION** 📍 | `location` string | Required, 2-160 chars |
| **TENANT TYPE** | | |
| - Bachelor button | `category: "Bachelor"` | Required |
| - Family button | `category: "Family"` | Required |
| - Seat button | `category: "Seat"` | Required |
| - Sublet button | `category: "Sublet"` | Required |
| **MONTHLY RENT** ৳ /month | `price` number | Required, 0-10M |
| **BEDROOMS** | | |
| - Minus button | Decrease `bedrooms` | 0-20 |
| - 2 BHK display | `bedrooms: 2` | - |
| - Plus button (dark) | Increase `bedrooms` | - |
| **BATHROOMS** | | |
| - Minus button | Decrease `bathrooms` | 0-20 |
| - 2 Bath display | `bathrooms: 2` | - |
| - Plus button (dark) | Increase `bathrooms` | - |

---

## 📱 Screen 2 Mapping

| UI Element | API Field | Endpoint |
|------------|-----------|----------|
| Bedrooms/Bathrooms (repeated) | Same as Screen 1 | - |
| **DESCRIPTION** | | |
| "Describe your property..." | `description` string | Optional, max 4000 chars |
| **AMENITIES** | | |
| Lift toggle (ON) | `amenities.lift: true` | Boolean |
| Parking toggle (ON) | `amenities.parking: true` | Boolean |
| Gas Line toggle (ON) | `amenities.gasLine: true` | Boolean |
| Wi-Fi Included toggle (OFF) | `amenities.wifi: false` | Boolean |
| **Direct Owner** | | |
| ☑ No brokerage • Direct owner | `isDirectOwner: true` | Default true |
| **Publish Button** | | |
| "Publish Listing →" | POST `/api/listings` | Creates listing |
| Success message | "Listing will be reviewed and live within 2 hours" | - |

---

## 🔄 Complete Workflow

### Flow: Create Listing

```
1. User picks images (📸)
   ↓
2. Upload to server (POST /api/upload/images)
   → Get back image URLs
   ↓
3. User fills form (title, location, price, etc.)
   ↓
4. User clicks "Publish Listing"
   ↓
5. Create listing (POST /api/listings)
   → Include uploaded image URLs
   ↓
6. Success! Show message
   "Listing will be reviewed and live within 2 hours"
```

---

## 💡 Key Features

### Image Upload System
- ✅ **Multiple images:** 1-8 photos per listing
- ✅ **Base64 upload:** Mobile-friendly
- ✅ **Supabase Storage:** Secure cloud storage
- ✅ **Auto cleanup:** Failed uploads are rolled back
- ✅ **User isolation:** Images stored in user-specific folders
- ✅ **Alternative method:** Presigned URLs for large images

### Listing Management
- ✅ **Create:** Authenticated users can post listings
- ✅ **Update:** Only owner can edit their listing
- ✅ **Delete:** Only owner can delete their listing
- ✅ **My Listings:** Get all listings by user
- ✅ **Validation:** Comprehensive Zod schema validation
- ✅ **Auto-populate:** Owner info from auth token

### Data Structure
```json
{
  "title": "Beautiful 2BHK",
  "location": "Khulna Sadar, Khulna",
  "category": "Family",
  "price": 18000,
  "bedrooms": 2,
  "bathrooms": 2,
  "description": "Spacious apartment...",
  "images": ["url1", "url2"],
  "contactNumber": "+8801712345678",
  "amenities": {
    "lift": true,
    "parking": true,
    "gasLine": true,
    "wifi": false
  },
  "isDirectOwner": true
}
```

---

## 🗂️ Files Created/Updated

### New Files:
1. **`src/routes/upload.js`**
   - Image upload logic
   - Supabase Storage integration
   - Base64 → Buffer conversion
   - Presigned URL generation

2. **`PostListingScreen.jsx`**
   - Complete React Native component
   - Matches both screens exactly
   - Image picker integration
   - Form validation
   - API integration

3. **`API_POST_LISTING_DOCUMENTATION.md`**
   - Complete API reference
   - Request/response examples
   - Error handling
   - Testing guide

4. **`POST_LISTING_API_SUMMARY.md`** (this file)

### Updated Files:
1. **`src/app.js`**
   - Added upload router
   - Increased JSON payload limit to 10MB

2. **`src/routes/listings.js`**
   - Enhanced POST endpoint
   - Added PATCH endpoint
   - Added DELETE endpoint
   - Added "My Listings" endpoint

---

## 🚀 Deployment Steps

### 1. Supabase Storage Setup
```sql
-- Create bucket in Supabase Dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true);

-- Set policies (see documentation for full SQL)
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Start Server
```bash
npm run dev
```

### 4. Test Endpoints
```bash
# Test image upload
curl -X POST http://localhost:3000/api/upload/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"images": ["data:image/jpeg;base64,..."]}'

# Test create listing
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Property",
    "location": "Khulna",
    "category": "Family",
    "price": 15000,
    "bedrooms": 2,
    "bathrooms": 2,
    "contactNumber": "+8801712345678",
    "images": ["https://..."],
    "amenities": {"lift": true},
    "isDirectOwner": true
  }'
```

---

## 📱 Mobile Integration

### React Native Setup
```bash
# Install image picker
expo install expo-image-picker
```

### Component Usage
```jsx
import PostListingScreen from './PostListingScreen';

// Navigation
<Stack.Screen 
  name="PostListing" 
  component={PostListingScreen}
  options={{ headerShown: false }}
/>

// Navigate with auth token
navigation.navigate('PostListing', {
  authToken: userToken,
  userPhone: userPhoneNumber
});
```

---

## 🔐 Authentication

সব endpoints authentication required (except GET single listing):

```javascript
headers: {
  'Authorization': 'Bearer YOUR_SUPABASE_JWT_TOKEN'
}
```

Token থেকে user info automatically extract হয়:
- `owner_id` - User UUID
- `owner_name` - User's name
- `owner_email` - User's email

---

## 📊 API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/images` | ✅ | Upload images (base64) |
| POST | `/api/upload/images/presigned-url` | ✅ | Get presigned upload URL |
| DELETE | `/api/upload/images` | ✅ | Delete images |
| POST | `/api/listings` | ✅ | **Create listing** |
| PATCH | `/api/listings/:id` | ✅ | Update listing |
| DELETE | `/api/listings/:id` | ✅ | Delete listing |
| GET | `/api/listings/my/listings` | ✅ | Get my listings |
| GET | `/api/listings/:id` | ❌ | Get single listing |
| GET | `/api/listings` | ❌ | Filter listings |

---

## ⚠️ Important Notes

1. **Image Size:** 10MB JSON limit set in app.js for base64 images
2. **Storage:** Create `property-images` bucket in Supabase
3. **Policies:** Set up storage policies for upload/delete permissions
4. **Contact Number:** Should come from user profile or be entered
5. **Review System:** Implement status field ('pending', 'approved') if needed
6. **Min Photos:** UI shows "Min 3 photos" but API allows 1-8

---

## 🎯 Next Steps (Optional)

1. **Status Management:** Add listing status (pending/approved/rejected)
2. **Image Optimization:** Compress images before upload
3. **Draft System:** Save incomplete listings as drafts
4. **Edit Listing:** Add edit screen using PATCH endpoint
5. **My Listings:** Create a screen to show user's own listings

---

## 📖 Documentation Reference

- **Full API Docs:** `API_POST_LISTING_DOCUMENTATION.md`
- **Filter API Docs:** `API_FILTER_DOCUMENTATION.md`
- **React Component:** `PostListingScreen.jsx`
- **Upload Route:** `src/routes/upload.js`

---

আপনার Post Listing স্ক্রিনের জন্য সম্পূর্ণ API তৈরি! 🎉

এখন মোবাইল অ্যাপ থেকে user নতুন property listing create করতে পারবে।