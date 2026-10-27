import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { entries } from '../db/schema.js'
import {
  EntryFilterValidationError,
  entryFilterCondition,
  normalizeExactEntryFilters,
  parseRestExactFilters,
} from './entry-filters.js'

const fields: any[] = [
  {
    id: 'review',
    name: 'is_in_review',
    label: 'In review',
    type: 'select',
    required: false,
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  },
  {
    id: 'featured',
    name: 'featured',
    label: 'Featured',
    type: 'boolean',
    required: false,
  },
  {
    id: 'priority',
    name: 'priority',
    label: 'Priority',
    type: 'radio',
    required: false,
    options: [{ label: 'High', value: 'high' }],
  },
  { id: 'title', name: 'title', label: 'Title', type: 'text', required: false },
]

describe('entry exact filters', () => {
  it('parses and validates select, radio, and boolean REST filters', () => {
    const raw = parseRestExactFilters(
      new URLSearchParams(
        'filter[is_in_review]=Yes&filter[featured]=false&filter[priority]=high'
      )
    )
    expect(normalizeExactEntryFilters(fields, raw)).toEqual([
      { field: 'is_in_review', value: 'Yes' },
      { field: 'featured', value: false },
      { field: 'priority', value: 'high' },
    ])
  })

  it('rejects unknown fields, unsupported types, and invalid select values', () => {
    expect(() =>
      normalizeExactEntryFilters(fields, { missing: 'Yes' })
    ).toThrow(EntryFilterValidationError)
    expect(() => normalizeExactEntryFilters(fields, { title: 123 })).toThrow(
      EntryFilterValidationError
    )
    expect(() =>
      normalizeExactEntryFilters(fields, { is_in_review: 'Maybe' })
    ).toThrow(EntryFilterValidationError)
  })
})

describe('text entry filters', () => {
  it('supports shorthand and explicit case-sensitive equality', () => {
    for (const query of ['filter[title]=Hello', 'filter[title][eq]=Hello']) {
      expect(
        normalizeExactEntryFilters(
          fields,
          parseRestExactFilters(new URLSearchParams(query))
        )
      ).toEqual([{ field: 'title', value: 'Hello' }])
    }
  })

  it('combines contains with existing exact filters', () => {
    expect(
      normalizeExactEntryFilters(
        fields,
        parseRestExactFilters(
          new URLSearchParams(
            'filter[title][icontains]=hello&filter[featured]=true'
          )
        )
      )
    ).toEqual([
      { field: 'title', value: 'hello', operator: 'icontains' },
      { field: 'featured', value: true },
    ])
  })

  it('supports textarea and empty text equality', () => {
    expect(
      normalizeExactEntryFilters(
        [{ ...fields[3], name: 'body', type: 'textarea' }],
        { body: { eq: '' } }
      )
    ).toEqual([{ field: 'body', value: '' }])
  })

  it.each([
    'filter[title][unknown]=hello',
    'filter[title]=a&filter[title]=b',
    'filter[title]=a&filter[title][eq]=b',
    'filter[title][eq]=a&filter[title][icontains]=b',
    'filter[title][nested][eq]=a',
  ])('rejects ambiguous or unsupported REST syntax: %s', (query) => {
    expect(() => parseRestExactFilters(new URLSearchParams(query))).toThrow(
      EntryFilterValidationError
    )
  })

  it.each([
    { title: { contains: 'hello' } },
    { title: { eq: 'a', icontains: 'b' } },
    { title: { icontains: 1 } },
    { title: null },
    { title: ['hello'] },
    { featured: { icontains: 'true' } },
  ])('rejects invalid operators and values: %j', (filters) => {
    expect(() => normalizeExactEntryFilters(fields, filters)).toThrow(
      EntryFilterValidationError
    )
  })

  it('parameterizes SQL and escapes LIKE wildcards as literal characters', () => {
    const query = new PgDialect().sqlToQuery(
      entryFilterCondition(entries.content, {
        field: 'title',
        operator: 'icontains',
        value: "50%_\\ O'Reilly",
      })
    )
    expect(query.sql).toContain('ilike')
    expect(query.sql).toContain('jsonb_typeof')
    expect(query.sql).not.toContain("O'Reilly")
    expect(query.params).toEqual([
      'title',
      'title',
      "%50\\%\\_\\\\ O'Reilly%",
      '\\',
    ])
  })

  it('preserves JSON string type and case for equality', () => {
    const query = new PgDialect().sqlToQuery(
      entryFilterCondition(entries.content, { field: 'title', value: 'Hello' })
    )
    expect(query.sql).toContain('@>')
    expect(query.params).toEqual(['{"title":"Hello"}'])
  })
})

