import { serveStatic } from '@hono/node-server/serve-static'
import { Polar } from '@polar-sh/sdk'
import { validateEvent } from '@polar-sh/sdk/webhooks'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  notInArray,
  or,
  sql,
} from 'drizzle-orm'
import fs from 'fs'
import { Hono } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { sign, verify } from 'hono/jwt'
import { generateSecret, generateURI, verifySync } from 'otplib'
import path from 'path'
import QRCode from 'qrcode'
import {
  getTenantFeatures,
  getWorkspaceFeatures,
  isReservedSlug,
  PLAN_LIMITS,
} from '../config/features.js'
import { db } from '../db/index.js'
import {
  abilities,
  apiLogs,
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
  webhooks,
  webhookLogs,
} from '../db/schema.js'
import type { FieldDefinition } from '../lib/dynamic-schema.js'
import { buildZodSchema } from '../lib/dynamic-schema.js'
import { sendEmail } from '../lib/email.js'
import { inertia } from '../lib/inertia.js'
import { triggerWebhooks } from '../lib/webhooks.js'
import { redis, usageTracker } from '../middleware/usageTracker.js'
import { checkPermission } from '../lib/permissions.js'
import apiDocuments from './documents.js'
import { createGraphQLHandler } from './graphql.js'
import apiMedia from './media.js'
import apiUsers from './users.js'

export { checkPermission }

console.log('🔥 Morphic CMS: Hono Initializing on Vercel Node Runtime')

type Variables = {
  user: any
  tenantId: number | null
  currentTenant: any | null
  tenantRole: string | null
  authType: 'api_key' | 'session' | null
}

const getCookieOptions = (c: any, maxAge: number) => {
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || ''
  const cleanHost = host.split(':')[0]
  let domain: string | undefined = undefined

  const baseAppDomain = process.env.APP_DOMAIN || 'morphic-cms.com'

  if (cleanHost.endsWith(`.${baseAppDomain}`) || cleanHost === baseAppDomain) {
    domain = `.${baseAppDomain}`
  }

  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax' as const,
    maxAge,
    ...(domain ? { domain } : {}),
  }
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
app.use('/favicon.png', serveStatic({ root: distPath }))
app.use('/vite.svg', serveStatic({ root: distPath }))

// Middleware to decode token, verify user, and determine tenant globally
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
  let authType: 'api_key' | 'session' | null = null

  if (apiKey) {
    authType = 'api_key'
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
          apiKey: dbUser.apiKey,
          planTier: (dbUser.planTier || 'FREE').toUpperCase(),
          allowedMonthlyRequests: dbUser.allowedMonthlyRequests,
        }
      }
    } catch (e) {
      console.error('Failed to verify API Key:', e)
    }
  } else if (token) {
    authType = 'session'
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
          apiKey: dbUser.apiKey,
          planTier: (dbUser.planTier || 'FREE').toUpperCase(),
          allowedMonthlyRequests: dbUser.allowedMonthlyRequests,
        }
      }
    } catch (e) {
      console.error('Failed to verify token globally:', e)
    }
  }

  c.set('user', userData)
  c.set('authType', authType)

  // --- Tenant Detection ---
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || ''
  const cleanHost = host.split(':')[0]
  let subdomain: string | null = null

  const baseAppDomain = process.env.APP_DOMAIN || 'morphic-cms.com'

  if (cleanHost.endsWith(`.${baseAppDomain}`)) {
    subdomain = cleanHost.slice(0, -`.${baseAppDomain}`.length)
  }

  if (subdomain === 'www' || subdomain === 'api') {
    subdomain = null
  }

  let subdomainTenantId: number | null = null
  let subdomainTenant: any = null
  if (subdomain) {
    try {
      const tenantResult = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, subdomain))
        .limit(1)
      if (tenantResult[0]) {
        subdomainTenant = tenantResult[0]
        subdomainTenantId = tenantResult[0].id
      }
    } catch (e) {
      console.error('Failed to resolve tenant by subdomain:', e)
    }
  }

  // Subdomain tenant ID overrides cookie/header if present and valid
  const activeTenantId =
    subdomainTenantId?.toString() ||
    c.req.header('X-Tenant-ID') ||
    getCookie(c, 'morphic_active_tenant')

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
        if (subdomainTenant && subdomainTenant.id === id) {
          currentTenant = subdomainTenant
        } else {
          const tenantResult = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, id))
            .limit(1)
          if (tenantResult[0]) {
            currentTenant = tenantResult[0]
          }
        }

        if (currentTenant) {
          tenantId = id
          tenantRole =
            userTenantAccess[0]?.role ||
            (userData?.role === 'super_admin' ? 'owner' : 'member')

          try {
            const ownerRecords = await db
              .select({
                planTier: users.planTier,
                allowedMonthlyRequests: users.allowedMonthlyRequests,
              })
              .from(usersToTenants)
              .innerJoin(users, eq(usersToTenants.userId, users.id))
              .where(
                and(
                  eq(usersToTenants.tenantId, id),
                  eq(usersToTenants.role, 'owner')
                )
              )

            if (ownerRecords.length > 0) {
              let bestOwner = ownerRecords[0]
              const tierWeight = (tier: string) => {
                const t = (tier || 'FREE').toUpperCase()
                if (t === 'SELF_HOSTED') return 3
                if (t === 'PRO') return 2
                return 1
              }
              for (const record of ownerRecords) {
                if (
                  tierWeight(record.planTier) > tierWeight(bestOwner.planTier)
                ) {
                  bestOwner = record
                }
              }

              currentTenant = {
                ...currentTenant,
                planTier: (bestOwner.planTier || 'FREE').toUpperCase(),
                allowedMonthlyRequests: bestOwner.allowedMonthlyRequests,
              }
            } else {
              currentTenant = {
                ...currentTenant,
                planTier: 'FREE',
                allowedMonthlyRequests: PLAN_LIMITS.FREE.allowedMonthlyRequests,
              }
            }
          } catch (err) {
            console.error('Failed to resolve tenant owner plan details:', err)
          }
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
  if (!c.req.path.startsWith('/api/')) {
    const userData = c.get('user')
    const currentTenant = c.get('currentTenant')

    let availableTenants: any[] = []
    let features = null

    let canCreateWorkspace = false
    if (userData) {
      try {
        if (userData.role === 'super_admin') {
          availableTenants = await db.select().from(tenants)
          canCreateWorkspace = true
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

          if (userData.planTier === 'PRO' || userData.planTier === 'SELF_HOSTED') {
            const ownedWorkspaces = await db
              .select({ id: tenants.id })
              .from(tenants)
              .innerJoin(usersToTenants, eq(tenants.id, usersToTenants.tenantId))
              .where(
                and(
                  eq(usersToTenants.userId, userData.id),
                  eq(usersToTenants.role, 'owner')
                )
              )
            const userFeatures = getTenantFeatures(userData.planTier)
            canCreateWorkspace = ownedWorkspaces.length < userFeatures.maxWorkspaces
          }
        }

        features = await getWorkspaceFeatures(currentTenant?.id)
      } catch (e) {
        console.error('Failed to fetch available tenants for shared props:', e)
      }
    }

    c.set('inertiaSharedProps' as any, {
      user: userData || null,
      activeTenant: currentTenant || null,
      activeTenantRole: c.get('tenantRole') || null,
      availableTenants: availableTenants,
      appDomain: process.env.APP_DOMAIN || 'morphic-cms.com',
      features,
      canCreateWorkspace,
      isSelfHosted: process.env.IS_SELF_HOSTED === 'true',
    })
  }
  await next()
})

// Serve the Landing Page at root
app.get('/', async (c) => {
  const isSimple = process.env.SIMPLE_HOMEPAGE === '1'
  return c.get('inertia')('Home', {
    title: 'Morphic CMS',
    isSimpleHomepage: isSimple,
  })
})

// Serve the Login page at /login
app.get('/login', async (c) => {
  const userData = c.get('user')
  if (userData) {
    return c.redirect('/dashboard')
  }
  return c.get('inertia')('Index', { title: 'Morphic CMS' })
})

// Serve the Sign Up page at /signup
app.get('/signup', async (c) => {
  const userData = c.get('user')
  if (userData) {
    return c.redirect('/dashboard')
  }
  return c.get('inertia')('Auth/SignUp', {
    title: 'Morphic CMS',
    turnstileSiteKey: process.env.CLOUDFLARE_TURNSTILE_SITE_KEY || '',
  })
})

// Verify email address confirmation route
app.get('/verify-email', async (c) => {
  const token = c.req.query('token')
  if (!token) {
    return c.redirect('/login?error=verification_failed')
  }

  try {
    const userResult = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerificationToken, token),
          gt(users.emailVerificationExpiresAt, new Date())
        )
      )
      .limit(1)

    const user = userResult[0]
    if (!user) {
      return c.redirect('/login?error=verification_failed')
    }

    await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return c.redirect('/login?verified=true')
  } catch (err) {
    console.error('Error during email verification:', err)
    return c.redirect('/login?error=verification_failed')
  }
})

// Serve the Pricing page at /pricing
app.get('/pricing', async (c) => {
  const userData = c.get('user')
  if (userData) {
    return c.get('inertia')('Pricing', {
      user: userData,
      paddleClientToken: process.env.PADDLE_CLIENT_TOKEN || '',
      paddlePriceId: process.env.PADDLE_PRICE_ID || '',
      paddleEnvironment: process.env.PADDLE_ENVIRONMENT || 'sandbox',
      title: 'Pricing & Plans',
    })
  }
  return c.get('inertia')('PricingPublic', {
    title: 'Pricing & Plans',
  })
})

