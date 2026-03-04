import { Hono } from 'hono';
console.log('🔥 Morphic CMS: Hono Initializing on Vercel Node Runtime');
import { sign } from 'hono/jwt';
import { setCookie } from 'hono/cookie';
import { serveStatic } from '@hono/node-server/serve-static';
import bcrypt from 'bcryptjs';

import { db } from '../db/index.js';
import { collections, entries, users } from '../db/schema.js';
import { eq, isNull, asc, desc, and, sql } from 'drizzle-orm';
import { buildZodSchema } from '../lib/dynamic-schema.js';
import type { FieldDefinition } from '../lib/dynamic-schema.js';

import { inertia } from '../lib/inertia.js';

type Variables = {
  user: any;
};

// Set up the main app without a base path so it can serve the root '/'
const app = new Hono<{ Variables: Variables }>();

// Inertia middleware injects c.set('inertia', renderFn)
app.use('*', inertia());

// Absolute path to dist for Vercel
const distPath = './dist'; 

// Serve static assets from the dist folder
app.use('/assets/*', serveStatic({ root: distPath }));
app.use('/favicon.ico', serveStatic({ root: distPath }));
app.use('/vite.svg', serveStatic({ root: distPath }));

// Serve the Index page at root for login
app.get('/', async (c) => {
  return c.get('inertia')('Index', { title: 'Morphic CMS' });
});

import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

// Middleware to inject the authenticated user into the Inertia shared props globally
app.use('*', async (c, next) => {
  // Safe helper to get cookie even if c.req.header fails
  const getAuthToken = () => {
    try {
      return getCookie(c, 'morphic_token');
    } catch (e) {
      const cookieHeader = (c.req.raw as any)?.headers?.['cookie'] || (c.req.raw as any)?.headers?.get?.('cookie');
      if (typeof cookieHeader === 'string') {
        const match = cookieHeader.match(/morphic_token=([^;]+)/);
        return match ? match[1] : undefined;
      }
      return undefined;
    }
  };

  const token = getAuthToken();
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
  const role = c.req.query('role');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const offset = (page - 1) * limit;
  
  // Dynamic where clause
  const conditions = [isNull(users.deletedAt)];
  if (role && role !== 'all') {
    conditions.push(eq(users.role, role as any));
  }
  const whereClause = and(...conditions);

  // Dynamic order by
  let orderClause = desc(users.createdAt);
  if (sort === 'name') {
    orderClause = dir === 'asc' ? asc(users.name) : desc(users.name);
  } else if (dir === 'asc') {
     const column = (users as any)[sort] || users.createdAt;
     orderClause = asc(column);
  } else if (dir === 'desc') {
     const column = (users as any)[sort] || users.createdAt;
     orderClause = desc(column);
  }

  // Get total count for pagination
  const countResult = await db.select({ count: sql`count(*)` }).from(users).where(whereClause);
  const totalCount = Number(countResult[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  const allUsers = await db.select()
    .from(users)
    .where(whereClause)
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset);

  return c.get('inertia')('Users/List', { 
    users: allUsers, 
    user: userData,
    filters: { sort, dir, role, page, limit },
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit
    }
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

// Media Management Pages
app.get('/media', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  // We'll let the frontend fetch its data from the API endpoint,
  // or we could SSR it here. Let's pass the initial props for the root folder.
  return c.get('inertia')('Media/Index', { user: userData });
});

// Collections Management Pages
app.get('/collections', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');

  const sort = c.req.query('sort') || 'createdAt';
  const dir = c.req.query('dir') || 'desc';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const offset = (page - 1) * limit;

  // Dynamic order by
  let orderClause = desc(collections.createdAt);
  if (sort === 'name') {
    orderClause = dir === 'asc' ? asc(collections.name) : desc(collections.name);
  } else if (sort === 'createdAt') {
    orderClause = dir === 'asc' ? asc(collections.createdAt) : desc(collections.createdAt);
  } else if (dir === 'asc') {
    const column = (collections as any)[sort] || collections.createdAt;
    orderClause = asc(column);
  } else if (dir === 'desc') {
    const column = (collections as any)[sort] || collections.createdAt;
    orderClause = desc(column);
  }

  // Get total count for pagination
  const countResult = await db.select({ count: sql`count(*)` }).from(collections);
  const totalCount = Number(countResult[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  const allCollections = await db.select()
    .from(collections)
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset);

  return c.get('inertia')('Collections/List', { 
    collections: allCollections, 
    user: userData,
    filters: { sort, dir, page, limit },
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit
    }
  });
});

app.get('/entries', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  const allCollections = await db.select().from(collections).orderBy(asc(collections.name));
  return c.get('inertia')('Entries/Index', { collections: allCollections, user: userData });
});

app.get('/entries/:collectionId', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  const collectionId = parseInt(c.req.param('collectionId'), 10);
  const collectionResult = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1);
  const collection = collectionResult[0];
  
  if (!collection) return c.redirect('/entries');

  // Handle pagination/sort for entries
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const offset = (page - 1) * limit;

  const countResult = await db.select({ count: sql`count(*)` })
    .from(entries)
    .where(eq(entries.collectionId, collectionId));
  const totalCount = Number(countResult[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  const entriesList = await db.select()
    .from(entries)
    .where(eq(entries.collectionId, collectionId))
    .orderBy(desc(entries.createdAt))
    .limit(limit)
    .offset(offset);

  return c.get('inertia')('Entries/List', { 
    collection,
    entries: entriesList, 
    user: userData,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit
    }
  });
});

