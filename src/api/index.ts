import { Hono } from 'hono';
console.log('🔥 Morphic CMS: Hono Initializing on Vercel Node Runtime');
import { sign } from 'hono/jwt';
import { setCookie } from 'hono/cookie';
import { serveStatic } from '@hono/node-server/serve-static';
import bcrypt from 'bcryptjs';

import { db } from '../db/index.js';
import { collections, entries, users, abilities, media, documents } from '../db/schema.js';
import { eq, isNull, asc, desc, and, sql } from 'drizzle-orm';
import { buildZodSchema } from '../lib/dynamic-schema.js';
import type { FieldDefinition } from '../lib/dynamic-schema.js';

import { inertia } from '../lib/inertia.js';
import { sendEmail } from '../lib/email.js';

type Variables = {
  user: any;
};

// Set up the main app without a base path so it can serve the root '/'
const app = new Hono<{ Variables: Variables }>();

// Seed default abilities
const seedAbilities = async () => {
  const readAccess = await db.select().from(abilities).where(eq(abilities.name, 'Read Access')).limit(1);
  if (readAccess.length === 0) {
    await db.insert(abilities).values({
      name: 'Read Access',
      isSystem: '1',
      permissions: {}, // Logic will handle empty as "read only all" or we can pre-populate
    });
    console.log('✅ Seeded: Read Access ability');
  }
};
seedAbilities().catch(console.error);

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
  
  // Check for API Key in header or query param
  const authHeader = c.req.header('Authorization');
  const apiKeyHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const apiKeyQuery = c.req.query('api_key');
  const apiKey = apiKeyHeader || apiKeyQuery;

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
  } else if (apiKey) {
    try {
      const userResult = await db.select().from(users).where(eq(users.apiKey, apiKey)).limit(1);
      const dbUser = userResult[0];
      
      if (dbUser) {
        userData = { 
          id: dbUser.id,
          name: dbUser.name || dbUser.username, 
          email: dbUser.email 
        };
      }
    } catch (e) {
      console.error('Failed to verify API Key:', e);
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

  // 1. Fetch Overview Stats
  const collectionCountRes = await db.select({ count: sql`count(*)` }).from(collections).where(eq(collections.type, 'collection'));
  const totalCollections = Number(collectionCountRes[0].count);

  const globalCountRes = await db.select({ count: sql`count(*)` }).from(collections).where(eq(collections.type, 'global'));
  const totalGlobals = Number(globalCountRes[0].count);

  const entriesCountRes = await db.select({ count: sql`count(*)` }).from(entries);
  const totalEntries = Number(entriesCountRes[0].count);

  const mediaCountRes = await db.select({ count: sql`count(*)` }).from(media);
  const totalMedia = Number(mediaCountRes[0].count);

  const docCountRes = await db.select({ count: sql`count(*)` }).from(documents);
  const totalDocuments = Number(docCountRes[0].count);

  const userCountRes = await db.select({ count: sql`count(*)` }).from(users).where(isNull(users.deletedAt));
  const totalUsers = Number(userCountRes[0].count);

  // 2. Fetch Recent Activity (Latest 5 entries across all collections)
  const recentEntries = await db.select({
    id: entries.id,
    collectionId: entries.collectionId,
    content: entries.content,
    createdAt: entries.createdAt,
    updatedAt: entries.updatedAt,
    collectionName: collections.name,
    collectionSlug: collections.slug
  })
  .from(entries)
  .leftJoin(collections, eq(entries.collectionId, collections.id))
  .orderBy(desc(entries.updatedAt))
  .limit(5);

  // 3. Collection Breakdown (Entries per collection)
  const collectionBreakdown = await db.select({
    id: collections.id,
    name: collections.name,
    slug: collections.slug,
    count: sql`count(${entries.id})`
  })
  .from(collections)
  .leftJoin(entries, eq(collections.id, entries.collectionId))
  .where(eq(collections.type, 'collection'))
  .groupBy(collections.id)
  .orderBy(desc(sql`count(${entries.id})`));

  return c.get('inertia')('Dashboard', { 
    user: userData,
    stats: {
      totalCollections,
      totalGlobals,
      totalEntries,
      totalMedia,
      totalDocuments,
      totalUsers
    },
    recentActivity: recentEntries,
    collectionBreakdown: collectionBreakdown.map(c => ({
      ...c,
      count: Number(c.count)
    }))
  });
});

