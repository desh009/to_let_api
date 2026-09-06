import { app } from '../src/app.js';

// Vercel runs this Express application as a serverless function.
// Firebase is initialized only by routes that need Firebase Admin services.
export default app;
