import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTenantFeatures, getWorkspaceFeatures, PLAN_LIMITS } from './features'
import { db } from '../db/index.js'
import { tenants, users, usersToTenants } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

describe('Features Configuration', () => {
  const originalEnv = process.env.IS_SELF_HOSTED

  beforeEach(() => {
    process.env.IS_SELF_HOSTED = originalEnv
  })

  afterEach(() => {
    process.env.IS_SELF_HOSTED = originalEnv
  })

  describe('getTenantFeatures', () => {
    it('should return FREE tier features for empty or invalid tier', () => {
      const defaultFeatures = getTenantFeatures(null)
      expect(defaultFeatures.maxCollections).toBe(5)
      expect(defaultFeatures.maxUsers).toBe(1)
      expect(defaultFeatures.maxWorkspaces).toBe(1)
      expect(defaultFeatures.hasLocalization).toBe(false)
      expect(defaultFeatures.hasWebhooks).toBe(false)
      expect(defaultFeatures.hasFormBuilder).toBe(false)

      const invalidFeatures = getTenantFeatures('INVALID_TIER')
      expect(invalidFeatures.maxCollections).toBe(5)
    })

    it('should return PRO tier features correctly', () => {
      const proFeatures = getTenantFeatures('PRO')
      expect(proFeatures.maxCollections).toBe(Infinity)
      expect(proFeatures.maxUsers).toBe(3)
      expect(proFeatures.maxWorkspaces).toBe(3)
      expect(proFeatures.hasLocalization).toBe(true)
      expect(proFeatures.hasWebhooks).toBe(true)
      expect(proFeatures.hasFormBuilder).toBe(true)
    })

    it('should override any input to SELF_HOSTED boundaries when IS_SELF_HOSTED env variable is set to true', () => {
      process.env.IS_SELF_HOSTED = 'true'
      const features = getTenantFeatures('FREE')
      expect(features.maxCollections).toBe(Infinity)
      expect(features.maxUsers).toBe(Infinity)
      expect(features.maxWorkspaces).toBe(Infinity)
      expect(features.hasLocalization).toBe(true)
      expect(features.hasWebhooks).toBe(true)
    })
  })

  describe('getWorkspaceFeatures', () => {
    it('should return default FREE features if tenantId is null', async () => {
      const features = await getWorkspaceFeatures(null)
      expect(features.maxCollections).toBe(5)
    })

    it('should return SELF_HOSTED features when IS_SELF_HOSTED env variable is set to true', async () => {
      process.env.IS_SELF_HOSTED = 'true'
      const features = await getWorkspaceFeatures(9999)
      expect(features.maxCollections).toBe(Infinity)
    })

    it('should resolve workspace owner subscription plan tier from database', async () => {
      const testSuffix = crypto.randomUUID().substring(0, 8)
      const username = `featuser-${testSuffix}`
      const email = `featuser-${testSuffix}@example.com`

      let tenantId: number | undefined
      let userId: number | undefined

      try {
        // 1. Create tenant
        const [tenant] = await db
          .insert(tenants)
          .values({
            name: `Test Tenant ${testSuffix}`,
            slug: `test-tenant-${testSuffix}`,
          })
          .returning()
        tenantId = tenant.id

        // 2. Create user with PRO plan
        const [user] = await db
          .insert(users)
          .values({
            name: `Pro User ${testSuffix}`,
            username,
            email,
            password: 'hashedpassword',
            planTier: 'PRO',
            allowedMonthlyRequests: 500000,
          })
          .returning()
        userId = user.id

        // 3. Link user as owner of the tenant
        await db.insert(usersToTenants).values({
          userId: user.id,
          tenantId: tenant.id,
          role: 'owner',
        })

        // Verify features are resolved as PRO
        const features = await getWorkspaceFeatures(tenant.id)
        expect(features.maxCollections).toBe(Infinity)
        expect(features.maxUsers).toBe(3)
        expect(features.hasLocalization).toBe(true)
      } finally {
        // Clean up
        if (userId) {
          await db.delete(usersToTenants).where(eq(usersToTenants.userId, userId))
          await db.delete(users).where(eq(users.id, userId))
        }
        if (tenantId) {
          await db.delete(tenants).where(eq(tenants.id, tenantId))
        }
      }
    })

    it('should fallback to FREE limits if the owner cannot be resolved', async () => {
      const testSuffix = crypto.randomUUID().substring(0, 8)
      let tenantId: number | undefined

      try {
        // Create tenant without any users/owner linked
        const [tenant] = await db
          .insert(tenants)
          .values({
            name: `Orphan Tenant ${testSuffix}`,
            slug: `orphan-tenant-${testSuffix}`,
          })
          .returning()
        tenantId = tenant.id

        const features = await getWorkspaceFeatures(tenant.id)
        expect(features.maxCollections).toBe(5)
        expect(features.maxUsers).toBe(1)
      } finally {
        if (tenantId) {
          await db.delete(tenants).where(eq(tenants.id, tenantId))
        }
      }
    })
  })
})
