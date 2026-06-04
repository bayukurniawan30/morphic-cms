import { describe, expect, it } from 'vitest'
import app from './index'
import { db } from '../db/index.js'
import { tenants, collections, entries, users, usersToTenants } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

describe('Morphic CMS API', () => {
  it('should return 404 for unknown routes (when authenticated)', async () => {
    const res = await app.request('/api/unknown-route', {
      headers: { 'X-Morphic-Test': 'true' }
    })
    expect(res.status).toBe(404)
  })

  it('should redirect unauthenticated requests to login (without bypass)', async () => {
    // Note: Inertia routes usually redirect, but /api/ routes might return 401
    // depending on which middleware hits first. 
    const res = await app.request('/api/collections')
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should block access if X-Tenant-ID is missing (when bypass is active)', async () => {
    // Hit GraphQL with bypass but WITHOUT tenant ID
    const res = await app.request('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Morphic-Test': 'true'
      },
      body: JSON.stringify({ query: '{ collections { id } }' }),
    })
    
    // Should hit our new security logic (403 Forbidden)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('X-Tenant-ID header is required')
  })

  describe('Public Routes', () => {
    it('should return 200 for the landing page (/)', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)
    })

    it('should return 200 for the login page (/login)', async () => {
      const res = await app.request('/login')
      expect(res.status).toBe(200)
    })

    it('should redirect to /login and clear cookie on logout (/logout)', async () => {
      const res = await app.request('/logout')
      expect(res.status).toBe(302)
      expect(res.headers.get('location')).toBe('/login')
      // Check if Set-Cookie header attempts to clear the morphic_token
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toContain('morphic_token=')
    })

    it('should return 200 for the forgot password page (/forgot-password)', async () => {
      const res = await app.request('/forgot-password')
      expect(res.status).toBe(200)
    })

    it('should return 200 for the docs page (/docs)', async () => {
      const res = await app.request('/docs')
      expect(res.status).toBe(200)
    })
  })

  describe('Tenant Isolation for Collection Entries', () => {
    it('should separate entries by tenant when collections have the same slug', async () => {
      const testId = crypto.randomUUID().substring(0, 8)
      const apiKey = `test-api-key-${testId}`
      const username = `testuser-${testId}`
      const email = `testuser-${testId}@example.com`

      let tenantAId: number | undefined
      let tenantBId: number | undefined
      let userTestId: number | undefined
      let colAId: number | undefined
      let colBId: number | undefined
      let entryAId: number | undefined
      let entryBId: number | undefined

      try {
        // 1. Create two tenants
        const [tenantA] = await db
          .insert(tenants)
          .values({
            name: `Tenant A ${testId}`,
            slug: `tenant-a-${testId}`,
          })
          .returning()
        tenantAId = tenantA.id

        const [tenantB] = await db
          .insert(tenants)
          .values({
            name: `Tenant B ${testId}`,
            slug: `tenant-b-${testId}`,
          })
          .returning()
        tenantBId = tenantB.id

        // 2. Create a super admin user with API key
        const [testUser] = await db
          .insert(users)
          .values({
            name: `Test Admin ${testId}`,
            username,
            email,
            password: 'hashedpassword',
            role: 'super_admin',
            apiKey,
          })
          .returning()
        userTestId = testUser.id

        // Link user to tenants
        await db.insert(usersToTenants).values([
          { userId: testUser.id, tenantId: tenantA.id, role: 'owner' },
          { userId: testUser.id, tenantId: tenantB.id, role: 'owner' },
        ])

        // 3. Create collections with same slug in both tenants
        const [colA] = await db
          .insert(collections)
          .values({
            tenantId: tenantA.id,
            name: 'Projects',
            slug: 'projects',
            type: 'collection',
            fields: [{ name: 'title', type: 'text' }],
          })
          .returning()
        colAId = colA.id

        const [colB] = await db
          .insert(collections)
          .values({
            tenantId: tenantB.id,
            name: 'Projects',
            slug: 'projects',
            type: 'collection',
            fields: [{ name: 'title', type: 'text' }],
          })
          .returning()
        colBId = colB.id

        // 4. Create one published entry in each collection
        const [entryA] = await db
          .insert(entries)
          .values({
            tenantId: tenantA.id,
            collectionId: colA.id,
            content: { title: 'Project A' },
            status: 'published',
            locale: 'en',
          })
          .returning()
        entryAId = entryA.id

        const [entryB] = await db
          .insert(entries)
          .values({
            tenantId: tenantB.id,
            collectionId: colB.id,
            content: { title: 'Project B' },
            status: 'published',
            locale: 'en',
          })
          .returning()
        entryBId = entryB.id

        // 5. Query for tenant A
        const resA = await app.request('/api/collections/projects/entries', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Tenant-ID': String(tenantA.id),
          },
        })
        expect(resA.status).toBe(200)
        const dataA = await resA.json()
        expect(dataA.entries).toBeDefined()
        expect(dataA.entries.length).toBe(1)
        expect(dataA.entries[0].content.title).toBe('Project A')
        expect(dataA.entries[0].collectionId).toBe(colA.id)

        // 6. Query for tenant B
        const resB = await app.request('/api/collections/projects/entries', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Tenant-ID': String(tenantB.id),
          },
        })
        expect(resB.status).toBe(200)
        const dataB = await resB.json()
        expect(dataB.entries).toBeDefined()
        expect(dataB.entries.length).toBe(1)
        expect(dataB.entries[0].content.title).toBe('Project B')
        expect(dataB.entries[0].collectionId).toBe(colB.id)

      } finally {
        // Clean up
        if (entryAId) await db.delete(entries).where(eq(entries.id, entryAId))
        if (entryBId) await db.delete(entries).where(eq(entries.id, entryBId))
        if (colAId) await db.delete(collections).where(eq(collections.id, colAId))
        if (colBId) await db.delete(collections).where(eq(collections.id, colBId))
        if (userTestId) {
          await db.delete(usersToTenants).where(eq(usersToTenants.userId, userTestId))
          await db.delete(users).where(eq(users.id, userTestId))
        }
        if (tenantAId) await db.delete(tenants).where(eq(tenants.id, tenantAId))
        if (tenantBId) await db.delete(tenants).where(eq(tenants.id, tenantBId))
      }
    })
  })
})
