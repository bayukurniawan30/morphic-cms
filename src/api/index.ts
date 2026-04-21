import { serveStatic } from '@hono/node-server/serve-static'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  sql,
} from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { db } from '../db/index.js'
import {
  abilities,
  collections,
  documents,
  entries,
  entryVersions,
  formEntries,
  forms,
  locales,
  media,
  tenants,
  users,
  usersToTenants,
} from '../db/schema.js'
import type { FieldDefinition } from '../lib/dynamic-schema.js'
import { buildZodSchema } from '../lib/dynamic-schema.js'
import { sendEmail } from '../lib/email.js'
import { inertia } from '../lib/inertia.js'
import apiDocuments from './documents.js'
import apiMedia from './media.js'
import apiUsers from './users.js'

console.log('🔥 Morphic CMS: Hono Initializing on Vercel Node Runtime')

type Variables = {
  user: any
  tenantId: number | null
  currentTenant: any | null
  tenantRole: string | null
}

// Set up the main app without a base path so it can serve the root '/'
const app = new Hono<{ Variables: Variables }>()

// Seed default abilities
const seedAbilities = async () => {
  const readAccess = await db
    .select()
    .from(abilities)
    .where(eq(abilities.name, 'Read Access'))
    .limit(1)
  if (readAccess.length === 0) {
    await db.insert(abilities).values({
      name: 'Read Access',
      isSystem: '1',
      permissions: {}, // Logic will handle empty as "read only all" or we can pre-populate
    })
    console.log('✅ Seeded: Read Access ability')
  }
}
seedAbilities().catch(console.error)

// Seed default locales
const seedLocales = async () => {
  const enLocale = await db
    .select()
    .from(locales)
    .where(eq(locales.code, 'en'))
    .limit(1)
  if (enLocale.length === 0) {
    await db.insert(locales).values({
      code: 'en',
      name: 'English',
      isDefault: true,
    })
    console.log('✅ Seeded: English locale')
  }
}
seedLocales().catch(console.error)

// Inertia middleware injects c.set('inertia', renderFn)
app.use('*', inertia())

// Absolute path to dist for Vercel
const distPath = './dist'

// Serve static assets from the dist folder
app.use('/assets/*', serveStatic({ root: distPath }))
app.use('/favicon.ico', serveStatic({ root: distPath }))
app.use('/vite.svg', serveStatic({ root: distPath }))

// Serve the Landing Page at root
app.get('/', async (c) => {
  return c.get('inertia')('Home', { title: 'Morphic CMS' })
})

// Serve the Login page at /login
app.get('/login', async (c) => {
  return c.get('inertia')('Index', { title: 'Morphic CMS - Login' })
})

app.get('/logout', async (c) => {
  deleteCookie(c, 'morphic_token')
  return c.redirect('/login')
})

app.get('/forgot-password', async (c) => {
  return c.get('inertia')('Auth/ForgotPassword', { title: 'Forgot Password' })
})

app.get('/reset-password', async (c) => {
  const token = c.req.query('token')
  if (!token) return c.redirect('/forgot-password')
  return c.get('inertia')('Auth/ResetPassword', {
    title: 'Reset Password',
    token,
  })
})

app.get('/docs', async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('Documentation', {
    user: userData,
    title: 'Documentation | Morphic CMS',
  })
})

// Middleware to inject the authenticated user into the Inertia shared props globally
app.use('*', async (c, next) => {
  const getAuthToken = () => {
    try {
      return getCookie(c, 'morphic_token')
    } catch (e) {
      const cookieHeader =
        (c.req.raw as any)?.headers?.['cookie'] ||
        (c.req.raw as any)?.headers?.get?.('cookie')
      if (typeof cookieHeader === 'string') {
        const match = cookieHeader.match(/morphic_token=([^;]+)/)
        return match ? match[1] : undefined
      }
      return undefined
    }
  }

  const token = getAuthToken()

  // Check for API Key in header or query param
  const authHeader = c.req.header('Authorization')
  const apiKeyHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : undefined
  const apiKeyQuery = c.req.query('api_key')
  const apiKey = apiKeyHeader || apiKeyQuery

  let userData: any = null

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only'
      const decoded = await verify(token, secret, 'HS256')

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(decoded.id)))
        .limit(1)
      const dbUser = userResult[0]

      if (dbUser) {
        userData = {
          id: dbUser.id,
          name: dbUser.name || dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
        }
      }
    } catch (e) {
      console.error('Failed to verify token globally:', e)
    }
  } else if (apiKey) {
    try {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.apiKey, apiKey))
        .limit(1)
      const dbUser = userResult[0]

      if (dbUser) {
        userData = {
          id: dbUser.id,
          name: dbUser.name || dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
        }
      }
    } catch (e) {
      console.error('Failed to verify API Key:', e)
    }
  }

  c.set('user', userData)

  // --- Tenant Detection ---
  const activeTenantId = getCookie(c, 'morphic_active_tenant')
  let currentTenant: any = null
  let tenantId: number | null = null
  let tenantRole: string | null = null

  if (userData && activeTenantId) {
    try {
      const id = Number(activeTenantId)
      // Verify user has access to this tenant
      const userTenantAccess = await db
        .select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.userId, userData.id),
            eq(usersToTenants.tenantId, id)
          )
        )
        .limit(1)

      if (userTenantAccess.length > 0 || userData.role === 'super_admin') {
        const tenantResult = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, id))
          .limit(1)

        if (tenantResult[0]) {
          currentTenant = tenantResult[0]
          tenantId = id
          tenantRole =
            userTenantAccess[0]?.role ||
            (userData?.role === 'super_admin' ? 'owner' : 'member')
        }
      }
    } catch (e) {
      console.error('Failed to verify tenant access:', e)
    }
  }

  c.set('tenantId', tenantId)
  c.set('currentTenant', currentTenant)
  c.set('tenantRole', tenantRole)

  await next()
})

// Inject shared Inertia props
app.use('*', async (c, next) => {
  const userData = c.get('user')
  const currentTenant = c.get('currentTenant')

  if (userData && !c.req.path.startsWith('/api/')) {
    try {
      let availableTenants = []
      if (userData.role === 'super_admin') {
        availableTenants = await db.select().from(tenants)
      } else {
        availableTenants = await db
          .select({
            id: tenants.id,
            name: tenants.name,
            slug: tenants.slug,
          })
          .from(tenants)
          .innerJoin(usersToTenants, eq(tenants.id, usersToTenants.tenantId))
          .where(eq(usersToTenants.userId, userData.id))
      }

      c.set('inertiaSharedProps' as any, {
        user: userData,
        activeTenant: currentTenant,
        activeTenantRole: c.get('tenantRole'),
        availableTenants: availableTenants,
      })
    } catch (e) {
      console.error('Failed to fetch available tenants for shared props:', e)
    }
  }
  await next()
})

// Middleware to require authentication for admin pages
const requireAuth = async (c: any, next: any) => {
  const userData = c.get('user')
  if (!userData) {
    return c.redirect('/login')
  }

  const tenantId = c.get('tenantId')
  const path = c.req.path

  // If no tenant selected and not a super_admin, redirect to tenant selection
  // Allow access to /select-tenant and /tenants (API)
  if (
    !tenantId &&
    userData.role !== 'super_admin' &&
    path !== '/select-tenant' &&
    path !== '/logout' &&
    !path.startsWith('/api/tenants')
  ) {
    return c.redirect('/select-tenant')
  }

  await next()
}

// Tenant Management Routes
app.get('/select-tenant', requireAuth, async (c) => {
  const userData = c.get('user')
  const userTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
    })
    .from(tenants)
    .innerJoin(usersToTenants, eq(tenants.id, usersToTenants.tenantId))
    .where(eq(usersToTenants.userId, userData.id))

  return c.get('inertia')('Auth/SelectTenant', {
    user: userData,
    tenants: userTenants,
    title: 'Select Organization',
  })
})

app.get('/tenants/add', requireAuth, async (c) => {
  const userData = c.get('user')
  if (userData.role !== 'super_admin') return c.redirect('/dashboard')
  return c.get('inertia')('Tenants/Add', { user: userData })
})



// Locales Management Pages
app.get('/localization', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')
  return c.get('inertia')('Localization/List', {
    user: userData,
    tenantId,
    title: 'Localization',
  })
})

app.get('/localization/add', requireAuth, async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('Localization/Form', {
    user: userData,
    title: 'Add Language',
    mode: 'create',
  })
})

app.get('/localization/edit/:id', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')
  const id = parseInt(c.req.param('id'), 10)

  const whereClause = [eq(locales.id, id)]
  if (tenantId) whereClause.push(eq(locales.tenantId, tenantId))

  const localeResult = await db
    .select()
    .from(locales)
    .where(and(...whereClause))
    .limit(1)
  const locale = localeResult[0]
  if (!locale) return c.redirect('/localization')

  return c.get('inertia')('Localization/Form', {
    user: userData,
    title: 'Edit Language',
    mode: 'edit',
    locale,
  })
})

