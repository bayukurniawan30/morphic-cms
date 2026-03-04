import { Hono } from 'hono';
import { db } from '../db/index.js';
import { media, mediaFolders } from '../db/schema.js';
import { eq, isNull, and, desc } from 'drizzle-orm';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

type Variables = {
  userId: number;
};

const apiMedia = new Hono<{ Variables: Variables }>();

// Simple auth middleware for media routes
// For now, require login (could restrict to editor/admin if needed)
apiMedia.use('*', async (c, next) => {
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

// GET /api/media
// Query params: ?folderId=null  (for root) or ?folderId=123
apiMedia.get('/', async (c) => {
  try {
    const queryFolderId = c.req.query('folderId');
    let condition = isNull(mediaFolders.parentId);
    let mediaCondition = isNull(media.folderId);

    if (queryFolderId && queryFolderId !== 'null') {
      const parsedId = parseInt(queryFolderId, 10);
      if (!isNaN(parsedId)) {
        condition = eq(mediaFolders.parentId, parsedId);
        mediaCondition = eq(media.folderId, parsedId);
      }
    }

    // Fetch folders in this level
    const folders = await db.select()
      .from(mediaFolders)
      .where(condition)
      .orderBy(desc(mediaFolders.createdAt));

    // Fetch media in this level
    const files = await db.select()
      .from(media)
      .where(mediaCondition)
      .orderBy(desc(media.createdAt));

    return c.json({ folders, files });
  } catch (err) {
    console.error('Error fetching media payload:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/media/folders
apiMedia.post('/folders', async (c) => {
  try {
    const body = await c.req.json();
    const { name, parentId } = body;

    if (!name) {
      return c.json({ error: 'Folder name is required' }, 400);
    }

    const newFolder = await db.insert(mediaFolders).values({
      name,
      parentId: parentId || null
    }).returning();

    return c.json({ success: true, folder: newFolder[0] }, 201);
  } catch (err) {
    console.error('Error creating folder:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/media/folders/:id
apiMedia.put('/folders/:id', async (c) => {
  try {
    const folderId = parseInt(c.req.param('id'), 10);
    if (isNaN(folderId)) return c.json({ error: 'Invalid folder ID' }, 400);

    const body = await c.req.json();
    const { name, parentId } = body;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId;

    const updated = await db.update(mediaFolders)
      .set(updateData)
      .where(eq(mediaFolders.id, folderId))
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'Folder not found' }, 404);
    }

    return c.json({ success: true, folder: updated[0] });
  } catch (err) {
    console.error('Error updating folder:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/media/folders/:id
apiMedia.delete('/folders/:id', async (c) => {
  try {
    const folderId = parseInt(c.req.param('id'), 10);
    if (isNaN(folderId)) return c.json({ error: 'Invalid folder ID' }, 400);

    // TODO: Verify if the folder is empty or cascading delete is handled safely
    // Drizzle currently doesn't cascade automatically unless defined in Postgres schema.
    // For now, let's just attempt delete, which will fail if there are dependent rows unless ON DELETE CASCADE is set.

    const deleted = await db.delete(mediaFolders).where(eq(mediaFolders.id, folderId)).returning();
    
    if (deleted.length === 0) {
       return c.json({ error: 'Folder not found' }, 404);
    }

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting folder:', err);
    if (err.code === '23503') { // Foreign key violation
       return c.json({ error: 'Cannot delete folder because it is not empty' }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

import { uploadBufferToCloudinary } from '../lib/cloudinary.js';

// POST /api/media/upload
apiMedia.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') ? parseInt(formData.get('folderId') as string, 10) : null;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'morphic-cms';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    // Convert the ArrayBuffer to a Buffer for Node.js environments
    const buffer = Buffer.from(arrayBuffer);

    // Pass the buffer and original filename to the Cloudinary utility
    const result = await uploadBufferToCloudinary(buffer, uploadPreset, file.name);

    const newMedia = await db.insert(media).values({
      filename: file.name,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      mimeType: file.type,
      size: result.bytes,
      width: result.width,
      height: result.height,
      folderId: isNaN(folderId as any) ? null : folderId,
    }).returning();

    return c.json({ success: true, media: newMedia[0] }, 201);
  } catch (err) {
    console.error('Error uploading media:', err);
    return c.json({ error: 'Failed to upload media' }, 500);
  }
});

// DELETE /api/media/:id
apiMedia.delete('/:id', async (c) => {
  try {
    const mediaId = parseInt(c.req.param('id'), 10);
    if (isNaN(mediaId)) return c.json({ error: 'Invalid media ID' }, 400);

    // Delete from database
    const deleted = await db.delete(media).where(eq(media.id, mediaId)).returning();
    
    if (deleted.length === 0) {
       return c.json({ error: 'Media not found' }, 404);
    }

    // TODO: Optionally delete from Cloudinary if API Secret is provided
    // For now, only deleting from DB as requested/implied.

    return c.json({ success: true });
  } catch (err) {
    console.error('Error deleting media:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default apiMedia;
