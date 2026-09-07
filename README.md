# To-Let API

Node.js REST API for the Flutter To-Let app. It uses **Supabase only**: email/password authentication, password reset, and property listings. Google sign-in is not implemented.

## Setup

1. Copy `.env.example` to `.env` and set real values:

   ```env
   SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   SUPABASE_KEY=YOUR_SERVICE_ROLE_KEY
   PORT=3000
   APP_ORIGINS=https://YOUR_FRONTEND_DOMAIN
   AUTH_RATE_LIMIT_MAX=10
   ```

2. In Supabase Dashboard, enable **Email** and **Confirm email** under Authentication → Providers. Add your app's password-reset URL to Authentication → URL Configuration, then set it as `PASSWORD_RESET_REDIRECT_URL` if needed. Configure Supabase's password policy to match the API: at least 12 characters with uppercase, lowercase, and a number.
3. Run [supabase/schema.sql](supabase/schema.sql) in Supabase Dashboard → SQL Editor. This creates the `to_let_api` listings table.
4. Start the server:

   ```bash
   npm install
   npm run dev
   ```

`SUPABASE_KEY` is a service-role/secret key. Keep it only on this Node.js server and in server environment variables—never include it in Flutter.

## Authentication endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an email/password account and send confirmation email |
| `POST` | `/api/auth/login` | Sign in with email and password |
| `POST` | `/api/auth/forgot-password` | Send a Supabase password-reset email |
| `POST` | `/api/auth/reset-password` | Set a new password using a recovery access token |

Registration body:

```json
{
  "name": "Rahim Ahmed",
  "email": "rahim@gmail.com",
  "password": "a-secure-password"
}
```

Registration returns a confirmation message, not a session. The user must confirm their email, then log in. Login returns `idToken` (the Supabase access token), `refreshToken`, and user data. Use `idToken` for protected endpoints:

```http
Authorization: Bearer <supabase-access-token>
```

To reset a password, call `forgot-password` with `{ "email": "rahim@gmail.com" }`. After the user opens the Supabase recovery link, send its authenticated recovery-session access token as the Bearer token to `reset-password` with:

```json
{ "password": "new-secure-password" }
```

## Listing endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/flats` | Fetch all flats, newest first |
| `GET` | `/api/listings` | Fetch up to 20 listings (`?limit=1-50`) |
| `GET` | `/api/listings/:id` | Fetch one listing |
| `POST` | `/api/listings` | Create a listing; requires a Supabase access token |

## Deploy to Vercel

Add `SUPABASE_URL`, `SUPABASE_KEY`, `PORT`, `APP_ORIGINS`, and optionally `PASSWORD_RESET_REDIRECT_URL` under Vercel → Project → Settings → Environment Variables. Mark the service-role key as sensitive. Do not commit `.env`. `APP_ORIGINS` is mandatory in production and must not include a wildcard.
