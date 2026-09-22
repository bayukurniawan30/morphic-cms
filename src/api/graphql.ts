import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from 'drizzle-orm'
import { GraphQLError, valueFromASTUntyped } from 'graphql'
import { createSchema, createYoga } from 'graphql-yoga'
import crypto from 'node:crypto'
import { db } from '../db/index.js'
import { collections, entries, entryVersions, media } from '../db/schema.js'
import { buildZodSchema } from '../lib/dynamic-schema.js'
import {
  EntryFilterValidationError,
  normalizeExactEntryFilters,
} from '../lib/entry-filters.js'
import { populateEntryRelations } from '../lib/entry-relations.js'
import { checkPermission } from '../lib/permissions.js'
import { triggerWebhooks } from '../lib/webhooks.js'

interface YogaContext {
  tenantId: number | null
  user: any
  requestContext: any
}
type EntryArgs = {
  collectionSlug: string
  limit?: number
  page?: number
  offset?: number
  sortBy?: string
  sortDir?: string
  locale?: string
  status?: string
  trash?: boolean
  filters?: Record<string, unknown>
}
const fail = (message: string, code: string) =>
  new GraphQLError(message, { extensions: { code } })
const tenantCondition = (column: any, tenantId: number | null) =>
  tenantId ? eq(column, tenantId) : sql`true`
const requirePermission = (
  context: YogaContext,
  slug: string,
  action: 'create' | 'read' | 'update' | 'delete'
) => {
  if (!checkPermission(context.requestContext, slug, action))
    throw fail(`Forbidden: No ${action} access to this collection`, 'FORBIDDEN')
}
const findCollection = async (slug: string, tenantId: number | null) =>
  (
    await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.slug, slug),
          tenantCondition(collections.tenantId, tenantId)
        )
      )
      .limit(1)
  )[0] || null
const filtersFor = (
  fields: any[],
  filters: Record<string, unknown> | undefined
) => {
  try {
    return normalizeExactEntryFilters(fields, filters)
  } catch (error) {
    if (error instanceof EntryFilterValidationError)
      throw fail(error.message, 'BAD_USER_INPUT')
    throw error
  }
}

const entriesPage = async (args: EntryArgs, context: YogaContext) => {
  const collection = await findCollection(args.collectionSlug, context.tenantId)
  if (!collection) throw fail('Collection not found', 'NOT_FOUND')
  requirePermission(context, collection.slug, 'read')
  const filters = filtersFor(collection.fields as any[], args.filters)
  const conditions: any[] = [
    eq(entries.collectionId, collection.id),
    tenantCondition(entries.tenantId, context.tenantId),
  ]
  if ((args.status || 'published') !== 'all')
    conditions.push(eq(entries.status, args.status || 'published'))
  for (const filter of filters)
    conditions.push(
      sql`${entries.content} @> ${JSON.stringify({ [filter.field]: filter.value })}::jsonb`
    )
  const locale = args.locale || 'en'

  if (collection.type === 'global') {
    const readGlobal = async (targetLocale: string) =>
      await db
        .select()
        .from(entries)
        .where(
          and(
            ...conditions,
            isNull(entries.deletedAt),
            eq(entries.locale, targetLocale)
          )
        )
        .orderBy(desc(entries.createdAt))
        .limit(1)
    let result = await readGlobal(locale)
    if (!result.length && locale !== 'en') result = await readGlobal('en')
    const populated = await populateEntryRelations(
      result,
      collection.fields as any[],
      context.tenantId
    )
    return {
      type: 'global',
      entry: populated[0] || null,
      entries: [],
      pagination: null,
    }
  }

  if (args.locale !== '_all') conditions.push(eq(entries.locale, locale))
  conditions.push(
    collection.enableTrash && args.trash
      ? isNotNull(entries.deletedAt)
      : isNull(entries.deletedAt)
  )
  const limit = Math.min(Math.max(args.limit || 10, 1), 100)
  const page = Math.max(args.page || 1, 1)
  const offset = args.page ? (page - 1) * limit : Math.max(args.offset || 0, 0)
  const order =
    args.sortDir === 'asc'
      ? asc(args.sortBy === 'id' ? entries.id : entries.createdAt)
      : desc(args.sortBy === 'id' ? entries.id : entries.createdAt)
  const [count, result] = await Promise.all([
    db
      .select({ count: sql`count(*)` })
      .from(entries)
      .where(and(...conditions)),
    db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(order)
      .limit(limit)
      .offset(offset),
  ])
  const totalCount = Number(count[0]?.count || 0)
  return {
    type: 'collection',
    entry: null,
    entries: await populateEntryRelations(
      result,
      collection.fields as any[],
      context.tenantId
    ),
    pagination: {
      currentPage: args.page ? page : Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit,
    },
  }
}

