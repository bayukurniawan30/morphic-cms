import { describe, expect, it } from 'vitest'
import {
  EntryFilterValidationError,
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
    expect(() =>
      normalizeExactEntryFilters(fields, { title: 'Hello' })
    ).toThrow(EntryFilterValidationError)
    expect(() =>
      normalizeExactEntryFilters(fields, { is_in_review: 'Maybe' })
    ).toThrow(EntryFilterValidationError)
  })
})
