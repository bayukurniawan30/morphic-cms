import { createSchema, createYoga } from 'graphql-yoga'
import { db } from '../db/index.js'
import { collections, entries, media } from '../db/schema.js'
import { and, eq, desc, asc, isNull, sql } from 'drizzle-orm'

interface YogaContext {
  tenantId: number | null
  user: any
}

export const createGraphQLHandler = () => {
  const schema = createSchema<YogaContext>({
    typeDefs: /* GraphQL */ `
      scalar JSON

      type Collection {
        id: Int!
        name: String!
        slug: String!
        type: String!
        fields: JSON!
        createdAt: String!
        updatedAt: String!
      }

      type Entry {
        id: Int!
        collectionId: Int!
        content: JSON!
        locale: String!
        status: String!
        createdAt: String!
        updatedAt: String!
      }

      type Media {
        id: Int!
        filename: String!
        secureUrl: String!
        size: Int
        mimeType: String
        createdAt: String!
      }

      type Query {
        collections: [Collection!]!
        collection(slug: String!): Collection
        entries(collectionSlug: String!, limit: Int, page: Int, offset: Int, sortBy: String, sortDir: String, locale: String): [Entry!]!
        media(limit: Int, offset: Int): [Media!]!
      }
    `,
    resolvers: {
      JSON: {
        serialize: (value: any) => value,
        parseValue: (value: any) => value,
        parseLiteral: (ast: any) => (ast as any).value,
      },
      Query: {
        collections: async (_, __, context) => {
          const { tenantId } = context
          if (!tenantId) return []
          return await db
            .select()
            .from(collections)
            .where(eq(collections.tenantId, tenantId))
            .orderBy(desc(collections.createdAt))
        },
        collection: async (_, { slug }, context) => {
          const { tenantId } = context
          if (!tenantId) return null
          const result = await db
            .select()
            .from(collections)
            .where(and(eq(collections.slug, slug), eq(collections.tenantId, tenantId)))
            .limit(1)
          return result[0] || null
        },
        entries: async (_, { collectionSlug, limit = 10, offset = 0, page, sortBy = 'createdAt', sortDir = 'desc', locale }, context) => {
          const { tenantId } = context
          const computedOffset = page ? (page - 1) * limit : offset;
          if (!tenantId) return []

          // First find the collection ID
          const collectionResult = await db
            .select({ id: collections.id })
            .from(collections)
            .where(and(eq(collections.slug, collectionSlug), eq(collections.tenantId, tenantId)))
            .limit(1)
          
          if (collectionResult.length === 0) return []
          const collectionId = collectionResult[0].id

          const conditions = [
            eq(entries.collectionId, collectionId),
            eq(entries.tenantId, tenantId),
            isNull(entries.deletedAt)
          ]

          if (locale) {
            conditions.push(eq(entries.locale, locale))
          }

          return await db
            .select()
            .from(entries)
            .where(and(...conditions))
            .limit(limit)
            .offset(computedOffset)
            .orderBy(sortDir === 'asc' ? asc(sortBy === 'id' ? entries.id : entries.createdAt) : desc(sortBy === 'id' ? entries.id : entries.createdAt))
        },
        media: async (_, { limit = 20, offset = 0 }, context) => {
          const { tenantId } = context
          if (!tenantId) return []
          return await db
            .select()
            .from(media)
            .where(eq(media.tenantId, tenantId))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(media.createdAt))
        }
      }
    }
  })

  return createYoga<YogaContext>({
    schema,
    graphqlEndpoint: '/api/graphql',
    fetchAPI: { Response, Request }
  })
}
