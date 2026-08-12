import type { CorsOptions } from 'cors';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env, isAllowedCorsOrigin, parseCorsOrigins } from './config/env.js';
import { errorHandler } from './lib/http.js';
import { authRouter } from './routes/auth-routes.js';
import { filesRouter } from './routes/files-routes.js';
import { foldersRouter } from './routes/folders-routes.js';
import { usersRouter } from './routes/users-routes.js';

const app = express();
const allowedOrigins: readonly string[] = parseCorsOrigins(env.corsOrigin);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isAllowedCorsOrigin(origin, allowedOrigins)) {
      callback(null, origin ?? allowedOrigins[0] ?? true);
      return;
    }
    console.warn(`CORS blocked request from origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'vaultly-api',
      status: 'ok',
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/files', filesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/users', usersRouter);

app.use(errorHandler);

export default app;

if (!process.env.VERCEL) {
  app.listen(env.apiPort, () => {
    console.log(`Vaultly API listening on port ${env.apiPort}`);
    console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`Cookie secure=${env.cookieSecure}, sameSite=${env.cookieSameSite}`);
  });
}
