import { Pool } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema.js'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
export const db = drizzle(pool, { schema })
