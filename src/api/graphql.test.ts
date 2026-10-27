import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGraphQLHandler } from './graphql.js'

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  checkPermission: vi.fn(),
  populateEntryRelations: vi.fn(),
  triggerWebhooks: vi.fn(),
}))

vi.mock('../db/index.js', () => ({
  db: { select: mocks.select },
}))
vi.mock('../lib/permissions.js', () => ({
  checkPermission: mocks.checkPermission,
}))
vi.mock('../lib/entry-relations.js', () => ({
  populateEntryRelations: mocks.populateEntryRelations,
}))
vi.mock('../lib/webhooks.js', () => ({
  triggerWebhooks: mocks.triggerWebhooks,
}))

const postsCollection = {
  id: 12,
  tenantId: 1,
  name: 'Posts',
  slug: 'posts',
  type: 'collection',
  enableTrash: false,
  localized: false,
  fields: [
    { name: 'is_in_review', type: 'select', options: [{ value: 'Yes' }] },
    { name: 'featured', type: 'boolean' },
    { name: 'title', type: 'text' },
    { name: 'category', type: 'relation', relationCollectionId: 7 },
    { name: 'publish_date', type: 'date' },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const post = {
  id: 35,
  tenantId: 1,
  collectionId: 12,
  content: { title: 'Typed entry', is_in_review: 'Yes', featured: true },
  updatedById: 1,
  status: 'published',
  locale: 'en',
  translationGroupId: 'translation-group',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
}

const queryResult = (value: unknown) => {
  const query = Promise.resolve(value) as Promise<unknown> &
    Record<string, unknown>
  for (const method of ['from', 'where', 'orderBy', 'limit', 'offset']) {
    query[method] = vi.fn(() => query)
  }
  return query
}

const graphQLRequest = async (query: string) => {
  const handler = createGraphQLHandler()
  const response = await handler.fetch(
    new Request('http://localhost/api/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
    }),
    { tenantId: 1, user: { id: 1 }, requestContext: { get: vi.fn() } }
  )
  return response.json()
}

describe('Morphic GraphQL API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.checkPermission.mockReturnValue(true)
    mocks.populateEntryRelations.mockImplementation(async (entries) => entries)
  })

  it('returns REST-aligned pagination and supports multiple exact filters', async () => {
    mocks.select
      .mockReturnValueOnce(queryResult([postsCollection]))
      .mockReturnValueOnce(queryResult([{ count: '1' }]))
      .mockReturnValueOnce(queryResult([post]))

    const body = await graphQLRequest(`
      query {
        entriesPage(
          collectionSlug: "posts"
          page: 1
          limit: 10
          filters: { is_in_review: "Yes", featured: true }
        ) {
          type
          entries { id content status locale }
          pagination { currentPage totalPages totalCount limit }
        }
      }
    `)

    expect(body).toEqual({
      data: {
        entriesPage: {
          type: 'collection',
          entries: [
            {
              id: 35,
              content: post.content,
              status: 'published',
              locale: 'en',
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
            limit: 10,
          },
        },
      },
    })
    expect(mocks.checkPermission).toHaveBeenCalledWith(
      expect.anything(),
      'posts',
      'read'
    )
    expect(mocks.populateEntryRelations).toHaveBeenCalledWith(
      [post],
      postsCollection.fields,
      1
    )
  })

  it.each(['{ eq: "Typed entry" }', '{ icontains: "typed" }'])(
    'supports text operators in GraphQL: %s',
    async (operator) => {
      const countQuery = queryResult([{ count: '1' }])
      const rowsQuery = queryResult([post])
      mocks.select
        .mockReturnValueOnce(queryResult([postsCollection]))
        .mockReturnValueOnce(countQuery)
        .mockReturnValueOnce(rowsQuery)
      const body = await graphQLRequest(`query {
        entriesPage(collectionSlug: "posts", filters: { title: ${operator} }) {
          entries { id } pagination { totalCount }
        }
      }`)
      expect(body.errors).toBeUndefined()
      expect(body.data.entriesPage.entries).toEqual([{ id: 35 }])
      expect(countQuery.where).toHaveBeenCalled()
      expect(rowsQuery.where).toHaveBeenCalled()
    }
  )

  it.each(['"2026-10-25"', '{ gte: "2026-10-01", lte: "2026-10-31" }'])(
    'supports date filters in GraphQL: %s',
    async (value) => {
      mocks.select
        .mockReturnValueOnce(queryResult([postsCollection]))
        .mockReturnValueOnce(queryResult([{ count: '1' }]))
        .mockReturnValueOnce(queryResult([post]))
      const body = await graphQLRequest(`query {
        entriesPage(collectionSlug: "posts", filters: { publish_date: ${value} }) { entries { id } }
      }`)
      expect(body.errors).toBeUndefined()
      expect(body.data.entriesPage.entries).toEqual([{ id: 35 }])
    }
  )
  it.each(['{ eq: "2026-02-29" }', '{ gte: "2026-11-01", lte: "2026-10-01" }'])(
    'rejects invalid date filters in GraphQL: %s',
    async (value) => {
      mocks.select.mockReturnValueOnce(queryResult([postsCollection]))
      const body = await graphQLRequest(`query {
        entriesPage(collectionSlug: "posts", filters: { publish_date: ${value} }) { entries { id } }
      }`)
      expect(body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    }
  )

  it.each(['42', '{ eq: 42 }'])(
    'supports relation ID filters in GraphQL: %s',
    async (value) => {
      mocks.select
        .mockReturnValueOnce(queryResult([postsCollection]))
        .mockReturnValueOnce(queryResult([{ count: '1' }]))
        .mockReturnValueOnce(queryResult([post]))
      const body = await graphQLRequest(`query {
        entriesPage(collectionSlug: "posts", filters: { category: ${value} }) { entries { id } }
      }`)
      expect(body.errors).toBeUndefined()
      expect(body.data.entriesPage.entries).toEqual([{ id: 35 }])
    }
  )
  it('rejects invalid relation IDs in GraphQL', async () => {
    mocks.select.mockReturnValueOnce(queryResult([postsCollection]))
    const body = await graphQLRequest(`query {
      entriesPage(collectionSlug: "posts", filters: { category: -1 }) { entries { id } }
    }`)
    expect(body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
  })

  it.each(['unknown', 'category', 'publish_date.nested'])(
    'rejects unsupported sort fields in GraphQL: %s',
    async (field) => {
      mocks.select.mockReturnValueOnce(queryResult([postsCollection]))
      const body = await graphQLRequest(`query {
        entriesPage(collectionSlug: "posts", sortBy: "${field}") { entries { id } }
      }`)
      expect(body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    }
  )

  it('rejects unsupported text operators in GraphQL', async () => {
    mocks.select.mockReturnValueOnce(queryResult([postsCollection]))
    const body = await graphQLRequest(`query {
      entriesPage(collectionSlug: "posts", filters: { title: { unknown: "x" } }) { entries { id } }
    }`)
    expect(body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
  })

  it('preserves the legacy entries query while returning the same entries', async () => {
    mocks.select
      .mockReturnValueOnce(queryResult([postsCollection]))
      .mockReturnValueOnce(queryResult([{ count: '1' }]))
      .mockReturnValueOnce(queryResult([post]))

    const body = await graphQLRequest(`
      query {
        entries(collectionSlug: "posts") { id content }
      }
    `)

    expect(body).toEqual({
      data: { entries: [{ id: 35, content: post.content }] },
    })
  })

  it('rejects a collection read when the API key lacks the read ability', async () => {
    mocks.select.mockReturnValueOnce(queryResult([postsCollection]))
    mocks.checkPermission.mockReturnValue(false)

    const body = await graphQLRequest(`
      query {
        entriesPage(collectionSlug: "posts") { entries { id } }
      }
    `)

    expect(body.errors[0]).toMatchObject({
      message: 'Forbidden: No read access to this collection',
      extensions: { code: 'FORBIDDEN' },
    })
  })
})
