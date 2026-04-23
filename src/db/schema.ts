import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const usersToTenants = pgTable('users_to_tenants', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'), // 'owner', 'member'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('collection'), // 'collection' or 'global'
  enableTrash: boolean('enable_trash').notNull().default(false),
  localized: boolean('localized').notNull().default(false),
  fields: jsonb('fields').$type<any[]>().notNull().default([]),
  createdById: integer('created_by_id').references(() => users.id),
  updatedById: integer('updated_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('collections_name_idx').on(table.name),
}))

export const collectionsRelations = relations(collections, ({ one }) => ({
  createdBy: one(users, {
    fields: [collections.createdById],
    references: [users.id],
    relationName: 'collection_creator',
  }),
  updatedBy: one(users, {
    fields: [collections.updatedById],
    references: [users.id],
    relationName: 'collection_updater',
  }),
}))

export const locales = pgTable('locales', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  code: varchar('code', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  collectionId: integer('collection_id')
    .references(() => collections.id, { onDelete: 'cascade' })
    .notNull(),
  content: jsonb('content').notNull().default({}),
  updatedById: integer('updated_by_id').references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('published'),
  locale: varchar('locale', { length: 10 }).notNull().default('en'),
  translationGroupId: varchar('translation_group_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const entryVersions = pgTable('entry_versions', {
  id: serial('id').primaryKey(),
  entryId: integer('entry_id')
    .references(() => entries.id, { onDelete: 'cascade' })
    .notNull(),
  content: jsonb('content').notNull().default({}),
  versionNumber: integer('version_number').notNull(),
  status: varchar('status', { length: 20 }),
  locale: varchar('locale', { length: 10 }),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const roleEnum = pgEnum('role', ['super_admin', 'editor'])

export const abilities = pgTable('abilities', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  permissions: jsonb('permissions').notNull().default({}), // Format: { [collectionSlug]: { create: bool, read: bool, update: bool, delete: bool } }
  isSystem: varchar('is_system', { length: 1 }).default('0').notNull(), // '1' = protected (Read Access)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: roleEnum('role').default('editor').notNull(),
  apiKey: varchar('api_key', { length: 255 }).unique(),
  abilityId: integer('ability_id').references(() => abilities.id),
  lastLogin: timestamp('last_login'),
  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordExpiresAt: timestamp('reset_password_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  nameIdx: index('users_name_idx').on(table.name),
}))

export const mediaFolders = pgTable('media_folders', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: integer('parent_id'), // Self-referencing FK added below or handled loosely
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  publicId: varchar('public_id', { length: 255 }).notNull(),
  secureUrl: varchar('secure_url', { length: 1024 }).notNull(),
  format: varchar('format', { length: 50 }),
  mimeType: varchar('mime_type', { length: 50 }),
  size: integer('size'), // size in bytes
  width: integer('width'),
  height: integer('height'),
  assetId: varchar('asset_id', { length: 255 }),
  resourceType: varchar('resource_type', { length: 50 }),
  folderId: integer('folder_id').references(() => mediaFolders.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  publicId: varchar('public_id', { length: 255 }).notNull(),
  secureUrl: varchar('secure_url', { length: 1024 }).notNull(),
  format: varchar('format', { length: 50 }),
  mimeType: varchar('mime_type', { length: 50 }),
  size: integer('size'), // size in bytes
  assetId: varchar('asset_id', { length: 255 }),
  resourceType: varchar('resource_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const forms = pgTable('forms', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  fields: jsonb('fields').$type<any[]>().notNull().default([]),
  storageType: varchar('storage_type', { length: 20 })
    .notNull()
    .default('external'), // 'internal' or 'external'
  apiUrl: varchar('api_url', { length: 1024 }),
  apiMethod: varchar('api_method', { length: 10 }).notNull().default('POST'),
  apiHeaders: jsonb('api_headers')
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  apiEntriesPath: varchar('api_entries_path', { length: 255 }),
  allowedOrigins: varchar('allowed_origins', { length: 1024 }), // Comma-separated list of domains
  honeypotField: varchar('honeypot_field', { length: 255 }), // Field name for honeypot
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const formEntries = pgTable('form_entries', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  formId: integer('form_id')
    .references(() => forms.id, { onDelete: 'cascade' })
    .notNull(),
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const apiLogs = pgTable(
  'api_logs',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenants.id),
    userId: integer('user_id').references(() => users.id),
    method: varchar('method', { length: 10 }).notNull(),
    path: varchar('path', { length: 1024 }).notNull(),
    ip: varchar('ip', { length: 45 }).notNull(),
    userAgent: varchar('user_agent', { length: 1024 }),
    statusCode: integer('status_code'),
    responseTime: integer('response_time'), // in milliseconds
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      createdAtIdx: index('api_logs_created_at_idx').on(table.createdAt),
      pathIdx: index('api_logs_path_idx').on(table.path),
    }
  }
)
