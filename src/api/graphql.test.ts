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
