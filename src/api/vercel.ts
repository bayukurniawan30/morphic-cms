import app from './index';
import { handle } from 'hono/vercel';

// Export the Vercel handler
export default handle(app);
