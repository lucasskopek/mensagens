import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // If TURSO_DATABASE_URL is set, use the libsql adapter for Vercel deployment
  if (process.env.TURSO_DATABASE_URL) {
    try {
      const { PrismaLibSQL } = require('@prisma/adapter-libsql') as typeof import('@prisma/adapter-libsql');
      const { createClient } = require('@libsql/client') as typeof import('@libsql/client');

      const libsql = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter, log: [] });
    } catch {
      // Fall through to default
    }
  }

  // Default: direct SQLite connection (local development)
  return new PrismaClient({ log: [] });
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db