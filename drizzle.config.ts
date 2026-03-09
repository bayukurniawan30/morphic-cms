import * as dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables')
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
})
