import { describe, expect, it } from 'vitest'
import app from './index'

describe('Morphic CMS API', () => {
  it('should return 404 for unknown routes (when authenticated)', async () => {
    const res = await app.request('/api/unknown-route', {
      headers: { 'X-Morphic-Test': 'true' }
    })
    expect(res.status).toBe(404)
  })

  it('should redirect unauthenticated requests to login (without bypass)', async () => {
    // Note: Inertia routes usually redirect, but /api/ routes might return 401
    // depending on which middleware hits first. 
    const res = await app.request('/api/collections')
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should block access if X-Tenant-ID is missing (when bypass is active)', async () => {
    // Hit GraphQL with bypass but WITHOUT tenant ID
    const res = await app.request('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Morphic-Test': 'true'
      },
      body: JSON.stringify({ query: '{ collections { id } }' }),
    })
    
    // Should hit our new security logic (403 Forbidden)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('X-Tenant-ID header is required')
  })
})
