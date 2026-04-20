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

type Variables = {
  userId: number
  tenantId: number | null
}

const apiMedia = new Hono<{ Variables: Variables }>()

// Simple auth middleware for media routes
// For now, require login (could restrict to editor/admin if needed)
apiMedia.use('*', async (c, next) => {
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
    const headerTenant = c.req.header('morphic-tenant-id')
    const tenantId = cookieTenant || headerTenant
    c.set('tenantId', tenantId ? parseInt(tenantId, 10) : null)

    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// GET /api/media
// Query params: ?folderId=null  (for root) or ?folderId=123
apiMedia.get('/', async (c) => {
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
    const folders = await db
      .select()
      .from(mediaFolders)
      .where(condition)
      .orderBy(desc(mediaFolders.createdAt))

    // Fetch media in this level
    const files = await db
      .select()
      .from(media)
      .where(mediaCondition)
      .orderBy(desc(media.createdAt))

    return c.json({ folders, files })
  } catch (err) {
    console.error('Error fetching media payload:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/media/folders
apiMedia.post('/folders', async (c) => {
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
  try {
    const tenantId = c.get('tenantId')
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId')
      ? parseInt(formData.get('folderId') as string, 10)
      : null

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
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
        // Ensure the nested folder exists via Admin API
        await createCloudinaryFolder(folderPath)
      }
    }

    // Pass the buffer, original filename, and the combined path
    const result = await uploadBufferToCloudinary(buffer, file.name, folderPath)

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

    return c.json({ success: true, media: newMedia[0] }, 201)
  } catch (err) {
    console.error('Error uploading media:', err)
    return c.json({ error: 'Failed to upload media' }, 500)
  }
})

// DELETE /api/media/:id
apiMedia.delete('/:id', async (c) => {
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

    // 2. Delete from Cloudinary
    if (mediaItem.publicId) {
      await deleteFromCloudinary(
        mediaItem.publicId,
        mediaItem.resourceType || 'image'
      )
    }

    // 3. Delete from database
    await db.delete(media).where(eq(media.id, mediaId))

    return c.json({ success: true })
  } catch (err) {
    console.error('Error deleting media:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default apiMedia