const oneEntry = async (
  id: number,
  locale: string | undefined,
  status: string | undefined,
  context: YogaContext
) => {
  const conditions: any[] = [
    eq(entries.id, id),
    isNull(entries.deletedAt),
    tenantCondition(entries.tenantId, context.tenantId),
  ]
  if ((status || 'published') !== 'all')
    conditions.push(eq(entries.status, status || 'published'))
  let result = await db
    .select()
    .from(entries)
    .where(and(...conditions))
    .limit(1)
  const entry = result[0]
  if (!entry) throw fail('Entry not found', 'NOT_FOUND')
  const collection = (
    await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.id, entry.collectionId),
          tenantCondition(collections.tenantId, context.tenantId)
        )
      )
      .limit(1)
  )[0]
  if (!collection) throw fail('Collection not found', 'NOT_FOUND')
  requirePermission(context, collection.slug, 'read')
  if (locale && entry.locale !== locale && entry.translationGroupId)
    result = await db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.translationGroupId, entry.translationGroupId),
          eq(entries.locale, locale),
          isNull(entries.deletedAt),
          eq(entries.status, 'published'),
          tenantCondition(entries.tenantId, context.tenantId)
        )
      )
      .limit(1)
  return (
    (
      await populateEntryRelations(
        result,
        collection.fields as any[],
        context.tenantId
      )
    )[0] || null
  )
}

const validatedContent = (fields: any[], content: unknown) => {
  const result = buildZodSchema(fields).safeParse(content)
  if (!result.success)
    throw new GraphQLError('Validation failed', {
      extensions: { code: 'BAD_USER_INPUT', details: result.error.format() },
    })
  return result.data
}