app.get('/logout', async (c) => {
  const cookieOpts = getCookieOptions(c, 0)
  deleteCookie(c, 'morphic_token', {
    path: cookieOpts.path,
    domain: cookieOpts.domain,
  })
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

app.get('/sitemap.xml', async (c) => {
  const baseUrl = process.env.APP_URL || 'https://morphic-cms.com'

  interface SitemapPath {
    path: string
    priority: string
    lastmod?: string
  }

  const staticPaths: SitemapPath[] = [
    { path: '/', priority: '1.0' },
    { path: '/pricing', priority: '0.8' },
    { path: '/terms', priority: '0.8' },
    { path: '/privacy', priority: '0.8' },
    { path: '/refund-policy', priority: '0.8' },
    { path: '/blog', priority: '0.8' },
  ]

  const tenantSlug = process.env.MORPHIC_WORKSPACE
  const collectionSlug = process.env.MORPHIC_POSTS_COLLECTION
  const dynamicPaths: SitemapPath[] = []

  if (tenantSlug && collectionSlug) {
    try {
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, tenantSlug))
        .limit(1)
        .then((r) => r[0])

      if (tenant) {
        const collection = await db
          .select()
          .from(collections)
          .where(
            and(
              eq(collections.tenantId, tenant.id),
              eq(collections.slug, collectionSlug)
            )
          )
          .limit(1)
          .then((r) => r[0])

        if (collection) {
          const posts = await db
            .select({
              content: entries.content,
              updatedAt: entries.updatedAt,
            })
            .from(entries)
            .where(
              and(
                eq(entries.collectionId, collection.id),
                eq(entries.tenantId, tenant.id),
                eq(entries.status, 'published'),
                isNull(entries.deletedAt)
              )
            )

          posts.forEach((p) => {
            const content = p.content as any
            if (content?.slug) {
              const lastmod = p.updatedAt
                ? new Date(p.updatedAt).toISOString().split('T')[0]
                : undefined
              dynamicPaths.push({
                path: `/blog/${content.slug}`,
                priority: '0.8',
                lastmod,
              })
            }
          })
        }
      }
    } catch (err) {
      console.error('Error generating sitemap:', err)
    }
  }

  const allPaths = [...staticPaths, ...dynamicPaths]
  const urlsXml = allPaths
    .map(({ path, priority, lastmod }) => {
      const fullUrl = `${baseUrl.replace(/\/$/, '')}${path}`
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${fullUrl}</loc>${lastmodTag}\n    <changefreq>daily</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    })
    .join('\n')

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`

  c.header('Content-Type', 'application/xml')
  return c.text(sitemapXml)
})

app.get('/blog', async (c) => {
  const userData = c.get('user')
  const tenantSlug = process.env.MORPHIC_WORKSPACE
  const collectionSlug = process.env.MORPHIC_POSTS_COLLECTION

  if (!tenantSlug || !collectionSlug) {
    return c.text(
      'Configuration error: Workspace or Posts Collection not configured in env',
      500
    )
  }

  // Find tenant
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1)
    .then((r) => r[0])

  if (!tenant) {
    return c.text('Tenant not found ' + tenantSlug, 404)
  }

  // Find collection
  const collection = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.slug, collectionSlug),
        eq(collections.tenantId, tenant.id)
      )
    )
    .limit(1)
    .then((r) => r[0])

  if (!collection) {
    return c.get('inertia')('Blog/Index', {
      user: userData,
      posts: [],
      pagination: { currentPage: 1, totalPages: 0, totalCount: 0, limit: 5 },
      title: 'Blog | Morphic CMS',
    })
  }

  // Pagination query params
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = 5
  const offset = (page - 1) * limit

  const whereClause = and(
    eq(entries.collectionId, collection.id),
    eq(entries.tenantId, tenant.id),
    eq(entries.status, 'published'),
    isNull(entries.deletedAt)
  )

  const countResult = await db
    .select({ count: sql`count(*)` })
    .from(entries)
    .where(whereClause)
  const totalCount = Number(countResult[0].count)
  const totalPages = Math.ceil(totalCount / limit)

  const blogEntries = await db
    .select()
    .from(entries)
    .where(whereClause)
    .orderBy(desc(entries.createdAt))
    .limit(limit)
    .offset(offset)

  return c.get('inertia')('Blog/Index', {
    user: userData,
    posts: blogEntries.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      collectionId: e.collectionId,
      content: e.content,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalCount: totalCount,
      limit: limit,
    },
    title: 'Blog | Morphic CMS',
  })
})

app.get('/blog/:slug', async (c) => {
  const userData = c.get('user')
  const tenantSlug = process.env.MORPHIC_WORKSPACE
  const collectionSlug = process.env.MORPHIC_POSTS_COLLECTION
  const slug = c.req.param('slug')

  if (!tenantSlug || !collectionSlug) {
    return c.text(
      'Configuration error: Workspace or Posts Collection not configured in env',
      500
    )
  }

  // Find tenant
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1)
    .then((r) => r[0])

  if (!tenant) {
    return c.text('Tenant not found', 404)
  }

  // Find collection
  const collection = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.slug, collectionSlug),
        eq(collections.tenantId, tenant.id)
      )
    )
    .limit(1)
    .then((r) => r[0])

  if (!collection) {
    return c.text('Collection not found', 404)
  }

  // Find entry matching slug inside jsonb content
  const post = await db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.collectionId, collection.id),
        eq(entries.tenantId, tenant.id),
        eq(entries.status, 'published'),
        isNull(entries.deletedAt),
        sql`${entries.content}->>'slug' = ${slug}`
      )
    )
    .limit(1)
    .then((r) => r[0])

  if (!post) {
    return c.redirect('/blog')
  }

  return c.get('inertia')('Blog/Detail', {
    user: userData,
    post: {
      id: post.id,
      tenantId: post.tenantId,
      collectionId: post.collectionId,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    },
    title: `${(post.content as any).title} | Morphic CMS`,
  })
})

app.get('/terms', async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('Terms', {
    user: userData,
    title: 'Terms of Service | Morphic CMS',
  })
})

app.get('/privacy', async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('Privacy', {
    user: userData,
    title: 'Privacy Policy | Morphic CMS',
  })
})

app.get('/refund-policy', async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('RefundPolicy', {
    user: userData,
    title: 'Refund Policy | Morphic CMS',
  })
})

const parseMarkdown = (md: string): string => {
  let html = md
  // Escape HTML entities to prevent XSS
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Horizontal Rules
  html = html.replace(/^---$/gm, '<hr class="border-white/5 my-6" />')

  // Headings
  html = html.replace(
    /^# (.*$)/gm,
    '<h1 class="text-2xl font-extrabold text-white mb-4 mt-6">$1</h1>'
  )
  html = html.replace(
    /^## (.*$)/gm,
    '<h2 class="text-xl font-bold text-white mb-3 mt-5">$1</h2>'
  )
  html = html.replace(
    /^### (.*$)/gm,
    '<h3 class="text-lg font-semibold text-white mb-2 mt-4">$1</h3>'
  )

  // Bold
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-bold text-white">$1</strong>'
  )

  // Links
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" class="text-primary hover:underline">$1</a>'
  )

  // Inline Code
  html = html.replace(
    /`(.*?)`/g,
    '<code class="bg-white/10 px-1 py-0.5 rounded font-mono text-xs text-slate-200">$1</code>'
  )

  // Lists
  html = html.replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>')

  // Wrap contiguous <li> elements in <ul>
  html = html.replace(/(?:<li>.*?<\/li>\s*)+/gs, (match) => {
    return `<ul class="list-disc pl-5 my-4 space-y-2 text-slate-300">\n${match}</ul>`
  })

  // Paragraphs
  const lines = html.split('\n')
  const processedLines = lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('</ul')
    ) {
      return line
    }
    return `<p class="text-slate-400 leading-relaxed mb-4">${line}</p>`
  })

  return processedLines.join('\n')
}

app.get('/changelog', async (c) => {
  const userData = c.get('user')
  const dirPath = path.resolve(process.cwd(), 'release_notes')

  if (!fs.existsSync(dirPath)) {
    return c.get('inertia')('Changelog', {
      user: userData,
      title: 'Changelog | Morphic CMS',
      changelogs: [],
    })
  }

  const files = fs.readdirSync(dirPath)
  const versionRegex = /release_notes_v(\d+\.\d+\.\d+)\.md/

  const changelogData = files
    .filter((file) => versionRegex.test(file))
    .map((file) => {
      const match = file.match(versionRegex)
      const version = match ? match[1] : '0.0.0'
      const filePath = path.join(dirPath, file)
      const content = fs.readFileSync(filePath, 'utf-8')

      const htmlContent = parseMarkdown(content)
      const stats = fs.statSync(filePath)
      const date = stats.mtime.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      return {
        version,
        date,
        content: htmlContent,
      }
    })
    .sort((a, b) => {
      const partsA = a.version.split('.').map(Number)
      const partsB = b.version.split('.').map(Number)
      for (let i = 0; i < 3; i++) {
        if (partsA[i] > partsB[i]) return -1
        if (partsA[i] < partsB[i]) return 1
      }
      return 0
    })

  return c.get('inertia')('Changelog', {
    user: userData,
    title: 'Changelog | Morphic CMS',
    changelogs: changelogData,
  })
})

// Public Form view route (no requireAuth middleware)
app.get('/public-form/:tenantSlug/:slug', async (c) => {
  const tenantSlug = c.req.param('tenantSlug')
  const slug = c.req.param('slug')

  try {
    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1)

    if (tenantResult.length === 0) {
      return c.get('inertia')('Forms/PublicForm', {
        error: 'The organization you are looking for does not exist.',
      })
    }

    const tenant = tenantResult[0]

    const formResult = await db
      .select()
      .from(forms)
      .where(and(eq(forms.slug, slug), eq(forms.tenantId, tenant.id)))
      .limit(1)

    if (formResult.length === 0) {
      return c.get('inertia')('Forms/PublicForm', {
        error: 'This form definition could not be found.',
      })
    }

    const form = formResult[0]
    if (!form.isActive) {
      return c.get('inertia')('Forms/PublicForm', {
        error: 'This form is currently closed for submissions.',
        formName: form.name,
        tenantSlug: tenant.slug,
        form: {
          id: form.id,
          name: form.name,
          slug: form.slug,
          fields: form.fields,
          theme: form.theme,
        },
      })
    }

    if (form.storageType !== 'internal') {
      return c.get('inertia')('Forms/PublicForm', {
        error:
          'Only forms set to internal storage mode can be accessed directly.',
        formName: form.name,
        tenantSlug: tenant.slug,
        form: {
          id: form.id,
          name: form.name,
          slug: form.slug,
          fields: form.fields,
          theme: form.theme,
        },
      })
    }

    return c.get('inertia')('Forms/PublicForm', {
      form: {
        id: form.id,
        name: form.name,
        slug: form.slug,
        fields: form.fields,
        honeypotField: form.honeypotField,
        theme: form.theme,
      },
      tenantSlug: tenant.slug,
      turnstileSiteKey: process.env.CLOUDFLARE_TURNSTILE_SITE_KEY || '',
    })
  } catch (e) {
    console.error('Error fetching form for public view:', e)
    return c.get('inertia')('Forms/PublicForm', {
      error: 'An unexpected error occurred while loading this form.',
    })
  }
})

// Middleware to require authentication for admin pages
async function requireAuth(c: any, next: any) {
  const userData = c.get('user')
  if (!userData) {
    return c.redirect('/login')
  }

  const tenantId = c.get('tenantId')
  const currentTenant = c.get('currentTenant')
  const path = c.req.path

  // Redirect to subdomain if accessing root domain but a tenant is active (except for super_admin who might want global access)
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || ''
  const cleanHost = host.split(':')[0]
  const baseAppDomain = process.env.APP_DOMAIN || 'morphic-cms.com'
  const isRootDomain = cleanHost === baseAppDomain

  if (
    isRootDomain &&
    currentTenant &&
    userData.role !== 'super_admin' &&
    path !== '/logout'
  ) {
    const proto = c.req.header('x-forwarded-proto') || 'https'
    return c.redirect(`${proto}://${currentTenant.slug}.${cleanHost}${path}`)
  }

  // If no tenant selected and not a super_admin, redirect to tenant selection
  // Allow access to /select-tenant and /tenants (API)
  if (
    !tenantId &&
    userData.role !== 'super_admin' &&
    path !== '/select-tenant' &&
    path !== '/logout' &&
    !path.startsWith('/api/tenants')
  ) {
    if (path.startsWith('/api/')) {
      return c.json(
        { error: 'Valid X-Tenant-ID header is required for this request' },
        403
      )
    }
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

// Webhooks Management Pages
app.get('/webhooks', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantRole = c.get('tenantRole')

  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/dashboard')
  }

  return c.get('inertia')('Webhooks/List', {
    user: userData,
    title: 'Webhooks',
  })
})

app.get('/webhooks/logs', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantRole = c.get('tenantRole')

  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/dashboard')
  }

  const webhookId = c.req.query('webhookId')

  return c.get('inertia')('Webhooks/Logs', {
    user: userData,
    title: 'Webhook Logs',
    initialWebhookId: webhookId ? parseInt(webhookId, 10) : undefined,
  })
})

app.get('/webhooks/add', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantRole = c.get('tenantRole')

  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/webhooks')
  }

  return c.get('inertia')('Webhooks/Form', {
    user: userData,
    title: 'Add Webhook',
    mode: 'create',
  })
})

