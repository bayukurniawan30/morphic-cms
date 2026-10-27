import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { db } from '../../db/index.js'
import {
  collections,
  entries,
  tenants,
  users,
  usersToTenants,
} from '../../db/schema.js'
import app from '../index'

describe('Schema field sorting', () => {
  it('sorts supported types before pagination, with missing values last and stable ties', async () => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const apiKey = `sort-test-${suffix}`
    let tenantId: number | undefined
    let collectionId: number | undefined
    let userId: number | undefined
    try {
      const [tenant] = await db
        .insert(tenants)
        .values({ name: 'Sorting', slug: `sort-${suffix}` })
        .returning()
      tenantId = tenant.id
      const [user] = await db
        .insert(users)
        .values({
          username: `sort-${suffix}`,
          email: `sort-${suffix}@example.com`,
          password: 'dummy',
          role: 'super_admin',
          apiKey,
        })
        .returning()
      userId = user.id
      await db
        .insert(usersToTenants)
        .values({ userId, tenantId, role: 'owner' })
      const [collection] = await db
        .insert(collections)
        .values({
          tenantId,
          name: 'Products',
          slug: 'products',
          type: 'collection',
          fields: [
            { name: 'price', type: 'number' },
            { name: 'name', type: 'text' },
            { name: 'email', type: 'email' },
            { name: 'day', type: 'date' },
            { name: 'featured', type: 'boolean' },
            { name: 'slug', type: 'slug' },
          ],
        })
        .returning()
      collectionId = collection.id
      const rows = await db
        .insert(entries)
        .values(
          [
            {
              key: 'a',
              price: 2,
              name: 'alpha',
              email: 'B@example.com',
              day: '2026-10-02',
              featured: true,
            },
            {
              key: 'b',
              price: 10,
              name: 'Bravo',
              email: 'a@example.com',
              day: '2026-10-10',
              featured: false,
            },
            {
              key: 'c',
              price: -1,
              name: 'ALPHA',
              email: 'c@example.com',
              day: '2026-09-30',
              featured: false,
            },
            {
              key: 'd',
              price: 2,
              name: '',
              email: '',
              day: '',
              featured: null,
            },
            { key: 'e' },
            {
              key: 'f',
              price: 'not a number',
              name: null,
              email: null,
              day: '2026-02-30',
              featured: 'not boolean',
            },
          ].map((content) => ({
            tenantId,
            collectionId: collection.id,
            content,
            status: 'published',
            locale: 'en',
          }))
        )
        .returning()
      const headers = {
        Authorization: `Bearer ${apiKey}`,
        'X-Tenant-ID': String(tenantId),
      }
      const request = (query: string) =>
        app.request(`/api/collections/products/entries?${query}`, { headers })
      for (const [field, direction, expected] of [
        ['price', 'asc', ['c', 'a', 'd', 'b', 'e', 'f']],
        ['price', 'desc', ['b', 'a', 'd', 'c', 'e', 'f']],
        ['name', 'asc', ['a', 'c', 'b', 'd', 'e', 'f']],
        ['name', 'desc', ['b', 'a', 'c', 'd', 'e', 'f']],
        ['email', 'asc', ['b', 'a', 'c', 'd', 'e', 'f']],
        ['email', 'desc', ['c', 'a', 'b', 'd', 'e', 'f']],
        ['day', 'asc', ['c', 'a', 'b', 'd', 'e', 'f']],
        ['day', 'desc', ['b', 'a', 'c', 'd', 'e', 'f']],
        ['featured', 'asc', ['b', 'c', 'a', 'd', 'e', 'f']],
        ['featured', 'desc', ['a', 'b', 'c', 'd', 'e', 'f']],
      ] as const) {
        const response = await request(`sortBy=${field}&sortDir=${direction}`)
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.entries.map((entry: any) => entry.content.key)).toEqual(
          expected
        )
        expect(data.pagination.totalCount).toBe(6)
      }
      const paged = await request('sortBy=price&sortDir=asc&limit=1&page=3')
      expect(paged.status).toBe(200)
      expect((await paged.json()).entries[0].id).toBe(rows[3].id)
      const filtered = await request(
        'filter[featured]=false&sortBy=price&sortDir=desc'
      )
      expect(filtered.status).toBe(200)
      expect(
        (await filtered.json()).entries.map((entry: any) => entry.content.key)
      ).toEqual(['b', 'c'])
      for (const query of [
        'sortBy=slug',
        'sortBy=unknown',
        'sortDir=invalid',
        'sortBy=price.nested',
      ]) {
        expect((await request(query)).status).toBe(400)
      }
      // Exercise the real GraphQL query path against the same database and fixtures.
      const graphql = await app.request('/api/graphql', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query:
            '{ entriesPage(collectionSlug: "products", sortBy: "price", sortDir: "asc", limit: 2) { entries { id } pagination { totalCount } } }',
        }),
      })
      const body = await graphql.json()
      expect(body.errors).toBeUndefined()
      expect(
        body.data.entriesPage.entries.map((entry: any) => entry.id)
      ).toEqual([rows[2].id, rows[0].id])
      expect(body.data.entriesPage.pagination.totalCount).toBe(6)
    } finally {
      if (collectionId) {
        await db.delete(entries).where(eq(entries.collectionId, collectionId))
        await db.delete(collections).where(eq(collections.id, collectionId))
      }
      if (userId) {
        await db.delete(usersToTenants).where(eq(usersToTenants.userId, userId))
        await db.delete(users).where(eq(users.id, userId))
      }
      if (tenantId) await db.delete(tenants).where(eq(tenants.id, tenantId))
    }
  }, 30000)
})
