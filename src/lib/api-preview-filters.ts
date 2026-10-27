import type { FieldDefinition } from './dynamic-schema.js'
import {
  normalizeExactEntryFilters,
  parseRestExactFilters,
} from './entry-filter-validation.js'

export type PreviewFilter = {
  field: string
  operator: 'eq' | 'icontains' | 'range'
  value: string
  end: string
}
export type PreviewField = {
  name: string
  type: string
  multiple?: boolean
  label?: string
  options?: { label: string; value: string }[]
}
export const previewFilterFields = (fields: PreviewField[]) =>
  fields.filter(
    (field) =>
      /^[A-Za-z][A-Za-z0-9_]*$/.test(field.name) &&
      [
        'text',
        'textarea',
        'date',
        'relation',
        'boolean',
        'select',
        'radio',
      ].includes(field.type) &&
      !(field.type === 'select' && field.multiple)
  )

/** Use the API's validator so preview URLs and GraphQL have the same typed values. */
export function buildPreviewFilters(
  fields: PreviewField[],
  rows: PreviewFilter[]
) {
  const params = new URLSearchParams()
  for (const row of rows) {
    if (row.operator === 'range') {
      if (!row.value && !row.end)
        throw new Error('Enter at least one date boundary.')
      if (row.value) params.append(`filter[${row.field}][gte]`, row.value)
      if (row.end) params.append(`filter[${row.field}][lte]`, row.end)
    } else {
      params.append(`filter[${row.field}][${row.operator}]`, row.value)
    }
  }
  const normalized = normalizeExactEntryFilters(
    fields as FieldDefinition[],
    parseRestExactFilters(params)
  )
  const filters: Record<string, unknown> = Object.create(null)
  for (const filter of normalized) {
    if (filter.operator) {
      filters[filter.field] = {
        ...((filters[filter.field] as object) || {}),
        [filter.operator]: filter.value,
      }
    } else filters[filter.field] = filter.value
  }
  return { params: params.toString(), filters }
}

export function graphqlPreviewFilters(
  filters: Record<string, unknown>
): string {
  const render = (value: unknown): string =>
    value !== null && typeof value === 'object'
      ? `{ ${Object.entries(value)
          .map(([key, child]) => `${key}: ${render(child)}`)
          .join(', ')} }`
      : JSON.stringify(value)
  return Object.keys(filters).length ? `, filters: ${render(filters)}` : ''
}
