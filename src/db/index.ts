import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

dotenv.config()

// Required for neon serverless connection to Postgres
const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, { schema })
