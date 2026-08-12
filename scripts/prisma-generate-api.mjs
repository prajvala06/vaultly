import { execSync } from 'node:child_process';

const fallbackUrl = 'postgresql://build:build@127.0.0.1:5432/build?schema=public';

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = fallbackUrl;
}

if (!process.env.DIRECT_URL?.trim()) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

execSync('npx prisma generate --schema=prisma/schema.prisma', {
  stdio: 'inherit',
  env: process.env,
});
