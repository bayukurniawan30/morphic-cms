import { MiddlewareHandler } from 'hono'
import { Redis } from '@upstash/redis'
import { db } from '../db/index.js'
import { users, usersToTenants } from '../db/schema.js'
import { and, eq } from 'drizzle-orm'
import { PLAN_LIMITS } from '../config/features.js'

// Initialize Redis client only if credentials are set
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

export const usageTracker: MiddlewareHandler = async (c, next) => {
  // If self-hosted environment, skip SaaS usage tracking
  if (process.env.IS_SELF_HOSTED === 'true') {
    return await next()
  }

  // Extract the current processed tenantId
  const tenantId = c.get('tenantId')

  // Skip tracking if the context is SYSTEM or tenantId is null
  const isSystem = c.get('isSystem') === true || c.get('user')?.role === 'super_admin'
  if (isSystem || !tenantId) {
    return await next()
  }

  // If Redis is not configured, fall back gracefully
  if (!redis) {
    console.warn('Usage Tracker: Upstash Redis is not configured. Request tracking skipped.')
    return await next()
  }

  try {
    // 1. Retrieve and cache workspace owner metadata
    const cacheKey = `tenant:${tenantId}:owner_metadata`
    let ownerMeta: { ownerId: number; allowedMonthlyRequests: number; planTier: string } | null = null

    const cachedMeta = await redis.get<any>(cacheKey)
    if (cachedMeta) {
      ownerMeta = typeof cachedMeta === 'string' ? JSON.parse(cachedMeta) : cachedMeta
    }

    if (!ownerMeta) {
      // Find the workspace owner and read allowed monthly requests
      const ownerRecords = await db
        .select({
          ownerId: users.id,
          allowedMonthlyRequests: users.allowedMonthlyRequests,
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

      if (ownerRecords.length > 0) {
        let bestOwner = ownerRecords[0]
        const tierWeight = (tier: string) => {
          const t = (tier || 'FREE').toUpperCase()
          if (t === 'SELF_HOSTED') return 3
          if (t === 'PRO') return 2
          return 1
        }
        for (const record of ownerRecords) {
          if (tierWeight(record.planTier) > tierWeight(bestOwner.planTier)) {
            bestOwner = record
          }
        }

        ownerMeta = {
          ownerId: bestOwner.ownerId,
          allowedMonthlyRequests: bestOwner.allowedMonthlyRequests,
          planTier: (bestOwner.planTier || 'FREE').toUpperCase(),
        }
        // Cache in Redis with 1 hour TTL (3600 seconds)
        await redis.set(cacheKey, JSON.stringify(ownerMeta), { ex: 3600 })
      }
    }

    // 2. Build the redisKey based on ownerId (or tenantId fallback)
    const currentMonth = new Date().toISOString().slice(0, 7)
    const redisKey = ownerMeta
      ? `usage:owner:${ownerMeta.ownerId}:${currentMonth}`
      : `usage:tenant:${tenantId}:${currentMonth}`

    // 3. Fetch the current running tally
    let currentTally = 0
    const rawTally = await redis.get<string | number>(redisKey)
    if (rawTally !== null) {
      currentTally = typeof rawTally === 'number' ? rawTally : parseInt(rawTally, 10)
    }

    const maxLimit = ownerMeta?.allowedMonthlyRequests ?? PLAN_LIMITS.FREE.allowedMonthlyRequests // default to FREE tier limit

    // Check if the current transaction exceeds the threshold
    if (currentTally >= maxLimit) {
      return c.json({
        error: 'Too Many Requests: Monthly API traffic limit exceeded for this workspace.',
        limit: maxLimit,
        current: currentTally,
      }, 429)
    }

    // Increment tally in the background asynchronously
    let hasWaitUntil = false
    try {
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(
          redis.incr(redisKey).catch((err) => {
            console.error('Failed to increment usage in Redis background:', err)
          })
        )
        hasWaitUntil = true
      }
    } catch (e) {
      // ignore
    }

    if (!hasWaitUntil) {
      redis.incr(redisKey).catch((err) => {
        console.error('Failed to increment usage in Redis background:', err)
      })
    }
  } catch (err) {
    console.error('Error in usageTracker middleware:', err)
  }

  return await next()
}
