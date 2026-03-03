import app from '../src/api/index.js';
import { handle } from 'hono/vercel';

// Export the Vercel handler
export default handle(app);
