# To-Let API

Node.js REST API for the Flutter/React Native To-Let app. It uses **Supabase** for authentication, storage, and database. This API supports property listings with advanced filtering, image uploads, and full CRUD operations.

## 🚀 Features

- ✅ Email/password authentication with Supabase
- ✅ Advanced property listing filters (location, price, amenities, etc.)
- ✅ Image upload to Supabase Storage
- ✅ Create, Read, Update, Delete listings
- ✅ User-specific listing management
- ✅ **Realtime chat & messaging system**
- ✅ **One-on-one conversations with property owners**
- ✅ **Read receipts and unread tracking**
- ✅ **Supabase Realtime integration for instant messaging**
- ✅ Comprehensive validation with Zod schemas
- ✅ Pagination support

## 📋 Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and set real values:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_KEY=YOUR_SERVICE_ROLE_KEY
PORT=3000
APP_ORIGINS=http://localhost:3000,https://your-app.com
PASSWORD_RESET_REDIRECT_URL=your-app://reset-password
```

⚠️ **Security Note:** `SUPABASE_KEY` is a service-role/secret key. Keep it only on this Node.js server and in server environment variables—never include it in Flutter/React Native.

### 2. Supabase Configuration

1. **Enable Email Authentication:**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable **Email** provider
   - Set password-reset URL in URL Configuration

2. **Create Database Tables:**
   - Run `supabase/schema.sql` in Supabase Dashboard → SQL Editor
   - This creates the `to_let_api` listings table with all necessary fields

3. **Setup Storage Bucket:**
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('property-images', 'property-images', true);
   
   -- See API_POST_LISTING_DOCUMENTATION.md for complete storage policies
   ```

4. **Setup Messaging Tables:**
   - Run `supabase/messages-schema.sql` in Supabase SQL Editor
   - This creates conversations, messages tables with RLS and triggers
   - Enables Supabase Realtime for instant messaging

5. **Load Sample Data (Optional):**
   - Run `sample-data.sql` for test data

### 3. Install Dependencies & Start

```bash
npm install
npm run dev
```

Server will start on `http://localhost:3000`

## 🔐 Authentication Endpoints

| Method | Endpoint | Purpose | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Create an email/password account | ❌ |
| `POST` | `/api/auth/login` | Sign in with email and password | ❌ |
| `POST` | `/api/auth/forgot-password` | Send a password-reset email | ❌ |
| `POST` | `/api/auth/reset-password` | Set a new password | ✅ (recovery token) |

### Registration Example
```json
{
  "name": "Rahim Ahmed",
  "email": "rahim@gmail.com",
  "password": "a-secure-password"
}
```

### Login Response
Returns `idToken` (Supabase access token), `refreshToken`, and user data.

Use `idToken` for protected endpoints:
```http
Authorization: Bearer <supabase-access-token>
```

### Password Reset Flow
1. Call `forgot-password` with `{ "email": "rahim@gmail.com" }`
2. User opens recovery link from email
3. Send recovery token to `reset-password` with `{ "password": "new-secure-password" }`

---

## 🏠 Listing Endpoints

### Filter & Search
| Method | Endpoint | Purpose | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/listings` | Get filtered listings with pagination | ❌ |
| `GET` | `/api/listings/filters/options` | Get available filter options | ❌ |
| `GET` | `/api/listings/:id` | Get single listing details | ❌ |

### Create & Manage
| Method | Endpoint | Purpose | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/listings` | Create new listing | ✅ |
| `PATCH` | `/api/listings/:id` | Update listing (owner only) | ✅ |
| `DELETE` | `/api/listings/:id` | Delete listing (owner only) | ✅ |
| `GET` | `/api/listings/my/listings` | Get user's own listings | ✅ |

### Image Upload
| Method | Endpoint | Purpose | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/upload/images` | Upload images (base64) | ✅ |
| `POST` | `/api/upload/images/presigned-url` | Get presigned upload URL | ✅ |
| `DELETE` | `/api/upload/images` | Delete uploaded images | ✅ |

---

## 💬 Realtime Chat/Messaging Endpoints

### Conversations
| Method | Endpoint | Purpose | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/messages/conversations` | Get all conversations | ✅ |
| `POST` | `/api/messages/conversations` | Create/get conversation | ✅ |
| `GET` | `/api/messages/conversations/:id` | Get conversation details | ✅ |

### Messages
| Method | Endpoint | Purpose | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/messages/conversations/:id/messages` | Get messages | ✅ |
| `POST` | `/api/messages/send` | Send message | ✅ |
| `POST` | `/api/messages/mark-as-read` | Mark as read | ✅ |
| `GET` | `/api/messages/unread-count` | Get total unread | ✅ |
| `DELETE` | `/api/messages/:id` | Delete message | ✅ |
| `POST` | `/api/messages/conversations/:id/block` | Block/unblock | ✅ |

**Features:**
- ⚡ Real-time message delivery via Supabase Realtime
- 📱 Read receipts (✓✓)
- 🔔 Unread message tracking
- 🚫 Block/unblock conversations
- 💬 One-on-one chats linked to property listings

---

## 📖 API Examples

### 1. Get Filtered Listings
```bash
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

