import { app } from '../src/app.js';

// Vercel runs this Express application as a serverless function.
// Firebase is initialized lazily by protected routes, so /health remains
// available even when a deployment's Firebase environment variables are wrong.
export default app;