describe('date entry filters', () => {
  const dateFields: any[] = [{ name: 'day', type: 'date' }, ...fields]
  it.each(['filter[day]=2024-02-29', 'filter[day][eq]=2024-02-29'])(
    'supports date equality: %s',
    (query) => {
      expect(
        normalizeExactEntryFilters(
          dateFields,
          parseRestExactFilters(new URLSearchParams(query))
        )
      ).toEqual([{ field: 'day', value: '2024-02-29' }])
    }
  )
  it('supports inclusive ranges and combines them with text', () => {
    expect(
      normalizeExactEntryFilters(
        dateFields,
        parseRestExactFilters(
          new URLSearchParams(
            'filter[day][gte]=2026-10-01&filter[day][lte]=2026-10-31&filter[title]=Hello'
          )
        )
      )
    ).toEqual([
      { field: 'day', value: '2026-10-01', operator: 'gte' },
      { field: 'day', value: '2026-10-31', operator: 'lte' },
      { field: 'title', value: 'Hello' },
    ])
  })
  it.each(['gte', 'lte'] as const)('supports an open-ended %s range', (op) => {
    expect(
      normalizeExactEntryFilters(dateFields, { day: { [op]: '2026-10-25' } })
    ).toEqual([{ field: 'day', value: '2026-10-25', operator: op }])
  })
  it('allows equal boundaries', () => {
    expect(
      normalizeExactEntryFilters(dateFields, {
        day: { gte: '2026-10-25', lte: '2026-10-25' },
      })
    ).toHaveLength(2)
  })
  it.each([
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-01',
    '2026-10-00',
    '0000-01-01',
    '2026-1-01',
    '',
    '2026-10-25T00:00:00Z',
  ])('rejects invalid date %s', (value) => {
    expect(() =>
      normalizeExactEntryFilters(dateFields, { day: value })
    ).toThrow(EntryFilterValidationError)
  })
  it.each([
    { day: { gte: '2026-11-01', lte: '2026-10-01' } },
    { day: { eq: '2026-10-01', gte: '2026-10-01' } },
    { day: { icontains: '2026' } },
    { day: {} },
    { day: null },
    { day: 42 },
    { title: { gte: '2026-10-01' } },
  ])('rejects unsupported date filters %j', (filters) => {
    expect(() => normalizeExactEntryFilters(dateFields, filters)).toThrow(
      EntryFilterValidationError
    )
  })
  it.each([
    'filter[day][gte]=2026-01-01&filter[day][gte]=2026-02-01',
    'filter[day]=2026-01-01&filter[day][lte]=2026-02-01',
    'filter[day][gte]=2026-01-01&filter[day][eq]=2026-02-01',
  ])('rejects duplicate or conflicting REST bounds %s', (query) => {
    expect(() => parseRestExactFilters(new URLSearchParams(query))).toThrow(
      EntryFilterValidationError
    )
  })
  it.each(['gte', 'lte'] as const)(
    'parameterizes %s SQL without casting stored values',
    (operator) => {
      const query = new PgDialect().sqlToQuery(
        entryFilterCondition(entries.content, {
          field: 'day',
          operator,
          value: '2026-10-25',
        })
      )
      expect(query.sql).toContain(operator === 'gte' ? '>=' : '<=')
      expect(query.sql).not.toContain('::date')
      expect(query.params).toContain('2026-10-25')
      expect(query.sql).toContain('jsonb_typeof')
    }
  )
})

describe('relation entry filters', () => {
  const relationFields: any[] = [
    { name: 'category', type: 'relation', relationCollectionId: 7 },
    ...fields,
  ]
  it.each([42, '42', { eq: 42 }, { eq: '42' }])(
    'normalizes relation ID %j',
    (value) => {
      expect(
        normalizeExactEntryFilters(relationFields, { category: value })
      ).toEqual([{ field: 'category', value: 42 }])
    }
  )
  it.each(['filter[category]=42', 'filter[category][eq]=42'])(
    'parses relation REST equality %s',
    (query) => {
      expect(
        normalizeExactEntryFilters(
          relationFields,
          parseRestExactFilters(new URLSearchParams(query))
        )
      ).toEqual([{ field: 'category', value: 42 }])
    }
  )
  it.each([
    0,
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    '',
    '0',
    '-1',
    '1.5',
    '1e2',
    '42oops',
    ' 42 ',
    true,
    null,
    [42],
    { id: 42 },
    { gte: 42 },
    { icontains: '42' },
  ])('rejects invalid relation ID/operator %j', (value) => {
    expect(() =>
      normalizeExactEntryFilters(relationFields, { category: value })
    ).toThrow(EntryFilterValidationError)
  })
  it('uses numeric JSON containment and combines with other filters', () => {
    const filters = normalizeExactEntryFilters(relationFields, {
      category: '42',
      title: { icontains: 'hello' },
    })
    const query = new PgDialect().sqlToQuery(
      entryFilterCondition(entries.content, filters[0])
    )
    expect(query.sql).toContain('@>')
    expect(query.params).toEqual(['{"category":42}'])
    expect(filters[1]).toEqual({
      field: 'title',
      value: 'hello',
      operator: 'icontains',
    })
  })
})
