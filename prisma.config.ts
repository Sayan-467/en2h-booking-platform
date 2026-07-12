import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use the direct (non-pooled) URL for migrations
    // The pooled URL (DATABASE_URL) is used by the app at runtime via PrismaClient
    url: env('DIRECT_URL'),
  },
});