export const createGraphQLHandler = () => {
  const schema = createSchema<YogaContext>({
    typeDefs: /* GraphQL */ `
      scalar JSON
      type UserReference {
        id: Int!
        name: String
      }
      type Collection {
        id: Int!
        tenantId: Int
        name: String!
        slug: String!
        type: String!
        enableTrash: Boolean!
        localized: Boolean!
        fields: JSON!
        createdAt: String!
        updatedAt: String!
      }
      type Entry {
        id: Int!
        tenantId: Int
        collectionId: Int!
        content: JSON!
        updatedById: Int
        status: String!
        locale: String!
        translationGroupId: String
        createdAt: String!
        updatedAt: String!
        deletedAt: String
      }
      type Pagination {
        currentPage: Int!
        totalPages: Int!
        totalCount: Int!
        limit: Int!
      }
      type EntryPage {
        type: String!
        entry: Entry
        entries: [Entry!]!
        pagination: Pagination
      }
      type Media {
        id: Int!
        filename: String!
        secureUrl: String!
        size: Int
        mimeType: String
        alt: String
        createdAt: String!
      }
      type EntryMutationResult {
        success: Boolean!
        message: String
        entry: Entry
      }
      type Query {
        collections: [Collection!]!
        collection(slug: String!): Collection
        entry(id: Int!, locale: String, status: String): Entry
        entries(
          collectionSlug: String!
          limit: Int
          page: Int
          offset: Int
          sortBy: String
          sortDir: String
          locale: String
          status: String
          trash: Boolean
          filters: JSON
        ): [Entry!]!
          @deprecated(reason: "Use entriesPage for pagination metadata.")
        entriesPage(
          collectionSlug: String!
          limit: Int
          page: Int
          offset: Int
          sortBy: String
          sortDir: String
          locale: String
          status: String
          trash: Boolean
          filters: JSON
        ): EntryPage!
        media(limit: Int, offset: Int): [Media!]!
      }
      type Mutation {
        createEntry(
          collectionSlug: String!
          content: JSON!
          status: String
          locale: String
          translationGroupId: String
        ): EntryMutationResult!
        updateEntry(
          id: Int!
          content: JSON!
          status: String
          locale: String
        ): EntryMutationResult!
        deleteEntry(id: Int!, force: Boolean = false): EntryMutationResult!
      }
    `,
    resolvers: {
      JSON: {
        serialize: (value: any) => value,
        parseValue: (value: any) => value,
        parseLiteral: valueFromASTUntyped,
      },
      Query: {
        collections: async (_: unknown, __: unknown, context: YogaContext) =>
          await db
            .select()
            .from(collections)
            .where(tenantCondition(collections.tenantId, context.tenantId))
            .orderBy(desc(collections.createdAt)),
        collection: async (
          _: unknown,
          { slug }: { slug: string },
          context: YogaContext
        ) => await findCollection(slug, context.tenantId),
        entry: async (
          _: unknown,
          args: { id: number; locale?: string; status?: string },
          context: YogaContext
        ) => await oneEntry(args.id, args.locale, args.status, context),
        entries: async (_: unknown, args: EntryArgs, context: YogaContext) => {
          const page = await entriesPage(args, context)
          return page.entry ? [page.entry] : page.entries
        },
        entriesPage: async (
          _: unknown,
          args: EntryArgs,
          context: YogaContext
        ) => await entriesPage(args, context),
        media: async (
          _: unknown,
          { limit = 20, offset = 0 }: { limit?: number; offset?: number },
          context: YogaContext
        ) => {
          requirePermission(context, 'media', 'read')
          return await db
            .select()
            .from(media)
            .where(tenantCondition(media.tenantId, context.tenantId))
            .limit(Math.min(Math.max(limit, 1), 100))
            .offset(Math.max(offset, 0))
            .orderBy(desc(media.createdAt))
        },
      },
      Mutation: {
        createEntry: async (
          _: unknown,
          args: {
            collectionSlug: string
            content: unknown
            status?: string
            locale?: string
            translationGroupId?: string
          },
          context: YogaContext
        ) => {
          const collection = await findCollection(
            args.collectionSlug,
            context.tenantId
          )
          if (!collection) throw fail('Collection not found', 'NOT_FOUND')
          requirePermission(context, collection.slug, 'create')
          const [entry] = await db
            .insert(entries)
            .values({
              collectionId: collection.id,
              content: validatedContent(
                collection.fields as any[],
                args.content
              ),
              status: args.status || 'published',
              locale: args.locale || 'en',
              translationGroupId:
                args.translationGroupId || crypto.randomUUID(),
              updatedById: context.user?.id || null,
              tenantId: context.tenantId,
            })
            .returning()
          triggerWebhooks(context.tenantId, 'entry.created', { entry })
          if (entry.status === 'published')
            triggerWebhooks(context.tenantId, 'entry.published', { entry })
          return { success: true, entry }
        },
        updateEntry: async (
          _: unknown,
          args: {
            id: number
            content: unknown
            status?: string
            locale?: string
          },
          context: YogaContext
        ) => {
          const conditions: any[] = [
            eq(entries.id, args.id),
            tenantCondition(entries.tenantId, context.tenantId),
          ]
          const previous = (
            await db
              .select()
              .from(entries)
              .where(and(...conditions))
              .limit(1)
          )[0]
          if (!previous) throw fail('Entry not found', 'NOT_FOUND')
          const collection = (
            await db
              .select()
              .from(collections)
              .where(eq(collections.id, previous.collectionId))
              .limit(1)
          )[0]
          if (!collection) throw fail('Collection not found', 'NOT_FOUND')
          requirePermission(context, collection.slug, 'update')
          const previousVersions = await db
            .select({
              id: entryVersions.id,
              versionNumber: entryVersions.versionNumber,
            })
            .from(entryVersions)
            .where(eq(entryVersions.entryId, previous.id))
            .orderBy(desc(entryVersions.versionNumber))
          await db.insert(entryVersions).values({
            tenantId: previous.tenantId,
            entryId: previous.id,
            content: previous.content,
            versionNumber: (previousVersions[0]?.versionNumber || 0) + 1,
            status: previous.status,
            locale: previous.locale,
            createdById: previous.updatedById,
            createdAt: previous.updatedAt,
          })
          if (previousVersions.length >= 5) {
            await db.delete(entryVersions).where(
              inArray(
                entryVersions.id,
                previousVersions.slice(4).map((version) => version.id)
              )
            )
          }
          const [entry] = await db
            .update(entries)
            .set({
              content: validatedContent(
                collection.fields as any[],
                args.content
              ),
              status: args.status || previous.status,
              locale: args.locale || previous.locale,
              updatedById: context.user?.id || null,
              updatedAt: new Date(),
            })
            .where(and(...conditions))
            .returning()
          triggerWebhooks(context.tenantId, 'entry.updated', { entry })
          if (entry.status === 'published' && previous.status !== 'published')
            triggerWebhooks(context.tenantId, 'entry.published', { entry })
          return { success: true, entry }
        },
        deleteEntry: async (
          _: unknown,
          { id, force = false }: { id: number; force?: boolean },
          context: YogaContext
        ) => {
          const conditions: any[] = [
            eq(entries.id, id),
            tenantCondition(entries.tenantId, context.tenantId),
          ]
          const entry = (
            await db
              .select()
              .from(entries)
              .where(and(...conditions))
              .limit(1)
          )[0]
          if (!entry) throw fail('Entry not found', 'NOT_FOUND')
          const collection = (
            await db
              .select()
              .from(collections)
              .where(eq(collections.id, entry.collectionId))
              .limit(1)
          )[0]
          if (!collection) throw fail('Collection not found', 'NOT_FOUND')
          requirePermission(context, collection.slug, 'delete')
          if (collection.enableTrash && !force) {
            await db
              .update(entries)
              .set({ deletedAt: new Date() })
              .where(and(...conditions))
            triggerWebhooks(context.tenantId, 'entry.deleted', { entry })
            return { success: true, message: 'Entry moved to trash' }
          }
          await db.delete(entries).where(and(...conditions))
          triggerWebhooks(context.tenantId, 'entry.deleted', { entry })
          return { success: true }
        },
      },
    },
  })
  return createYoga<YogaContext>({
    schema,
    graphqlEndpoint: '/api/graphql',
    fetchAPI: { Response, Request },
    maskedErrors: false,
  })
}
