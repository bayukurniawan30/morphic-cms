import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from '../../db/index.js'
import {
  tenants,
  collections,
  entries,
  users,
  usersToTenants,
} from '../../db/schema.js'
import app from '../index'

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
          fields: [
            { name: 'title', type: 'text' },
            { name: 'publish_date', type: 'date' },
          ],
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
          fields: [
            { name: 'title', type: 'text' },
            { name: 'publish_date', type: 'date' },
          ],
        })
        .returning()
      colBId = colB.id

      // 4. Create one published entry in each collection
      const [entryA] = await db
        .insert(entries)
        .values({
          tenantId: tenantA.id,
          collectionId: colA.id,
          content: { title: 'Project A', publish_date: '2026-10-01' },
          status: 'published',
          locale: 'en',
        })
        .returning()

      const [entryB] = await db
        .insert(entries)
        .values({
          tenantId: tenantB.id,
          collectionId: colB.id,
          content: { title: 'Project B', publish_date: '2026-10-01' },
          status: 'published',
          locale: 'en',
        })
        .returning()
      entryBId = entryB.id

      // 5. Query for tenant A
      const resA = await app.request('/api/collections/projects/entries', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Tenant-ID': String(tenantA.id),
        },
      })
      expect(resA.status).toBe(200)
      const dataA = await resA.json()
      expect(dataA.entries).toBeDefined()
      expect(dataA.entries.length).toBe(1)
      expect(dataA.entries[0].content.title).toBe('Project A')
      expect(dataA.entries[0].collectionId).toBe(colA.id)

      // Text filters run before pagination and preserve tenant isolation.
      for (const [filter, expectedCount] of [
        ['filter[title]=Project A', 1],
        ['filter[title][eq]=Project B', 0],
        ['filter[title][icontains]=project a', 1],
        ['filter[title][icontains]=project b', 0],
        ['filter[title][icontains]=%', 0],
      ] as const) {
        const filtered = await app.request(
          `/api/collections/projects/entries?${filter}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'X-Tenant-ID': String(tenantA.id),
            },
          }
        )
        expect(filtered.status).toBe(200)
        const filteredData = await filtered.json()
        expect(filteredData.entries).toHaveLength(expectedCount)
        expect(filteredData.pagination.totalCount).toBe(expectedCount)
      }

      // Include boundaries, missing/empty dates, and a date outside the range.
      await db
        .insert(entries)
        .values(
          [
            { title: 'End', publish_date: '2026-10-31' },
            { title: 'After', publish_date: '2026-11-01' },
            { title: 'Empty', publish_date: '' },
            { title: 'Missing' },
            { title: 'Null', publish_date: null },
          ].map((content) => ({
            tenantId: tenantA.id,
            collectionId: colA.id,
            content,
            status: 'published',
            locale: 'en',
          }))
        )
      for (const [filter, count] of [
        ['filter[publish_date]=2026-10-01', 1],
        ['filter[publish_date][eq]=2026-10-31', 1],
        [
          'filter[publish_date][gte]=2026-10-01&filter[publish_date][lte]=2026-10-31',
          2,
        ],
        ['filter[publish_date][lte]=2026-10-31', 2],
        ['filter[publish_date][gte]=2026-10-31', 2],
        [
          'filter[publish_date][gte]=2026-10-01&filter[publish_date][lte]=2026-10-01',
          1,
        ],
        [
          'filter[publish_date][gte]=2026-10-01&filter[publish_date][lte]=2026-10-31&filter[title][icontains]=project',
          1,
        ],
      ] as const) {
        const res = await app.request(
          `/api/collections/projects/entries?limit=1&${filter}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'X-Tenant-ID': String(tenantA.id),
            },
          }
        )
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.entries).toHaveLength(1)
        expect(data.pagination.totalCount).toBe(count)
        expect(data.pagination.totalPages).toBe(count)
      }
      for (const filter of [
        'filter[publish_date]=2026-02-29',
        'filter[publish_date][gte]=2026-11-01&filter[publish_date][lte]=2026-10-01',
      ]) {
        const res = await app.request(
          `/api/collections/projects/entries?${filter}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'X-Tenant-ID': String(tenantA.id),
            },
          }
        )
        expect(res.status).toBe(400)
      }

      // 6. Query for tenant B
      const resB = await app.request('/api/collections/projects/entries', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
      if (colAId)
        await db.delete(entries).where(eq(entries.collectionId, colAId))
      if (entryBId) await db.delete(entries).where(eq(entries.id, entryBId))
      if (colAId) await db.delete(collections).where(eq(collections.id, colAId))
      if (colBId) await db.delete(collections).where(eq(collections.id, colBId))
      if (userTestId) {
        await db
          .delete(usersToTenants)
          .where(eq(usersToTenants.userId, userTestId))
        await db.delete(users).where(eq(users.id, userTestId))
      }
      if (tenantAId) await db.delete(tenants).where(eq(tenants.id, tenantAId))
      if (tenantBId) await db.delete(tenants).where(eq(tenants.id, tenantBId))
    }
  }, 30000)
})
