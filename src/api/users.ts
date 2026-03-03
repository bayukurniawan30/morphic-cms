import { Hono } from 'hono';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

type Variables = {
  userId: number;
};

const apiUsers = new Hono<{ Variables: Variables }>();

// Middleware to check super_admin role
apiUsers.use('*', async (c, next) => {
  const token = getCookie(c, 'morphic_token');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    const decoded = await verify(token, secret, "HS256");
    
    if (decoded.role !== 'super_admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Pass user ID to context if needed
    c.set('userId', Number(decoded.id));
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// GET /api/users - List active users
apiUsers.get('/', async (c) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      role: users.role,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt));

    return c.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/users - Create a new user
apiUsers.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, username, password, role } = body;

    if (!email || !username || !password) {
      return c.json({ error: 'Email, username, and password are required' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users).values({
      name,
      email,
      username,
      password: hashedPassword,
      role: role || 'editor'
    }).returning({
      id: users.id,
      email: users.email,
      username: users.username
    });

    return c.json({ success: true, user: newUser[0] }, 201);
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === '23505') { // postgres unique constraint error
      return c.json({ error: 'Email or username already exists' }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/users/:id - Update user
apiUsers.put('/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'), 10);
    if (isNaN(userId)) return c.json({ error: 'Invalid ID' }, 400);

    const body = await c.req.json();
    const { name, email, username, password, role } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (role !== undefined) updateData.role = role;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        role: users.role
      });

    if (updatedUser.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ success: true, user: updatedUser[0] });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      return c.json({ error: 'Email or username already exists' }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/users/:id - Soft Delete User
apiUsers.delete('/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'), 10);
    if (isNaN(userId)) return c.json({ error: 'Invalid ID' }, 400);

    // Prevent deleting self (Optional: depends on requirements)
    const currentUserId = c.get('userId');
    if (currentUserId === userId) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    const deletedUser = await db.update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (deletedUser.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
// POST /api/users/:id/api-key - Generate API Key
apiUsers.post('/:id/api-key', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'), 10);
    if (isNaN(userId)) return c.json({ error: 'Invalid ID' }, 400);

    // Generate a simple secure-looking key
    const newKey = 'mc_' + crypto.randomUUID().replace(/-/g, '');

    const updated = await db.update(users)
      .set({ apiKey: newKey })
      .where(eq(users.id, userId))
      .returning({ apiKey: users.apiKey });

    if (updated.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ success: true, apiKey: updated[0].apiKey });
  } catch (error) {
    console.error('Error generating api key:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/users/:id/api-key - Revoke API Key
apiUsers.delete('/:id/api-key', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'), 10);
    if (isNaN(userId)) return c.json({ error: 'Invalid ID' }, 400);

    const updated = await db.update(users)
      .set({ apiKey: null })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (updated.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error revoking api key:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default apiUsers;
