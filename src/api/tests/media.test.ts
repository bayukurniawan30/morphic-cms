import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from '../../db/index.js'
import {
  tenants,
  users,
  usersToTenants,
  abilities,
  mediaFolders,
} from '../../db/schema.js'
import app from '../index'

describe('API Key Media & Media Folder Permissions', () => {
  it('should allow media folder creation and deletion with media_folder permissions, and block without', async () => {
    const testId = crypto.randomUUID().substring(0, 8)
    const apiKeyAllowed = `media-key-allowed-${testId}`
    const apiKeyDenied = `media-key-denied-${testId}`
    let tenantId: number | undefined
    let abilityAllowedId: number | undefined
    let abilityDeniedId: number | undefined
    let userAllowedId: number | undefined
    let userDeniedId: number | undefined
    let createdFolderId: number | undefined

    try {
      // 1. Create tenant
      const [tenant] = await db
        .insert(tenants)
        .values({
          name: `Media Test Tenant ${testId}`,
          slug: `media-tenant-${testId}`,
        })
        .returning()
      tenantId = tenant.id

      // 2. Create ability with media_folder permissions
      const [abilityAllowed] = await db
        .insert(abilities)
        .values({
          name: `Media Folder Admin ${testId}`,
          permissions: {
            media_folder: {
              create: true,
              delete: true,
              read: false,
              update: false,
            },
            media: { create: true, read: true, delete: true, update: false },
          },
          isSystem: '0',
          tenantId,
        })
        .returning()
      abilityAllowedId = abilityAllowed.id

      // 3. Create ability without media_folder permissions (read-only on media)
      const [abilityDenied] = await db
        .insert(abilities)
        .values({
          name: `Media Read Only ${testId}`,
          permissions: {
            media_folder: {
              create: false,
              delete: false,
              read: false,
              update: false,
            },
            media: { create: false, read: true, delete: false, update: false },
          },
          isSystem: '0',
          tenantId,
        })
        .returning()
      abilityDeniedId = abilityDenied.id

      // 4. Create user with allowed ability
      const [userAllowed] = await db
        .insert(users)
        .values({
          username: `user-allowed-${testId}`,
          email: `user-allowed-${testId}@example.com`,
          password: 'dummyhash',
          apiKey: apiKeyAllowed,
          abilityId: abilityAllowedId,
          role: 'editor',
          isEmailVerified: true,
        })
        .returning()
      userAllowedId = userAllowed.id

      // 5. Create user with denied ability
      const [userDenied] = await db
        .insert(users)
        .values({
          username: `user-denied-${testId}`,
          email: `user-denied-${testId}@example.com`,
          password: 'dummyhash',
          apiKey: apiKeyDenied,
          abilityId: abilityDeniedId,
          role: 'editor',
          isEmailVerified: true,
        })
        .returning()
      userDeniedId = userDenied.id

      // Link users to tenant
      await db.insert(usersToTenants).values([
        { userId: userAllowedId, tenantId, role: 'editor' },
        { userId: userDeniedId, tenantId, role: 'editor' },
      ])

      // Test 1: Denied key tries to create folder -> 403 Forbidden
      const deniedRes = await app.request('/api/media/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeyDenied}`,
          'X-Tenant-ID': `${tenantId}`,
        },
        body: JSON.stringify({ name: 'Denied Folder' }),
      })
      expect(deniedRes.status).toBe(403)
      const deniedData = await deniedRes.json()
      expect(deniedData.error).toContain(
        'Create access required for media folder'
      )

      // Test 2: Allowed key creates folder -> 201 Created
      const allowedRes = await app.request('/api/media/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeyAllowed}`,
          'X-Tenant-ID': `${tenantId}`,
        },
        body: JSON.stringify({ name: 'Allowed Folder' }),
      })
      expect(allowedRes.status).toBe(201)
      const allowedData = await allowedRes.json()
      expect(allowedData.success).toBe(true)
      expect(allowedData.folder.name).toBe('Allowed Folder')
      createdFolderId = allowedData.folder.id

      // Test 3: Denied key tries to delete folder -> 403 Forbidden
      const deleteDeniedRes = await app.request(
        `/api/media/folders/${createdFolderId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${apiKeyDenied}`,
            'X-Tenant-ID': `${tenantId}`,
          },
        }
      )
      expect(deleteDeniedRes.status).toBe(403)
      const deleteDeniedData = await deleteDeniedRes.json()
      expect(deleteDeniedData.error).toContain(
        'Delete access required for media folder'
      )

      // Test 4: Allowed key deletes folder -> 200 OK
      const deleteAllowedRes = await app.request(
        `/api/media/folders/${createdFolderId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${apiKeyAllowed}`,
            'X-Tenant-ID': `${tenantId}`,
          },
        }
      )
      expect(deleteAllowedRes.status).toBe(200)
      const deleteAllowedData = await deleteAllowedRes.json()
      expect(deleteAllowedData.success).toBe(true)

      // Test 5: Denied key tries to upload media (no file provided test) -> fails with 403 write permission before file check
      const uploadDeniedRes = await app.request('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKeyDenied}`,
          'X-Tenant-ID': `${tenantId}`,
        },
      })
      expect(uploadDeniedRes.status).toBe(403)
      const uploadDeniedData = await uploadDeniedRes.json()
      expect(uploadDeniedData.error).toContain(
        'Write access required for this action'
      )

      // Test 6: Allowed key tries to upload media with no file -> passes auth check, reaches route logic returning 400 No file provided
      const uploadAllowedRes = await app.request('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKeyAllowed}`,
          'X-Tenant-ID': `${tenantId}`,
        },
      })
      expect(uploadAllowedRes.status).toBe(400)
      const uploadAllowedData = await uploadAllowedRes.json()
      expect(uploadAllowedData.error).toBe('No file provided')
    } finally {
      if (createdFolderId) {
        await db
          .delete(mediaFolders)
          .where(eq(mediaFolders.id, createdFolderId))
          .catch(() => {})
      }
      if (userAllowedId) {
        await db
          .delete(usersToTenants)
          .where(eq(usersToTenants.userId, userAllowedId))
          .catch(() => {})
        await db
          .delete(users)
          .where(eq(users.id, userAllowedId))
          .catch(() => {})
      }
      if (userDeniedId) {
        await db
          .delete(usersToTenants)
          .where(eq(usersToTenants.userId, userDeniedId))
          .catch(() => {})
        await db
          .delete(users)
          .where(eq(users.id, userDeniedId))
          .catch(() => {})
      }
      if (abilityAllowedId) {
        await db
          .delete(abilities)
          .where(eq(abilities.id, abilityAllowedId))
          .catch(() => {})
      }
      if (abilityDeniedId) {
        await db
          .delete(abilities)
          .where(eq(abilities.id, abilityDeniedId))
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
