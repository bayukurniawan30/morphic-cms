import { parse } from 'graphql'
import { describe, expect, it } from 'vitest'
import {
  buildPreviewFilters,
  graphqlPreviewFilters,
  previewFilterFields,
  type PreviewFilter,
} from './api-preview-filters'

const fields = [
  { name: 'title', type: 'text' },
  { name: 'body', type: 'textarea' },
  { name: 'day', type: 'date' },
  { name: 'category', type: 'relation' },
  { name: 'featured', type: 'boolean' },
  {
    name: 'status',
    type: 'select',
    options: [{ label: 'Live', value: 'live' }],
  },
  { name: 'tags', type: 'select', multiple: true },
  { name: 'price', type: 'number' },
  { name: 'group', type: 'group' },
  { name: 'group.title', type: 'text' },
]
const row = (
  field: string,
  value: string,
  operator: PreviewFilter['operator'] = 'eq',
  end = ''
): PreviewFilter => ({ field, value, operator, end })

describe('API preview filters', () => {
  it('only offers API-filterable top-level fields', () => {
    expect(previewFilterFields(fields).map((field) => field.name)).toEqual([
      'title',
      'body',
      'day',
      'category',
      'featured',
      'status',
    ])
  })
  it('encodes special text safely in REST and GraphQL while preserving numeric/boolean types', () => {
    const value = 'Hi "there" & 50%_ \\ newline\n世界'
    const result = buildPreviewFilters(fields, [
      row('title', value, 'icontains'),
      row('category', '42'),
      row('featured', 'false'),
    ])
    expect(
      new URLSearchParams(result.params).get('filter[title][icontains]')
    ).toBe(value)
    expect(result.filters).toEqual({
      title: { icontains: value },
      category: 42,
      featured: false,
    })
    const query = `query { entries(collectionSlug: "posts"${graphqlPreviewFilters(result.filters)}) { id } }`
    expect(() => parse(query)).not.toThrow()
    expect(query).toContain('category: 42')
    expect(query).toContain('featured: false')
  })
  it('keeps both inclusive bounds in REST and GraphQL', () => {
    const result = buildPreviewFilters(fields, [
      row('day', '2026-10-01', 'range', '2026-10-31'),
    ])
    expect(new URLSearchParams(result.params).get('filter[day][gte]')).toBe(
      '2026-10-01'
    )
    expect(new URLSearchParams(result.params).get('filter[day][lte]')).toBe(
      '2026-10-31'
    )
    expect(result.filters).toEqual({
      day: { gte: '2026-10-01', lte: '2026-10-31' },
    })
  })
  it.each([
    ['2026-10-01', '', { gte: '2026-10-01' }],
    ['', '2026-10-31', { lte: '2026-10-31' }],
  ])('supports open-ended ranges %s %s', (start, end, expected) => {
    expect(
      buildPreviewFilters(fields, [
        row('day', start as string, 'range', end as string),
      ]).filters.day
    ).toEqual(expected)
  })
  it.each([
    [row('day', '', 'range')],
    [row('day', '2026-11-01', 'range', '2026-10-01')],
    [row('day', '2026-02-29')],
    [row('category', 'abc')],
    [row('status', 'unknown')],
    [row('title', 'a'), row('title', 'b')],
    [row('price', '4')],
  ])(
    'rejects invalid selections using shared API validation: %j',
    (...rows) => {
      expect(() => buildPreviewFilters(fields, rows)).toThrow()
    }
  )
  it('clears REST and GraphQL filters completely', () => {
    const result = buildPreviewFilters(fields, [])
    expect(result.params).toBe('')
    expect(result.filters).toEqual({})
    expect(graphqlPreviewFilters(result.filters)).toBe('')
  })
})