### 2. Upload Images
```bash
POST /api/upload/images
Authorization: Bearer {token}

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
  "data": {
    "urls": [
      "https://supabase.co/.../image1.jpg",
      "https://supabase.co/.../image2.jpg"
    ]
  }
}
```

### 3. Create Listing
```bash
POST /api/listings
Authorization: Bearer {token}

{
  "title": "Beautiful 2BHK Apartment",
  "location": "Khulna Sadar, Khulna",
  "category": "Family",
  "price": 18000,
  "bedrooms": 2,
  "bathrooms": 2,
  "images": ["https://..."],
  "contactNumber": "+8801712345678",
  "amenities": {
    "lift": true,
    "parking": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Listing created successfully. It will be reviewed and live within 2 hours.",
  "data": {...}
}
```

---

## 📚 Complete Documentation

For detailed API documentation, see:

- **[API_COMPLETE_GUIDE.md](API_COMPLETE_GUIDE.md)** - Complete overview of all APIs
- **[API_FILTER_DOCUMENTATION.md](API_FILTER_DOCUMENTATION.md)** - Filter & search API details
- **[API_POST_LISTING_DOCUMENTATION.md](API_POST_LISTING_DOCUMENTATION.md)** - Create & manage listings
- **[API_MESSAGES_DOCUMENTATION.md](API_MESSAGES_DOCUMENTATION.md)** - Realtime chat/messaging API
- **[MESSAGES_API_SUMMARY.md](MESSAGES_API_SUMMARY.md)** - Quick messaging reference

### React Native Components
- **[FilterScreen.jsx](FilterScreen.jsx)** - Property filter implementation
- **[PostListingScreen.jsx](PostListingScreen.jsx)** - Create listing implementation
- **[MessagesScreen.jsx](MessagesScreen.jsx)** - Messages list with realtime updates
- **[ChatScreen.jsx](ChatScreen.jsx)** - One-on-one chat with instant messaging

---

## 🗂️ Project Structure

```
to_let_api/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   ├── config/
│   │   └── supabase.js        # Supabase client config
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── listings.js        # Listing CRUD & filters
│   │   ├── upload.js          # Image upload endpoints
│   │   └── messages.js        # Chat/messaging endpoints ⚡
│   └── schemas/
│       ├── auth.js            # Auth validation schemas
│       └── listing.js         # Listing validation schemas
├── supabase/
│   ├── schema.sql             # Listings database schema
│   └── messages-schema.sql    # Chat/messaging schema ⚡
├── sample-data.sql            # Test data
├── .env.example               # Environment template
└── package.json               # Dependencies
```

---

## 🔍 Available Filter Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `city` | string | City name | `Khulna` |
| `area` | string | Area/locality | `Khulna Sadar` |
| `minPrice` | number | Minimum price | `10000` |
| `maxPrice` | number | Maximum price | `25000` |
| `category` | enum | Property type | `Family`, `Bachelor`, `Seat`, `Sublet` |
| `bedrooms` | number | Number of bedrooms | `1`, `2`, `3`, `4` (4+ means >=4) |
| `bathrooms` | number | Number of bathrooms | `1`, `2`, `3` |
| `furnishing` | enum | Furnishing status | `Furnished`, `Unfurnished`, `Semi` |
| `availability` | enum | Availability | `Available now`, `From next month` |
| `amenities.*` | boolean | Amenity filters | `amenities.lift=true` |
| `limit` | number | Results per page | `1-50` (default: 20) |
| `offset` | number | Pagination offset | `0`, `20`, `40` |

### Amenities Filters
- `amenities.lift` - Lift available
- `amenities.parking` - Parking available
- `amenities.gasLine` - Gas line connection
- `amenities.generator` - Backup generator
- `amenities.water24_7` - 24/7 water supply
- `amenities.wifi` - WiFi included

---

## 🚀 Deploy to Vercel

1. **Add Environment Variables:**
   - Go to Vercel → Project → Settings → Environment Variables
   - Add: `SUPABASE_URL`, `SUPABASE_KEY`, `PORT`, `APP_ORIGINS`
   - Mark service-role key as sensitive

2. **Deploy:**
   ```bash
   vercel deploy
   ```

⚠️ **Important:** Never commit `.env` file to version control!

---

## 🧪 Testing

### Run Syntax Check
```bash
npm run check
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get filter options
curl http://localhost:3000/api/listings/filters/options

# Search listings
curl "http://localhost:3000/api/listings?city=Khulna&category=Family"
```

See [test-api.md](test-api.md) for comprehensive testing guide.

---

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **Supabase** - Database, Auth, Storage
- **Zod** - Schema validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

---

## 📝 License

This project is for educational purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for Bangladesh Property Rental Platform**