// Serve the Dashboard page
app.get('/dashboard', requireAuth, async (c) => {
  const userData = c.get('user')

  const tenantId = c.get('tenantId')
  const whereTenant = (table: any) =>
    tenantId ? eq(table.tenantId, tenantId) : sql`true`

  // 1. Fetch Overview Stats
  const collectionCountRes = await db
    .select({ count: sql`count(*)` })
    .from(collections)
    .where(and(eq(collections.type, 'collection'), whereTenant(collections)))
  const totalCollections = Number(collectionCountRes[0].count)

  const globalCountRes = await db
    .select({ count: sql`count(*)` })
    .from(collections)
    .where(and(eq(collections.type, 'global'), whereTenant(collections)))
  const totalGlobals = Number(globalCountRes[0].count)

  const entriesCountRes = await db
    .select({ count: sql`count(*)` })
    .from(entries)
    .where(and(isNull(entries.deletedAt), whereTenant(entries)))
  const totalEntries = Number(entriesCountRes[0].count)

  const mediaCountRes = await db
    .select({ count: sql`count(*)` })
    .from(media)
    .where(whereTenant(media))
  const totalMedia = Number(mediaCountRes[0].count)

  const docCountRes = await db
    .select({ count: sql`count(*)` })
    .from(documents)
    .where(whereTenant(documents))
  const totalDocuments = Number(docCountRes[0].count)

  const userCountRes = await db
    .select({ count: sql`count(*)` })
    .from(users)
    .where(isNull(users.deletedAt)) // Users are global for now, but we could filter by tenant if we want
  const totalUsers = Number(userCountRes[0].count)

  // 2. Fetch Recent Activity (Latest 5 entries across all collections)
  const recentEntries = await db
    .select({
      id: entries.id,
      collectionId: entries.collectionId,
      content: entries.content,
      createdAt: entries.createdAt,
      updatedAt: entries.updatedAt,
      collectionName: collections.name,
      collectionSlug: collections.slug,
    })
    .from(entries)
    .leftJoin(collections, eq(entries.collectionId, collections.id))
    .where(and(isNull(entries.deletedAt), whereTenant(entries)))
    .orderBy(desc(entries.updatedAt))
    .limit(5)

  // 3. Collection Breakdown (Entries per collection)
  const collectionBreakdown = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      count: sql`count(${entries.id})`,
    })
    .from(collections)
    .leftJoin(
      entries,
      and(eq(collections.id, entries.collectionId), isNull(entries.deletedAt))
    )
    .where(and(eq(collections.type, 'collection'), whereTenant(collections)))
    .groupBy(collections.id)
    .orderBy(desc(sql`count(${entries.id})`))

  return c.get('inertia')('Dashboard', {
    user: userData,
    stats: {
      totalCollections,
      totalGlobals,
      totalEntries,
      totalMedia,
      totalDocuments,
      totalUsers,
    },
    recentActivity: recentEntries,
    collectionBreakdown: collectionBreakdown.map((c) => ({
      ...c,
      count: Number(c.count),
    })),
  })
})

app.get('/email-settings', requireAuth, async (c) => {
  const userData = c.get('user')
  if (userData.role !== 'super_admin') return c.redirect('/dashboard')
  return c.get('inertia')('EmailSettings', { user: userData })
})

app.get('/api-key-abilities', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')
  const tenantRole = c.get('tenantRole')

  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/dashboard')
  }

  const whereTenant = (table: any) =>
    tenantId ? eq(table.tenantId, tenantId) : sql`true`

  const allCollections = await db
    .select()
    .from(collections)
    .where(whereTenant(collections))
    .orderBy(asc(collections.name))
  const allAbilities = await db
    .select()
    .from(abilities)
    .where(whereTenant(abilities))
    .orderBy(desc(abilities.createdAt))

  return c.get('inertia')('ApiKeyAbilities', {
    user: userData,
    collections: allCollections,
    abilities: allAbilities,
  })
})

app.get('/api-key-abilities/add', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')
  const tenantRole = c.get('tenantRole')

  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/dashboard')
  }

  const whereTenant = (table: any) =>
    tenantId ? eq(table.tenantId, tenantId) : sql`true`

  const allCollections = await db
    .select()
    .from(collections)
    .where(whereTenant(collections))
    .orderBy(asc(collections.name))

  return c.get('inertia')('ApiKeyAbilities/Form', {
    user: userData,
    collections: allCollections,
    mode: 'create',
  })
})

app.get('/api-key-abilities/edit/:id', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')
  const tenantRole = c.get('tenantRole')

  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/dashboard')
  }

  const id = parseInt(c.req.param('id'), 10)
  const whereTenant = (table: any) =>
    tenantId ? eq(table.tenantId, tenantId) : sql`true`

  const abilityResult = await db
    .select()
    .from(abilities)
    .where(and(eq(abilities.id, id), whereTenant(abilities)))
    .limit(1)

  const ability = abilityResult[0]
  if (!ability) return c.redirect('/api-key-abilities')

  const allCollections = await db
    .select()
    .from(collections)
    .where(whereTenant(collections))
    .orderBy(asc(collections.name))

  return c.get('inertia')('ApiKeyAbilities/Form', {
    user: userData,
    ability,
    collections: allCollections,
    mode: 'edit',
  })
})

// --- Form Builder Routes ---
app.get('/forms', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')
  const whereTenant = (table: any) =>
    tenantId ? eq(table.tenantId, tenantId) : sql`true`

  const allForms = await db
    .select()
    .from(forms)
    .where(whereTenant(forms))
    .orderBy(desc(forms.createdAt))

  return c.get('inertia')('Forms/List', {
    user: userData,
    forms: allForms,
  })
})

app.get('/forms/add', requireAuth, async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('Forms/Add', { user: userData })
})

app.get('/forms/edit/:id', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  const id = parseInt(c.req.param('id'), 10)
  const whereClause = [eq(forms.id, id)]
  if (tenantId) whereClause.push(eq(forms.tenantId, tenantId))

  const formResult = await db
    .select()
    .from(forms)
    .where(and(...whereClause))
    .limit(1)
  if (formResult.length === 0) return c.redirect('/forms')

  return c.get('inertia')('Forms/Edit', {
    user: userData,
    form: formResult[0],
  })
})

app.get('/forms/:slug/entries', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  const slug = c.req.param('slug')
  const whereClause = [eq(forms.slug, slug)]
  if (tenantId) whereClause.push(eq(forms.tenantId, tenantId))

  const formResult = await db
    .select()
    .from(forms)
    .where(and(...whereClause))
    .limit(1)
  if (formResult.length === 0) return c.redirect('/forms')

  return c.get('inertia')('Forms/EntriesList', {
    user: userData,
    form: formResult[0],
  })
})

app.get('/settings', requireAuth, async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('Settings', { user: userData })
})

// User Management Pages
app.get('/users', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')
  const tenantRole = c.get('tenantRole')


  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/dashboard')
  }

  const sort = c.req.query('sort') || 'createdAt'
  const dir = c.req.query('dir') || 'desc'
  const role = c.req.query('role')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const offset = (page - 1) * limit

  // Dynamic where clause
  const conditions = [isNull(users.deletedAt)]
  if (role && role !== 'all') {
    conditions.push(eq(users.role, role as any))
  }
  const whereClause = and(...conditions)

  // Dynamic order by
  let orderClause = desc(users.createdAt)
  if (sort === 'name') {
    orderClause = dir === 'asc' ? asc(users.name) : desc(users.name)
  } else if (dir === 'asc') {
    const column = (users as any)[sort] || users.createdAt
    orderClause = asc(column)
  } else if (dir === 'desc') {
    const column = (users as any)[sort] || users.createdAt
    orderClause = desc(column)
  }

  // Handle Multi-tenant scoping
  let usersQuery: any
  let totalCountQuery: any

  if (tenantId) {
    // Show only users in the selected tenant
    usersQuery = db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        globalRole: users.role,
        workspaceRole: usersToTenants.role, // Fetch the specific role in this workspace
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(usersToTenants, eq(users.id, usersToTenants.userId))
      .where(and(whereClause, eq(usersToTenants.tenantId, tenantId), ne(users.role, 'super_admin')))

    totalCountQuery = db
      .select({ count: sql`count(*)` })
      .from(users)
      .innerJoin(usersToTenants, eq(users.id, usersToTenants.userId))
      .where(and(whereClause, eq(usersToTenants.tenantId, tenantId), ne(users.role, 'super_admin')))
  } else {
    // System Global mode: Rich summaries for administrators
    usersQuery = db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        globalRole: users.role,
        ownedCount: sql<number>`count(CASE WHEN ${usersToTenants.role} = 'owner' THEN 1 END)`.mapWith(Number),
        memberCount: sql<number>`count(CASE WHEN ${usersToTenants.role} = 'member' THEN 1 END)`.mapWith(Number),
        firstOwnedName: sql<string>`MAX(CASE WHEN ${usersToTenants.role} = 'owner' THEN ${tenants.name} END)`,
        firstMemberName: sql<string>`MAX(CASE WHEN ${usersToTenants.role} = 'member' THEN ${tenants.name} END)`,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(usersToTenants, eq(users.id, usersToTenants.userId))
      .leftJoin(tenants, eq(usersToTenants.tenantId, tenants.id))
      .where(whereClause)
      .groupBy(users.id)

    totalCountQuery = db.select({ count: sql`count(*)` }).from(users).where(whereClause)
  }

  const [allUsers, countResult] = await Promise.all([
    usersQuery.orderBy(orderClause).limit(limit).offset(offset),
    totalCountQuery,
  ])

  const totalCount = Number(countResult[0].count)
  const totalPages = Math.ceil(totalCount / limit)

  const processedUsers = allUsers.map((u: any) => {
    const isTargetSuperAdmin = u.globalRole === 'super_admin'
    const isSelf = u.id === userData.id

    let canManage = false
    if (userData.role === 'super_admin') {
      canManage = true
    } else if (tenantRole === 'owner') {
      // Owners can manage anyone who isn't a Super Admin or themselves
      canManage = !isTargetSuperAdmin && !isSelf
    }

    return {
      ...u,
      canManage,
      workspaceRole: u.workspaceRole || null,
      ownedCount: u.ownedCount || 0,
      memberCount: u.memberCount || 0,
      firstOwnedName: u.firstOwnedName || null,
      firstMemberName: u.firstMemberName || null,
    }
  })


  let allTenants: any[] = []
  const currentTenant = c.get('currentTenant')
  if (userData.role === 'super_admin') {
    allTenants = await db.select().from(tenants).orderBy(asc(tenants.name))
  } else if (currentTenant) {
    allTenants = [currentTenant]
  }

  return c.get('inertia')('Users/List', {
    users: processedUsers,
    user: userData,
    activeTenantRole: tenantRole,
    allTenants,
    filters: { sort, dir, role, page, limit },
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
  })
})

