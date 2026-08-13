import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const DEFAULT_CONNECTION_LIMIT = 5;
const DEFAULT_POOL_TIMEOUT_SECONDS = 20;

function buildDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl?.trim()) {
    return rawUrl;
  }
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', String(DEFAULT_CONNECTION_LIMIT));
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', String(DEFAULT_POOL_TIMEOUT_SECONDS));
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const databaseUrl: string | undefined = buildDatabaseUrl(process.env.DATABASE_URL);

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
