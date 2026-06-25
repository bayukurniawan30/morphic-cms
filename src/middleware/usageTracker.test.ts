import { vi } from 'vitest'

const { mockGet, mockSet, mockIncr } = vi.hoisted(() => {
  return {
    mockGet: vi.fn(),
    mockSet: vi.fn(),
    mockIncr: vi.fn(),
  }
})

vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => ({
      get: mockGet,
      set: mockSet,
      incr: mockIncr,
    })),
  }
})

// Set environment variables to trigger Redis client initialization in the middleware module
process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token'

import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { usageTracker } from './usageTracker'
import { db } from '../db/index.js'
import { tenants, users, usersToTenants } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

describe('Usage Tracker Middleware', () => {
  let app: Hono<{ Variables: { tenantId: number | null; user?: any; isSystem?: boolean } }>
  const originalEnv = process.env.IS_SELF_HOSTED

  beforeEach(() => {
    process.env.IS_SELF_HOSTED = originalEnv
    vi.clearAllMocks()

    app = new Hono<{ Variables: { tenantId: number | null; user?: any; isSystem?: boolean } }>()
    app.use('*', usageTracker)
    app.get('/test', (c) => c.json({ ok: true }))
  })

  afterEach(() => {
    process.env.IS_SELF_HOSTED = originalEnv
  })

  it('should bypass tracking if IS_SELF_HOSTED is true', async () => {
    process.env.IS_SELF_HOSTED = 'true'
    
    // Set tenant ID
    app.use('/test', async (c, next) => {
      c.set('tenantId', 123)
      await next()
    })

    const res = await app.request('/test')
    expect(res.status).toBe(200)
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('should bypass tracking if tenantId is missing', async () => {
    const res = await app.request('/test')
    expect(res.status).toBe(200)
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('should bypass tracking if user is super_admin', async () => {
    app.use('/test', async (c, next) => {
      c.set('tenantId', 123)
      c.set('user', { role: 'super_admin' })
      await next()
    })

    const res = await app.request('/test')
    expect(res.status).toBe(200)
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('should allow requests and increment usage if under the limit', async () => {
    const testSuffix = crypto.randomUUID().substring(0, 8)
    const username = `owner-${testSuffix}`
    const email = `owner-${testSuffix}@example.com`

    let tenantId: number | undefined
    let userId: number | undefined

    try {
      // 1. Create tenant and owner in the database
      const [tenant] = await db
        .insert(tenants)
        .values({
          name: `Tracker Tenant ${testSuffix}`,
          slug: `tracker-tenant-${testSuffix}`,
        })
        .returning()
      tenantId = tenant.id

      const [user] = await db
        .insert(users)
        .values({
          name: `Owner ${testSuffix}`,
          username,
          email,
          password: 'hashedpassword',
          planTier: 'FREE',
          allowedMonthlyRequests: 20000,
        })
        .returning()
      userId = user.id

      await db.insert(usersToTenants).values({
        userId: user.id,
        tenantId: tenant.id,
        role: 'owner',
      })

      // Mock Redis calls: tally = 15000, cache is empty
      mockGet.mockImplementation(async (key: string) => {
        if (key.startsWith('usage:')) {
          return 15000
        }
        return null // no cache for tenant metadata
      })

      mockIncr.mockResolvedValue(15001)

      // Apply Hono route to inject the tenantId
      const testApp = new Hono<{ Variables: { tenantId: number | null; user?: any; isSystem?: boolean } }>()
      testApp.use('*', async (c, next) => {
        c.set('tenantId', tenant.id)
        c.set('user', { id: user.id, role: 'member' })
        await next()
      })
      testApp.use('*', usageTracker)
      testApp.get('/test', (c) => c.json({ ok: true }))

      const res = await testApp.request('/test')
      expect(res.status).toBe(200)
      
      // Redis should have checked tally and metadata cache
      expect(mockGet).toHaveBeenCalled()
      expect(mockIncr).toHaveBeenCalled()
    } finally {
      if (userId) {
        await db.delete(usersToTenants).where(eq(usersToTenants.userId, userId))
        await db.delete(users).where(eq(users.id, userId))
      }
      if (tenantId) {
        await db.delete(tenants).where(eq(tenants.id, tenantId))
      }
    }
  })

  it('should block requests with 429 if the traffic limit is reached', async () => {
    const testSuffix = crypto.randomUUID().substring(0, 8)
    const username = `owner-${testSuffix}`
    const email = `owner-${testSuffix}@example.com`

    let tenantId: number | undefined
    let userId: number | undefined

    try {
      // 1. Create tenant and owner in the database
      const [tenant] = await db
        .insert(tenants)
        .values({
          name: `Limit Tenant ${testSuffix}`,
          slug: `limit-tenant-${testSuffix}`,
        })
        .returning()
      tenantId = tenant.id

      const [user] = await db
        .insert(users)
        .values({
          name: `Owner ${testSuffix}`,
          username,
          email,
          password: 'hashedpassword',
          planTier: 'FREE',
          allowedMonthlyRequests: 100, // very small limit for testing
        })
        .returning()
      userId = user.id

      await db.insert(usersToTenants).values({
        userId: user.id,
        tenantId: tenant.id,
        role: 'owner',
      })

      // Mock Redis calls: tally = 100 (exactly at the limit), cache is empty
      mockGet.mockImplementation(async (key: string) => {
        if (key.startsWith('usage:')) {
          return 100
        }
        return null // no cache for tenant metadata
      })

      // Apply Hono route to inject the tenantId
      const testApp = new Hono<{ Variables: { tenantId: number | null; user?: any; isSystem?: boolean } }>()
      testApp.use('*', async (c, next) => {
        c.set('tenantId', tenant.id)
        c.set('user', { id: user.id, role: 'member' })
        await next()
      })
      testApp.use('*', usageTracker)
      testApp.get('/test', (c) => c.json({ ok: true }))

      const res = await testApp.request('/test')
      expect(res.status).toBe(429)
      
      const body = await res.json()
      expect(body.error).toContain('limit exceeded')
      expect(body.limit).toBe(100)
      expect(body.current).toBe(100)

      // Tally should not have been incremented
      expect(mockIncr).not.toHaveBeenCalled()
    } finally {
      if (userId) {
        await db.delete(usersToTenants).where(eq(usersToTenants.userId, userId))
        await db.delete(users).where(eq(users.id, userId))
      }
      if (tenantId) {
        await db.delete(tenants).where(eq(tenants.id, tenantId))
      }
    }
  })
})
