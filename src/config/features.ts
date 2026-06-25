import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, usersToTenants, media, documents } from '../db/schema.js'

export interface PlanFeatures {
  maxCollections: number
  maxUsers: number
  maxWorkspaces: number
  hasLocalization: boolean
  hasWebhooks: boolean
  hasFormBuilder: boolean
  maxMediaStorageBytes: number
  allowedMonthlyRequests: number
  maxUploadSizeBytes: number
}

export const PLAN_LIMITS: Record<'FREE' | 'PRO' | 'SELF_HOSTED', PlanFeatures> =
  {
    FREE: {
      maxCollections: 5,
      maxUsers: 1, // 1 Admin
      maxWorkspaces: 1, // 1 Workspace
      hasLocalization: false,
      hasWebhooks: false,
      hasFormBuilder: false,
      maxMediaStorageBytes: 500 * 1024 * 1024, // 500 MB total storage limit
      allowedMonthlyRequests: 20000,
      maxUploadSizeBytes: 500 * 1024, // 500 KB per file
    },
    PRO: {
      maxCollections: Infinity,
      maxUsers: 3, // Up to 3 Users per Tenant
      maxWorkspaces: 3, // 3 Managed Workspaces
      hasLocalization: true,
      hasWebhooks: true,
      hasFormBuilder: true,
      maxMediaStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB total storage limit
      allowedMonthlyRequests: 500000,
      maxUploadSizeBytes: 5 * 1024 * 1024, // 5 MB per file
    },
    SELF_HOSTED: {
      maxCollections: Infinity,
      maxUsers: Infinity,
      maxWorkspaces: Infinity,
      hasLocalization: true,
      hasWebhooks: true,
      hasFormBuilder: true,
      maxMediaStorageBytes: Infinity,
      allowedMonthlyRequests: Infinity,
      maxUploadSizeBytes: 5 * 1024 * 1024, // 5 MB per file
    },
  }

/**
 * Returns features and resource limits associated with a given plan tier.
 * Automatically overrides to SELF_HOSTED boundaries if the IS_SELF_HOSTED environment flag is active.
 */
export function getTenantFeatures(planTier?: string | null): PlanFeatures {
  if (process.env.IS_SELF_HOSTED === 'true') {
    return PLAN_LIMITS.SELF_HOSTED
  }

  const tier = (planTier || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS
  return PLAN_LIMITS[tier] || PLAN_LIMITS.FREE
}

/**
 * Resolves the plan tier features for a workspace by fetching the owner's subscription plan.
 */
export async function getWorkspaceFeatures(
  tenantId: number | null
): Promise<PlanFeatures> {
  if (process.env.IS_SELF_HOSTED === 'true') {
    return PLAN_LIMITS.SELF_HOSTED
  }
  if (!tenantId) {
    return PLAN_LIMITS.FREE
  }

  try {
    const ownerRecord = await db
      .select({
        planTier: users.planTier,
      })
      .from(usersToTenants)
      .innerJoin(users, eq(usersToTenants.userId, users.id))
      .where(
        and(
          eq(usersToTenants.tenantId, tenantId),
          eq(usersToTenants.role, 'owner')
        )
      )
      .limit(1)

    if (ownerRecord.length > 0) {
      return getTenantFeatures(ownerRecord[0].planTier)
    }
  } catch (err) {
    console.error(
      'Failed to get workspace features from database, falling back to FREE:',
      err
    )
  }

  return PLAN_LIMITS.FREE
}

/**
 * Calculates the total storage usage (media + documents) of a workspace in bytes.
 */
export async function getWorkspaceStorageUsage(
  tenantId: number | null
): Promise<number> {
  if (!tenantId) return 0

  try {
    const [mediaUsage, documentsUsage] = await Promise.all([
      db
        .select({ total: sql`sum(${media.size})` })
        .from(media)
        .where(eq(media.tenantId, tenantId)),
      db
        .select({ total: sql`sum(${documents.size})` })
        .from(documents)
        .where(eq(documents.tenantId, tenantId)),
    ])

    const totalMedia = Number(mediaUsage[0]?.total || 0)
    const totalDocs = Number(documentsUsage[0]?.total || 0)

    return totalMedia + totalDocs
  } catch (err) {
    console.error('Failed to query workspace storage usage:', err)
    return 0
  }
}
