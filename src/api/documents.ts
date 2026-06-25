import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { db } from '../db/index.js'
import { documents, tenants } from '../db/schema.js'
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
  createCloudinaryFolder,
} from '../lib/cloudinary.js'
import { getWorkspaceFeatures, getWorkspaceStorageUsage } from '../config/features.js'

type Variables = {
  userId?: number
  user?: any
  tenantId: number | null
  currentTenant?: any | null
  tenantRole?: string | null
  authType?: 'api_key' | 'session' | null
}

const apiDocuments = new Hono<{ Variables: Variables }>()

// Auth middleware for document routes (supports session cookies and API keys)
apiDocuments.use('*', async (c, next) => {
  const user = c.get('user')

  if (user) {
    // For write operations, require edit/admin roles
    if (['POST', 'PUT', 'DELETE'].includes(c.req.method)) {
      const isAuthorized =
        user.role === 'super_admin' ||
        c.get('tenantRole') === 'owner'

      if (!isAuthorized) {
        return c.json({ error: 'Forbidden: Write access required for this action' }, 403)
      }
    }

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

// GET /api/documents
apiDocuments.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100)
    const search = c.req.query('search') || ''
    const sortBy = c.req.query('sortBy') || 'createdAt'
    const sortDir = c.req.query('sortDir') || 'desc'
    const offset = (page - 1) * limit

    const conditions: any[] = []
    if (search) {
      conditions.push(ilike(documents.filename, `%${search}%`))
    }
    if (tenantId) {
      conditions.push(eq(documents.tenantId, tenantId))
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(documents)
      .where(whereClause)

    const totalCount = Number(countResult[0].count)
    const totalPages = Math.ceil(totalCount / limit)

    let orderClause = desc(documents.createdAt)
    if (sortBy === 'createdAt') {
      orderClause = sortDir === 'asc' ? asc(documents.createdAt) : desc(documents.createdAt)
    } else if (sortBy === 'filename') {
      orderClause = sortDir === 'asc' ? asc(documents.filename) : desc(documents.filename)
    } else if (sortBy === 'size') {
      orderClause = sortDir === 'asc' ? asc(documents.size) : desc(documents.size)
    }

    const filesQuery = db
      .select()
      .from(documents)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset)

    if (whereClause) {
      filesQuery.where(whereClause)
    }

    const files = await filesQuery

    return c.json({
      files,
      pagination: { currentPage: page, totalPages, totalCount, limit },
    })
  } catch (err) {
    console.error('Error fetching documents:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/documents/upload
apiDocuments.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    const userData = c.get('user')
    const tenantId = c.get('tenantId')
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

    const allowedExtensions = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
    ]
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return c.json(
        { error: 'Invalid file type. Allowed: PDF, Word, Excel, PPT, TXT' },
        400
      )
    }

    const arrayBuffer = await file.arrayBuffer()
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

    // Upload to Cloudinary
    const result = await uploadBufferToCloudinary(buffer, file.name, folderPath)

    const newDoc = await db
      .insert(documents)
      .values({
        filename: file.name,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        assetId: result.asset_id,
        resourceType: result.resource_type,
        format: result.format,
        mimeType: file.type,
        size: result.bytes,
        tenantId,
      })
      .returning()

    return c.json({ success: true, document: newDoc[0] }, 201)
  } catch (err) {
    console.error('Error uploading document:', err)
    return c.json({ error: 'Failed to upload document' }, 500)
  }
})

// DELETE /api/documents/:id
apiDocuments.delete('/:id', async (c) => {
  try {
    const docId = parseInt(c.req.param('id'), 10)
    const tenantId = c.get('tenantId')
    if (isNaN(docId)) return c.json({ error: 'Invalid doc ID' }, 400)

    const whereClause = [eq(documents.id, docId)]
    if (tenantId) whereClause.push(eq(documents.tenantId, tenantId))

    // 1. Fetch from DB first
    const item = await db
      .select()
      .from(documents)
      .where(and(...whereClause))
      .limit(1)

    if (item.length === 0) {
      return c.json({ error: 'Document not found' }, 404)
    }

    const docItem = item[0]

    // 2. Delete from Cloudinary
    if (docItem.publicId) {
      await deleteFromCloudinary(
        docItem.publicId,
        docItem.resourceType || 'raw'
      )
    }

    // 3. Delete from database
    await db.delete(documents).where(eq(documents.id, docId))

    return c.json({ success: true })
  } catch (err) {
    console.error('Error deleting document:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default apiDocuments
