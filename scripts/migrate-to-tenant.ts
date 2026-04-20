import 'dotenv/config'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import {
  abilities,
  collections,
  documents,
  entries,
  formEntries,
  forms,
  locales,
  media,
  mediaFolders,
  tenants,
  users,
  usersToTenants,
} from '../src/db/schema.js'

async function migrate() {
  console.log('🚀 Starting Multi-Tenancy Migration...')

  try {
    // 1. Ensure a default tenant exists
    const defaultTenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, 'default-workspace'))
      .limit(1)

    let tenantId: number

    if (defaultTenantResult.length === 0) {
      console.log('📦 Creating Default Workspace...')
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: 'Default Workspace',
          slug: 'default-workspace',
        })
        .returning()
      tenantId = newTenant.id
      console.log(`✅ Default Workspace created with ID: ${tenantId}`)
    } else {
      tenantId = defaultTenantResult[0].id
      console.log(`ℹ️  Using existing Default Workspace (ID: ${tenantId})`)
    }

    // 2. Link all existing users to this tenant
    console.log('🔗 Linking all existing users to the default workspace...')
    const allUsers = await db.select().from(users)
    for (const user of allUsers) {
      // Check if already linked
      const existingLink = await db
        .select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.userId, user.id),
            eq(usersToTenants.tenantId, tenantId)
          )
        )
        .limit(1)

      if (existingLink.length === 0) {
        await db
          .insert(usersToTenants)
          .values({
            userId: user.id,
            tenantId: tenantId,
            role: user.role === 'super_admin' ? 'owner' : 'member',
          })
          .execute()
        console.log(`   - Linked user: ${user.email}`)
      }
    }

    // 3. Update all tables where tenantId is NULL
    const tables = [
      { name: 'collections', table: collections },
      { name: 'entries', table: entries },
      { name: 'locales', table: locales },
      { name: 'abilities', table: abilities },
      { name: 'media_folders', table: mediaFolders },
      { name: 'media', table: media },
      { name: 'documents', table: documents },
      { name: 'forms', table: forms },
      { name: 'form_entries', table: formEntries },
    ]

    for (const { name, table } of tables) {
      console.log(`📂 Migrating data in ${name}...`)
      try {
        const result = await db
          .update(table as any)
          .set({ tenantId })
          .where(isNull((table as any).tenantId))
          .returning()
        console.log(`   - Updated ${result.length} records in ${name}.`)
      } catch (err) {
        console.error(`   ⚠️  Failed to migrate ${name}:`, err)
      }
    }

    console.log('\n✨ Migration completed successfully!')
    console.log(
      '💡 Note: You may need to restart your dev server to see the changes.'
    )
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    process.exit(0)
  }
}

migrate()