app.get('/entries/:collectionId/add', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  const collectionId = parseInt(c.req.param('collectionId'), 10);
  const collectionResult = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1);
  const collection = collectionResult[0];
  
  if (!collection) return c.redirect('/entries');

  return c.get('inertia')('Entries/Form', { 
    collection,
    user: userData,
    mode: 'create'
  });
});

app.get('/entries/:collectionId/edit/:entryId', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  const collectionId = parseInt(c.req.param('collectionId'), 10);
  const entryId = parseInt(c.req.param('entryId'), 10);
  
  const collectionResult = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1);
  const collection = collectionResult[0];
  if (!collection) return c.redirect('/entries');

  const entryResult = await db.select().from(entries).where(eq(entries.id, entryId)).limit(1);
  const entry = entryResult[0];
  if (!entry) return c.redirect(`/entries/${collectionId}`);

  return c.get('inertia')('Entries/Form', { 
    collection,
    entry,
    user: userData,
    mode: 'edit'
  });
});

app.get('/collections/edit/:id', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  const id = parseInt(c.req.param('id'), 10);
  const collection = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  if (collection.length === 0) return c.redirect('/collections');
  return c.get('inertia')('Collections/Edit', { collection: collection[0], user: userData });
});

app.get('/collections/add', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  return c.get('inertia')('Collections/Add', { user: userData });
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

import apiUsers from './users.js';
import apiMedia from './media.js';

api.route('/users', apiUsers);
api.route('/media', apiMedia);

// API Collections
api.get('/collections', async (c) => {
  try {
    const all = await db.select().from(collections).orderBy(desc(collections.createdAt));
    return c.json({ collections: all });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

const generateUniqueSlug = async (name: string) => {
  const baseSlug = name.toLowerCase()
    .replace(/[^a-z0-0]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await db.select()
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    
    if (existing.length === 0) return slug;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

api.post('/collections', async (c) => {
  try {
    const body = await c.req.json();
    const { name, fields } = body;

    if (!name) return c.json({ error: 'Name is required' }, 400);

    const slug = await generateUniqueSlug(name);

    const newCollection = await db.insert(collections).values({
      name,
      slug,
      fields: fields || []
    }).returning();

    return c.json({ success: true, collection: newCollection[0] }, 201);
  } catch (err) {
    console.error('Error creating collection:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.put('/collections/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { name, fields } = body;

    if (!name) return c.json({ error: 'Name is required' }, 400);

    const updated = await db.update(collections)
      .set({ name, fields: fields || [], updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();

    if (updated.length === 0) return c.json({ error: 'Collection not found' }, 404);

    return c.json({ success: true, collection: updated[0] });
  } catch (err) {
    console.error('Error updating collection:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.delete('/collections/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400);

    // Check if there are entries
    const existingEntries = await db.select().from(entries).where(eq(entries.collectionId, id)).limit(1);
    if (existingEntries.length > 0) {
      return c.json({ error: 'Cannot delete collection because it contains entries' }, 400);
    }

    const deleted = await db.delete(collections).where(eq(collections.id, id)).returning();
    if (deleted.length === 0) return c.json({ error: 'Collection not found' }, 404);

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.get('/collections/:id/entries', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const countResult = await db.select({ count: sql`count(*)` }).from(entries).where(eq(entries.collectionId, id));
    const totalCount = Number(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const result = await db.select()
      .from(entries)
      .where(eq(entries.collectionId, id))
      .orderBy(desc(entries.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({ 
      entries: result,
      pagination: { currentPage: page, totalPages, totalCount, limit }
    });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.post('/collections/:id/entries', async (c) => {
  const collectionId = parseInt(c.req.param('id'), 10);
  if (isNaN(collectionId)) return c.json({ error: 'Invalid collection ID' }, 400);

  const collectionResult = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1);
  const collection = collectionResult[0];
  if (!collection) return c.json({ error: 'Collection not found' }, 404);

  const dynamicSchema = buildZodSchema(collection.fields as FieldDefinition[]);
  
  try {
    const body = await c.req.json();
    const parseResult = dynamicSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: 'Validation failed', details: parseResult.error.format() }, 400);
    }

    const insertResult = await db.insert(entries).values({
      collectionId: collectionId,
      content: parseResult.data,
    }).returning();

    return c.json({ success: true, entry: insertResult[0] }, 201);
  } catch (e) {
    return c.json({ error: 'Invalid JSON or Internal error' }, 400);
  }
});

api.get('/entries/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const result = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
    if (result.length === 0) return c.json({ error: 'Entry not found' }, 404);
    return c.json({ entry: result[0] });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.put('/entries/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const existingResult = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
    if (existingResult.length === 0) return c.json({ error: 'Entry not found' }, 404);
    const entry = existingResult[0];

    const collectionResult = await db.select().from(collections).where(eq(collections.id, entry.collectionId)).limit(1);
    const collection = collectionResult[0];
    if (!collection) return c.json({ error: 'Collection not found' }, 404);

    const dynamicSchema = buildZodSchema(collection.fields as FieldDefinition[]);
    const body = await c.req.json();
    const parseResult = dynamicSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: 'Validation failed', details: parseResult.error.format() }, 400);
    }

    const updated = await db.update(entries)
      .set({ content: parseResult.data, updatedAt: new Date() })
      .where(eq(entries.id, id))
      .returning();

    return c.json({ success: true, entry: updated[0] });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.delete('/entries/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const deleted = await db.delete(entries).where(eq(entries.id, id)).returning();
    if (deleted.length === 0) return c.json({ error: 'Entry not found' }, 404);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mount the api router under /api
app.route('/api', api);

// Export the raw app for Vite
export default app;
