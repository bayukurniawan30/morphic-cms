import {
  pgTable,
  serial,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
  integer,
  boolean,
} from 'drizzle-orm/pg-core'

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull().default('collection'), // 'collection' or 'global'
  enableTrash: boolean('enable_trash').notNull().default(false),
  fields: jsonb('fields').$type<any[]>().notNull().default([]),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  collectionId: integer('collection_id')
    .references(() => collections.id, { onDelete: 'cascade' })
    .notNull(),
  content: jsonb('content').notNull().default({}),
  updatedById: integer('updated_by_id').references(() => users.id),
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
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const roleEnum = pgEnum('role', ['super_admin', 'editor'])

export const abilities = pgTable('abilities', {
  id: serial('id').primaryKey(),
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
})

export const mediaFolders = pgTable('media_folders', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: integer('parent_id'), // Self-referencing FK added below or handled loosely
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  publicId: varchar('public_id', { length: 255 }).notNull(),
  secureUrl: varchar('secure_url', { length: 1024 }).notNull(),
  format: varchar('format', { length: 50 }),
  mimeType: varchar('mime_type', { length: 50 }),
  size: integer('size'), // size in bytes
  width: integer('width'),
  height: integer('height'),
  folderId: integer('folder_id').references(() => mediaFolders.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  publicId: varchar('public_id', { length: 255 }).notNull(),
  secureUrl: varchar('secure_url', { length: 1024 }).notNull(),
  format: varchar('format', { length: 50 }),
  mimeType: varchar('mime_type', { length: 50 }),
  size: integer('size'), // size in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const forms = pgTable('forms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
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
  formId: integer('form_id')
    .references(() => forms.id, { onDelete: 'cascade' })
    .notNull(),
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
