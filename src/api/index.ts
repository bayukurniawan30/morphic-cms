import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { sign } from 'hono/jwt';
import { setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';

import { db } from '../db';
import { collections, entries, users } from '../db/schema';
import { eq, isNull, asc, desc } from 'drizzle-orm';
import { buildZodSchema } from '../lib/dynamic-schema';
import type { FieldDefinition } from '../lib/dynamic-schema';

import { inertia } from '../lib/inertia';

type Variables = {
  user: any;
};

// Set up the main app without a base path so it can serve the root '/'
const app = new Hono<{ Variables: Variables }>();

// Inertia middleware injects c.set('inertia', renderFn)
app.use('*', inertia());

// Serve the Index page at root for login
app.get('/', async (c) => {
  return c.get('inertia')('Index', { title: 'Morphic CMS' });
});

import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

// Middleware to inject the authenticated user into the Inertia shared props globally
app.use('*', async (c, next) => {
  const token = getCookie(c, 'morphic_token');
  let userData: any = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
      const decoded = await verify(token, secret, "HS256");
      
      const userResult = await db.select().from(users).where(eq(users.id, Number(decoded.id))).limit(1);
      const dbUser = userResult[0];
      
      if (dbUser) {
        userData = { 
          id: dbUser.id,
          name: dbUser.name || dbUser.username, 
          email: dbUser.email 
        };
      }
    } catch (e) {
      console.error('Failed to verify token globally:', e);
    }
  }

  // Fallback to null or keep the super admin mock if strictly needed
  // If we only render pages for authenticated users, we enforce it on the specific routes
  c.set('user', userData);
  
  await next();
});

// Serve the Dashboard page
app.get('/dashboard', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  return c.get('inertia')('Dashboard', { user: userData });
});

// User Management Pages
app.get('/users', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  const sort = c.req.query('sort') || 'createdAt';
  const dir = c.req.query('dir') || 'desc';
  
  // Dynamic order by
  let orderClause = desc(users.createdAt);
  if (sort === 'name') {
    orderClause = dir === 'asc' ? asc(users.name) : desc(users.name);
  } else if (dir === 'asc') {
     const column = (users as any)[sort] || users.createdAt;
     orderClause = asc(column);
  }

  const allUsers = await db.select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(orderClause);

  return c.get('inertia')('Users/List', { 
    users: allUsers, 
    user: userData,
    filters: { sort, dir }
  });
});

app.get('/users/add', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  return c.get('inertia')('Users/Add', { user: userData });
});

app.get('/users/edit/:id', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  const userId = parseInt(c.req.param('id'), 10);
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return c.get('inertia')('Users/Edit', { userToEdit: userResult[0], user: userData });
});

// Set up the API routes
const api = new Hono();

api.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user by email
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResult[0];

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Create JWT Token (1 week expiration)
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    const expiresInDays = parseInt(process.env.JWT_EXPIRES_IN_DAYS || '7', 10);
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * expiresInDays;

    const token = await sign({
      id: user.id,
      role: user.role,
      exp: exp
    }, secret);

    // Set HTTP-only cookie
    setCookie(c, 'morphic_token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * expiresInDays,
      sameSite: 'Lax',
    });

    // Update last login
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

    return c.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Test route
api.get('/test', (c) => c.json({ message: 'Hello from Hono API!' }));

import apiUsers from './users';

api.route('/users', apiUsers);

api.post('/collections/:id/entries', async (c) => {
  const collectionId = parseInt(c.req.param('id'), 10);
  
  if (isNaN(collectionId)) {
    return c.json({ error: 'Invalid collection ID' }, 400);
  }

  // 1. Fetch the collection definition to know its schema
  const collectionResult = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1);
  const collection = collectionResult[0];

  if (!collection) {
    return c.json({ error: 'Collection not found' }, 404);
  }

  // 2. Build the Zod schema dynamically based on the DB field setup
  const fields = (collection.fields || []) as FieldDefinition[];
  const dynamicSchema = buildZodSchema(fields);

  // 3. Parse the incoming request payload
  let body;
  try {
     body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const parseResult = dynamicSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json({ 
      error: 'Validation failed', 
      details: parseResult.error.format() 
    }, 400);
  }

  // 4. Save to the database
  const insertResult = await db.insert(entries).values({
    collectionId: collectionId,
    content: parseResult.data,
  }).returning();

  return c.json({ success: true, entry: insertResult[0] }, 201);
});

// Mount the api router under /api
app.route('/api', api);

// Export the raw app for Vite
export default app;
