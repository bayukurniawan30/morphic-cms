import bcrypt from 'bcryptjs'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import { abilities, users } from '../db/schema.js'
import { sendEmail } from '../lib/email.js'

type Variables = {
  user: any
  tenantId: number | null
  tenantRole: string | null
}

const apiUsers = new Hono<{ Variables: Variables }>()

// Middleware is now handled by index.ts, which provides c.get('user'), c.get('tenantId'), and c.get('tenantRole')

// GET /api/users - List active users
apiUsers.get('/', async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')

  try {
    let usersQuery = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        role: users.role,
        abilityId: users.abilityId,
        abilityName: abilities.name,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(abilities, eq(users.abilityId, abilities.id))
      .where(isNull(users.deletedAt))

    if (userData.role !== 'super_admin' && tenantId) {
      // Import usersToTenants if not already available
      const { usersToTenants } = await import('../db/schema.js')
      usersQuery = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          username: users.username,
          role: users.role,
          abilityId: users.abilityId,
          abilityName: abilities.name,
          lastLogin: users.lastLogin,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(abilities, eq(users.abilityId, abilities.id))
        .innerJoin(usersToTenants, eq(users.id, usersToTenants.userId))
        .where(
          and(isNull(users.deletedAt), eq(usersToTenants.tenantId, tenantId))
        ) as any
    }

    const allUsers = await usersQuery.orderBy(desc(users.createdAt))

    return c.json({ users: allUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/users - Create a new user
apiUsers.post('/', async (c) => {
  const userData = c.get('user')
  const tenantId = c.get('tenantId')
  const tenantRole = c.get('tenantRole')

  try {
    const body = await c.req.json()
    const { name, email, username, password, role } = body

    if (!email || !username || !password) {
      return c.json(
        { error: 'Email, username, and password are required' },
        400
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await db.transaction(async (tx) => {
      const u = await tx
        .insert(users)
        .values({
          name,
          email,
          username,
          password: hashedPassword,
          role: userData.role === 'super_admin' ? (role || 'editor') : 'editor',
          abilityId: body.abilityId || null,
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
        })

      // Auto-assign to current tenant if creator is an owner
      if (
        tenantId &&
        (userData.role === 'super_admin' || tenantRole === 'owner')
      ) {
        const { usersToTenants } = await import('../db/schema.js')
        await tx.insert(usersToTenants).values({
          userId: u[0].id,
          tenantId: tenantId,
          role: 'member', // New users start as members
        })
      }

      return u[0]
    })

    if (process.env.RESEND_API_KEY) {
      try {
        const loginUrl = `${process.env.APP_URL || 'http://localhost:5173'}/login`
        await sendEmail({
          to: email,
          subject: 'Welcome to Morphic CMS',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h1 style="color: #87787a; border-bottom: 2px solid #514849; padding-bottom: 10px;">Welcome, ${name}!</h1>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                An account has been created for you on Morphic CMS with the <strong>${role || 'editor'}</strong> role.
              </p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background-color: #514849; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
              </div>
              <p style="font-size: 14px; color: #666;">
                We recommend changing your password after your first login.
              </p>
            </div>
          `,
        })
      } catch (err) {
        console.error('Failed to send welcome email:', err)
      }
    }

    return c.json({ success: true, user: newUser }, 201)
  } catch (error: any) {
    console.error('Error creating user:', error)
    if (error.code === '23505') {
      // postgres unique constraint error
      return c.json({ error: 'Email or username already exists' }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PUT /api/users/:id - Update user
apiUsers.put('/:id', async (c) => {
  const userData = c.get('user')
  try {
    const userId = parseInt(c.req.param('id'), 10)
    if (isNaN(userId)) return c.json({ error: 'Invalid ID' }, 400)

    const body = await c.req.json()
    const { name, email, username, password, role } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (username !== undefined) updateData.username = username

    // Security: Only super_admin can change roles or abilities
    const currentUserRole = userData.role

    // --- Hierarchy Check ---
    const targetUserResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const targetUser = targetUserResult[0]

    if (currentUserRole !== 'super_admin') {
      if (targetUser?.role === 'super_admin') {
        return c.json({ error: 'Forbidden: Cannot edit a Super Admin' }, 403)
      }
      // Non-admins cannot change roles or abilities
    } else {
      if (role !== undefined) updateData.role = role
      if (body.abilityId !== undefined) updateData.abilityId = body.abilityId
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        role: users.role,
        abilityId: users.abilityId,
      })

    if (updatedUser.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ success: true, user: updatedUser[0] })
  } catch (error: any) {
    console.error('Error updating user:', error)
    if (error.code === '23505') {
      return c.json({ error: 'Email or username already exists' }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /api/users/:id - Soft Delete User
apiUsers.delete('/:id', async (c) => {
  const userData = c.get('user')
  try {
    const userId = parseInt(c.req.param('id'), 10)
    if (isNaN(userId)) return c.json({ error: 'Invalid ID' }, 400)

    // Prevent deleting self (Optional: depends on requirements)
    const currentUserId = userData.id
    const currentUserRole = userData.role

    if (currentUserId === userId) {
      return c.json({ error: 'Cannot delete your own account' }, 400)
    }

    // --- Hierarchy Check ---
    const targetUserResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const targetUser = targetUserResult[0]

    if (currentUserRole !== 'super_admin') {
      if (targetUser?.role === 'super_admin') {
        return c.json({ error: 'Forbidden: Cannot delete a Super Admin' }, 403)
      }
    }

    const deletedUser = await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id })

    if (deletedUser.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
// POST /api/users/:id/api-key - Generate API Key
apiUsers.post('/:id/api-key', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'), 10)
    if (isNaN(userId)) return c.json({ error: 'Invalid ID' }, 400)

    // Generate a simple secure-looking key
    const newKey = 'mc_' + crypto.randomUUID().replace(/-/g, '')

    // Get the user to check current ability
    const userRes = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const dbUser = userRes[0]
    if (!dbUser) return c.json({ error: 'User not found' }, 404)

    const updateData: any = { apiKey: newKey }

    // Assign "Read Access" if no ability exists
    if (!dbUser.abilityId) {
      const readAccess = await db
        .select()
        .from(abilities)
        .where(eq(abilities.name, 'Read Access'))
        .limit(1)
      if (readAccess.length > 0) {
        updateData.abilityId = readAccess[0].id
      }
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({ apiKey: users.apiKey })

    return c.json({ success: true, apiKey: updated[0].apiKey })
  } catch (error) {
    console.error('Error generating api key:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /api/users/:id/api-key - Revoke API Key
apiUsers.delete('/:id/api-key', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'), 10)
    if (isNaN(userId)) return c.json({ error: 'Invalid ID' }, 400)

    const updated = await db
      .update(users)
      .set({ apiKey: null })
      .where(eq(users.id, userId))
      .returning({ id: users.id })

    if (updated.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error revoking api key:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default apiUsers
