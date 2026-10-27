import { eq, inArray } from 'drizzle-orm'
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

describe('Relation entry filters', () => {
  it('filters stored relation IDs before pagination and population within the tenant', async () => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const apiKey = `relation-test-${suffix}`
    const tenantIds: number[] = []
    const collectionIds: number[] = []
    let userId: number | undefined
    try {
      const createdTenants = await db
        .insert(tenants)
        .values([
          { name: 'Relation A', slug: `relation-a-${suffix}` },
          { name: 'Relation B', slug: `relation-b-${suffix}` },
        ])
        .returning()
      tenantIds.push(...createdTenants.map((t) => t.id))
      const [tenantA, tenantB] = createdTenants
      const [user] = await db
        .insert(users)
        .values({
          username: `relation-${suffix}`,
          email: `relation-${suffix}@example.com`,
          password: 'dummyhash',
          role: 'super_admin',
          apiKey,
        })
        .returning()
      userId = user.id
      await db
        .insert(usersToTenants)
        .values(
          tenantIds.map((tenantId) => ({
            userId: user.id,
            tenantId,
            role: 'owner',
          }))
        )
      const [categories] = await db
        .insert(collections)
        .values({
          tenantId: tenantA.id,
          name: 'Categories',
          slug: 'categories',
          type: 'collection',
          fields: [{ name: 'title', type: 'text' }],
        })
        .returning()
      collectionIds.push(categories.id)
      const [technology, news] = await db
        .insert(entries)
        .values([
          {
            tenantId: tenantA.id,
            collectionId: categories.id,
            content: { title: 'Technology' },
            status: 'published',
            locale: 'en',
          },
          {
            tenantId: tenantA.id,
            collectionId: categories.id,
            content: { title: 'News' },
            status: 'draft',
            locale: 'en',
          },
        ])
        .returning()
      const posts = await db
        .insert(collections)
        .values(
          tenantIds.map((tenantId) => ({
            tenantId,
            name: 'Posts',
            slug: 'posts',
            type: 'collection',
            fields: [
              { name: 'title', type: 'text' },
              {
                name: 'category',
                type: 'relation',
                relationCollectionId: categories.id,
              },
              { name: 'day', type: 'date' },
            ],
          }))
        )
        .returning()
      collectionIds.push(...posts.map((c) => c.id))
      const [postsA, postsB] = posts
      await db.insert(entries).values([
        {
          tenantId: tenantA.id,
          collectionId: postsA.id,
          content: {
            title: 'First',
            category: technology.id,
            day: '2026-10-25',
          },
          status: 'published',
          locale: 'en',
        },
        {
          tenantId: tenantA.id,
          collectionId: postsA.id,
          content: {
            title: 'Second',
            category: technology.id,
            day: '2026-10-26',
          },
          status: 'published',
          locale: 'en',
        },
        {
          tenantId: tenantA.id,
          collectionId: postsA.id,
          content: { title: 'News post', category: news.id },
          status: 'published',
          locale: 'en',
        },
        {
          tenantId: tenantA.id,
          collectionId: postsA.id,
          content: { title: 'No category' },
          status: 'published',
          locale: 'en',
        },
        {
          tenantId: tenantA.id,
          collectionId: postsA.id,
          content: { title: 'Draft', category: technology.id },
          status: 'draft',
          locale: 'en',
        },
        {
          tenantId: tenantB.id,
          collectionId: postsB.id,
          content: { title: 'Other tenant', category: technology.id },
          status: 'published',
          locale: 'en',
        },
      ])
      const request = (query: string) =>
        app.request(`/api/collections/posts/entries?${query}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-Tenant-ID': String(tenantA.id),
          },
        })
      for (const query of [
        `filter[category]=${technology.id}`,
        `filter[category][eq]=${technology.id}`,
      ]) {
        const res = await request(`${query}&limit=1`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.pagination.totalCount).toBe(2)
        expect(data.pagination.totalPages).toBe(2)
        expect(data.entries).toHaveLength(1)
        expect(data.entries[0].tenantId).toBe(tenantA.id)
        expect(data.entries[0].content.category).toEqual({
          id: technology.id,
          title: 'Technology',
        })
      }
      const combined = await request(
        `filter[category]=${technology.id}&filter[title][icontains]=first&filter[day][gte]=2026-10-01&filter[day][lte]=2026-10-31`
      )
      expect(combined.status).toBe(200)
      const combinedData = await combined.json()
      expect(combinedData.pagination.totalCount).toBe(1)
      expect(combinedData.entries[0].content.title).toBe('First')
      // Matching uses stored IDs even when the target isn't published; population stays unchanged.
      const unpublished = await request(`filter[category]=${news.id}`)
      expect(unpublished.status).toBe(200)
      const unpublishedData = await unpublished.json()
      expect(unpublishedData.pagination.totalCount).toBe(1)
      expect(unpublishedData.entries[0].content.category).toBe(news.id)
      const missing = await request('filter[category]=2147483647')
      expect(missing.status).toBe(200)
      expect((await missing.json()).pagination.totalCount).toBe(0)
      for (const value of ['0', 'abc', '-1', '1.5']) {
        expect((await request(`filter[category]=${value}`)).status).toBe(400)
      }
    } finally {
      if (collectionIds.length) {
        await db
          .delete(entries)
          .where(inArray(entries.collectionId, collectionIds))
        await db
          .delete(collections)
          .where(inArray(collections.id, collectionIds))
      }
      if (userId) {
        await db.delete(usersToTenants).where(eq(usersToTenants.userId, userId))
        await db.delete(users).where(eq(users.id, userId))
      }
      if (tenantIds.length)
        await db.delete(tenants).where(inArray(tenants.id, tenantIds))
    }
  }, 30000)
})