app.get('/users/add', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantRole = c.get('tenantRole')

  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/users')
  }
  const tenantId = c.get('tenantId')
  const whereClause = tenantId ? eq(abilities.tenantId, tenantId) : isNull(abilities.tenantId)

  const filteredAbilities = await db
    .select()
    .from(abilities)
    .where(whereClause)
    .orderBy(asc(abilities.name))

  return c.get('inertia')('Users/Add', {
    user: userData,
    abilities: filteredAbilities,
  })
})

app.get('/users/edit/:id', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantRole = c.get('tenantRole')
  const id = parseInt(c.req.param('id'), 10)

  const isSuperAdmin = userData.role === 'super_admin'
  const isOwner = tenantRole === 'owner'

  // Allow if super_admin OR if the user is editing themselves OR if they are an owner
  if (!isSuperAdmin && !isOwner && userData.id !== id) {
    return c.redirect('/users')
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (userResult.length === 0) return c.redirect('/users')
  const userToEdit = userResult[0]

  // Hierarchy Check for Owners
  if (!isSuperAdmin && userToEdit.role === 'super_admin' && userData.id !== id) {
    return c.redirect('/users')
  }

  const tenantId = c.get('tenantId')
  const abilityWhereClause = tenantId ? eq(abilities.tenantId, tenantId) : isNull(abilities.tenantId)

  const filteredAbilities = await db
    .select()
    .from(abilities)
    .where(abilityWhereClause)
    .orderBy(asc(abilities.name))

  return c.get('inertia')('Users/Edit', {
    userToEdit: userResult[0],
    user: userData,
    abilities: filteredAbilities,
  })
})

// Media Management Pages
app.get('/media', requireAuth, async (c) => {
  const userData = c.get('user')

  // We'll let the frontend fetch its data from the API endpoint,
  // or we could SSR it here. Let's pass the initial props for the root folder.
  return c.get('inertia')('Media/Index', { user: userData })
})

// Documents Management Pages
app.get('/documents', requireAuth, async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('Documents/Index', { user: userData })
})

// Collections Management Pages
app.get('/collections', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  const sort = c.req.query('sort') || 'createdAt'
  const dir = c.req.query('dir') || 'desc'
  const typeFilter = c.req.query('type') || 'all'
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const offset = (page - 1) * limit

  // Build where clause
  const conditions: any[] = []
  if (typeFilter !== 'all') {
    conditions.push(eq(collections.type, typeFilter as any))
  }
  if (tenantId) {
    conditions.push(eq(collections.tenantId, tenantId))
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Dynamic order by
  let orderClause = desc(collections.createdAt)
  if (sort === 'name') {
    orderClause = dir === 'asc' ? asc(collections.name) : desc(collections.name)
  } else if (sort === 'createdAt') {
    orderClause =
      dir === 'asc' ? asc(collections.createdAt) : desc(collections.createdAt)
  } else if (dir === 'asc') {
    const column = (collections as any)[sort] || collections.createdAt
    orderClause = asc(column)
  } else if (dir === 'desc') {
    const column = (collections as any)[sort] || collections.createdAt
    orderClause = desc(column)
  }

  // Get total count for pagination
  const countQuery = db.select({ count: sql`count(*)` }).from(collections)
  if (whereClause) countQuery.where(whereClause)
  const countResult = await countQuery

  const totalCount = Number(countResult[0].count)
  const totalPages = Math.ceil(totalCount / limit)

  const collectionsQuery = db
    .select({
      collection: collections,
      createdBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(collections)
    .leftJoin(users, eq(collections.createdById, users.id))
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset)

  if (whereClause) collectionsQuery.where(whereClause)

  const allCollections = await collectionsQuery

  return c.get('inertia')('Collections/List', {
    collections: allCollections.map((r) => ({
      ...r.collection,
      createdBy: r.createdBy?.id ? r.createdBy : null,
    })),
    user: userData,
    filters: { sort, dir, type: typeFilter, page, limit },
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
  })
})

app.get('/entries', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  const typeFilter = c.req.query('type') || 'all'

  const query = db
    .select({
      collection: collections,
      createdBy: { id: users.id, name: users.name },
    })
    .from(collections)
    .leftJoin(users, eq(collections.createdById, users.id))

  const conditions: any[] = []
  if (typeFilter !== 'all') {
    conditions.push(eq(collections.type, typeFilter as any))
  }
  if (tenantId) {
    conditions.push(eq(collections.tenantId, tenantId))
  }

  if (conditions.length > 0) {
    query.where(and(...conditions))
  }

  const allCollections = await query.orderBy(asc(collections.name))
  return c.get('inertia')('Entries/Index', {
    collections: allCollections.map((r) => ({
      ...r.collection,
      createdBy: r.createdBy?.id ? r.createdBy : null,
    })),
    user: userData,
    filters: { type: typeFilter },
  })
})

app.get('/entries/:collectionId', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  const collectionId = parseInt(c.req.param('collectionId'), 10)

  const colWhere = [eq(collections.id, collectionId)]
  if (tenantId) colWhere.push(eq(collections.tenantId, tenantId))

  const collectionResult = await db
    .select()
    .from(collections)
    .where(and(...colWhere))
    .limit(1)
  const collection = collectionResult[0]

  if (!collection) return c.redirect('/entries')

  // Handle pagination/sort for entries
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const offset = (page - 1) * limit

  const isTrash = c.req.query('trash') === 'true'
  let whereClause = and(
    eq(entries.collectionId, collectionId),
    tenantId ? eq(entries.tenantId, tenantId) : sql`true`
  ) as any

  if (collection.enableTrash) {
    if (isTrash) {
      whereClause = and(whereClause, isNotNull(entries.deletedAt)) as any
    } else {
      whereClause = and(whereClause, isNull(entries.deletedAt)) as any
    }
  }
  const localeFilter = c.req.query('locale')
  if (localeFilter) {
    whereClause = and(whereClause, eq(entries.locale, localeFilter)) as any
  }

  const countResult = await db
    .select({ count: sql`count(*)` })
    .from(entries)
    .where(whereClause)
  const totalCount = Number(countResult[0].count)
  const totalPages = Math.ceil(totalCount / limit)

  const entriesList = await db
    .select({
      entry: entries,
      updatedBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(entries)
    .leftJoin(users, eq(entries.updatedById, users.id))
    .where(whereClause)
    .orderBy(desc(entries.createdAt))
    .limit(limit)
    .offset(offset)

  const localesWhere = tenantId ? [eq(locales.tenantId, tenantId)] : []

  return c.get('inertia')('Entries/List', {
    collection,
    entries: entriesList.map((r) => ({ ...r.entry, updatedBy: r.updatedBy })),
    user: userData,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
    allLocales: await db
      .select()
      .from(locales)
      .where(and(...localesWhere)),
    filters: {
      trash: isTrash,
      locale: localeFilter || null,
    },
  })
})

app.get('/entries/:collectionId/add', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  const collectionId = parseInt(c.req.param('collectionId'), 10)
  const colWhere = [eq(collections.id, collectionId)]
  if (tenantId) colWhere.push(eq(collections.tenantId, tenantId))

  const collectionResult = await db
    .select()
    .from(collections)
    .where(and(...colWhere))
    .limit(1)
  const collection = collectionResult[0]

  if (!collection) return c.redirect('/entries')

  const localesWhere = tenantId ? [eq(locales.tenantId, tenantId)] : []
  const allLocales = await db
    .select()
    .from(locales)
    .where(and(...localesWhere))

  const translationGroupId = c.req.query('translationGroupId')
  const sourceLocale = c.req.query('sourceLocale')
  let sourceEntry = null

  if (translationGroupId && sourceLocale) {
    const entryConditions = [
      eq(entries.translationGroupId, translationGroupId),
      eq(entries.locale, sourceLocale),
    ]
    if (tenantId) entryConditions.push(eq(entries.tenantId, tenantId))

    const results = await db
      .select()
      .from(entries)
      .where(and(...entryConditions))
      .limit(1)
    sourceEntry = results[0]
  }

  return c.get('inertia')('Entries/Form', {
    collection,
    user: userData,
    mode: 'create',
    locales: allLocales,
    translationGroupId: translationGroupId || null,
    sourceEntry: sourceEntry || null,
  })
})

app.get('/globals/:slug', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  const slug = c.req.param('slug')
  const colWhere = [eq(collections.slug, slug)]
  if (tenantId) colWhere.push(eq(collections.tenantId, tenantId))

  const collectionResult = await db
    .select()
    .from(collections)
    .where(and(...colWhere))
    .limit(1)
  const collection = collectionResult[0]

  if (!collection || collection.type !== 'global')
    return c.redirect('/dashboard')

  const entryResult = await db
    .select()
    .from(entries)
    .where(eq(entries.collectionId, collection.id))
    .limit(1)
  const entry = entryResult[0]

  if (entry) {
    return c.redirect(`/entries/${collection.id}/edit/${entry.id}`)
  } else {
    return c.redirect(`/entries/${collection.id}/add`)
  }
})

app.get('/entries/:collectionId/edit/:entryId', requireAuth, async (c) => {
  const userData = c.get('user')

  const collectionId = parseInt(c.req.param('collectionId'), 10)
  const entryId = parseInt(c.req.param('entryId'), 10)

  const collectionResult = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1)
  const collection = collectionResult[0]
  if (!collection) return c.redirect('/entries')

  const entryResult = await db
    .select({
      entry: entries,
      updatedBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(entries)
    .leftJoin(users, eq(entries.updatedById, users.id))
    .where(eq(entries.id, entryId))
    .limit(1)

  const entry = entryResult[0]
  if (!entry) return c.redirect(`/entries/${collectionId}`)

  const allLocales = await db.select().from(locales)
  const existingTranslations: Record<string, number> = {}

  if (collection.localized && entry.entry.translationGroupId) {
    const transResults = await db
      .select({ id: entries.id, locale: entries.locale })
      .from(entries)
      .where(eq(entries.translationGroupId, entry.entry.translationGroupId))

    transResults.forEach((r) => {
      existingTranslations[r.locale] = r.id
    })
  }

  return c.get('inertia')('Entries/Form', {
    collection,
    entry: entry.entry,
    updatedBy: entry.updatedBy,
    user: userData,
    mode: 'edit',
    locales: allLocales,
    existingTranslations,
  })
})

app.get('/collections/edit/:id', requireAuth, async (c) => {
  const userData = c.get('user')
  const id = parseInt(c.req.param('id'), 10)
  const collection = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1)
  if (collection.length === 0) return c.redirect('/collections')
  return c.get('inertia')('Collections/Edit', {
    collection: collection[0],
    user: userData,
  })
})

