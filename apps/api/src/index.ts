import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const app = express();

const port: number = Number(process.env.API_PORT ?? 4000);
const corsOrigin: string = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'vaultly-api',
      status: 'ok',
    },
  });
});

app.listen(port, () => {
  console.log(`Vaultly API listening on port ${port}`);
});
