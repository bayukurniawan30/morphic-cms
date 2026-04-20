import { and, desc, eq, ilike, sql } from 'drizzle-orm'
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

type Variables = {
  userId: number
  tenantId: number | null
}

const apiDocuments = new Hono<{ Variables: Variables }>()

// Simple auth middleware for document routes
apiDocuments.use('*', async (c, next) => {
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

// GET /api/documents
apiDocuments.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = parseInt(c.req.query('limit') || '10', 10)
    const search = c.req.query('search') || ''
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

    const filesQuery = db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt))
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

    const tenantId = c.get('tenantId')
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
