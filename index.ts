import app from './src/api/index.js';
import { handle } from 'hono/vercel';

// Export the Vercel handler for the Hono framework preset
export default handle(app);