app.get('/collections/add', requireAuth, async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('Collections/Add', { user: userData })
})

app.get('/api-docs', requireAuth, async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('ApiDocs', { user: userData })
})

// Set up the API routes
const api = new Hono<{ Variables: Variables }>()

// API Auth Middleware
api.use('*', async (c, next) => {
  // Allow login and test routes to be skip auth if needed,
  // but usually we want all /api routes to be authenticated except login
  const path = c.req.path
  if (
    path === '/api/auth/login' ||
    path === '/api/auth/forgot-password' ||
    path === '/api/auth/reset-password' ||
    path === '/api/test' ||
    (path.startsWith('/api/forms/') && path.endsWith('/submit'))
  ) {
    return await next()
  }

  const userData = c.get('user')
  if (!userData) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Fetch ability for non-super-admins
  const userResult = await db
    .select({
      role: users.role,
      abilityId: users.abilityId,
      abilityName: abilities.name,
      visibility: abilities.isSystem,
      permissions: abilities.permissions,
    })
    .from(users)
    .leftJoin(abilities, eq(users.abilityId, abilities.id))
    .where(eq(users.id, userData.id))
    .limit(1)

  const fullUser = userResult[0]
  if (fullUser) {
    // Inject permissions into context
    c.set('user', {
      ...userData,
      role: fullUser.role,
      abilityName: fullUser.abilityName,
      permissions:
        fullUser.role === 'super_admin' ? '*' : fullUser.permissions || {},
    } as any)
  }

  await next()
})

// Tenant Management API
api.get('/tenants', async (c) => {
  const userData = c.get('user')
  const userTenants =
    userData.role === 'super_admin'
      ? await db.select().from(tenants)
      : await db
          .select({
            id: tenants.id,
            name: tenants.name,
            slug: tenants.slug,
          })
          .from(tenants)
          .innerJoin(usersToTenants, eq(tenants.id, usersToTenants.tenantId))
          .where(eq(usersToTenants.userId, userData.id))

  return c.json(userTenants)
})

api.post('/tenants', async (c) => {
  const userData = c.get('user')
  if (userData.role !== 'super_admin')
    return c.json({ error: 'Forbidden' }, 403)

  try {
    const { name, slug } = await c.req.json()
    if (!name || !slug)
      return c.json({ error: 'Name and slug are required' }, 400)

    const newTenant = await db.transaction(async (tx) => {
      const t = await tx.insert(tenants).values({ name, slug }).returning()

      // Add creator to tenant as owner
      await tx.insert(usersToTenants).values({
        userId: userData.id,
        tenantId: t[0].id,
        role: 'owner',
      })

      // Seed default locale for the new tenant
      await tx.insert(locales).values({
        tenantId: t[0].id,
        code: 'en',
        name: 'English',
        isDefault: true,
      })

      // Seed default "Read Access" ability for the new tenant
      await tx.insert(abilities).values({
        tenantId: t[0].id,
        name: 'Read Access',
        isSystem: '1',
        permissions: {},
      })

      return t[0]
    })

    // Set as active tenant immediately
    setCookie(c, 'morphic_active_tenant', newTenant.id.toString(), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30,
    })

    return c.json({ success: true, tenant: newTenant }, 201)
  } catch (err) {
    console.error('Error creating tenant:', err)
    if (
      String(err).includes('unique constraint') ||
      (err as any).code === '23505'
    ) {
      return c.json({ error: 'Slug already exists' }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/tenants/switch', async (c) => {
  const userData = c.get('user')
  const { tenantId } = await c.req.json()

  // Allow Super Admins to clear active tenant (System Global)
  if (tenantId === null) {
    if (userData.role !== 'super_admin') {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    deleteCookie(c, 'morphic_active_tenant', { path: '/' })
    return c.json({ success: true })
  }

  if (!tenantId) return c.json({ error: 'Tenant ID is required' }, 400)

  // Verify access
  const access = await db
    .select()
    .from(usersToTenants)
    .where(
      and(
        eq(usersToTenants.userId, userData.id),
        eq(usersToTenants.tenantId, Number(tenantId))
      )
    )
    .limit(1)

  if (access.length === 0 && userData.role !== 'super_admin') {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  setCookie(c, 'morphic_active_tenant', tenantId.toString(), {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return c.json({ success: true })
})

// --- User-Tenant Management (Super Admin only) ---

// GET /api/tenants/:id/users - List users in a tenant
api.get('/tenants/:id/users', async (c) => {
  const userData = c.get('user')
  const activeTenantId = c.get('tenantId')
  const tenantRole = c.get('tenantRole')
  const tenantId = parseInt(c.req.param('id'), 10)

  const isAuthorized =
    userData.role === 'super_admin' ||
    (tenantId === activeTenantId && tenantRole === 'owner')

  if (!isAuthorized) return c.json({ error: 'Forbidden' }, 403)
  if (isNaN(tenantId)) return c.json({ error: 'Invalid tenant ID' }, 400)

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: usersToTenants.role,
      joinedAt: usersToTenants.createdAt,
    })
    .from(usersToTenants)
    .innerJoin(users, eq(usersToTenants.userId, users.id))
    .where(eq(usersToTenants.tenantId, tenantId))

  return c.json(members)
})

// POST /api/tenants/:id/users - Add a user to a tenant
api.post('/tenants/:id/users', async (c) => {
  const userData = c.get('user')
  const activeTenantId = c.get('tenantId')
  const tenantRole = c.get('tenantRole')
  const tenantId = parseInt(c.req.param('id'), 10)

  const isAuthorized =
    userData.role === 'super_admin' ||
    (tenantId === activeTenantId && tenantRole === 'owner')

  if (!isAuthorized) return c.json({ error: 'Forbidden' }, 403)

  const { userEmail, userId: directUserId, role: newRole } = await c.req.json()

  let targetUserId = directUserId
  if (!targetUserId && userEmail) {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)
    if (userResult[0]) targetUserId = userResult[0].id
  }

  if (!targetUserId) return c.json({ error: 'User not found' }, 404)

  // --- Hierarchy Check ---
  const targetUserResult = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1)
  const targetUser = targetUserResult[0]

  if (userData.role !== 'super_admin') {
    if (targetUser?.role === 'super_admin') {
      return c.json({ error: 'Cannot manage a Super Admin' }, 403)
    }
    if (targetUserId === userData.id) {
      return c.json({ error: 'Cannot manage yourself here' }, 403)
    }
  }

  // Check if already assigned
  const existing = await db
    .select()
    .from(usersToTenants)
    .where(
      and(
        eq(usersToTenants.tenantId, tenantId),
        eq(usersToTenants.userId, targetUserId)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    // Just update role if already exists
    await db
      .update(usersToTenants)
      .set({ role: newRole || 'member' })
      .where(
        and(
          eq(usersToTenants.tenantId, tenantId),
          eq(usersToTenants.userId, targetUserId)
        )
      )
  } else {
    await db.insert(usersToTenants).values({
      tenantId,
      userId: targetUserId,
      role: newRole || 'member',
    })
  }

  return c.json({ success: true })
})

// DELETE /api/tenants/:id/users/:userId - Remove a user from a tenant
api.delete('/tenants/:id/users/:userId', async (c) => {
  const userData = c.get('user')
  const activeTenantId = c.get('tenantId')
  const tenantRole = c.get('tenantRole')
  const tenantId = parseInt(c.req.param('id'), 10)
  const userId = parseInt(c.req.param('userId'), 10)

  const isAuthorized =
    userData.role === 'super_admin' ||
    (tenantId === activeTenantId && tenantRole === 'owner')

  if (!isAuthorized) return c.json({ error: 'Forbidden' }, 403)

  // --- Hierarchy Check ---
  const targetUserResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const targetUser = targetUserResult[0]

  if (userData.role !== 'super_admin') {
    if (targetUser?.role === 'super_admin') {
      return c.json({ error: 'Cannot delete a Super Admin' }, 403)
    }
    if (userId === userData.id) {
      return c.json({ error: 'Cannot remove yourself from your own tenant' }, 403)
    }
  }

  await db
    .delete(usersToTenants)
    .where(
      and(
        eq(usersToTenants.tenantId, tenantId),
        eq(usersToTenants.userId, userId)
      )
    )

  return c.json({ success: true })
})

// GET /api/users/:id/tenants - Get all tenants for a specific user
api.get('/users/:id/tenants', async (c) => {
  const userData = c.get('user')
  if (userData.role !== 'super_admin') return c.json({ error: 'Forbidden' }, 403)

  const userId = parseInt(c.req.param('id'), 10)
  if (isNaN(userId)) return c.json({ error: 'Invalid user ID' }, 400)

  const userTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      role: usersToTenants.role,
      joinedAt: usersToTenants.createdAt,
    })
    .from(usersToTenants)
    .innerJoin(tenants, eq(usersToTenants.tenantId, tenants.id))
    .where(eq(usersToTenants.userId, userId))

  return c.json(userTenants)
})

// Locales API
api.get('/locales', async (c) => {
  const tenantId = c.get('tenantId')
  const whereTenant = tenantId ? eq(locales.tenantId, tenantId) : sql`true`
  const allLocales = await db
    .select()
    .from(locales)
    .where(whereTenant)
    .orderBy(asc(locales.name))
  return c.json({ locales: allLocales })
})

api.post('/locales', async (c) => {
  try {
    const { code, name, isDefault } = await c.req.json()
    const tenantId = c.get('tenantId')
    if (!code || !name)
      return c.json({ error: 'Code and name are required' }, 400)

    // If setting as default, unset others in the same tenant
    if (isDefault) {
      await db
        .update(locales)
        .set({ isDefault: false })
        .where(tenantId ? eq(locales.tenantId, tenantId) : sql`true`)
    }

    const result = await db
      .insert(locales)
      .values({
        code,
        name,
        isDefault: !!isDefault,
        tenantId,
      })
      .returning()
    return c.json({ locale: result[0] })
  } catch (err) {
    return c.json({ error: 'Failed to create locale' }, 500)
  }
})

api.put('/locales/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const { code, name, isDefault } = await c.req.json()
    const tenantId = c.get('tenantId')

    const whereClause = [eq(locales.id, id)]
    if (tenantId) whereClause.push(eq(locales.tenantId, tenantId))

    // Protected en locale (Global or per tenant?)
    const existing = await db
      .select()
      .from(locales)
      .where(and(...whereClause))
      .limit(1)

    if (!existing[0]) return c.json({ error: 'Locale not found' }, 404)

    if (existing[0].code === 'en' && code !== 'en') {
      return c.json(
        { error: 'Cannot change the code of the default English locale' },
        400
      )
    }

    if (isDefault) {
      await db
        .update(locales)
        .set({ isDefault: false })
        .where(tenantId ? eq(locales.tenantId, tenantId) : sql`true`)
    }

    const result = await db
      .update(locales)
      .set({ code, name, isDefault: !!isDefault, updatedAt: new Date() })
      .where(and(...whereClause))
      .returning()
    return c.json({ locale: result[0] })
  } catch (err) {
    return c.json({ error: 'Failed to update locale' }, 500)
  }
})

