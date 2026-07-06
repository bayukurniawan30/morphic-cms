import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { webhooks, webhookLogs } from '../db/schema.js'
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
      const startTime = Date.now()
      let statusCode: number | null = null
      let responseHeaders: any = null
      let responseBody: string | null = null
      let errorMessage: string | null = null

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

      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payload
        })
        
        statusCode = res.status
        const resHeaders: Record<string, string> = {}
        res.headers.forEach((val, key) => {
          resHeaders[key] = val
        })
        responseHeaders = resHeaders

        const text = await res.text()
        responseBody = text.length > 5000 ? text.substring(0, 5000) + '... (truncated)' : text
      } catch (err: any) {
        errorMessage = err.message || String(err)
        console.error(`Failed to trigger webhook ${webhook.id}:`, err)
      } finally {
        const responseTime = Date.now() - startTime
        
        db.insert(webhookLogs)
          .values({
            webhookId: webhook.id,
            tenantId: webhook.tenantId,
            event,
            url: webhook.url,
            statusCode,
            responseTime,
            requestHeaders: headers,
            requestBody: payload,
            responseHeaders,
            responseBody,
            errorMessage,
          })
          .execute()
          .catch((dbErr) => {
            console.error('Failed to save webhook log to DB:', dbErr)
          })
      }
    })

    await Promise.all(promises)
  } catch (err) {
    console.error('Webhook trigger error:', err)
  }
}

