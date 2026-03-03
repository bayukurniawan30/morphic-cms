import { Hono } from 'hono';
import app from './src/api/index.js';

// Export the main Hono app directly for the Vercel Hono framework preset
export default app;
