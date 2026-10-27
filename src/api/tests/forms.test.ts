import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from '../../db/index.js'
import { tenants, forms, formEntries } from '../../db/schema.js'
import app from '../index'

describe('Form Max Entries & Auto-Close', () => {
  it('should automatically close form (isActive=false) when submissions reach maxEntries limit', async () => {
    const testId = crypto.randomUUID().substring(0, 8)
    let tenantId: number | undefined
    let formId: number | undefined

    try {
      const [tenant] = await db
        .insert(tenants)
        .values({
          name: `Form Tenant ${testId}`,
          slug: `form-tenant-${testId}`,
        })
        .returning()
      tenantId = tenant.id

      const [form] = await db
        .insert(forms)
        .values({
          name: `Test Form ${testId}`,
          slug: `test-form-${testId}`,
          tenantId,
          storageType: 'internal',
          isActive: true,
          maxEntries: 2,
          fields: [
            {
              id: 'field_email',
              name: 'email',
              label: 'Email',
              type: 'email',
              required: true,
            },
          ],
        })
        .returning()
      formId = form.id

      expect(form.isActive).toBe(true)
      expect(form.maxEntries).toBe(2)

      // 1. Submit first entry -> should succeed and form remains active
      const sub1 = await app.request(
        `/api/forms/${tenant.slug}/${form.slug}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Host: 'localhost',
          },
          body: JSON.stringify({ email: 'user1@example.com' }),
        }
      )
      expect(sub1.status).toBe(200)
      const sub1Data = await sub1.json()
      expect(sub1Data.success).toBe(true)

      const [formAfter1] = await db
        .select()
        .from(forms)
        .where(eq(forms.id, formId))
        .limit(1)
      expect(formAfter1.isActive).toBe(true)

      // 2. Submit second entry (reaches maxEntries: 2) -> should succeed and auto-close form
      const sub2 = await app.request(
        `/api/forms/${tenant.slug}/${form.slug}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Host: 'localhost',
          },
          body: JSON.stringify({ email: 'user2@example.com' }),
        }
      )
      expect(sub2.status).toBe(200)
      const sub2Data = await sub2.json()
      expect(sub2Data.success).toBe(true)

      const [formAfter2] = await db
        .select()
        .from(forms)
        .where(eq(forms.id, formId))
        .limit(1)
      expect(formAfter2.isActive).toBe(false)

      // 3. Submit third entry -> should be blocked with 400 since form is closed
      const sub3 = await app.request(
        `/api/forms/${tenant.slug}/${form.slug}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Host: 'localhost',
          },
          body: JSON.stringify({ email: 'user3@example.com' }),
        }
      )
      expect(sub3.status).toBe(400)
      const sub3Data = await sub3.json()
      expect(sub3Data.error).toContain('closed')
    } finally {
      if (formId) {
        await db
          .delete(formEntries)
          .where(eq(formEntries.formId, formId))
          .catch(() => {})
        await db
          .delete(forms)
          .where(eq(forms.id, formId))
          .catch(() => {})
      }
      if (tenantId) {
        await db
          .delete(tenants)
          .where(eq(tenants.id, tenantId))
          .catch(() => {})
      }
    }
  })
})
