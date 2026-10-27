import { expect, it } from 'vitest'
import app from '../index'

it('should return 404 for unknown routes (when authenticated)', async () => {
  const res = await app.request('/api/unknown-route', {
    headers: { 'X-Morphic-Test': 'true' },
  })
  expect(res.status).toBe(404)
})

it('should return 200 for the landing page (/)', async () => {
  const res = await app.request('/')
  expect(res.status).toBe(200)
})

it('should return 200 for the docs page (/docs)', async () => {
  const res = await app.request('/docs')
  expect(res.status).toBe(200)
})