api.delete('/locales/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')

    const whereClause = [eq(locales.id, id)]
    if (tenantId) whereClause.push(eq(locales.tenantId, tenantId))

    const localeResult = await db
      .select()
      .from(locales)
      .where(and(...whereClause))
      .limit(1)
    const locale = localeResult[0]

    if (!locale) return c.json({ error: 'Locale not found' }, 404)
    if (locale.code === 'en')
      return c.json({ error: 'Cannot delete default English locale' }, 400)

    // Check if in use
    const usedEntries = await db
      .select({ id: entries.id })
      .from(entries)
      .where(
        and(
          eq(entries.locale, locale.code),
          tenantId ? eq(entries.tenantId, tenantId) : sql`true`
        )
      )
      .limit(1)
    if (usedEntries.length > 0) {
      return c.json(
        { error: 'Cannot delete locale while it is being used by entries' },
        400
      )
    }

    await db.delete(locales).where(and(...whereClause))
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Failed to delete locale' }, 500)
  }
})

const checkPermission = (
  c: any,
  collectionSlug: string,
  action: 'create' | 'read' | 'update' | 'delete'
) => {
  const user = c.get('user')
  if (!user) return false
  if (user.role === 'super_admin' || user.permissions === '*') return true

  // Special case for seeded "Read Access"
  if (user.abilityName === 'Read Access' && action === 'read') return true

  const perms = (user.permissions as any)[collectionSlug]
  return perms ? !!perms[action] : false
}

api.post('/test-email', async (c) => {
  const userData = c.get('user')
  if (userData?.role !== 'super_admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  try {
    const { to } = await c.req.json()
    if (!to) return c.json({ error: 'Recipient email is required' }, 400)

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
    })

    return c.json(result)
  } catch (err) {
    console.error('Test email API error:', err)
    return c.json(
      { success: false, error: 'Failed to process email request' },
      500
    )
  }
})

