import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { webhooks } from '../db/schema.js'
import crypto from 'crypto'

export const triggerWebhooks = async (tenantId: number | null, event: string, data: any) => {
  try {
    const whereTenant = tenantId ? eq(webhooks.tenantId, tenantId) : sql`true`
    const activeWebhooks = await db
      .select()
      .from(webhooks)
      .where(and(whereTenant, eq(webhooks.isActive, true)))

    const filtered = activeWebhooks.filter(w => w.events.includes(event))

    const promises = filtered.map(async (webhook) => {
      try {
        const payload = JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          tenantId,
          data
        })

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Morphic-Event': event,
        }

        if (webhook.secret) {
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(payload)
            .digest('hex')
          headers['X-Morphic-Signature'] = signature
        }

        // Use global fetch
        await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payload
        })
      } catch (err) {
        console.error(`Failed to trigger webhook ${webhook.id}:`, err)
      }
    })

    await Promise.all(promises)
  } catch (err) {
    console.error('Webhook trigger error:', err)
  }
}
