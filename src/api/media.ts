import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { db } from '../db/index.js'
import { media, mediaFolders, tenants } from '../db/schema.js'
import {
  createCloudinaryFolder,
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from '../lib/cloudinary.js'
import {
  createS3Folder,
  deleteFromS3,
  uploadBufferToS3,
} from '../lib/s3.js'

import { triggerWebhooks } from '../lib/webhooks.js'
import { getWorkspaceFeatures, getWorkspaceStorageUsage } from '../config/features.js'
import { checkPermission } from '../lib/permissions.js'

type Variables = {
  userId?: number
  user?: any
  tenantId: number | null
  currentTenant?: any | null
  tenantRole?: string | null
  authType?: 'api_key' | 'session' | null
}

const apiMedia = new Hono<{ Variables: Variables }>()

// Auth middleware for media routes (supports session cookies and API keys)
apiMedia.use('*', async (c, next) => {
  const user = c.get('user')

  if (user) {
    c.set('userId', user.id)
    return await next()
  }

  // Legacy cookie check fallback
  const getAuthToken = () => {
    try {
      return getCookie(c, 'morphic_token')
    } catch (e) {
      const cookieHeader =
        (c.req.raw as any)?.headers?.['cookie'] ||
        (c.req.raw as any)?.headers?.get?.('cookie')
      if (typeof cookieHeader === 'string') {
        const match = cookieHeader.match(/morphic_token=([^;]+)/)
        return match ? match[1] : undefined
      }
      return undefined
    }
  }

  const token = getAuthToken()
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only'
    const decoded = await verify(token, secret, 'HS256')
    c.set('userId', Number(decoded.id))

    // Detect tenantId from cookie or header
    const cookieTenant = getCookie(c, 'morphic_active_tenant')
    const headerTenant = c.req.header('morphic-tenant-id') || c.req.header('X-Tenant-ID')
    const resolvedTenantId = cookieTenant || headerTenant
    c.set('tenantId', resolvedTenantId ? parseInt(resolvedTenantId, 10) : null)

    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// GET /api/media
// Query params: ?folderId=null  (for root) or ?folderId=123
apiMedia.get('/', async (c) => {
  if (!checkPermission(c, 'media', 'read')) {
    return c.json({ error: 'Forbidden: Read access required for media' }, 403)
  }

  try {
    const tenantId = c.get('tenantId')
    const queryFolderId = c.req.query('folderId')

    let condition = and(
      isNull(mediaFolders.parentId),
      tenantId ? eq(mediaFolders.tenantId, tenantId) : sql`true`
    )
    let mediaCondition = and(
      isNull(media.folderId),
      tenantId ? eq(media.tenantId, tenantId) : sql`true`
    )

    if (queryFolderId && queryFolderId !== 'null') {
      const parsedId = parseInt(queryFolderId, 10)
      if (!isNaN(parsedId)) {
        condition = and(
          eq(mediaFolders.parentId, parsedId),
          tenantId ? eq(mediaFolders.tenantId, tenantId) : sql`true`
        )
        mediaCondition = and(
          eq(media.folderId, parsedId),
          tenantId ? eq(media.tenantId, tenantId) : sql`true`
        )
      }
    }

    // Fetch folders in this level
    const foldersData = await db
      .select({
        folder: mediaFolders,
        tenant: {
          id: tenants.id,
          name: tenants.name,
        },
      })
      .from(mediaFolders)
      .leftJoin(tenants, eq(mediaFolders.tenantId, tenants.id))
      .where(condition)
      .orderBy(desc(mediaFolders.createdAt))

    // Fetch media in this level
    const filesData = await db
      .select({
        file: media,
        tenant: {
          id: tenants.id,
          name: tenants.name,
        },
      })
      .from(media)
      .leftJoin(tenants, eq(media.tenantId, tenants.id))
      .where(mediaCondition)
      .orderBy(desc(media.createdAt))

    return c.json({
      folders: foldersData.map((r) => ({
        ...r.folder,
        tenant: r.tenant?.id ? r.tenant : null,
      })),
      files: filesData.map((r) => ({
        ...r.file,
        tenant: r.tenant?.id ? r.tenant : null,
      })),
    })
  } catch (err) {
    console.error('Error fetching media payload:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/media/folders
apiMedia.post('/folders', async (c) => {
  if (
    !checkPermission(c, 'media_folder', 'create') &&
    !checkPermission(c, 'media_folders', 'create')
  ) {
    return c.json(
      { error: 'Forbidden: Create access required for media folder' },
      403
    )
  }

  try {
    const body = await c.req.json()
    const { name, parentId } = body

    if (!name) {
      return c.json({ error: 'Folder name is required' }, 400)
    }

    const tenantId = c.get('tenantId')
    const newFolder = await db
      .insert(mediaFolders)
      .values({
        name,
        parentId: parentId || null,
        tenantId,
      })
      .returning()

    return c.json({ success: true, folder: newFolder[0] }, 201)
  } catch (err) {
    console.error('Error creating folder:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PUT /api/media/folders/:id
apiMedia.put('/folders/:id', async (c) => {
  if (
    !checkPermission(c, 'media_folder', 'update') &&
    !checkPermission(c, 'media_folder', 'create') &&
    !checkPermission(c, 'media_folders', 'create')
  ) {
    return c.json(
      { error: 'Forbidden: Update access required for media folder' },
      403
    )
  }

  try {
    const tenantId = c.get('tenantId')
    const folderId = parseInt(c.req.param('id'), 10)
    if (isNaN(folderId)) return c.json({ error: 'Invalid folder ID' }, 400)

    const body = await c.req.json()
    const { name, parentId } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (parentId !== undefined) updateData.parentId = parentId

    const whereClause = [eq(mediaFolders.id, folderId)]
    if (tenantId) whereClause.push(eq(mediaFolders.tenantId, tenantId))

    const updated = await db
      .update(mediaFolders)
      .set(updateData)
      .where(and(...whereClause))
      .returning()

    if (updated.length === 0) {
      return c.json({ error: 'Folder not found' }, 404)
    }

    return c.json({ success: true, folder: updated[0] })
  } catch (err) {
    console.error('Error updating folder:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /api/media/folders/:id
apiMedia.delete('/folders/:id', async (c) => {
  if (
    !checkPermission(c, 'media_folder', 'delete') &&
    !checkPermission(c, 'media_folders', 'delete')
  ) {
    return c.json(
      { error: 'Forbidden: Delete access required for media folder' },
      403
    )
  }

  try {
    const tenantId = c.get('tenantId')
    const folderId = parseInt(c.req.param('id'), 10)
    if (isNaN(folderId)) return c.json({ error: 'Invalid folder ID' }, 400)

    const whereClause = [eq(mediaFolders.id, folderId)]
    if (tenantId) whereClause.push(eq(mediaFolders.tenantId, tenantId))

    const deleted = await db
      .delete(mediaFolders)
      .where(and(...whereClause))
      .returning()

    if (deleted.length === 0) {
      return c.json({ error: 'Folder not found' }, 404)
    }

    return c.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting folder:', err)
    if (err.code === '23503') {
      // Foreign key violation
      return c.json(
        { error: 'Cannot delete folder because it is not empty' },
        400
      )
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/media/upload
apiMedia.post('/upload', async (c) => {
  if (!checkPermission(c, 'media', 'create')) {
    return c.json({ error: 'Forbidden: Write access required for this action' }, 403)
  }

  try {
    const tenantId = c.get('tenantId')
    let formData: FormData
    try {
      formData = await c.req.formData()
    } catch (e) {
      return c.json({ error: 'No file provided' }, 400)
    }
    const file = formData.get('file') as File
    const folderId = formData.get('folderId')
      ? parseInt(formData.get('folderId') as string, 10)
      : null

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    const userData = c.get('user')
    if (tenantId && userData?.role !== 'super_admin') {
      const features = await getWorkspaceFeatures(tenantId)

      // Enforce per-file upload size limit
      if (file.size > features.maxUploadSizeBytes) {
        const limitDisplay = features.maxUploadSizeBytes >= 1024 * 1024
          ? `${features.maxUploadSizeBytes / (1024 * 1024)} MB`
          : `${features.maxUploadSizeBytes / 1024} KB`
        return c.json({
          error: `File size exceeds the upload limit of ${limitDisplay} per file on your current plan.`,
        }, 403)
      }

      const currentUsage = await getWorkspaceStorageUsage(tenantId)
      if (currentUsage + file.size > features.maxMediaStorageBytes) {
        const limitMb = Math.round(features.maxMediaStorageBytes / (1024 * 1024))
        return c.json({
          error: `Storage limit reached. You are allowed up to ${limitMb} MB of total storage on your current plan. Please upgrade your workspace plan to upload more files.`,
        }, 403)
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    // Convert the ArrayBuffer to a Buffer for Node.js environments
    const buffer = Buffer.from(arrayBuffer)

    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'morphic-cms'
    let folderPath = uploadPreset

    if (tenantId) {
      const tenantData = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1)
      if (tenantData.length > 0) {
        // Nest the tenant folder inside the preset folder
        folderPath = `${uploadPreset}/${tenantData[0].slug}`
        
        const storageService = process.env.STORAGE_SERVICE?.toUpperCase()
        if (storageService === 'S3') {
          await createS3Folder(folderPath)
        } else {
          // Ensure the nested folder exists via Admin API
          await createCloudinaryFolder(folderPath)
        }
      }
    }

    const storageService = process.env.STORAGE_SERVICE?.toUpperCase()
    let result: any

    if (storageService === 'S3') {
      result = await uploadBufferToS3(buffer, file.name, folderPath, file.type)
    } else {
      result = await uploadBufferToCloudinary(buffer, file.name, folderPath)
    }

    const newMedia = await db
      .insert(media)
      .values({
        filename: file.name,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        assetId: result.asset_id,
        resourceType: result.resource_type,
        format: result.format,
        mimeType: file.type,
        size: result.bytes,
        width: result.width,
        height: result.height,
        folderId: isNaN(folderId as any) ? null : folderId,
        tenantId,
      })
      .returning()

    const mediaItem = newMedia[0]
    
    // Trigger webhooks
    triggerWebhooks(tenantId, 'media.uploaded', { media: mediaItem })

    return c.json({ success: true, media: mediaItem }, 201)
  } catch (err) {
    console.error('Error uploading media:', err)
    return c.json({ error: 'Failed to upload media' }, 500)
  }
})

// DELETE /api/media/:id
apiMedia.delete('/:id', async (c) => {
  if (!checkPermission(c, 'media', 'delete')) {
    return c.json({ error: 'Forbidden: Delete access required for media' }, 403)
  }

  try {
    const mediaId = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')
    if (isNaN(mediaId)) return c.json({ error: 'Invalid media ID' }, 400)

    const whereClause = [eq(media.id, mediaId)]
    if (tenantId) whereClause.push(eq(media.tenantId, tenantId))

    // 1. Fetch from DB first to get publicId
    const item = await db
      .select()
      .from(media)
      .where(and(...whereClause))
      .limit(1)

    if (item.length === 0) {
      return c.json({ error: 'Media not found' }, 404)
    }

    const mediaItem = item[0]

    // 2. Delete from Storage Provider
    const storageService = process.env.STORAGE_SERVICE?.toUpperCase()
    
    if (mediaItem.publicId) {
      if (storageService === 'S3') {
        await deleteFromS3(mediaItem.publicId)
      } else {
        await deleteFromCloudinary(
          mediaItem.publicId,
          mediaItem.resourceType || 'image'
        )
      }
    }

    // 3. Delete from database
    const deleted = await db.delete(media).where(eq(media.id, mediaId)).returning()

    // Trigger webhooks
    if (deleted.length > 0) {
      triggerWebhooks(tenantId, 'media.deleted', { media: deleted[0] })
    }

    return c.json({ success: true })
  } catch (err) {
    console.error('Error deleting media:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PUT /api/media/:id
apiMedia.put('/:id', async (c) => {
  if (
    !checkPermission(c, 'media', 'update') &&
    !checkPermission(c, 'media', 'create')
  ) {
    return c.json({ error: 'Forbidden: Update access required for media' }, 403)
  }

  try {
    const mediaId = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')
    if (isNaN(mediaId)) return c.json({ error: 'Invalid media ID' }, 400)

    const body = await c.req.json()
    const { alt } = body

    const whereClause = [eq(media.id, mediaId)]
    if (tenantId) whereClause.push(eq(media.tenantId, tenantId))

    const updated = await db
      .update(media)
      .set({ alt, updatedAt: new Date() })
      .where(and(...whereClause))
      .returning()

    if (updated.length === 0) {
      return c.json({ error: 'Media not found' }, 404)
    }

    return c.json({ success: true, media: updated[0] })
  } catch (err) {
    console.error('Error updating media:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default apiMedia
