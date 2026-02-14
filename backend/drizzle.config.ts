import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/contexts/**/infrastructure/persistence/drizzle/schema.ts'],
  out: './src/infrastructure/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app',
  },
});