app.get('/webhooks/edit/:id', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantRole = c.get('tenantRole')
  const id = parseInt(c.req.param('id'), 10)

  if (userData.role !== 'super_admin' && tenantRole !== 'owner') {
    return c.redirect('/webhooks')
  }

  const webhookResult = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, id))
  const webhook = webhookResult[0]

  if (!webhook) return c.redirect('/webhooks')

  return c.get('inertia')('Webhooks/Form', {
    user: userData,
    title: 'Edit Webhook',
    mode: 'edit',
    webhook,
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
      tenantName: tenants.name,
      tenantId: collections.tenantId,
    })
    .from(collections)
    .leftJoin(tenants, eq(collections.tenantId, tenants.id))
    .leftJoin(
      entries,
      and(eq(collections.id, entries.collectionId), isNull(entries.deletedAt))
    )
    .where(and(eq(collections.type, 'collection'), whereTenant(collections)))
    .groupBy(collections.id, tenants.id)
    .orderBy(desc(sql`count(${entries.id})`))
    .limit(10)

  // 4. Fetch Analytics for the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const trafficData = await db
    .select({
      date: sql<string>`TO_CHAR(${apiLogs.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(apiLogs)
    .where(and(gt(apiLogs.createdAt, sevenDaysAgo), whereTenant(apiLogs)))
    .groupBy(sql`TO_CHAR(${apiLogs.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(asc(sql`TO_CHAR(${apiLogs.createdAt}, 'YYYY-MM-DD')`))

  const performanceData = await db
    .select({
      date: sql<string>`TO_CHAR(${apiLogs.createdAt}, 'YYYY-MM-DD')`,
      avgResponseTime: sql<number>`avg(${apiLogs.responseTime})`.mapWith(
        Number
      ),
    })
    .from(apiLogs)
    .where(and(gt(apiLogs.createdAt, sevenDaysAgo), whereTenant(apiLogs)))
    .groupBy(sql`TO_CHAR(${apiLogs.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(asc(sql`TO_CHAR(${apiLogs.createdAt}, 'YYYY-MM-DD')`))

  // 5. Fetch PRO users and their workspaces (tenants) - only for super_admin
  let proUsers: any[] = []
  if (userData?.role === 'super_admin') {
    try {
      const rawProUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          username: users.username,
          planTier: users.planTier,
          tenantId: tenants.id,
          tenantName: tenants.name,
          tenantSlug: tenants.slug,
        })
        .from(users)
        .leftJoin(usersToTenants, eq(users.id, usersToTenants.userId))
        .leftJoin(tenants, eq(usersToTenants.tenantId, tenants.id))
        .where(
          and(
            isNull(users.deletedAt),
            eq(sql`LOWER(${users.planTier})`, 'pro')
          )
        )

      const proUsersMap = new Map<number, any>()
      for (const r of rawProUsers) {
        if (!proUsersMap.has(r.id)) {
          proUsersMap.set(r.id, {
            id: r.id,
            name: r.name,
            email: r.email,
            username: r.username,
            planTier: r.planTier,
            tenants: [],
          })
        }
        if (r.tenantId) {
          proUsersMap.get(r.id).tenants.push({
            id: r.tenantId,
            name: r.tenantName,
            slug: r.tenantSlug,
          })
        }
      }
      proUsers = Array.from(proUsersMap.values())
    } catch (e) {
      console.error('Failed to fetch PRO users:', e)
    }
  }

  // 6. Fetch Monthly Request Tally from Upstash Redis
  let currentMonthlyRequests = 0
  if (redis && tenantId) {
    try {
      const cacheKey = `tenant:${tenantId}:owner_metadata`
      let ownerMeta: { ownerId: number } | null = null

      const cachedMeta = await redis.get<any>(cacheKey)
      if (cachedMeta) {
        ownerMeta = typeof cachedMeta === 'string' ? JSON.parse(cachedMeta) : cachedMeta
      }

      if (!ownerMeta) {
        const ownerRecords = await db
          .select({
            ownerId: users.id,
          })
          .from(usersToTenants)
          .innerJoin(users, eq(usersToTenants.userId, users.id))
          .where(
            and(
              eq(usersToTenants.tenantId, tenantId),
              eq(usersToTenants.role, 'owner')
            )
          )
        if (ownerRecords.length > 0) {
          ownerMeta = { ownerId: ownerRecords[0].ownerId }
        }
      }

      const currentMonth = new Date().toISOString().slice(0, 7)
      const redisKey = ownerMeta
        ? `usage:owner:${ownerMeta.ownerId}:${currentMonth}`
        : `usage:tenant:${tenantId}:${currentMonth}`

      const rawTally = await redis.get<string | number>(redisKey)
      if (rawTally !== null) {
        currentMonthlyRequests = typeof rawTally === 'number' ? rawTally : parseInt(rawTally, 10)
      }
    } catch (err) {
      console.error('Failed to fetch current monthly requests from Redis:', err)
    }
  }

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
      tenantName: c.tenantName,
      tenantId: c.tenantId,
    })),
    trafficData,
    performanceData,
    proUsers,
    currentMonthlyRequests,
  })
})

app.get('/email-settings', requireAuth, async (c) => {
  const userData = c.get('user')
  if (userData.role !== 'super_admin') return c.redirect('/dashboard')
  return c.get('inertia')('EmailSettings', { user: userData })
})

app.get('/api-playground', requireAuth, async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('ApiPlayground', {
    user: userData,
    title: 'API Playground',
  })
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
    .select({
      ability: abilities,
      tenant: {
        id: tenants.id,
        name: tenants.name,
      },
    })
    .from(abilities)
    .leftJoin(tenants, eq(abilities.tenantId, tenants.id))
    .where(whereTenant(abilities))
    .orderBy(desc(abilities.createdAt))

  return c.get('inertia')('ApiKeyAbilities/List', {
    user: userData,
    collections: allCollections,
    abilities: allAbilities.map((r) => ({
      ...r.ability,
      tenant: r.tenant?.id ? r.tenant : null,
    })),
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
    .select({
      id: forms.id,
      tenantId: forms.tenantId,
      name: forms.name,
      slug: forms.slug,
      fields: forms.fields,
      storageType: forms.storageType,
      apiUrl: forms.apiUrl,
      apiMethod: forms.apiMethod,
      apiHeaders: forms.apiHeaders,
      apiEntriesPath: forms.apiEntriesPath,
      allowedOrigins: forms.allowedOrigins,
      honeypotField: forms.honeypotField,
      collectionId: forms.collectionId,
      emailNotifications: forms.emailNotifications,
      collectionName: collections.name,
    })
    .from(forms)
    .leftJoin(collections, eq(forms.collectionId, collections.id))
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
  const q = c.req.query('q')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100)
  const offset = (page - 1) * limit

  // Dynamic where clause
  const conditions = [isNull(users.deletedAt)]
  if (role && role !== 'all') {
    conditions.push(eq(users.role, role as any))
  }
  if (q) {
    conditions.push(
      sql`(${users.name} ILIKE ${`%${q}%`} OR ${users.email} ILIKE ${`%${q}%`} OR ${users.username} ILIKE ${`%${q}%`})`
    )
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
      .where(
        and(
          whereClause,
          eq(usersToTenants.tenantId, tenantId),
          ne(users.role, 'super_admin')
        )
      )

    totalCountQuery = db
      .select({ count: sql`count(*)` })
      .from(users)
      .innerJoin(usersToTenants, eq(users.id, usersToTenants.userId))
      .where(
        and(
          whereClause,
          eq(usersToTenants.tenantId, tenantId),
          ne(users.role, 'super_admin')
        )
      )
  } else {
    // System Global mode: Rich summaries for administrators
    usersQuery = db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        globalRole: users.role,
        ownedCount:
          sql<number>`count(CASE WHEN ${usersToTenants.role} = 'owner' THEN 1 END)`.mapWith(
            Number
          ),
        memberCount:
          sql<number>`count(CASE WHEN ${usersToTenants.role} = 'member' THEN 1 END)`.mapWith(
            Number
          ),
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

    totalCountQuery = db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(whereClause)
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

  let totalWorkspaceUsers = 0
  if (tenantId) {
    const workspaceUsersCount = await db
      .select({ count: sql`count(*)` })
      .from(usersToTenants)
      .where(eq(usersToTenants.tenantId, tenantId))
    totalWorkspaceUsers = Number(workspaceUsersCount[0]?.count || 0)
  }

  const flashError = c.req.query('error') || undefined
  const flashSuccess = c.req.query('success') || undefined

  return c.get('inertia')('Users/List', {
    users: processedUsers,
    user: userData,
    activeTenantRole: tenantRole,
    allTenants,
    filters: { sort, dir, role, page, limit, q },
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
    totalWorkspaceUsers,
    flash: {
      error: flashError,
      success: flashSuccess,
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

  if (tenantId && userData.role !== 'super_admin') {
    const features = await getWorkspaceFeatures(tenantId)
    const existingUsers = await db
      .select({ count: sql`count(*)` })
      .from(usersToTenants)
      .where(eq(usersToTenants.tenantId, tenantId))
    const userCount = Number(existingUsers[0]?.count || 0)

    if (userCount >= features.maxUsers) {
      return c.redirect(
        `/users?error=User limit reached for this workspace. Upgrade your plan to add more users.`
      )
    }
  }
  const whereClause = tenantId
    ? eq(abilities.tenantId, tenantId)
    : isNull(abilities.tenantId)

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
  if (
    !isSuperAdmin &&
    userToEdit.role === 'super_admin' &&
    userData.id !== id
  ) {
    return c.redirect('/users')
  }

  const tenantId = c.get('tenantId')
  const abilityWhereClause = tenantId
    ? eq(abilities.tenantId, tenantId)
    : isNull(abilities.tenantId)

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
  const q = c.req.query('q')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100)
  const offset = (page - 1) * limit

  // Build where clause
  const conditions: any[] = []
  if (typeFilter !== 'all') {
    conditions.push(eq(collections.type, typeFilter as any))
  }
  if (tenantId) {
    conditions.push(eq(collections.tenantId, tenantId))
  } else if (userData.role !== 'super_admin') {
    conditions.push(eq(collections.id, -1))
  }
  if (q) {
    conditions.push(sql`${collections.name} ILIKE ${`%${q}%`}`)
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
      tenant: {
        id: tenants.id,
        name: tenants.name,
      },
    })
    .from(collections)
    .leftJoin(users, eq(collections.createdById, users.id))
    .leftJoin(tenants, eq(collections.tenantId, tenants.id))
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset)

  if (whereClause) collectionsQuery.where(whereClause)

  const allCollections = await collectionsQuery

  let totalWorkspaceCollections = 0
  if (tenantId) {
    const collectionsCountResult = await db
      .select({ count: sql`count(*)` })
      .from(collections)
      .where(
        and(
          eq(collections.type, 'collection'),
          eq(collections.tenantId, tenantId)
        )
      )
    totalWorkspaceCollections = Number(collectionsCountResult[0]?.count || 0)
  }

  const flashError = c.req.query('error') || undefined
  const flashSuccess = c.req.query('success') || undefined

  return c.get('inertia')('Collections/List', {
    collections: allCollections.map((r: any) => ({
      ...r.collection,
      createdBy: r.createdBy?.id ? r.createdBy : null,
      tenant: r.tenant?.id ? r.tenant : null,
    })),
    user: userData,
    filters: { sort, dir, type: typeFilter, page, limit, q },
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
    totalWorkspaceCollections,
    flash: {
      error: flashError,
      success: flashSuccess,
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
      tenant: { id: tenants.id, name: tenants.name },
    })
    .from(collections)
    .leftJoin(users, eq(collections.createdById, users.id))
    .leftJoin(tenants, eq(collections.tenantId, tenants.id))

  const conditions: any[] = []
  if (typeFilter !== 'all') {
    conditions.push(eq(collections.type, typeFilter as any))
  }
  if (tenantId) {
    conditions.push(eq(collections.tenantId, tenantId))
  } else if (userData.role !== 'super_admin') {
    conditions.push(eq(collections.id, -1))
  }

  if (conditions.length > 0) {
    query.where(and(...conditions))
  }

  const allCollections = await query.orderBy(asc(collections.name))
  return c.get('inertia')('Entries/Index', {
    collections: allCollections.map((r: any) => ({
      ...r.collection,
      createdBy: r.createdBy?.id ? r.createdBy : null,
      tenant: r.tenant?.id ? r.tenant : null,
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
  const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100)
  const offset = (page - 1) * limit
  const sort = c.req.query('sort') || 'createdAt'
  const dir = c.req.query('dir') || 'desc'

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

  let orderClause = desc(entries.createdAt)
  if (sort === 'createdAt') {
    orderClause =
      dir === 'asc' ? asc(entries.createdAt) : desc(entries.createdAt)
  } else if (sort === 'id') {
    orderClause = dir === 'asc' ? asc(entries.id) : desc(entries.id)
  } else if (sort === 'status') {
    orderClause = dir === 'asc' ? asc(entries.status) : desc(entries.status)
  } else if (sort === 'locale') {
    orderClause = dir === 'asc' ? asc(entries.locale) : desc(entries.locale)
  }

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
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset)

  const localesWhere = tenantId ? [eq(locales.tenantId, tenantId)] : []
  const connectedForms = await db
    .select()
    .from(forms)
    .where(
      and(
        eq(forms.collectionId, collectionId),
        tenantId ? eq(forms.tenantId, tenantId) : sql`true`
      )
    )

  return c.get('inertia')('Entries/List', {
    collection,
    entries: entriesList.map((r) => ({ ...r.entry, updatedBy: r.updatedBy })),
    connectedForms,
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
      sort,
      dir,
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
      tenant: {
        id: tenants.id,
        name: tenants.name,
      },
    })
    .from(entries)
    .leftJoin(users, eq(entries.updatedById, users.id))
    .leftJoin(tenants, eq(entries.tenantId, tenants.id))
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
    entry: {
      ...entry.entry,
      tenant: entry.tenant,
    },
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
  const collectionWithRelations = await db.query.collections.findFirst({
    where: eq(collections.id, id),
    with: {
      createdBy: {
        columns: {
          id: true,
          name: true,
        },
      },
      updatedBy: {
        columns: {
          id: true,
          name: true,
        },
      },
      tenant: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!collectionWithRelations) return c.redirect('/collections')

  return c.get('inertia')('Collections/Edit', {
    collection: collectionWithRelations,
    updatedBy: collectionWithRelations.updatedBy?.id
      ? collectionWithRelations.updatedBy
      : null,
    user: userData,
  })
})

app.get('/collections/add', requireAuth, async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  if (tenantId && userData.role !== 'super_admin') {
    const features = await getWorkspaceFeatures(tenantId)
    const existingCollections = await db
      .select({ count: sql`count(*)` })
      .from(collections)
      .where(
        and(
          eq(collections.type, 'collection'),
          eq(collections.tenantId, tenantId)
        )
      )
    const count = Number(existingCollections[0]?.count || 0)
    if (count >= features.maxCollections) {
      return c.redirect(
        `/collections?error=Collection limit reached for this workspace. Upgrade your plan to create more.`
      )
    }
  }

  return c.get('inertia')('Collections/Add', { user: userData })
})

app.get('/api-docs', requireAuth, async (c) => {
  const userData = c.get('user')
  return c.get('inertia')('ApiDocs', { user: userData })
})

// Set up the API routes
const api = new Hono<{ Variables: Variables }>()

api.use(
  '*',
  cors({
    origin: (origin) => origin,
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-Morphic-Test',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

api.use('*', usageTracker)

// API Logging Middleware
api.use('*', async (c, next) => {
  const start = Date.now()
  const ip =
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1'
  const isInertia = c.req.header('x-inertia')
  const hasApiKey = c.req.header('x-api-key')
  const hasAuth = c.req.header('Authorization')

  // Skip localhost or internal CMS requests
  // External API requests MUST have either x-api-key or Authorization header
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    isInertia ||
    (!hasApiKey && !hasAuth)
  ) {
    return await next()
  }

  await next()

  const ms = Date.now() - start
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  // Log in background to not block response
  db.insert(apiLogs)
    .values({
      method: c.req.method,
      path: c.req.path,
      ip: ip.split(',')[0].trim(), // Handle potential comma-separated list from x-forwarded-for
      userAgent: c.req.header('user-agent'),
      statusCode: c.res.status,
      responseTime: ms,
      userId: userData?.id,
      tenantId: tenantId,
    })
    .execute()
    .catch((err) => console.error('Failed to log API request:', err))

  // 1% chance to cleanup old logs (older than 7 days)
  // This avoids using a Cron Job while keeping the DB light
  if (Math.random() < 0.01) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    db.delete(apiLogs)
      .where(lt(apiLogs.createdAt, sevenDaysAgo))
      .execute()
      .catch((err) => console.error('Failed to auto-cleanup logs:', err))
  }
})

// API Auth Middleware
api.use('*', async (c, next) => {
  // Allow login and test routes to be skip auth if needed,
  // but usually we want all /api routes to be authenticated except login
  const path = c.req.path
  if (
    path === '/api/auth/login' ||
    path === '/api/auth/login/2fa' ||
    path === '/api/auth/signup' ||
    path === '/api/auth/forgot-password' ||
    path === '/api/auth/reset-password' ||
    path === '/api/webhooks/polar' ||
    path === '/api/cron/cleanup-webhook-logs' ||
    path === '/api/test' ||
    c.req.header('X-Morphic-Test') === 'true' ||
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
    const authType = c.get('authType')
    // Inject permissions into context
    c.set('user', {
      ...userData,
      role: fullUser.role,
      abilityName: fullUser.abilityName,
      permissions:
        authType === 'api_key'
          ? fullUser.permissions || {}
          : fullUser.role === 'super_admin'
            ? '*'
            : fullUser.permissions || {},
    } as any)
  }

  // Enforce tenant isolation for non-super-admins
  const tenantId = c.get('tenantId')
  const userRole = fullUser?.role || userData.role

  const xTenantId = c.req.header('X-Tenant-ID')
  if (xTenantId && !tenantId) {
    return c.json(
      {
        error:
          'Tenant not found or access denied for the specified X-Tenant-ID',
      },
      403
    )
  }

  if (
    !tenantId &&
    userRole !== 'super_admin' &&
    !path.startsWith('/api/tenants') &&
    !path.startsWith('/api/users')
  ) {
    return c.json(
      { error: 'Valid X-Tenant-ID header is required for this request' },
      403
    )
  }

  await next()
})

// Webhook CRUD
api.get('/webhooks', async (c) => {
  const tenantId = c.get('tenantId')

  const query = db
    .select({
      id: webhooks.id,
      name: webhooks.name,
      url: webhooks.url,
      events: webhooks.events,
      isActive: webhooks.isActive,
      createdAt: webhooks.createdAt,
      tenant: {
        id: tenants.id,
        name: tenants.name,
      },
    })
    .from(webhooks)
    .leftJoin(tenants, eq(webhooks.tenantId, tenants.id))

  if (tenantId) {
    query.where(eq(webhooks.tenantId, tenantId))
  }

  const allWebhooks = await query.orderBy(desc(webhooks.createdAt))

  return c.json({ webhooks: allWebhooks })
})

api.post('/webhooks', async (c) => {
  try {
    const { id, name, url, secret, events, isActive } = await c.req.json()
    const tenantId = c.get('tenantId')

    if (!name || !url) {
      return c.json({ error: 'Name and URL are required' }, 400)
    }

    if (id) {
      // Update
      await db
        .update(webhooks)
        .set({ name, url, secret, events, isActive, updatedAt: new Date() })
        .where(eq(webhooks.id, id))
      return c.json({ success: true })
    } else {
      // Create
      const features = await getWorkspaceFeatures(tenantId)
      if (!features.hasWebhooks) {
        return c.json(
          {
            error:
              'Webhook features are not available on this plan. Please upgrade.',
          },
          403
        )
      }

      const newWebhook = await db
        .insert(webhooks)
        .values({ name, url, secret, events, isActive, tenantId })
        .returning()
      return c.json({ success: true, webhook: newWebhook[0] })
    }
  } catch (err) {
    console.error('Webhook save error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.delete('/webhooks/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  const tenantId = c.get('tenantId')

  const whereClause = [eq(webhooks.id, id)]
  if (tenantId) whereClause.push(eq(webhooks.tenantId, tenantId))

  await db.delete(webhooks).where(and(...whereClause))
  return c.json({ success: true })
})

api.get('/webhooks/logs', async (c) => {
  const tenantId = c.get('tenantId')
  const webhookId = c.req.query('webhookId')
  const status = c.req.query('status')
  const event = c.req.query('event')

  const query = db
    .select({
      id: webhookLogs.id,
      webhookId: webhookLogs.webhookId,
      webhookName: webhooks.name,
      tenantId: webhookLogs.tenantId,
      event: webhookLogs.event,
      url: webhookLogs.url,
      statusCode: webhookLogs.statusCode,
      responseTime: webhookLogs.responseTime,
      requestHeaders: webhookLogs.requestHeaders,
      requestBody: webhookLogs.requestBody,
      responseHeaders: webhookLogs.responseHeaders,
      responseBody: webhookLogs.responseBody,
      errorMessage: webhookLogs.errorMessage,
      createdAt: webhookLogs.createdAt,
    })
    .from(webhookLogs)
    .leftJoin(webhooks, eq(webhookLogs.webhookId, webhooks.id))

  const whereClause: any[] = []

  if (tenantId) {
    whereClause.push(eq(webhookLogs.tenantId, tenantId))
  }

  if (webhookId) {
    whereClause.push(eq(webhookLogs.webhookId, parseInt(webhookId, 10)))
  }

  if (status === 'success') {
    whereClause.push(
      and(
        gte(webhookLogs.statusCode, 200),
        lt(webhookLogs.statusCode, 300),
        isNull(webhookLogs.errorMessage)
      )
    )
  } else if (status === 'error') {
    whereClause.push(
      or(
        lt(webhookLogs.statusCode, 200),
        gte(webhookLogs.statusCode, 300),
        isNotNull(webhookLogs.errorMessage),
        isNull(webhookLogs.statusCode)
      )
    )
  }

  if (event) {
    whereClause.push(eq(webhookLogs.event, event))
  }

  if (whereClause.length > 0) {
    query.where(and(...whereClause))
  }

  const logs = await query.orderBy(desc(webhookLogs.createdAt)).limit(100)

  return c.json({ logs })
})

api.get('/cron/cleanup-webhook-logs', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (process.env.NODE_ENV === 'production') {
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
  }

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Find PRO / SELF_HOSTED tenant IDs
    const proTenantIdsResult = await db
      .select({ tenantId: usersToTenants.tenantId })
      .from(usersToTenants)
      .innerJoin(users, eq(usersToTenants.userId, users.id))
      .where(
        and(
          eq(usersToTenants.role, 'owner'),
          or(eq(users.planTier, 'PRO'), eq(users.planTier, 'SELF_HOSTED'))
        )
      )

    const proTenantIds = Array.from(
      new Set(
        proTenantIdsResult
          .map((r) => r.tenantId)
          .filter((id): id is number => id !== null)
      )
    )

    // 1. Delete PRO/SELF_HOSTED logs older than 30 days
    if (proTenantIds.length > 0) {
      await db
        .delete(webhookLogs)
        .where(
          and(
            inArray(webhookLogs.tenantId, proTenantIds),
            lt(webhookLogs.createdAt, thirtyDaysAgo)
          )
        )
    }

    // 2. Delete FREE / System Global logs older than 3 days
    const freeConditions: any[] = [lt(webhookLogs.createdAt, threeDaysAgo)]
    if (proTenantIds.length > 0) {
      freeConditions.push(
        or(
          isNull(webhookLogs.tenantId),
          notInArray(webhookLogs.tenantId, proTenantIds)!
        )
      )
    }

    await db
      .delete(webhookLogs)
      .where(and(...freeConditions))

    return c.json({ success: true, message: 'Cleanup complete' })
  } catch (err: any) {
    console.error('Failed to cleanup webhook logs:', err)
    return c.json({ error: err.message || 'Internal server error' }, 500)
  }
})

api.post('/payments/polar/checkout', async (c) => {
  const userData = c.get('user')
  if (!userData) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = process.env.POLAR_API_TOKEN
  const productId = process.env.POLAR_PRODUCT_ID
  const environment = process.env.POLAR_ENV || 'sandbox'

  if (!token || !productId) {
    console.error('Polar Config: Missing POLAR_API_TOKEN or POLAR_PRODUCT_ID.')
    return c.json({ error: 'Billing is not configured on this server.' }, 500)
  }

  try {
    const polar = new Polar({
      accessToken: token,
      server: environment === 'sandbox' ? 'sandbox' : 'production',
    })

    const requestUrl = new URL(c.req.url)
    const successUrl = `${requestUrl.protocol}//${requestUrl.host}/pricing`

    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: userData.email,
      metadata: {
        userId: String(userData.id),
      },
      successUrl,
    })

    return c.json({ url: checkout.url })
  } catch (err: any) {
    console.error('Error creating Polar checkout session:', err)
    return c.json(
      { error: err.message || 'Failed to create checkout session' },
      500
    )
  }
})