app.get('/email-settings', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  return c.get('inertia')('EmailSettings', { user: userData  });
});

app.get('/api-key-abilities', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  const allCollections = await db.select().from(collections).orderBy(asc(collections.name));
  const allAbilities = await db.select().from(abilities).orderBy(desc(abilities.createdAt));
  
  return c.get('inertia')('ApiKeyAbilities', { 
    user: userData,
    collections: allCollections,
    abilities: allAbilities
  });
});

app.get('/api-key-abilities/add', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  const allCollections = await db.select().from(collections).orderBy(asc(collections.name));
  return c.get('inertia')('ApiKeyAbilities/Form', { user: userData, collections: allCollections, mode: 'create' });
});

app.get('/api-key-abilities/edit/:id', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  const id = parseInt(c.req.param('id'), 10);
  const ability = await db.select().from(abilities).where(eq(abilities.id, id)).limit(1);
  const allCollections = await db.select().from(collections).orderBy(asc(collections.name));
  return c.get('inertia')('ApiKeyAbilities/Form', { 
    user: userData, 
    ability: ability[0], 
    collections: allCollections, 
    mode: 'edit' 
  });
});

app.get('/settings', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  return c.get('inertia')('Settings', { user: userData });
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
  const allAbilities = await db.select().from(abilities).orderBy(asc(abilities.name));
  return c.get('inertia')('Users/Add', { user: userData, abilities: allAbilities });
});

app.get('/users/edit/:id', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  const id = parseInt(c.req.param('id'), 10);
  const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (userResult.length === 0) return c.redirect('/users');
  
  const allAbilities = await db.select().from(abilities).orderBy(asc(abilities.name));
  
  return c.get('inertia')('Users/Edit', { 
    userToEdit: userResult[0], 
    user: userData,
    abilities: allAbilities
  });
});

// Media Management Pages
app.get('/media', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  // We'll let the frontend fetch its data from the API endpoint,
  // or we could SSR it here. Let's pass the initial props for the root folder.
  return c.get('inertia')('Media/Index', { user: userData });
});

// Documents Management Pages
app.get('/documents', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  return c.get('inertia')('Documents/Index', { user: userData });
});

