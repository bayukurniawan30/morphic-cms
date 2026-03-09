import { handle } from 'hono/vercel'
import app from './index.js'

// Export the Vercel handler
export default handle(app)
