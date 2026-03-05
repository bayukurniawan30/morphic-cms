import { Hono } from 'hono';
import { db } from '../db/index.js';
import { documents } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { uploadBufferToCloudinary } from '../lib/cloudinary.js';

type Variables = {
  userId: number;
};

const apiDocuments = new Hono<{ Variables: Variables }>();

// Simple auth middleware for document routes
apiDocuments.use('*', async (c, next) => {
  const getAuthToken = () => {
    try {
      return getCookie(c, 'morphic_token');
    } catch (e) {
      const cookieHeader = (c.req.raw as any)?.headers?.['cookie'] || (c.req.raw as any)?.headers?.get?.('cookie');
      if (typeof cookieHeader === 'string') {
        const match = cookieHeader.match(/morphic_token=([^;]+)/);
        return match ? match[1] : undefined;
      }
      return undefined;
    }
  };

  const token = getAuthToken();
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    const decoded = await verify(token, secret, "HS256");
    c.set('userId', Number(decoded.id));
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// GET /api/documents
apiDocuments.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const countResult = await db.select({ count: sql`count(*)` }).from(documents);
    const totalCount = Number(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const files = await db.select()
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({ 
      files,
      pagination: { currentPage: page, totalPages, totalCount, limit }
    });
  } catch (err) {
    console.error('Error fetching documents:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/documents/upload
apiDocuments.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'morphic-cms';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return c.json({ error: 'Invalid file type. Allowed: PDF, Word, Excel, PPT, TXT' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await uploadBufferToCloudinary(buffer, uploadPreset, file.name);

    const newDoc = await db.insert(documents).values({
      filename: file.name,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      mimeType: file.type,
      size: result.bytes,
    }).returning();

    return c.json({ success: true, document: newDoc[0] }, 201);
  } catch (err) {
    console.error('Error uploading document:', err);
    return c.json({ error: 'Failed to upload document' }, 500);
  }
});

// DELETE /api/documents/:id
apiDocuments.delete('/:id', async (c) => {
  try {
    const docId = parseInt(c.req.param('id'), 10);
    if (isNaN(docId)) return c.json({ error: 'Invalid doc ID' }, 400);

    const deleted = await db.delete(documents).where(eq(documents.id, docId)).returning();
    
    if (deleted.length === 0) {
       return c.json({ error: 'Document not found' }, 404);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Error deleting document:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default apiDocuments;