// Collections Management Pages
app.get('/collections', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');

  const sort = c.req.query('sort') || 'createdAt';
  const dir = c.req.query('dir') || 'desc';
  const typeFilter = c.req.query('type') || 'all';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const offset = (page - 1) * limit;

  // Build where clause
  let whereClause = undefined;
  if (typeFilter !== 'all') {
    whereClause = eq(collections.type, typeFilter as any);
  }

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
  const countQuery = db.select({ count: sql`count(*)` }).from(collections);
  if (whereClause) countQuery.where(whereClause);
  const countResult = await countQuery;
  
  const totalCount = Number(countResult[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  const collectionsQuery = db.select()
    .from(collections)
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset);
  
  if (whereClause) collectionsQuery.where(whereClause);
  
  const allCollections = await collectionsQuery;

  return c.get('inertia')('Collections/List', { 
    collections: allCollections, 
    user: userData,
    filters: { sort, dir, type: typeFilter, page, limit },
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
  
  const typeFilter = c.req.query('type') || 'all';
  
  const query = db.select().from(collections);
  if (typeFilter !== 'all') {
    query.where(eq(collections.type, typeFilter as any));
  }
  
  const allCollections = await query.orderBy(asc(collections.name));
  return c.get('inertia')('Entries/Index', { 
    collections: allCollections, 
    user: userData,
    filters: { type: typeFilter }
  });
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

app.get('/globals/:slug', async (c) => {
  const userData = c.get('user');
  if (!userData) return c.redirect('/');
  
  const slug = c.req.param('slug');
  const collectionResult = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1);
  const collection = collectionResult[0];
  
  if (!collection || collection.type !== 'global') return c.redirect('/dashboard');

  const entryResult = await db.select().from(entries).where(eq(entries.collectionId, collection.id)).limit(1);
  const entry = entryResult[0];

  if (entry) {
    return c.redirect(`/entries/${collection.id}/edit/${entry.id}`);
  } else {
    return c.redirect(`/entries/${collection.id}/add`);
  }
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
const api = new Hono<{ Variables: Variables }>();

// API Auth Middleware
api.use('*', async (c, next) => {
  // Allow login and test routes to be skip auth if needed, 
  // but usually we want all /api routes to be authenticated except login
  const path = c.req.path;
  if (path === '/api/auth/login' || path === '/api/test') {
    return await next();
  }

  const userData = c.get('user');
  if (!userData) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Fetch ability for non-super-admins
  const userResult = await db.select({
    role: users.role,
    abilityId: users.abilityId,
    abilityName: abilities.name,
    visibility: abilities.isSystem,
    permissions: abilities.permissions
  })
  .from(users)
  .leftJoin(abilities, eq(users.abilityId, abilities.id))
  .where(eq(users.id, userData.id))
  .limit(1);

  const fullUser = userResult[0];
  if (fullUser) {
    // Inject permissions into context
    c.set('user', { 
      ...userData, 
      role: fullUser.role, 
      abilityName: fullUser.abilityName,
      permissions: fullUser.role === 'super_admin' ? '*' : (fullUser.permissions || {})
    } as any);
  }

  await next();
});

const checkPermission = (c: any, collectionSlug: string, action: 'create' | 'read' | 'update' | 'delete') => {
  const user = c.get('user');
  if (!user) return false;
  if (user.role === 'super_admin' || user.permissions === '*') return true;
  
  // Special case for seeded "Read Access"
  if (user.abilityName === 'Read Access' && action === 'read') return true;

  const perms = (user.permissions as any)[collectionSlug];
  return perms ? !!perms[action] : false;
};

api.post('/test-email', async (c) => {
  try {
    const { to } = await c.req.json();
    if (!to) return c.json({ error: 'Recipient email is required' }, 400);

    const result = await sendEmail({
      to,
      subject: 'Morphic CMS: Transactional Email Test',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
          <h1 style="color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">Email Service Active</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Hello! This is a test email from your <strong>Morphic CMS</strong> instance.
          </p>
          <p style="font-size: 14px; background: #f9f9f9; padding: 15px; border-left: 4px solid #7c3aed; color: #666;">
            If you're reading this, your Resend integration is correctly configured and ready for production use.
          </p>
          <footer style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            Sent at: ${new Date().toLocaleString()}
          </footer>
        </div>
      `,
    });

    return c.json(result);
  } catch (err) {
    console.error('Test email API error:', err);
    return c.json({ success: false, error: 'Failed to process email request' }, 500);
  }
});

// Abilities API
api.get('/abilities', async (c) => {
  try {
    const all = await db.select().from(abilities).orderBy(desc(abilities.createdAt));
    return c.json({ abilities: all });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.post('/abilities', async (c) => {
  try {
    const { name, permissions } = await c.req.json();
    if (!name) return c.json({ error: 'Name is required' }, 400);

    const newAbility = await db.insert(abilities).values({
      name,
      permissions: permissions || {},
      isSystem: '0'
    }).returning();

    return c.json({ success: true, ability: newAbility[0] }, 201);
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.put('/abilities/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const { name, permissions } = await c.req.json();

    const updated = await db.update(abilities)
      .set({ name, permissions: permissions || {}, updatedAt: new Date() })
      .where(eq(abilities.id, id))
      .returning();

    if (updated.length === 0) return c.json({ error: 'Ability not found' }, 404);

    return c.json({ success: true, ability: updated[0] });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.delete('/abilities/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const abilityResult = await db.select().from(abilities).where(eq(abilities.id, id)).limit(1);
    const ability = abilityResult[0];

    if (!ability) return c.json({ error: 'Ability not found' }, 404);
    if (ability.isSystem === '1') return c.json({ error: 'System abilities cannot be deleted' }, 400);

    // Check if any users are using this ability
    const usersWithAbility = await db.select().from(users).where(eq(users.abilityId, id)).limit(1);
    if (usersWithAbility.length > 0) {
      return c.json({ error: 'Cannot delete ability because it is assigned to users' }, 400);
    }

    await db.delete(abilities).where(eq(abilities.id, id));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

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
import apiDocuments from './documents.js';

api.route('/users', apiUsers);
api.route('/media', apiMedia);
api.route('/documents', apiDocuments);

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
      type: body.type || 'collection',
      fields: fields || []
    }).returning();

    // Auto-expand "Read Access" ability for new collections
    try {
      const readAccess = await db.select().from(abilities).where(eq(abilities.name, 'Read Access')).limit(1);
      if (readAccess.length > 0) {
        const ability = readAccess[0];
        const perms: any = ability.permissions || {};
        perms[slug] = { create: false, read: true, update: false, delete: false };
        await db.update(abilities).set({ permissions: perms, updatedAt: new Date() }).where(eq(abilities.id, ability.id));
      }
    } catch (e) {
      console.error('Failed to auto-expand Read Access ability:', e);
    }

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
      .set({ 
        name, 
        type: body.type || 'collection',
        fields: fields || [], 
        updatedAt: new Date() 
      })
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

api.get('/collections/:idOrSlug/entries', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug');
    let id: number | null = null;

    if (/^\d+$/.test(idOrSlug)) {
      id = parseInt(idOrSlug, 10);
    } else {
      const col = await db.select({ id: collections.id })
        .from(collections)
        .where(eq(collections.slug, idOrSlug))
        .limit(1);
      if (col.length > 0) id = col[0].id;
    }

    if (!id) return c.json({ error: 'Collection not found' }, 404);

    // Get slug for permission check
    const colResult = await db.select({ slug: collections.slug }).from(collections).where(eq(collections.id, id)).limit(1);
    const slug = colResult[0]?.slug;
    if (!slug || !checkPermission(c, slug, 'read')) {
      return c.json({ error: 'Forbidden: No read access to this collection' }, 403);
    }

    const col = await db.select({ type: collections.type }).from(collections).where(eq(collections.id, id)).limit(1);
    const isGlobal = col[0]?.type === 'global';

    if (isGlobal) {
      const result = await db.select()
        .from(entries)
        .where(eq(entries.collectionId, id))
        .orderBy(desc(entries.createdAt))
        .limit(1);
      
      return c.json({ 
        type: 'global',
        entry: result[0] || null 
      });
    }

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
      type: 'collection',
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

  if (!checkPermission(c, collection.slug, 'create')) {
    return c.json({ error: 'Forbidden: No create access to this collection' }, 403);
  }

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

    if (!checkPermission(c, collection.slug, 'update')) {
      return c.json({ error: 'Forbidden: No update access to this collection' }, 403);
    }

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
    if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400);

    // Get collection slug to check permission
    const entryData = await db.select({ 
      slug: collections.slug 
    })
    .from(entries)
    .innerJoin(collections, eq(entries.collectionId, collections.id))
    .where(eq(entries.id, id))
    .limit(1);
    
    if (entryData.length === 0) return c.json({ error: 'Entry not found' }, 404);

    const slug = entryData[0].slug;
    if (!checkPermission(c, slug, 'delete')) {
      return c.json({ error: 'Forbidden: No delete access to this collection' }, 403);
    }

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