// Abilities API
api.get('/abilities', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const whereTenant = tenantId ? eq(abilities.tenantId, tenantId) : sql`true`

    const all = await db
      .select()
      .from(abilities)
      .where(whereTenant)
      .orderBy(desc(abilities.createdAt))
    return c.json({ abilities: all })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/abilities', async (c) => {
  try {
    const { name, permissions } = await c.req.json()
    const tenantId = c.get('tenantId')
    if (!name) return c.json({ error: 'Name is required' }, 400)

    const newAbility = await db
      .insert(abilities)
      .values({
        name,
        permissions: permissions || {},
        isSystem: '0',
        tenantId,
      })
      .returning()

    return c.json({ success: true, ability: newAbility[0] }, 201)
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.put('/abilities/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const { name, permissions } = await c.req.json()
    const tenantId = c.get('tenantId')

    const whereClause = [eq(abilities.id, id)]
    if (tenantId) whereClause.push(eq(abilities.tenantId, tenantId))

    const updated = await db
      .update(abilities)
      .set({ name, permissions: permissions || {}, updatedAt: new Date() })
      .where(and(...whereClause))
      .returning()

    if (updated.length === 0) return c.json({ error: 'Ability not found' }, 404)

    return c.json({ success: true, ability: updated[0] })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.delete('/abilities/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')

    const whereClause = [eq(abilities.id, id)]
    if (tenantId) whereClause.push(eq(abilities.tenantId, tenantId))

    const abilityResult = await db
      .select()
      .from(abilities)
      .where(and(...whereClause))
      .limit(1)
    const ability = abilityResult[0]

    if (!ability) return c.json({ error: 'Ability not found' }, 404)
    if (ability.isSystem === '1')
      return c.json({ error: 'System abilities cannot be deleted' }, 400)

    // Check if any users are using this ability
    const usersWithAbility = await db
      .select()
      .from(users)
      .where(eq(users.abilityId, id))
      .limit(1)
    if (usersWithAbility.length > 0) {
      return c.json(
        { error: 'Cannot delete ability because it is assigned to users' },
        400
      )
    }

    await db.delete(abilities).where(and(...whereClause))
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = body

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    const user = userResult[0]

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Create JWT Token (1 week expiration)
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only'
    const expiresInDays = parseInt(process.env.JWT_EXPIRES_IN_DAYS || '7', 10)
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * expiresInDays

    const token = await sign(
      {
        id: user.id,
        role: user.role,
        exp: exp,
      },
      secret
    )

    // Set HTTP-only cookie
    setCookie(c, 'morphic_token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * expiresInDays,
      sameSite: 'Lax',
    })

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id))

    return c.json({ success: true })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email) return c.json({ error: 'Email is required' }, 400)

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    const user = userResult[0]

    if (!user) {
      // For security, don't reveal if user exists
      return c.json({
        success: true,
        message:
          'If an account exists with that email, a reset link has been sent.',
      })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour

    await db
      .update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpiresAt: expiresAt,
      })
      .where(eq(users.id, user.id))

    const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`

    await sendEmail({
      to: email,
      subject: 'Morphic CMS: Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h1 style="color: #87787a; border-bottom: 2px solid #514849; padding-bottom: 10px;">Password Reset</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            You requested a password reset for your Morphic CMS account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #514849; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666;">
            If you did not request this, please ignore this email. This link will expire in 1 hour.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">
            If the button doesn't work, copy and paste this link into your browser: <br />
            <a href="${resetLink}" style="color: #514849;">${resetLink}</a>
          </p>
        </div>
      `,
    })

    return c.json({
      success: true,
      message:
        'If an account exists with that email, a reset link has been sent.',
    })
  } catch (err) {
    console.error('Forgot password error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/auth/reset-password', async (c) => {
  try {
    const { token, password } = await c.req.json()
    if (!token || !password)
      return c.json({ error: 'Token and password are required' }, 400)

    const userResult = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetPasswordToken, token),
          sql`${users.resetPasswordExpiresAt} > now()`
        )
      )
      .limit(1)

    const user = userResult[0]

    if (!user) {
      return c.json({ error: 'Invalid or expired reset token' }, 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      })
      .where(eq(users.id, user.id))

    return c.json({
      success: true,
      message: 'Password has been reset successfully.',
    })
  } catch (err) {
    console.error('Reset password error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Test route
api.get('/test', (c) => c.json({ message: 'Hello from Hono API!' }))

api.route('/users', apiUsers)
api.route('/media', apiMedia)
api.route('/documents', apiDocuments)

// API Collections
api.get('/collections', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const whereTenant = tenantId
      ? eq(collections.tenantId, tenantId)
      : sql`true`

    const all = await db
      .select({
        collection: collections,
        createdBy: {
          id: users.id,
          name: users.name,
        },
      })
      .from(collections)
      .leftJoin(users, eq(collections.createdById, users.id))
      .where(whereTenant)
      .orderBy(desc(collections.createdAt))

    return c.json({
      collections: all.map((r) => ({
        ...r.collection,
        createdBy:
          r.createdBy && 'id' in r.createdBy && r.createdBy.id
            ? r.createdBy
            : null,
      })),
    })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

const generateUniqueSlug = async (name: string, tenantId: number | null) => {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  let slug = baseSlug
  let counter = 1

  while (true) {
    const conditions = [eq(collections.slug, slug)]
    if (tenantId) conditions.push(eq(collections.tenantId, tenantId))

    const existing = await db
      .select()
      .from(collections)
      .where(and(...conditions))
      .limit(1)

    if (existing.length === 0) return slug

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

api.post('/collections', async (c) => {
  try {
    const body = await c.req.json()
    const { name, fields } = body
    const tenantId = c.get('tenantId')
    if (!name) return c.json({ error: 'Name is required' }, 400)

    const hasStatusField = fields?.some(
      (f: any) => f.name.toLowerCase() === 'status'
    )
    if (hasStatusField) {
      return c.json({ error: "'status' is a reserved field name" }, 400)
    }

    const slug = await generateUniqueSlug(name, tenantId)

    const newCollection = await db
      .insert(collections)
      .values({
        name,
        slug,
        type: body.type || 'collection',
        enableTrash: body.enableTrash || false,
        localized: body.localized || false,
        fields: fields || [],
        createdById: c.get('user')?.id || null,
        tenantId,
      })
      .returning()

    console.log(
      `✅ Collection created: ${name} (slug: ${slug}) by user ID: ${c.get('user')?.id || 'SYSTEM'}`
    )

    // Auto-expand "Read Access" ability for new collections in the same tenant
    try {
      const readAccessConditions = [eq(abilities.name, 'Read Access')]
      if (tenantId) readAccessConditions.push(eq(abilities.tenantId, tenantId))

      const readAccess = await db
        .select()
        .from(abilities)
        .where(and(...readAccessConditions))
        .limit(1)
      if (readAccess.length > 0) {
        const ability = readAccess[0]
        const perms: any = ability.permissions || {}
        perms[slug] = {
          create: false,
          read: true,
          update: false,
          delete: false,
        }
        await db
          .update(abilities)
          .set({ permissions: perms, updatedAt: new Date() })
          .where(eq(abilities.id, ability.id))
      }
    } catch (e) {
      console.error('Failed to auto-expand Read Access ability:', e)
    }

    return c.json({ success: true, collection: newCollection[0] }, 201)
  } catch (err) {
    console.error('Error creating collection:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.put('/collections/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const body = await c.req.json()
    const { name, fields } = body
    const tenantId = c.get('tenantId')

    if (!name) return c.json({ error: 'Name is required' }, 400)

    const hasStatusField = fields?.some(
      (f: any) => f.name.toLowerCase() === 'status'
    )
    if (hasStatusField) {
      return c.json({ error: "'status' is a reserved field name" }, 400)
    }

    const whereClause = [eq(collections.id, id)]
    if (tenantId) whereClause.push(eq(collections.tenantId, tenantId))

    const updated = await db
      .update(collections)
      .set({
        name,
        type: body.type || 'collection',
        enableTrash: body.enableTrash || false,
        localized: body.localized || false,
        fields: fields || [],
        updatedAt: new Date(),
      })
      .where(and(...whereClause))
      .returning()

    if (updated.length === 0)
      return c.json({ error: 'Collection not found' }, 404)

    return c.json({ success: true, collection: updated[0] })
  } catch (err) {
    console.error('Error updating collection:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.delete('/collections/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')

    if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const whereClause = [eq(collections.id, id)]
    if (tenantId) whereClause.push(eq(collections.tenantId, tenantId))

    // Check if there are entries
    const entriesConditions = [eq(entries.collectionId, id)]
    if (tenantId) entriesConditions.push(eq(entries.tenantId, tenantId))

    const existingEntries = await db
      .select()
      .from(entries)
      .where(and(...entriesConditions))
      .limit(1)
    if (existingEntries.length > 0) {
      return c.json(
        { error: 'Cannot delete collection because it contains entries' },
        400
      )
    }

    const deleted = await db
      .delete(collections)
      .where(and(...whereClause))
      .returning()
    if (deleted.length === 0)
      return c.json({ error: 'Collection not found' }, 404)

    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.get('/collections/:idOrSlug/entries', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const idOrSlug = c.req.param('idOrSlug')
    let id: number | null = null

    if (/^\d+$/.test(idOrSlug)) {
      id = parseInt(idOrSlug, 10)
    } else {
      const col = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.slug, idOrSlug))
        .limit(1)
      if (col.length > 0) id = col[0].id
    }

    if (!id) return c.json({ error: 'Collection not found' }, 404)

    // Get slug for permission check
    const colResult = await db
      .select({ slug: collections.slug })
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1)
    const slug = colResult[0]?.slug
    if (!slug || !checkPermission(c, slug, 'read')) {
      return c.json(
        { error: 'Forbidden: No read access to this collection' },
        403
      )
    }

    const col = await db
      .select({ type: collections.type, fields: collections.fields })
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1)

    const isGlobal = col[0]?.type === 'global'
    const fieldsDef: any[] = (col[0]?.fields as any) || []

    const populateRelations = async (entriesList: any[]) => {
      const relationFields = fieldsDef.filter(
        (f) => f.type === 'relation' && f.relationCollectionId
      )
      if (relationFields.length === 0) return entriesList

      const relationData: Record<number, Record<number, any>> = {}
      const neededIdsByCollection: Record<number, Set<number>> = {}

      for (const entry of entriesList) {
        for (const field of relationFields) {
          const val = entry.content?.[field.name]
          if (val) {
            const relColId = field.relationCollectionId
            if (!neededIdsByCollection[relColId])
              neededIdsByCollection[relColId] = new Set()

            if (Array.isArray(val)) {
              val.forEach((v) => neededIdsByCollection[relColId].add(v))
            } else {
              neededIdsByCollection[relColId].add(val)
            }
          }
        }
      }

      for (const [colIdStr, idsSet] of Object.entries(neededIdsByCollection)) {
        const ids = Array.from(idsSet) as number[]
        if (ids.length === 0) continue

        const relationConditions = [
          eq(entries.collectionId, Number(colIdStr)),
          inArray(entries.id, ids),
          isNull(entries.deletedAt),
          eq(entries.status, 'published'),
        ]
        if (tenantId) relationConditions.push(eq(entries.tenantId, tenantId))

        const rels = await db
          .select()
          .from(entries)
          .where(and(...relationConditions))

        relationData[Number(colIdStr)] = {}
        for (const rel of rels) {
          relationData[Number(colIdStr)][rel.id] = rel
        }
      }

      return entriesList.map((entry) => {
        const newContent = { ...entry.content }
        for (const field of relationFields) {
          const val = entry.content?.[field.name]
          if (val) {
            const relColId = field.relationCollectionId
            if (Array.isArray(val)) {
              newContent[field.name] = val.map((v: any) => {
                const relatedEntry = relationData[relColId]?.[v]
                return relatedEntry
                  ? { id: relatedEntry.id, ...relatedEntry.content }
                  : v
              })
            } else {
              const relatedEntry = relationData[relColId]?.[val]
              if (relatedEntry) {
                newContent[field.name] = {
                  id: relatedEntry.id,
                  ...relatedEntry.content,
                }
              }
            }
          }
        }
        return { ...entry, content: newContent }
      })
    }

    if (isGlobal) {
      const requestedLocale = c.req.query('locale') || 'en'

      let result = await db
        .select({
          entry: entries,
          updatedBy: { id: users.id, name: users.name },
        })
        .from(entries)
        .leftJoin(users, eq(entries.updatedById, users.id))
        .where(
          and(
            eq(entries.collectionId, id),
            isNull(entries.deletedAt),
            eq(entries.status, 'published'),
            eq(entries.locale, requestedLocale)
          )
        )
        .orderBy(desc(entries.createdAt))
        .limit(1)

      // Fallback to default if requested locale not found
      if (result.length === 0 && requestedLocale !== 'en') {
        const fallbackConditions = [
          eq(entries.collectionId, id),
          isNull(entries.deletedAt),
          eq(entries.status, 'published'),
          eq(entries.locale, 'en'),
        ]
        if (tenantId) fallbackConditions.push(eq(entries.tenantId, tenantId))

        result = await db
          .select({
            entry: entries,
            updatedBy: { id: users.id, name: users.name },
          })
          .from(entries)
          .leftJoin(users, eq(entries.updatedById, users.id))
          .where(and(...fallbackConditions))
          .orderBy(desc(entries.createdAt))
          .limit(1)
      }

      const r = result[0]
      if (!r) return c.json({ type: 'global', entry: null })
      const populated = await populateRelations([r.entry])

      return c.json({
        type: 'global',
        entry: populated[0]
          ? { ...populated[0], updatedBy: r.updatedBy?.id ? r.updatedBy : null }
          : null,
      })
    }

    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = parseInt(c.req.query('limit') || '10', 10)
    const offset = (page - 1) * limit

    const isTrash = c.req.query('trash') === 'true'
    const localeQuery = c.req.query('locale')
    const requestedLocale = localeQuery || 'en'

    let whereClause = and(
      eq(entries.collectionId, id),
      eq(entries.status, 'published'),
      tenantId ? eq(entries.tenantId, tenantId) : sql`true`
    ) as any

    // Only filter by locale if not explicitly requesting all
    if (localeQuery !== '_all') {
      whereClause = and(whereClause, eq(entries.locale, requestedLocale)) as any
    }

    // col is fetched above. It doesn't have enableTrash. We must fetch it.
    const colExtended = await db
      .select({ enableTrash: collections.enableTrash })
      .from(collections)
      .where(
        and(
          eq(collections.id, id),
          tenantId ? eq(collections.tenantId, tenantId) : sql`true`
        )
      )
      .limit(1)

    if (colExtended[0]?.enableTrash) {
      if (isTrash) {
        whereClause = and(whereClause, isNotNull(entries.deletedAt)) as any
      } else {
        whereClause = and(whereClause, isNull(entries.deletedAt)) as any
      }
    } else {
      whereClause = and(whereClause, isNull(entries.deletedAt)) as any
    }

    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(entries)
      .where(whereClause)
    const totalCount = Number(countResult[0].count)
    const totalPages = Math.ceil(totalCount / limit)

    const result = await db
      .select({
        entry: entries,
        updatedBy: { id: users.id, name: users.name },
      })
      .from(entries)
      .leftJoin(users, eq(entries.updatedById, users.id))
      .where(whereClause)
      .orderBy(desc(entries.createdAt))
      .limit(limit)
      .offset(offset)

    const populatedEntries = await populateRelations(result.map((r) => r.entry))

    return c.json({
      type: 'collection',
      entries: populatedEntries.map((pe, idx) => ({
        ...pe,
        updatedBy: result[idx].updatedBy?.id ? result[idx].updatedBy : null,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/collections/:id/entries', async (c) => {
  const collectionId = parseInt(c.req.param('id'), 10)
  const tenantId = c.get('tenantId')
  if (isNaN(collectionId))
    return c.json({ error: 'Invalid collection ID' }, 400)

  const whereCol = [eq(collections.id, collectionId)]
  if (tenantId) whereCol.push(eq(collections.tenantId, tenantId))

  const collectionResult = await db
    .select()
    .from(collections)
    .where(and(...whereCol))
    .limit(1)
  const collection = collectionResult[0]
  if (!collection) return c.json({ error: 'Collection not found' }, 404)

  if (!checkPermission(c, collection.slug, 'create')) {
    return c.json(
      { error: 'Forbidden: No create access to this collection' },
      403
    )
  }

  const dynamicSchema = buildZodSchema(collection.fields as FieldDefinition[])

  try {
    const body = await c.req.json()

    // Handle Bulk Localization Save
    if (body.locales && typeof body.locales === 'object') {
      const localesData = body.locales
      const validationErrors: Record<string, any> = {}
      const validatedEntries: any[] = []

      const translationGroupId = body.translationGroupId || crypto.randomUUID()
      const status = body.status || 'published'

      for (const [localeCode, content] of Object.entries(localesData)) {
        // Skip empty drafts
        if (!content || Object.keys(content as object).length === 0) continue

        const parseResult = dynamicSchema.safeParse(content)
        if (!parseResult.success) {
          validationErrors[localeCode] = parseResult.error.format()
          continue
        }

        validatedEntries.push({
          collectionId,
          content: parseResult.data,
          status,
          locale: localeCode,
          translationGroupId,
          updatedById: c.get('user')?.id || null,
          tenantId,
        })
      }

      if (Object.keys(validationErrors).length > 0) {
        return c.json(
          {
            error: 'Validation failed',
            details: validationErrors,
            isBulk: true,
          },
          400
        )
      }

      if (validatedEntries.length === 0) {
        return c.json({ error: 'No content provided' }, 400)
      }

      // Transactional bulk insert
      const results = await db.transaction(async (tx) => {
        const inserted = []
        for (const entryData of validatedEntries) {
          const res = await tx.insert(entries).values(entryData).returning()
          inserted.push(res[0])
        }
        return inserted
      })

      // Try to return the entry matching currentLocale or default locale or first
      const primaryEntry =
        results.find((r) => r.locale === body.currentLocale) ||
        results.find((r) => r.locale === 'en') ||
        results[0]

      return c.json({ success: true, entry: primaryEntry, results }, 201)
    }

    // Fallback to single entry save (Backward compatibility)
    const parseResult = dynamicSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        400
      )
    }

    const insertResult = await db
      .insert(entries)
      .values({
        collectionId: collectionId,
        content: parseResult.data,
        status: body.status || 'published',
        locale: body.locale || 'en',
        translationGroupId: body.translationGroupId || crypto.randomUUID(),
        updatedById: c.get('user')?.id || null,
        tenantId,
      })
      .returning()

    return c.json({ success: true, entry: insertResult[0] }, 201)
  } catch (e) {
    console.error('Error creating entries:', e)
    return c.json({ error: 'Invalid JSON or Internal error' }, 400)
  }
})

api.get('/entries/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')
    const requestedLocale = c.req.query('locale')

    const entryConditions = [
      eq(entries.id, id),
      isNull(entries.deletedAt),
      eq(entries.status, 'published'),
    ]
    if (tenantId) entryConditions.push(eq(entries.tenantId, tenantId))

    const result = await db
      .select({
        entry: entries,
        updatedBy: {
          id: users.id,
          name: users.name,
        },
      })
      .from(entries)
      .leftJoin(users, eq(entries.updatedById, users.id))
      .where(and(...entryConditions))
      .limit(1)

    if (result.length === 0) return c.json({ error: 'Entry not found' }, 404)
    let r = result[0]

    // If a different locale is requested, try to find it in the same group
    if (
      requestedLocale &&
      r.entry.locale !== requestedLocale &&
      r.entry.translationGroupId
    ) {
      const transConditions = [
        eq(entries.translationGroupId, r.entry.translationGroupId),
        eq(entries.locale, requestedLocale),
        isNull(entries.deletedAt),
        eq(entries.status, 'published'),
      ]
      if (tenantId) transConditions.push(eq(entries.tenantId, tenantId))

      const translation = await db
        .select({
          entry: entries,
          updatedBy: {
            id: users.id,
            name: users.name,
          },
        })
        .from(entries)
        .leftJoin(users, eq(entries.updatedById, users.id))
        .where(and(...transConditions))
        .limit(1)

      if (translation.length > 0) {
        r = translation[0]
      }
    }
    return c.json({
      entry: r.entry,
      updatedBy:
        r.updatedBy && 'id' in r.updatedBy && r.updatedBy.id
          ? r.updatedBy
          : null,
    })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.put('/entries/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')

    const entryConditions = [eq(entries.id, id)]
    if (tenantId) entryConditions.push(eq(entries.tenantId, tenantId))

    const existingResult = await db
      .select()
      .from(entries)
      .where(and(...entryConditions))
      .limit(1)
    if (existingResult.length === 0)
      return c.json({ error: 'Entry not found' }, 404)
    const entry = existingResult[0]

    const colConditions = [eq(collections.id, entry.collectionId)]
    if (tenantId) colConditions.push(eq(collections.tenantId, tenantId))

    const collectionResult = await db
      .select()
      .from(collections)
      .where(and(...colConditions))
      .limit(1)
    const collection = collectionResult[0]
    if (!collection) return c.json({ error: 'Collection not found' }, 404)

    if (!checkPermission(c, collection.slug, 'update')) {
      return c.json(
        { error: 'Forbidden: No update access to this collection' },
        403
      )
    }

    const dynamicSchema = buildZodSchema(collection.fields as FieldDefinition[])
    const body = await c.req.json()
    const parseResult = dynamicSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        400
      )
    }

    // 1. Save current state to versions BEFORE updating
    const lastVersionResult = await db
      .select({ max: sql`max(${entryVersions.versionNumber})` })
      .from(entryVersions)
      .where(eq(entryVersions.entryId, id))

    const nextVersion = (Number(lastVersionResult[0]?.max) || 0) + 1

    await db.insert(entryVersions).values({
      entryId: id,
      content: entry.content,
      versionNumber: nextVersion,
      status: entry.status,
      locale: entry.locale,
      createdById: entry.updatedById,
      createdAt: entry.updatedAt,
    })

    // 2. Clear old versions (keep only latest 5)
    // We just added one, so after this update there will be 'nextVersion' versions.
    // We want to keep the latest 5.
    const allVersions = await db
      .select({ id: entryVersions.id })
      .from(entryVersions)
      .where(eq(entryVersions.entryId, id))
      .orderBy(desc(entryVersions.versionNumber))

    if (allVersions.length > 5) {
      const idsToDelete = allVersions.slice(5).map((v) => v.id)
      await db
        .delete(entryVersions)
        .where(sql`${entryVersions.id} in ${idsToDelete}`)
    }

    // 3. Update the entry
    const updated = await db
      .update(entries)
      .set({
        content: parseResult.data,
        status: body.status || entry.status,
        locale: body.locale || entry.locale,
        updatedById: c.get('user')?.id || null,
        updatedAt: new Date(),
      })
      .where(and(...entryConditions))
      .returning()

    return c.json({ success: true, entry: updated[0] })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.delete('/entries/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')
    if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const entryConditions = [eq(entries.id, id)]
    if (tenantId) entryConditions.push(eq(entries.tenantId, tenantId))

    // Get collection slug to check permission
    const entryData = await db
      .select({
        slug: collections.slug,
        collectionId: collections.id,
      })
      .from(entries)
      .innerJoin(collections, eq(entries.collectionId, collections.id))
      .where(and(...entryConditions))
      .limit(1)

    if (entryData.length === 0) return c.json({ error: 'Entry not found' }, 404)

    const slug = entryData[0].slug
    if (!checkPermission(c, slug, 'delete')) {
      return c.json(
        { error: 'Forbidden: No delete access to this collection' },
        403
      )
    }

    const colQuery = await db
      .select({ enableTrash: collections.enableTrash })
      .from(collections)
      .where(eq(collections.id, entryData[0].collectionId))
      .limit(1)
    const isTrashEnabled = colQuery[0]?.enableTrash

    const force = c.req.query('force') === 'true'

    if (isTrashEnabled && !force) {
      const updated = await db
        .update(entries)
        .set({ deletedAt: new Date() })
        .where(and(...entryConditions))
        .returning()
      if (updated.length === 0) return c.json({ error: 'Entry not found' }, 404)
      return c.json({ success: true, message: 'Entry moved to trash' })
    } else {
      const deleted = await db
        .delete(entries)
        .where(and(...entryConditions))
        .returning()
      if (deleted.length === 0) return c.json({ error: 'Entry not found' }, 404)
      return c.json({ success: true })
    }
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/entries/:id/restore', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')
    if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const entryConditions = [eq(entries.id, id)]
    if (tenantId) entryConditions.push(eq(entries.tenantId, tenantId))

    const entryData = await db
      .select({
        slug: collections.slug,
      })
      .from(entries)
      .innerJoin(collections, eq(entries.collectionId, collections.id))
      .where(and(...entryConditions))
      .limit(1)

    if (entryData.length === 0) return c.json({ error: 'Entry not found' }, 404)

    if (!checkPermission(c, entryData[0].slug, 'update')) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const updated = await db
      .update(entries)
      .set({ deletedAt: null })
      .where(and(...entryConditions))
      .returning()

    if (updated.length === 0) return c.json({ error: 'Entry not found' }, 404)
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.get('/entries/:id/versions', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')

    const entryConditions = [eq(entries.id, id)]
    if (tenantId) entryConditions.push(eq(entries.tenantId, tenantId))

    // Verify entry existence and ownership
    const entryExists = await db
      .select({ id: entries.id })
      .from(entries)
      .where(and(...entryConditions))
      .limit(1)

    if (entryExists.length === 0)
      return c.json({ error: 'Entry not found' }, 404)

    const result = await db
      .select({
        id: entryVersions.id,
        versionNumber: entryVersions.versionNumber,
        content: entryVersions.content,
        createdAt: entryVersions.createdAt,
        createdBy: {
          id: users.id,
          name: users.name,
        },
      })
      .from(entryVersions)
      .leftJoin(users, eq(entryVersions.createdById, users.id))
      .where(eq(entryVersions.entryId, id))
      .orderBy(desc(entryVersions.versionNumber))

    return c.json({ versions: result })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/entries/:id/versions/:versionId/revert', async (c) => {
  try {
    const entryId = parseInt(c.req.param('id'), 10)
    const versionId = parseInt(c.req.param('versionId'), 10)
    const tenantId = c.get('tenantId')

    const entryConditions = [eq(entries.id, entryId)]
    if (tenantId) entryConditions.push(eq(entries.tenantId, tenantId))

    const versionResult = await db
      .select()
      .from(entryVersions)
      .where(eq(entryVersions.id, versionId))
      .limit(1)
    if (versionResult.length === 0)
      return c.json({ error: 'Version not found' }, 404)
    const version = versionResult[0]

    // Check entry exists and permissions
    const existingEntry = await db
      .select()
      .from(entries)
      .where(and(...entryConditions))
      .limit(1)
    if (existingEntry.length === 0)
      return c.json({ error: 'Entry not found' }, 404)
    const entry = existingEntry[0]

    const colConditions = [eq(collections.id, entry.collectionId)]
    if (tenantId) colConditions.push(eq(collections.tenantId, tenantId))

    const collectionResult = await db
      .select()
      .from(collections)
      .where(and(...colConditions))
      .limit(1)
    const collection = collectionResult[0]
    if (!checkPermission(c, collection.slug, 'update')) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Save CURRENT state as a new version before reverting
    const lastVersionResult = await db
      .select({ max: sql`max(${entryVersions.versionNumber})` })
      .from(entryVersions)
      .where(eq(entryVersions.entryId, entryId))

    const nextVersion = (Number(lastVersionResult[0]?.max) || 0) + 1

    await db.insert(entryVersions).values({
      entryId: entryId,
      content: entry.content,
      versionNumber: nextVersion,
      status: entry.status,
      createdById: entry.updatedById,
      createdAt: entry.updatedAt,
    })

    const updated = await db
      .update(entries)
      .set({
        content: version.content,
        status: version.status || 'published',
        updatedById: c.get('user')?.id || null,
        updatedAt: new Date(),
      })
      .where(and(...entryConditions))
      .returning()

    // Clean up versions (keep 5)
    const allVersions = await db
      .select({ id: entryVersions.id })
      .from(entryVersions)
      .where(eq(entryVersions.entryId, entryId))
      .orderBy(desc(entryVersions.versionNumber))

    if (allVersions.length > 5) {
      const idsToDelete = allVersions.slice(5).map((v) => v.id)
      await db
        .delete(entryVersions)
        .where(sql`${entryVersions.id} in ${idsToDelete}`)
    }

    return c.json({ success: true, entry: updated[0] })
  } catch (err) {
    console.error('Revert error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// --- Form Builder API ---

api.get('/forms', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const whereTenant = tenantId ? eq(forms.tenantId, tenantId) : sql`true`
    const result = await db
      .select()
      .from(forms)
      .where(whereTenant)
      .orderBy(desc(forms.createdAt))
    return c.json({ forms: result })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.get('/forms/:idOrSlug', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug')
    const tenantId = c.get('tenantId')
    let result

    const conditions: any[] = []
    if (tenantId) conditions.push(eq(forms.tenantId, tenantId))

    if (/^\d+$/.test(idOrSlug)) {
      conditions.push(eq(forms.id, parseInt(idOrSlug, 10)))
      result = await db
        .select()
        .from(forms)
        .where(and(...conditions))
        .limit(1)
    } else {
      conditions.push(eq(forms.slug, idOrSlug))
      result = await db
        .select()
        .from(forms)
        .where(and(...conditions))
        .limit(1)
    }
    if (result.length === 0) return c.json({ error: 'Form not found' }, 404)
    return c.json({ form: result[0] })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/forms', async (c) => {
  try {
    const body = await c.req.json()
    const tenantId = c.get('tenantId')
    const {
      name,
      slug,
      fields,
      storageType,
      apiUrl,
      apiMethod,
      apiHeaders,
      apiEntriesPath,
      allowedOrigins,
      honeypotField,
    } = body

    if (!name || !slug) {
      return c.json({ error: 'Name and Slug are required' }, 400)
    }

    if (storageType === 'external' && !apiUrl) {
      return c.json({ error: 'API URL is required for external storage' }, 400)
    }

    const newForm = await db
      .insert(forms)
      .values({
        name,
        slug,
        fields: fields || [],
        storageType: storageType || 'external',
        apiUrl: storageType === 'external' ? apiUrl : null,
        apiMethod: apiMethod || 'POST',
        apiHeaders: apiHeaders || {},
        apiEntriesPath: apiEntriesPath || null,
        allowedOrigins: allowedOrigins || null,
        honeypotField: honeypotField || null,
        tenantId,
      })
      .returning()

    return c.json({ success: true, form: newForm[0] }, 201)
  } catch (err) {
    console.error('Error creating form:', err)
    if (String(err).includes('unique constraint')) {
      return c.json({ error: 'Slug already exists' }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.put('/forms/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')
    const body = await c.req.json()
    const {
      name,
      fields,
      storageType,
      apiUrl,
      apiMethod,
      apiHeaders,
      apiEntriesPath,
      allowedOrigins,
      honeypotField,
    } = body

    const whereClause = [eq(forms.id, id)]
    if (tenantId) whereClause.push(eq(forms.tenantId, tenantId))

    const updated = await db
      .update(forms)
      .set({
        name,
        fields: fields || [],
        storageType: storageType || 'external',
        apiUrl: storageType === 'external' ? apiUrl : null,
        apiMethod: apiMethod || 'POST',
        apiHeaders: apiHeaders || {},
        apiEntriesPath: apiEntriesPath || null,
        allowedOrigins: allowedOrigins || null,
        honeypotField: honeypotField || null,
        updatedAt: new Date(),
      })
      .where(and(...whereClause))
      .returning()

    if (updated.length === 0) return c.json({ error: 'Form not found' }, 404)
    return c.json({ success: true, form: updated[0] })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.delete('/forms/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')

    const whereClause = [eq(forms.id, id)]
    if (tenantId) whereClause.push(eq(forms.tenantId, tenantId))

    const deleted = await db
      .delete(forms)
      .where(and(...whereClause))
      .returning()
    if (deleted.length === 0) return c.json({ error: 'Form not found' }, 404)
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Proxy for Third-Party Entries or Fetch Internal
api.get('/forms/:slug/entries', async (c) => {
  try {
    const slug = c.req.param('slug')
    const tenantId = c.get('tenantId')

    const whereClause = [eq(forms.slug, slug)]
    if (tenantId) whereClause.push(eq(forms.tenantId, tenantId))

    const formResult = await db
      .select()
      .from(forms)
      .where(and(...whereClause))
      .limit(1)
    if (formResult.length === 0) return c.json({ error: 'Form not found' }, 404)

    const form = formResult[0]

    if (form.storageType === 'internal') {
      const entriesResult = await db
        .select()
        .from(formEntries)
        .where(eq(formEntries.formId, form.id))
        .orderBy(desc(formEntries.createdAt))
      // Map to consistent structure
      const entries = entriesResult.map((e) => ({
        id: e.id,
        createdAt: e.createdAt,
        ...(e.data as object),
      }))
      return c.json({ entries })
    }

    // This is where we would fetch from the third-party API
    // For now, we return an empty array until integration is tested
    return c.json({
      entries: [],
      message: 'Third-party integration pending real API URL',
    })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Public Form Submission
api.post('/forms/:slug/submit', async (c) => {
  try {
    const slug = c.req.param('slug')
    const tenantId = c.get('tenantId') // Public submit might not have tenant context unless via headers

    const whereClause = [eq(forms.slug, slug)]
    if (tenantId) whereClause.push(eq(forms.tenantId, tenantId))

    const formResult = await db
      .select()
      .from(forms)
      .where(and(...whereClause))
      .limit(1)
    if (formResult.length === 0) return c.json({ error: 'Form not found' }, 404)

    const form = formResult[0]
    const body = await c.req.json()

    // 1. Origin Check (CORS-like security)
    const requestOrigin = c.req.header('Origin') || c.req.header('Referer')
    if (form.allowedOrigins) {
      const allowed = form.allowedOrigins
        .split(',')
        .map((o) => o.trim().toLowerCase())
      if (!requestOrigin) {
        return c.json({ error: 'Origin header required' }, 403)
      }
      const originMatch = allowed.some((domain) =>
        requestOrigin.toLowerCase().includes(domain.replace(/^https?:\/\//, ''))
      )
      if (!originMatch) {
        return c.json({ error: 'Forbidden: Origin not allowed' }, 403)
      }
    }

    // 2. Honeypot Check (Bot protection)
    if (form.honeypotField && body[form.honeypotField]) {
      console.warn(`Spam detected via honeypot field: ${form.honeypotField}`)
      return c.json({
        success: true,
        message: 'Form submitted successfully (spam filtered)',
      })
    }

    // Validate body against form fields (optional but recommended)
    // For simplicity, we just save it now.

    if (form.storageType === 'internal') {
      await db.insert(formEntries).values({
        formId: form.id,
        data: body,
        tenantId: form.tenantId, // Ensure entry gets the same tenant as the form
      })
      return c.json({
        success: true,
        message: 'Form submitted successfully (internal)',
      })
    } else {
      // Proxy the submission to the third-party API
      if (!form.apiUrl)
        return c.json({ error: 'Form misconfigured: No API URL' }, 400)

      const response = await fetch(form.apiUrl, {
        method: form.apiMethod,
        headers: {
          'Content-Type': 'application/json',
          ...form.apiHeaders,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        return c.json({ error: 'Failed to submit to third-party API' }, 500)
      }

      return c.json({
        success: true,
        message: 'Form submitted successfully (external)',
      })
    }
  } catch (err) {
    console.error('Submission error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Handle 404
app.notFound(async (c) => {
  return c.get('inertia')('Errors/NotFound', { title: '404 - Not Found' })
})

// Mount the api router under /api
app.route('/api', api)

// Export the raw app for Vite
export default app
