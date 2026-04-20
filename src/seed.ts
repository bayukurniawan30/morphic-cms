import bcrypt from 'bcryptjs'
import { db } from './db/index.js'
import {
  users,
  tenants,
  usersToTenants,
  locales,
  abilities,
} from './db/schema.js'
import { eq, and } from 'drizzle-orm'

async function seed() {
  console.log('🚀 Starting Database Seeding...')

  try {
    // 1. Create Default Tenant
    let tenantId: number
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, 'main-workspace'))
      .limit(1)

    if (existingTenant.length === 0) {
      console.log('📦 Creating Default Tenant...')
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: 'Main Workspace',
          slug: 'main-workspace',
        })
        .returning()
      tenantId = newTenant.id

      // Seed Tenant Defaults (Locale & Ability)
      await db.insert(locales).values({
        tenantId,
        code: 'en',
        name: 'English',
        isDefault: true,
      })
      await db.insert(abilities).values({
        tenantId,
        name: 'Read Access',
        isSystem: '1',
        permissions: {},
      })
      console.log('✅ Default Tenant and settings created.')
    } else {
      tenantId = existingTenant[0].id
      console.log('ℹ️ Using existing Main Workspace.')
    }

    // 2. Create Super Admin
    const email = 'admin@morphic.cms'
    const hashedPassword = await bcrypt.hash('password123', 10)

    let userId: number
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length === 0) {
      console.log('👤 Creating Super Admin...')
      const [user] = await db
        .insert(users)
        .values({
          email,
          username: 'superadmin',
          password: hashedPassword,
          role: 'super_admin',
        })
        .returning()
      userId = user.id
      console.log(`✅ Super admin created: ${email}`)
    } else {
      userId = existingUser[0].id
      console.log('⚠️ Super admin already exists.')
    }

    // 3. Link Admin to Tenant
    const existingLink = await db
      .select()
      .from(usersToTenants)
      .where(
        and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, tenantId)
        )
      )
      .limit(1)

    if (existingLink.length === 0) {
      console.log('🔗 Linking Admin to Default Tenant...')
      await db.insert(usersToTenants).values({
        userId,
        tenantId,
        role: 'owner',
      })
      console.log('✅ Admin linked to tenant successfully.')
    } else {
      console.log('ℹ️ Admin already linked to tenant.')
    }

    console.log('\n✨ Seeding completed successfully!')
  } catch (err) {
    console.error('❌ Seeding failed:', err)
  } finally {
    process.exit(0)
  }
}

seed()
