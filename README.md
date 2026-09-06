# To-Let API

Standalone Node.js API for the Flutter **to_let_app_** project. It centralizes listing creation, verifies Firebase users, stores listings in Firestore, and broadcasts new-listing notifications through Firebase Cloud Messaging (FCM).

## What it replaces

The Flutter app currently writes directly to the `properties` Firestore collection and calls a separate notification service. This API provides one protected server endpoint that does both jobs.

## Setup

1. Copy `.env.example` to `.env`.
2. Add Firebase Admin credentials using **one** of these options:
   - set `FIREBASE_SERVICE_ACCOUNT_JSON` to the one-line JSON content of a Firebase service-account key; or
   - set `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of that key file.
3. Install packages and start the server:

   ```bash
   npm install
   npm run dev
   ```

4. Confirm the API is running:

   ```bash
   curl http://localhost:3000/health
   ```

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/listings` | Fetch up to 20 latest listings (`?limit=1-50`) |
| `GET` | `/api/listings/:id` | Fetch one listing |
| `POST` | `/api/listings` | Create a listing and notify `all_users` |

`POST /api/listings` requires the logged-in Firebase user's ID token:

```http
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Example body:

```json
{
  "title": "Family flat near KUET",
  "location": "Fulbarigate, Khulna",
  "price": 18000,
  "bedrooms": 2,
  "bathrooms": 2,
  "squareFeet": 950,
  "description": "A clean and well-lit flat.",
  "contactNumber": "+8801700000000",
  "images": ["https://example.com/property.jpg"],
  "category": "Family",
  "amenities": { "lift": true, "parking": false, "gasLine": true, "wifi": true },
  "isDirectOwner": true
}
```

## Flutter integration notes

- The app should call `POST /api/listings` instead of writing directly to Firestore and calling the old notification API.
- Send `FirebaseAuth.instance.currentUser!.getIdToken()` as the Bearer token.
- `images` must be uploaded image URLs (Firebase Storage is a good choice). Local paths from `image_picker`, such as `/data/user/...`, cannot be used by the API.
- Keep the app's `all_users` topic subscription; it allows FCM to deliver the new-listing alert to every installed app that permitted notifications.

## Deploy to Vercel

The project is configured for Vercel serverless functions. The `api/index.js` entry point exports the Express app and `vercel.json` routes requests such as `/health` and `/api/listings` to it.

1. Push this `to_let_api` folder to a GitHub repository, then import it into Vercel; or run `npx vercel` in this folder and follow the login prompts.
2. In **Vercel → Project → Settings → Environment Variables**, add the values from `.env.example`. At minimum, set:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — the complete service-account JSON on one line, marked **Sensitive**;
   - `FIREBASE_PROJECT_ID` — your Firebase project ID;
   - `APP_ORIGINS` — your production web origin, if you build the Flutter web app.
3. Deploy and open `https://your-project.vercel.app/health`. It should return `{ "status": "ok" }`.

Do not commit a Firebase service-account JSON file or `.env` to Git.
