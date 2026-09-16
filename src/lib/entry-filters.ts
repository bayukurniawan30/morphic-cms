import type { FieldDefinition } from './dynamic-schema.js'

export type ExactEntryFilter = {
  field: string
  value: string | boolean
}

export class EntryFilterValidationError extends Error {}

const FILTERABLE_TYPES = new Set(['select', 'radio', 'boolean'])
const FIELD_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

/**
 * Parses REST filters in the form `filter[field_name]=value`.
 * Values are intentionally limited to one value per field because this API
 * currently supports exact matching only.
 */
export function parseRestExactFilters(
  searchParams: URLSearchParams
): Record<string, string> {
  const filters: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    const match = key.match(/^filter\[([A-Za-z][A-Za-z0-9_]*)\]$/)
    if (!match) continue

    const field = match[1]
    if (field in filters) {
      throw new EntryFilterValidationError(
        `Only one exact filter value is allowed for "${field}"`
      )
    }
    filters[field] = value
  }

  return filters
}

/**
 * Validates and normalizes exact filters against a collection's field schema.
 * Keeping this allow-listed prevents arbitrary JSON paths or unsupported field
 * types from becoming part of the public query API.
 */
export function normalizeExactEntryFilters(
  fields: FieldDefinition[],
  rawFilters: Record<string, unknown> | null | undefined
): ExactEntryFilter[] {
  if (!rawFilters) return []
  if (typeof rawFilters !== 'object' || Array.isArray(rawFilters)) {
    throw new EntryFilterValidationError('filters must be an object')
  }

  const definitions = new Map(fields.map((field) => [field.name, field]))
  const filters: ExactEntryFilter[] = []

  for (const [fieldName, rawValue] of Object.entries(rawFilters)) {
    if (!FIELD_NAME_PATTERN.test(fieldName)) {
      throw new EntryFilterValidationError(
        `Invalid filter field name "${fieldName}"`
      )
    }

    const field = definitions.get(fieldName)
    if (!field) {
      throw new EntryFilterValidationError(
        `Unknown filter field "${fieldName}"`
      )
    }
    if (
      !FILTERABLE_TYPES.has(field.type) ||
      (field.type === 'select' && field.multiple)
    ) {
      throw new EntryFilterValidationError(
        `Exact filtering is not supported for field "${fieldName}"`
      )
    }

    if (field.type === 'boolean') {
      if (rawValue === true || rawValue === 'true') {
        filters.push({ field: fieldName, value: true })
      } else if (rawValue === false || rawValue === 'false') {
        filters.push({ field: fieldName, value: false })
      } else {
        throw new EntryFilterValidationError(
          `Boolean filter "${fieldName}" must be true or false`
        )
      }
      continue
    }

    if (typeof rawValue !== 'string') {
      throw new EntryFilterValidationError(
        `Filter "${fieldName}" must be a string`
      )
    }

    const options = field.options?.map((option) => option.value) || []
    if (!options.includes(rawValue)) {
      throw new EntryFilterValidationError(
        `Invalid value for filter "${fieldName}"`
      )
    }
    filters.push({ field: fieldName, value: rawValue })
  }

  return filters
}