api.post('/webhooks/polar', async (c) => {
  const signature = c.req.header('webhook-signature')
  const id = c.req.header('webhook-id')
  const timestamp = c.req.header('webhook-timestamp')
  const secret = process.env.POLAR_WEBHOOK_SECRET

  if (!signature || !secret || !id || !timestamp) {
    console.error('Polar Webhook: Missing signature headers or config secret.')
    return c.json({ error: 'Unauthorized signature validation setup' }, 401)
  }

  try {
    const rawBody = await c.req.text()

    const headers = {
      'webhook-signature': signature,
      'webhook-id': id,
      'webhook-timestamp': timestamp,
    }

    const event = validateEvent(rawBody, headers, secret) as any
    const eventType = event.type
    const status = event.data?.status

    console.log(
      `Polar Webhook Received [${eventType}]:`,
      JSON.stringify(event, null, 2)
    )

    if (eventType && eventType.startsWith('subscription.')) {
      const metadata = event.data?.metadata || {}
      const userId = metadata.userId || metadata.user_id

      if (userId) {
        if (status === 'active' || status === 'trialing') {
          // Retrieve user details before updating to check previous plan tier and get email/name
          const userRecords = await db
            .select()
            .from(users)
            .where(eq(users.id, Number(userId)))
            .limit(1)
          const user = userRecords[0]

          // 1. Upgrade the user's plan to PRO
          await db
            .update(users)
            .set({
              planTier: 'PRO',
              allowedMonthlyRequests: PLAN_LIMITS.PRO.allowedMonthlyRequests,
              updatedAt: new Date(),
            })
            .where(eq(users.id, Number(userId)))

          console.log(
            `Polar Webhook: Upgraded user ${userId} to PRO tier. Status: ${status}`
          )

          // 2. If the user successfully upgraded to PRO, send them a thank you email
          if (user && user.planTier !== 'PRO') {
            try {
              await sendEmail({
                to: user.email,
                subject: 'Thank you for subscribing to Morphic CMS Pro!',
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; color: #555; line-height: 1.6;">
                    <h2 style="color: #87787a; border-bottom: 2px solid #514849; padding-bottom: 10px; font-size: 24px; font-weight: bold; margin-bottom: 24px;">Welcome to Morphic CMS Pro!</h2>
                    <p style="font-size: 16px; color: #555;">Hi ${user.name || 'there'},</p>
                    <p style="font-size: 16px; color: #555;">Thank you for subscribing to our <strong>Morphic CMS Pro</strong> plan! We are thrilled to have you on board.</p>
                    <p style="font-size: 16px; color: #555;">Your workspace limits and features have been upgraded immediately:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #555;">Monthly API Requests</td>
                        <td style="padding: 10px 0; text-align: right; color: #514849; font-weight: bold;">500,000</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #555;">Storage Capacity</td>
                        <td style="padding: 10px 0; text-align: right; color: #514849; font-weight: bold;">5 GB</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #555;">Managed Workspaces</td>
                        <td style="padding: 10px 0; text-align: right; color: #514849; font-weight: bold;">3</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #555;">Users per Workspace</td>
                        <td style="padding: 10px 0; text-align: right; color: #514849; font-weight: bold;">Up to 3</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #555;">Collections (Schemas)</td>
                        <td style="padding: 10px 0; text-align: right; color: #514849; font-weight: bold;">Unlimited</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; font-weight: bold; color: #555;">Form Builder, Localization & Webhooks</td>
                        <td style="padding: 10px 0; text-align: right; color: #514849; font-weight: bold;">Fully Enabled</td>
                      </tr>
                    </table>
                    <p style="font-size: 15px; color: #555;">If you have any questions, encounter any issues, or need help setting up your endpoints, feel free to reply directly to this email or reach out to us at <a href="mailto:support@morphic-cms.com" style="color: #514849; text-decoration: underline;">support@morphic-cms.com</a>.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 14px; color: #666;">Cheers,<br><strong style="color: #514849;">The Morphic CMS Team</strong></p>
                  </div>
                `,
              })
              console.log(
                `Polar Webhook: Sent thank you email to user ${user.email} (${userId})`
              )
            } catch (emailErr) {
              console.error(
                `Polar Webhook: Failed to send thank you email to user ${user.email} (${userId}):`,
                emailErr
              )
            }
          }

          // 2. Clear Redis cache for all workspaces owned by this user
          const ownedWorkspaces = await db
            .select({ tenantId: usersToTenants.tenantId })
            .from(usersToTenants)
            .where(
              and(
                eq(usersToTenants.userId, Number(userId)),
                eq(usersToTenants.role, 'owner')
              )
            )

          if (redis) {
            for (const workspace of ownedWorkspaces) {
              const cacheKey = `tenant:${workspace.tenantId}:owner_metadata`
              await redis.del(cacheKey).catch((err: any) => {
                console.error(
                  `Failed to flush cache for tenant ${workspace.tenantId}:`,
                  err
                )
              })
            }
          }
        } else if (
          status === 'canceled' ||
          status === 'paused' ||
          status === 'past_due' ||
          status === 'unpaid'
        ) {
          // 1. Downgrade the user's plan to FREE
          await db
            .update(users)
            .set({
              planTier: 'FREE',
              allowedMonthlyRequests: PLAN_LIMITS.FREE.allowedMonthlyRequests,
              updatedAt: new Date(),
            })
            .where(eq(users.id, Number(userId)))

          console.log(
            `Polar Webhook: Downgraded user ${userId} to FREE tier. Status: ${status}`
          )

          // 2. Clear Redis cache for all workspaces owned by this user
          const ownedWorkspaces = await db
            .select({ tenantId: usersToTenants.tenantId })
            .from(usersToTenants)
            .where(
              and(
                eq(usersToTenants.userId, Number(userId)),
                eq(usersToTenants.role, 'owner')
              )
            )

          if (redis) {
            for (const workspace of ownedWorkspaces) {
              const cacheKey = `tenant:${workspace.tenantId}:owner_metadata`
              await redis.del(cacheKey).catch((err: any) => {
                console.error(
                  `Failed to flush cache for tenant ${workspace.tenantId}:`,
                  err
                )
              })
            }
          }
        }
      } else {
        console.warn(
          `Polar Webhook: No userId/user_id found in metadata for event ${eventType}.`
        )
      }
    }

    return c.json({ received: true })
  } catch (err) {
    console.error('Error handling Polar webhook:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

const yoga = createGraphQLHandler()
api.all('/graphql', async (c) => {
  const tenantId = c.get('tenantId')
  const userData = c.get('user')

  // Enforce tenant selection for non-super admins in GraphQL
  if (!tenantId && userData?.role !== 'super_admin') {
    return c.json(
      { error: 'Valid X-Tenant-ID header is required for GraphQL requests' },
      403
    )
  }

  return await yoga.fetch(c.req.raw, {
    tenantId,
    user: userData,
  })
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
  if (!userData) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Enforce workspace limit for non-super_admins
  if (userData.role !== 'super_admin') {
    try {
      const ownedWorkspaces = await db
        .select({ id: tenants.id })
        .from(tenants)
        .innerJoin(usersToTenants, eq(tenants.id, usersToTenants.tenantId))
        .where(
          and(
            eq(usersToTenants.userId, userData.id),
            eq(usersToTenants.role, 'owner')
          )
        )

      const features = getTenantFeatures(userData.planTier)
      if (ownedWorkspaces.length >= features.maxWorkspaces) {
        const errorMsg =
          userData.planTier === 'PRO'
            ? `You have reached the limit of ${features.maxWorkspaces} workspaces allowed on the PRO plan.`
            : `Upgrade to the PRO plan to manage up to 3 workspaces. You have reached the limit of ${features.maxWorkspaces} workspace on the Free plan.`
        return c.json({ error: errorMsg }, 403)
      }
    } catch (e) {
      console.error('Failed to verify owned workspaces count:', e)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  try {
    const { name, slug } = await c.req.json()
    if (!name || !slug)
      return c.json({ error: 'Name and slug are required' }, 400)

    if (isReservedSlug(slug)) {
      return c.json(
        { error: 'This workspace URL slug is reserved and cannot be used.' },
        400
      )
    }

    const existingTenant = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1)

    if (existingTenant.length > 0) {
      return c.json({ error: 'Tenant with this slug already exists' }, 400)
    }

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
    setCookie(
      c,
      'morphic_active_tenant',
      newTenant.id.toString(),
      getCookieOptions(c, 60 * 60 * 24 * 30)
    )

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
    const cookieOpts = getCookieOptions(c, 0)
    deleteCookie(c, 'morphic_active_tenant', {
      path: cookieOpts.path,
      domain: cookieOpts.domain,
    })
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

  setCookie(
    c,
    'morphic_active_tenant',
    tenantId.toString(),
    getCookieOptions(c, 60 * 60 * 24 * 30)
  )

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
  const targetUserResult = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1)
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
    if (userData.role !== 'super_admin') {
      const features = await getWorkspaceFeatures(tenantId)
      const existingUsers = await db
        .select({ count: sql`count(*)` })
        .from(usersToTenants)
        .where(eq(usersToTenants.tenantId, tenantId))
      const userCount = Number(existingUsers[0]?.count || 0)

      if (userCount >= features.maxUsers) {
        return c.json(
          {
            error: `Upgrade to PRO plan to add more than ${features.maxUsers} users to this workspace.`,
          },
          403
        )
      }
    }

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
  const targetUserResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const targetUser = targetUserResult[0]

  if (userData.role !== 'super_admin') {
    if (targetUser?.role === 'super_admin') {
      return c.json({ error: 'Cannot delete a Super Admin' }, 403)
    }
    if (userId === userData.id) {
      return c.json(
        { error: 'Cannot remove yourself from your own tenant' },
        403
      )
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
  if (userData.role !== 'super_admin')
    return c.json({ error: 'Forbidden' }, 403)

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
    .select({
      locale: locales,
      tenant: {
        id: tenants.id,
        name: tenants.name,
      },
    })
    .from(locales)
    .leftJoin(tenants, eq(locales.tenantId, tenants.id))
    .where(whereTenant)
    .orderBy(asc(locales.name))

  return c.json({
    locales: allLocales.map((r) => ({
      ...r.locale,
      tenant: r.tenant?.id ? r.tenant : null,
    })),
  })
})

api.post('/locales', async (c) => {
  try {
    const { code, name, isDefault } = await c.req.json()
    const tenantId = c.get('tenantId')
    if (!code || !name)
      return c.json({ error: 'Code and name are required' }, 400)

    const features = await getWorkspaceFeatures(tenantId)
    if (!features.hasLocalization) {
      return c.json(
        {
          error:
            'Localization features are not available on this plan. Please upgrade.',
        },
        403
      )
    }

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

api.post('/auth/signup', async (c) => {
  try {
    const body = await c.req.json()
    const { name, username, email, password, workspaceName, workspaceSlug } =
      body

    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !workspaceName ||
      !workspaceSlug
    ) {
      return c.json({ error: 'All fields are required.' }, 400)
    }

    if (isReservedSlug(workspaceSlug)) {
      return c.json(
        { error: 'This workspace URL slug is reserved and cannot be used.' },
        400
      )
    }

    // Cloudflare Turnstile Verification
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
    const host = c.req.header('host') || ''
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
    const isTest =
      process.env.NODE_ENV === 'test' ||
      c.req.header('X-Morphic-Test') === 'true'

    if (turnstileSecret && !isLocalhost && !isTest) {
      const turnstileToken = body.cf_turnstile_response || body.turnstileToken
      if (!turnstileToken) {
        return c.json(
          { error: 'Security verification failed: Missing Turnstile token.' },
          400
        )
      }

      try {
        const response = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              secret: turnstileSecret,
              response: turnstileToken,
            }),
          }
        )

        const outcome: any = await response.json()
        if (!outcome.success) {
          return c.json(
            { error: 'Security verification failed: Invalid Turnstile token.' },
            400
          )
        }
      } catch (err) {
        console.error('Turnstile verification error:', err)
        return c.json(
          { error: 'Security verification service unavailable.' },
          500
        )
      }
    }

    const now = new Date()

    // Helper to delete an expired, unverified user and their workspaces
    const deleteExpiredUser = async (userId: number) => {
      await db.transaction(async (tx) => {
        const ownedLinks = await tx
          .select({ tenantId: usersToTenants.tenantId })
          .from(usersToTenants)
          .where(
            and(
              eq(usersToTenants.userId, userId),
              eq(usersToTenants.role, 'owner')
            )
          )

        const tenantIds = ownedLinks.map((link) => link.tenantId)

        await tx.delete(users).where(eq(users.id, userId))

        if (tenantIds.length > 0) {
          await tx.delete(tenants).where(inArray(tenants.id, tenantIds))
        }
      })
    }

    // Validate email uniqueness
    const emailResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    if (emailResult.length > 0) {
      const existingUser = emailResult[0]
      if (
        !existingUser.isEmailVerified &&
        existingUser.emailVerificationExpiresAt &&
        existingUser.emailVerificationExpiresAt < now
      ) {
        await deleteExpiredUser(existingUser.id)
      } else {
        return c.json({ error: 'Email is already registered.' }, 400)
      }
    }

    // Validate username uniqueness
    const usernameResult = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
    if (usernameResult.length > 0) {
      const existingUser = usernameResult[0]
      if (
        !existingUser.isEmailVerified &&
        existingUser.emailVerificationExpiresAt &&
        existingUser.emailVerificationExpiresAt < now
      ) {
        await deleteExpiredUser(existingUser.id)
      } else {
        return c.json({ error: 'Username is already taken.' }, 400)
      }
    }

    // Validate workspace slug uniqueness
    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, workspaceSlug))
      .limit(1)
    if (tenantResult.length > 0) {
      const tenant = tenantResult[0]
      const ownerRecord = await db
        .select({
          id: users.id,
          isEmailVerified: users.isEmailVerified,
          emailVerificationExpiresAt: users.emailVerificationExpiresAt,
        })
        .from(usersToTenants)
        .innerJoin(users, eq(usersToTenants.userId, users.id))
        .where(
          and(
            eq(usersToTenants.tenantId, tenant.id),
            eq(usersToTenants.role, 'owner')
          )
        )
        .limit(1)

      if (ownerRecord.length > 0) {
        const owner = ownerRecord[0]
        if (
          !owner.isEmailVerified &&
          owner.emailVerificationExpiresAt &&
          owner.emailVerificationExpiresAt < now
        ) {
          await deleteExpiredUser(owner.id)
        } else {
          return c.json({ error: 'Workspace URL slug is already taken.' }, 400)
        }
      } else {
        await db.delete(tenants).where(eq(tenants.id, tenant.id))
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const isSelfHosted = process.env.IS_SELF_HOSTED === 'true'
    const verificationToken = isSelfHosted
      ? null
      : crypto.randomBytes(32).toString('hex')
    const isEmailVerifiedVal = isSelfHosted
    const verificationExpiresAt = verificationToken
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null

    // Execute user and workspace creation inside a database transaction
    const onboarding = await db.transaction(async (tx) => {
      // 1. Create User
      const uResult = await tx
        .insert(users)
        .values({
          name,
          username,
          email,
          password: hashedPassword,
          role: 'editor', // Default role is editor
          planTier: 'FREE',
          allowedMonthlyRequests: PLAN_LIMITS.FREE.allowedMonthlyRequests,
          isEmailVerified: isEmailVerifiedVal,
          emailVerificationToken: verificationToken,
          emailVerificationExpiresAt: verificationExpiresAt,
        })
        .returning()
      const newUser = uResult[0]

      // 2. Create Workspace (Tenant)
      const tResult = await tx
        .insert(tenants)
        .values({
          name: workspaceName,
          slug: workspaceSlug,
        })
        .returning()
      const newTenant = tResult[0]

      // 3. Link User as Owner of Workspace
      await tx.insert(usersToTenants).values({
        userId: newUser.id,
        tenantId: newTenant.id,
        role: 'owner',
      })

      // 4. Seed Default English Locale
      await tx.insert(locales).values({
        tenantId: newTenant.id,
        code: 'en',
        name: 'English',
        isDefault: true,
      })

      // 5. Seed Default "Read Access" Ability
      await tx.insert(abilities).values({
        tenantId: newTenant.id,
        name: 'Read Access',
        isSystem: '1',
        permissions: {},
      })

      return { newUser, newTenant }
    })

    if (!isSelfHosted && verificationToken) {
      const proto = c.req.header('x-forwarded-proto') || 'http'
      const reqHost =
        c.req.header('x-forwarded-host') ||
        c.req.header('host') ||
        'localhost:3000'
      const verificationLink = `${proto}://${reqHost}/verify-email?token=${verificationToken}`

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h1 style="color: #87787a; border-bottom: 2px solid #514849; padding-bottom: 10px; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Verify your Morphic CMS Account</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 24px;">
            Thank you for signing up for Morphic CMS! Please verify your email address to activate your account and access your workspace.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #514849; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-bottom: 8px;">
            If the button above doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="font-size: 14px; word-break: break-all; margin-bottom: 24px;">
            <a href="${verificationLink}" style="color: #514849; text-decoration: underline;">${verificationLink}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; line-height: 1.6;">
            This link will expire in 24 hours. If you did not sign up for a Morphic CMS account, you can safely ignore this email.
          </p>
        </div>
      `

      if (process.env.NODE_ENV !== 'production' || isLocalhost) {
        console.log(
          `\n✉️  [Local Dev] Email Verification Link:\n👉 ${verificationLink}\n`
        )
      }

      await sendEmail({
        to: email,
        subject: 'Verify your Morphic CMS Account',
        html: htmlContent,
      })

      return c.json({ success: true, requiresVerification: true })
    }

    // Sign JWT Token
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only'
    const expiresInDays = parseInt(process.env.JWT_EXPIRES_IN_DAYS || '7', 10)
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * expiresInDays

    const token = await sign(
      {
        id: onboarding.newUser.id,
        role: onboarding.newUser.role,
        exp,
      },
      secret
    )

    // Set auth cookie
    setCookie(
      c,
      'morphic_token',
      token,
      getCookieOptions(c, 60 * 60 * 24 * expiresInDays)
    )

    // Set active tenant cookie
    setCookie(
      c,
      'morphic_active_tenant',
      onboarding.newTenant.id.toString(),
      getCookieOptions(c, 60 * 60 * 24 * expiresInDays)
    )

    return c.json({ success: true, requiresVerification: false })
  } catch (err) {
    console.error('Error during onboarding signup:', err)
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

    // Check if email verification is completed (in Cloud SaaS mode)
    if (process.env.IS_SELF_HOSTED !== 'true' && !user.isEmailVerified) {
      return c.json(
        { error: 'Please verify your email address before logging in.' },
        403
      )
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only'

    if (user.isTwoFactorEnabled) {
      const tempToken = await sign(
        {
          id: user.id,
          is2faPending: true,
          exp: Math.floor(Date.now() / 1000) + 300,
        }, // 5 mins
        secret
      )
      return c.json({ requires2fa: true, tempToken })
    }

    // Create JWT Token (1 week expiration)
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
    setCookie(
      c,
      'morphic_token',
      token,
      getCookieOptions(c, 60 * 60 * 24 * expiresInDays)
    )

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

api.post('/auth/login/2fa', async (c) => {
  try {
    const { tempToken, code } = await c.req.json()
    if (!tempToken || !code)
      return c.json({ error: 'Token and code are required' }, 400)

    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only'
    let decoded: any
    try {
      decoded = await verify(tempToken, secret, 'HS256')
    } catch (e) {
      return c.json({ error: 'Invalid or expired temporary token' }, 401)
    }

    if (!decoded.is2faPending || !decoded.id) {
      return c.json({ error: 'Invalid token payload' }, 401)
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1)
    const user = userResult[0]
    if (!user || !user.isTwoFactorEnabled)
      return c.json({ error: 'Invalid user or 2FA not enabled' }, 400)

    let isValid = false
    let isRecoveryCode = false

    if (user.twoFactorSecret) {
      isValid = verifySync({
        token: code,
        secret: user.twoFactorSecret,
        strategy: 'totp',
      }).valid
    }

    if (
      !isValid &&
      Array.isArray(user.recoveryCodes) &&
      user.recoveryCodes.includes(code)
    ) {
      isValid = true
      isRecoveryCode = true
    }

    if (!isValid) {
      return c.json({ error: 'Invalid authentication code' }, 401)
    }

    if (isRecoveryCode) {
      const newRecoveryCodes = (user.recoveryCodes as string[]).filter(
        (c) => c !== code
      )
      await db
        .update(users)
        .set({ recoveryCodes: newRecoveryCodes })
        .where(eq(users.id, user.id))
    }

    const expiresInDays = parseInt(process.env.JWT_EXPIRES_IN_DAYS || '7', 10)
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * expiresInDays
    const token = await sign({ id: user.id, role: user.role, exp }, secret)

    setCookie(
      c,
      'morphic_token',
      token,
      getCookieOptions(c, 60 * 60 * 24 * expiresInDays)
    )

    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id))

    return c.json({ success: true })
  } catch (err) {
    console.error('2FA Login error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

api.post('/auth/2fa/generate', requireAuth, async (c) => {
  const userData = c.get('user')
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userData.id))
    .limit(1)
  const user = userResult[0]
  if (!user) return c.json({ error: 'User not found' }, 404)
  if (user.isTwoFactorEnabled)
    return c.json({ error: '2FA is already enabled' }, 400)

  const secret = generateSecret()
  const otpauthUrl = generateURI({
    secret,
    issuer: 'Morphic CMS',
    label: user.email,
    strategy: 'totp',
  })
  const qrCode = await QRCode.toDataURL(otpauthUrl)

  const recoveryCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex')
  )

  return c.json({ secret, qrCode, recoveryCodes })
})

api.post('/auth/2fa/verify-setup', requireAuth, async (c) => {
  const userData = c.get('user')
  const { secret, code, recoveryCodes } = await c.req.json()

  if (!secret || !code || !recoveryCodes) {
    return c.json({ error: 'Missing parameters' }, 400)
  }

  const isValid = verifySync({ token: code, secret, strategy: 'totp' }).valid
  if (!isValid) return c.json({ error: 'Invalid code' }, 400)

  await db
    .update(users)
    .set({
      isTwoFactorEnabled: true,
      twoFactorSecret: secret,
      recoveryCodes,
    })
    .where(eq(users.id, userData.id))

  return c.json({ success: true })
})

api.post('/auth/2fa/disable', requireAuth, async (c) => {
  const userData = c.get('user')
  const { password } = await c.req.json()

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userData.id))
    .limit(1)
  const user = userResult[0]
  if (!user) return c.json({ error: 'User not found' }, 404)

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return c.json({ error: 'Incorrect password' }, 401)

  await db
    .update(users)
    .set({
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
      recoveryCodes: [],
    })
    .where(eq(users.id, userData.id))

  return c.json({ success: true })
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

    const userData = c.get('user')
    if (tenantId && userData?.role !== 'super_admin') {
      const features = await getWorkspaceFeatures(tenantId)
      if (body.localized && !features.hasLocalization) {
        return c.json(
          {
            error: 'Upgrade to PRO plan to enable Localization features.',
          },
          403
        )
      }
      const existingCollections = await db
        .select({ count: sql`count(*)` })
        .from(collections)
        .where(
          and(
            eq(collections.type, body.type || 'collection'),
            eq(collections.tenantId, tenantId)
          )
        )
      const count = Number(existingCollections[0]?.count || 0)
      if (count >= features.maxCollections) {
        return c.json(
          {
            error: `Upgrade to PRO plan to create more than ${features.maxCollections} collections.`,
          },
          403
        )
      }
    }

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

    const userData = c.get('user')
    if (tenantId && userData?.role !== 'super_admin') {
      const features = await getWorkspaceFeatures(tenantId)
      if (body.localized && !features.hasLocalization) {
        return c.json(
          {
            error: 'Upgrade to PRO plan to enable Localization features.',
          },
          403
        )
      }
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
        updatedById: c.get('user')?.id,
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

function collectRelationIds(
  content: any,
  fields: any[],
  neededIds: Record<number, Set<number>>
) {
  if (!content || !fields) return
  for (const field of fields) {
    const val = content[field.name]
    if (val === undefined || val === null) continue

    if (field.type === 'relation' && field.relationCollectionId) {
      const relColId = field.relationCollectionId
      if (!neededIds[relColId]) {
        neededIds[relColId] = new Set()
      }
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (typeof v === 'number') neededIds[relColId].add(v)
          else if (v && typeof v === 'object' && typeof v.id === 'number') {
            neededIds[relColId].add(v.id)
          }
        })
      } else {
        if (typeof val === 'number') neededIds[relColId].add(val)
        else if (val && typeof val === 'object' && typeof val.id === 'number') {
          neededIds[relColId].add(val.id)
        }
      }
    } else if (field.type === 'group' && field.fields) {
      collectRelationIds(val, field.fields, neededIds)
    } else if (field.type === 'array' && field.fields && Array.isArray(val)) {
      for (const item of val) {
        collectRelationIds(item, field.fields, neededIds)
      }
    }
  }
}

function replaceRelationIds(
  content: any,
  fields: any[],
  relationData: Record<number, Record<number, any>>
): any {
  if (!content || !fields) return content
  const newContent = { ...content }

  for (const field of fields) {
    const val = content[field.name]
    if (val === undefined || val === null) continue

    if (field.type === 'relation' && field.relationCollectionId) {
      const relColId = field.relationCollectionId
      if (Array.isArray(val)) {
        newContent[field.name] = val.map((v: any) => {
          const id = typeof v === 'number' ? v : v?.id
          if (!id) return v
          const relatedEntry = relationData[relColId]?.[id]
          return relatedEntry
            ? { id: relatedEntry.id, ...relatedEntry.content }
            : v
        })
      } else {
        const id = typeof val === 'number' ? val : val?.id
        if (id) {
          const relatedEntry = relationData[relColId]?.[id]
          if (relatedEntry) {
            newContent[field.name] = {
              id: relatedEntry.id,
              ...relatedEntry.content,
            }
          }
        }
      }
    } else if (field.type === 'group' && field.fields) {
      newContent[field.name] = replaceRelationIds(val, field.fields, relationData)
    } else if (field.type === 'array' && field.fields && Array.isArray(val)) {
      newContent[field.name] = val.map((item) =>
        replaceRelationIds(item, field.fields, relationData)
      )
    }
  }

  return newContent
}

const populateRelations = async (
  entriesList: any[],
  fieldsDef: any[],
  tenantId: number | null
) => {
  if (!entriesList || entriesList.length === 0) return entriesList

  const relationData: Record<number, Record<number, any>> = {}
  const neededIdsByCollection: Record<number, Set<number>> = {}

  for (const entry of entriesList) {
    collectRelationIds(entry.content, fieldsDef, neededIdsByCollection)
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
    const newContent = replaceRelationIds(entry.content, fieldsDef, relationData)
    return { ...entry, content: newContent }
  })
}

api.get('/collections/:idOrSlug/entries', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const idOrSlug = c.req.param('idOrSlug')
    console.log(
      `[Entries API] Request for: ${idOrSlug}, Tenant ID (Context): ${tenantId}, X-Tenant-ID Header: ${c.req.header('X-Tenant-ID')}`
    )
    let id: number | null = null

    const colConditions = []
    if (/^\d+$/.test(idOrSlug)) {
      colConditions.push(eq(collections.id, parseInt(idOrSlug, 10)))
    } else {
      colConditions.push(eq(collections.slug, idOrSlug))
    }
    if (tenantId) {
      colConditions.push(eq(collections.tenantId, tenantId))
    }

    const collectionLookup = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(...colConditions))
      .limit(1)
    if (collectionLookup.length > 0) id = collectionLookup[0].id

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

    if (isGlobal) {
      const requestedLocale = c.req.query('locale') || 'en'
      const statusQuery = c.req.query('status') || 'published'

      const globalConditions = [
        eq(entries.collectionId, id),
        isNull(entries.deletedAt),
        eq(entries.locale, requestedLocale)
      ]

      if (statusQuery !== 'all') {
        globalConditions.push(eq(entries.status, statusQuery))
      }

      let result = await db
        .select({
          entry: entries,
          updatedBy: { id: users.id, name: users.name },
        })
        .from(entries)
        .leftJoin(users, eq(entries.updatedById, users.id))
        .where(
          and(...globalConditions)
        )
        .orderBy(desc(entries.createdAt))
        .limit(1)

      // Fallback to default if requested locale not found
      if (result.length === 0 && requestedLocale !== 'en') {
        const fallbackConditions = [
          eq(entries.collectionId, id),
          isNull(entries.deletedAt),
          eq(entries.locale, 'en'),
        ]
        if (tenantId) fallbackConditions.push(eq(entries.tenantId, tenantId))
        if (statusQuery !== 'all') {
          fallbackConditions.push(eq(entries.status, statusQuery))
        }

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
      const populated = await populateRelations([r.entry], fieldsDef, tenantId)

      return c.json({
        type: 'global',
        entry: populated[0]
          ? { ...populated[0], updatedBy: r.updatedBy?.id ? r.updatedBy : null }
          : null,
      })
    }

    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100)
    const offset = (page - 1) * limit

    const isTrash = c.req.query('trash') === 'true'
    const localeQuery = c.req.query('locale')
    const requestedLocale = localeQuery || 'en'
    const statusQuery = c.req.query('status') || 'published'

    let whereClause = and(
      eq(entries.collectionId, id),
      tenantId ? eq(entries.tenantId, tenantId) : sql`true`
    ) as any

    if (statusQuery !== 'all') {
      whereClause = and(whereClause, eq(entries.status, statusQuery)) as any
    }

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

    const sortByParam = c.req.query('sortBy')
    const sortDirParam = c.req.query('sortDir')
    let orderClause = desc(entries.createdAt)

    if (sortByParam === 'id') {
      orderClause = sortDirParam === 'asc' ? asc(entries.id) : desc(entries.id)
    } else if (sortByParam === 'createdAt') {
      orderClause =
        sortDirParam === 'asc'
          ? asc(entries.createdAt)
          : desc(entries.createdAt)
    }

    const result = await db
      .select({
        entry: entries,
        updatedBy: { id: users.id, name: users.name },
      })
      .from(entries)
      .leftJoin(users, eq(entries.updatedById, users.id))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset)

    const populatedEntries = await populateRelations(result.map((r) => r.entry), fieldsDef, tenantId)

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

api.post('/collections/:idOrSlug/entries', async (c) => {
  const idOrSlug = c.req.param('idOrSlug')
  const tenantId = c.get('tenantId')

  const colConditions = []
  if (/^\d+$/.test(idOrSlug)) {
    colConditions.push(eq(collections.id, parseInt(idOrSlug, 10)))
  } else {
    colConditions.push(eq(collections.slug, idOrSlug))
  }
  if (tenantId) {
    colConditions.push(eq(collections.tenantId, tenantId))
  }

  const collectionResult = await db
    .select()
    .from(collections)
    .where(and(...colConditions))
    .limit(1)
  const collection = collectionResult[0]
  if (!collection) return c.json({ error: 'Collection not found' }, 404)

  const collectionId = collection.id

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
          const newEntry = res[0]
          inserted.push(newEntry)

          // Trigger webhooks in background
          triggerWebhooks(tenantId, 'entry.created', { entry: newEntry })
          if (newEntry.status === 'published') {
            triggerWebhooks(tenantId, 'entry.published', { entry: newEntry })
          }
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

    const primaryEntry = insertResult[0]

    // Trigger webhooks
    triggerWebhooks(tenantId, 'entry.created', { entry: primaryEntry })
    if (primaryEntry.status === 'published') {
      triggerWebhooks(tenantId, 'entry.published', { entry: primaryEntry })
    }

    return c.json({ success: true, entry: primaryEntry }, 201)
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
    const statusQuery = c.req.query('status') || 'published'

    const entryConditions = [
      eq(entries.id, id),
      isNull(entries.deletedAt),
    ]
    if (tenantId) entryConditions.push(eq(entries.tenantId, tenantId))
    if (statusQuery !== 'all') {
      entryConditions.push(eq(entries.status, statusQuery))
    }

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

    // Populate relations for the single entry response
    const colResult = await db
      .select({ fields: collections.fields })
      .from(collections)
      .where(eq(collections.id, r.entry.collectionId))
      .limit(1)

    let populatedEntry = r.entry
    if (colResult.length > 0) {
      const fieldsDef = colResult[0].fields as any[]
      const populated = await populateRelations([r.entry], fieldsDef, tenantId)
      if (populated.length > 0) {
        populatedEntry = populated[0]
      }
    }

    return c.json({
      entry: populatedEntry,
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

    const updatedEntry = updated[0]

    // Trigger webhooks
    triggerWebhooks(tenantId, 'entry.updated', { entry: updatedEntry })
    if (updatedEntry.status === 'published' && entry.status !== 'published') {
      triggerWebhooks(tenantId, 'entry.published', { entry: updatedEntry })
    }

    return c.json({ success: true, entry: updatedEntry })
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

      // Trigger webhooks
      triggerWebhooks(tenantId, 'entry.deleted', { entry: updated[0] })

      return c.json({ success: true, message: 'Entry moved to trash' })
    } else {
      const deleted = await db
        .delete(entries)
        .where(and(...entryConditions))
        .returning()
      if (deleted.length === 0) return c.json({ error: 'Entry not found' }, 404)

      // Trigger webhooks
      triggerWebhooks(tenantId, 'entry.deleted', { entry: deleted[0] })

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
      collectionId,
      emailNotifications,
      isActive,
      theme,
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
        collectionId: collectionId || null,
        tenantId,
        emailNotifications: emailNotifications || false,
        isActive: isActive !== undefined ? isActive : true,
        theme: theme || {},
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
      collectionId,
      emailNotifications,
      isActive,
      theme,
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
        collectionId: collectionId || null,
        emailNotifications: emailNotifications ?? false,
        isActive: isActive ?? true,
        theme: theme || {},
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
    const queryParams = c.req.query()

    if (form.storageType === 'internal') {
      const entriesWhere = [eq(formEntries.formId, form.id)]

      // Allow filtering by any field defined in the form
      form.fields.forEach((field: any) => {
        if (queryParams[field.name]) {
          entriesWhere.push(
            sql`${formEntries.data}->>${field.name} = ${queryParams[field.name]}`
          )
        }
      })

      const entriesResult = await db
        .select()
        .from(formEntries)
        .where(and(...entriesWhere))
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

// Delete Form Entry
api.delete('/forms/:slug/entries/:entryId', async (c) => {
  try {
    const slug = c.req.param('slug')
    const entryId = parseInt(c.req.param('entryId'), 10)
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
      const deleted = await db
        .delete(formEntries)
        .where(
          and(eq(formEntries.id, entryId), eq(formEntries.formId, form.id))
        )
        .returning()

      if (deleted.length === 0) return c.json({ error: 'Entry not found' }, 404)
      return c.json({ success: true })
    }

    return c.json({ error: 'Cannot delete external entries from CMS' }, 400)
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Public Form Submission Rate Limiter
const formSubmitLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 submissions per form
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    const ip =
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For') ||
      c.req.header('x-real-ip') ||
      'anonymous'
    const tenantSlug = c.req.param('tenantSlug') || ''
    const slug = c.req.param('slug') || ''
    return `${ip}-${tenantSlug}-${slug}`
  },
  handler: (c) => {
    return c.json(
      { error: 'Too many submissions. Please try again in 15 minutes.' },
      429
    )
  },
})

// Public Form Submission
api.post('/forms/:tenantSlug/:slug/submit', formSubmitLimiter, async (c) => {
  try {
    const tenantSlug = c.req.param('tenantSlug')
    const slug = c.req.param('slug')

    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1)
    if (tenantResult.length === 0)
      return c.json({ error: 'Organization not found' }, 404)
    const tenant = tenantResult[0]

    const formResult = await db
      .select()
      .from(forms)
      .where(and(eq(forms.slug, slug), eq(forms.tenantId, tenant.id)))
      .limit(1)
    if (formResult.length === 0) return c.json({ error: 'Form not found' }, 404)

    const form = formResult[0]
    if (!form.isActive) {
      return c.json(
        { error: 'This form is currently closed for submissions.' },
        400
      )
    }

    let body: Record<string, any> = {}
    try {
      const contentType = c.req.header('content-type') || ''
      if (contentType.includes('application/json')) {
        body = await c.req.json()
      } else {
        body = await c.req.parseBody()
      }
    } catch (e) {
      return c.json({ error: 'Invalid request body format' }, 400)
    }

    // Cloudflare Turnstile Verification
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
    const host = c.req.header('Host') || ''
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')

    if (turnstileSecret && !isLocalhost) {
      const turnstileToken =
        body['cf-turnstile-response'] || body['turnstileToken']
      if (!turnstileToken) {
        return c.json(
          { error: 'Security verification failed: Missing Turnstile token.' },
          400
        )
      }

      try {
        const verifyRes = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              secret: turnstileSecret,
              response: turnstileToken,
              remoteip:
                c.req.header('CF-Connecting-IP') ||
                c.req.header('X-Forwarded-For') ||
                '',
            }),
          }
        )

        const verifyData: any = await verifyRes.json()
        if (!verifyData.success) {
          return c.json(
            { error: 'Security verification failed: Invalid Turnstile token.' },
            400
          )
        }
      } catch (err) {
        console.error('Turnstile verification error:', err)
        return c.json({ error: 'Security verification temporary error.' }, 500)
      }
    }

    // 1. Origin Check (CORS-like security)
    const requestOrigin = c.req.header('Origin') || c.req.header('Referer')
    const isLocalhostOrigin =
      requestOrigin &&
      (requestOrigin.toLowerCase().includes('localhost') ||
        requestOrigin.toLowerCase().includes('127.0.0.1'))
    if (form.allowedOrigins && !isLocalhostOrigin) {
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

    // Validate and clean body against form fields for security
    const filteredBody: Record<string, any> = {}
    const fields = (form.fields as any[]) || []

    for (const field of fields) {
      const val = body[field.name]

      // 1. Check required fields
      if (field.required && (val === undefined || val === null || val === '')) {
        return c.json(
          { error: `Field "${field.label || field.name}" is required` },
          400
        )
      }

      // 2. Filter input key/values (only keep keys defined in schema)
      if (val !== undefined && val !== null) {
        if (field.type === 'text' || field.type === 'textarea') {
          const strVal = String(val)
          if (
            field.validation?.minLength !== undefined &&
            strVal.length < field.validation.minLength
          ) {
            return c.json(
              {
                error: `Field "${field.label || field.name}" must be at least ${field.validation.minLength} characters`,
              },
              400
            )
          }
          if (
            field.validation?.maxLength !== undefined &&
            strVal.length > field.validation.maxLength
          ) {
            return c.json(
              {
                error: `Field "${field.label || field.name}" cannot exceed ${field.validation.maxLength} characters`,
              },
              400
            )
          }
          filteredBody[field.name] = strVal
        } else if (field.type === 'checkbox') {
          if (Array.isArray(val)) {
            filteredBody[field.name] = val.map(String)
          } else {
            filteredBody[field.name] = [String(val)]
          }
        } else if (field.type === 'email') {
          const strVal = String(val).trim()
          // Basic email format check
          if (strVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
            return c.json(
              {
                error: `Field "${field.label || field.name}" must be a valid email address`,
              },
              400
            )
          }
          filteredBody[field.name] = strVal
        } else {
          filteredBody[field.name] = val
        }
      }
    }

    // 3. Email Notification Check
    if (form.emailNotifications && form.tenantId) {
      try {
        const tenantData = await db
          .select({ name: tenants.name })
          .from(tenants)
          .where(eq(tenants.id, form.tenantId))
          .limit(1)
        const tenantName = tenantData[0]?.name || 'Unknown'

        const tenantUsers = await db
          .select({
            email: users.email,
          })
          .from(usersToTenants)
          .innerJoin(users, eq(usersToTenants.userId, users.id))
          .where(
            and(
              eq(usersToTenants.tenantId, form.tenantId),
              isNull(users.deletedAt)
            )
          )

        const emails = tenantUsers.map((u) => u.email).filter(Boolean)
        if (emails.length > 0) {
          const formFieldMap = new Map(
            ((form.fields as any[]) || []).map((f: any) => [f.name, f])
          )
          const submittedFieldsHtml = Object.entries(filteredBody)
            .filter(([key]) => formFieldMap.has(key))
            .map(([key, val]) => {
              const field = formFieldMap.get(key)
              const displayName = field?.label || key.replace(/_/g, ' ')
              const displayVal =
                typeof val === 'object' ? JSON.stringify(val) : String(val)
              return `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #514849; width: 150px; text-transform: capitalize; vertical-align: top;">${displayName}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555; vertical-align: top; white-space: pre-wrap;">${displayVal}</td>
                </tr>
              `
            })
            .join('')

          const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h1 style="color: #87787a; border-bottom: 2px solid #514849; padding-bottom: 10px; font-size: 24px; margin: 0 0 20px 0;">New Form Submission</h1>
              <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
                A new submission has been received for the form <strong>${form.name}</strong>. Below is the submitted content:
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #514849;">
                    <th style="padding: 10px; text-align: left; font-size: 14px; font-weight: bold; color: #87787a; width: 150px;">Field</th>
                    <th style="padding: 10px; text-align: left; font-size: 14px; font-weight: bold; color: #87787a;">Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${submittedFieldsHtml}
                </tbody>
              </table>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #514849; margin: 20px 0; font-size: 14px; color: #555;">
                <p style="margin: 0;"><strong>Submitted At:</strong> ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}</p>
              </div>
              <footer style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
                <p style="margin: 5px 0;">This email is sent automatically from Morphic CMS.</p>
                <p style="margin: 5px 0;">Workspace: ${tenantName} #${form.tenantId}</p>
              </footer>
            </div>
          `

          await Promise.all(
            emails.map((email) =>
              sendEmail({
                to: email,
                subject: `New Form Submission: ${form.name}`,
                html: htmlContent,
              })
            )
          )
        }
      } catch (err) {
        console.error('Failed to send submission email notifications:', err)
      }
    }

    if (form.storageType === 'internal') {
      const result = await db
        .insert(formEntries)
        .values({
          formId: form.id,
          data: filteredBody,
          tenantId: form.tenantId, // Ensure entry gets the same tenant as the form
        })
        .returning()

      // Trigger webhooks
      triggerWebhooks(form.tenantId, 'form.submitted', {
        form: { id: form.id, name: form.name },
        submission: result[0],
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

      // Trigger webhooks even for external (optional, but consistent)
      triggerWebhooks(form.tenantId, 'form.submitted', {
        form: { id: form.id, name: form.name },
        submission: body,
      })

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
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Route not found' }, 404)
  }
  return c.get('inertia')(
    'Errors/NotFound',
    { title: '404 - Not Found' },
    { status: 404 }
  )
})

// Mount the api router under /api
app.route('/api', api)

// Export the raw app for Vite
export default app
