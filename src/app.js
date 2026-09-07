import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth.js';
import { flatsTable, supabase } from './config/supabase.js';
import { listingsRouter } from './routes/listings.js';

const app = express();
const allowedOrigins = (process.env.APP_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('APP_ORIGINS must list allowed browser origins in production.');
}

app.use(helmet());
app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error('This origin is not allowed by CORS.');
    error.statusCode = 403;
    return callback(error);
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/flats', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from(flatsTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'An unexpected server error occurred.',
  });
});

export { app };
