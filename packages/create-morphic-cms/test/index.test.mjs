import assert from 'node:assert/strict'
import test from 'node:test'
import { buildEnvironment, parseArgs, setEnvValue } from '../src/index.mjs'

test('parses project setup options', () => {
  assert.deepEqual(
    parseArgs([
      'my-cms',
      '--ref',
      'v1.4.1',
      '--database-url',
      'postgres://example',
      '--skip-install',
    ]),
    {
      directory: 'my-cms',
      ref: 'v1.4.1',
      databaseUrl: 'postgres://example',
      adminEmail: '',
      adminPassword: '',
      adminUsername: '',
      appDomain: '',
      skipInstall: true,
      skipDb: false,
      yes: false,
      help: false,
    }
  )
})

test('rejects unknown CLI options', () => {
  assert.throws(() => parseArgs(['my-cms', '--unknown']), /Unknown option/)
})

test('updates environment values without duplicating keys', () => {
  const source = 'DATABASE_URL=\nJWT_SECRET=old\n'
  const environment = buildEnvironment(source, {
    databaseUrl: 'postgres://example',
    appDomain: 'cms.example.com',
    adminEmail: 'admin@example.com',
    adminPassword: 'secure-password',
    adminUsername: 'admin',
  })

  assert.match(environment, /^DATABASE_URL=postgres:\/\/example$/m)
  assert.match(environment, /^APP_DOMAIN=cms.example.com$/m)
  assert.match(environment, /^SEED_ADMIN_EMAIL=admin@example.com$/m)
  assert.equal((environment.match(/^JWT_SECRET=/gm) || []).length, 1)
  assert.equal(setEnvValue('KEY=old\n', 'KEY', 'new'), 'KEY=new\n')
})
