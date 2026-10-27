import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import type { FieldDefinition } from './dynamic-schema.js'
import { entryOrderBy, EntrySortValidationError } from './entry-sorting.js'

const fields = ['number', 'text', 'email', 'date', 'boolean'].map((type) => ({
  name: type,
  type,
})) as FieldDefinition[]
const dialect = new PgDialect()

describe('entry sorting', () => {
  it('defaults to creation date descending with ID as a stable tie-breaker', () => {
    const order = entryOrderBy(fields)
    expect(dialect.sqlToQuery(order[0]).sql).toContain('"created_at" desc')
    expect(dialect.sqlToQuery(order[1]).sql).toContain('"id" asc')
  })
  it.each(['asc', 'desc'])('preserves system ID sorting %s', (direction) => {
    expect(
      dialect.sqlToQuery(entryOrderBy(fields, 'id', direction)[0]).sql
    ).toContain(`"id" ${direction}`)
  })
  it.each(['number', 'text', 'email', 'date', 'boolean'])(
    'supports only top-level %s values with NULLS LAST',
    (field) => {
      const order = entryOrderBy(fields, field, 'asc')
      const query = dialect.sqlToQuery(order[0])
      expect(query.sql).toContain('asc nulls last')
      expect(query.sql).toContain('jsonb_typeof')
      expect(query.params).toContain(field)
      expect(dialect.sqlToQuery(order[1]).sql).toContain('"id" asc')
    }
  )
  it('sorts numbers numerically and booleans by their type', () => {
    expect(dialect.sqlToQuery(entryOrderBy(fields, 'number')[0]).sql).toContain(
      '::numeric'
    )
    expect(
      dialect.sqlToQuery(entryOrderBy(fields, 'boolean')[0]).sql
    ).toContain('::boolean')
  })
  it.each(['text', 'email'])('uses case-insensitive %s sorting', (field) => {
    expect(dialect.sqlToQuery(entryOrderBy(fields, field)[0]).sql).toContain(
      'lower(nullif('
    )
  })
  it.each([
    'textarea',
    'slug',
    'datetime',
    'time',
    'select',
    'radio',
    'relation',
    'media',
    'documents',
    'rich-text',
    'array',
    'group',
    'checkbox',
  ])('rejects unsupported type %s', (type) => {
    expect(() =>
      entryOrderBy([{ name: 'field', type } as FieldDefinition], 'field')
    ).toThrow(EntrySortValidationError)
  })
  it.each(['missing', 'group.name', "name'); DROP TABLE entries;--", ''])(
    'rejects unknown or unsafe field %s',
    (field) => {
      expect(() => entryOrderBy(fields, field)).toThrow(
        EntrySortValidationError
      )
    }
  )
  it.each(['ASC', 'invalid', ''])(
    'rejects invalid direction %s',
    (direction) => {
      expect(() => entryOrderBy(fields, 'text', direction)).toThrow(
        EntrySortValidationError
      )
    }
  )
  it('rejects multiple fields and gives system names precedence', () => {
    expect(() =>
      entryOrderBy(
        [{ name: 'field', type: 'text', multiple: true } as FieldDefinition],
        'field'
      )
    ).toThrow(EntrySortValidationError)
    expect(
      dialect.sqlToQuery(
        entryOrderBy([{ name: 'id', type: 'text' } as FieldDefinition], 'id')[0]
      ).sql
    ).toContain('"entries"."id"')
  })
})
