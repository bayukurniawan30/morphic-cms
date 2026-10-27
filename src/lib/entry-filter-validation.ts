import type { FieldDefinition } from './dynamic-schema.js'

export type ExactEntryFilter = {
  field: string
  operator?: 'icontains' | 'gte' | 'lte'
  value: string | boolean | number
}

export class EntryFilterValidationError extends Error {}

const TEXT_TYPES = new Set(['text', 'textarea'])
const FILTERABLE_TYPES = new Set([
  'select',
  'radio',
  'boolean',
  'date',
  'relation',
  ...TEXT_TYPES,
])
const FIELD_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

/** Strict Gregorian date-only validation without timezone conversion. */
function isDateOnly(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith('0000')
  )
    return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

/** Parses equality shorthand and explicit text/date operators. */
export function parseRestExactFilters(
  searchParams: URLSearchParams
): Record<string, unknown> {
  const filters: Record<string, unknown> = Object.create(null)

  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('filter[')) continue
    const match = key.match(
      /^filter\[([A-Za-z][A-Za-z0-9_]*)\](?:\[(eq|icontains|gte|lte)\])?$/
    )
    if (!match)
      throw new EntryFilterValidationError(`Invalid filter parameter "${key}"`)
    const [, field, operator] = match
    if (Object.prototype.hasOwnProperty.call(filters, field)) {
      const existing = filters[field]
      if (
        operator &&
        (operator === 'gte' || operator === 'lte') &&
        existing !== null &&
        typeof existing === 'object' &&
        Object.keys(existing).every((key) => key === 'gte' || key === 'lte') &&
        !Object.prototype.hasOwnProperty.call(existing, operator)
      ) {
        filters[field] = { ...existing, [operator]: value }
        continue
      }
      throw new EntryFilterValidationError(
        `Duplicate or conflicting filter for "${field}"`
      )
    }
    filters[field] = operator ? { [operator]: value } : value
  }
  return filters
}

/**
 * Validates and normalizes entry filters against a collection's field schema.
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

  for (const [fieldName, inputValue] of Object.entries(rawFilters)) {
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

    if (field.type === 'date') {
      const operations =
        typeof inputValue === 'string' ? { eq: inputValue } : inputValue
      if (
        !operations ||
        typeof operations !== 'object' ||
        Array.isArray(operations)
      ) {
        throw new EntryFilterValidationError(
          `Date filter "${fieldName}" must be a date or operator object`
        )
      }
      const pairs = Object.entries(operations)
      if (
        !pairs.length ||
        pairs.some(([op]) => !['eq', 'gte', 'lte'].includes(op)) ||
        (pairs.length > 1 &&
          Object.prototype.hasOwnProperty.call(operations, 'eq'))
      ) {
        throw new EntryFilterValidationError(
          `Date filter "${fieldName}" supports eq or gte/lte`
        )
      }
      for (const [, value] of pairs) {
        if (!isDateOnly(value)) {
          throw new EntryFilterValidationError(
            `Date filter "${fieldName}" must use a valid YYYY-MM-DD date`
          )
        }
      }
      const bounds = operations as Record<string, string>
      if (bounds.gte && bounds.lte && bounds.gte > bounds.lte) {
        throw new EntryFilterValidationError(
          `Date filter "${fieldName}" start must not exceed end`
        )
      }
      for (const [op, value] of pairs) {
        filters.push(
          op === 'eq'
            ? { field: fieldName, value: value as string }
            : {
                field: fieldName,
                value: value as string,
                operator: op as 'gte' | 'lte',
              }
        )
      }
      continue
    }

    let rawValue = inputValue
    let operator = 'eq'
    if (
      rawValue !== null &&
      typeof rawValue === 'object' &&
      !Array.isArray(rawValue)
    ) {
      const operations = Object.entries(rawValue)
      if (
        operations.length !== 1 ||
        !['eq', 'icontains'].includes(operations[0][0])
      ) {
        throw new EntryFilterValidationError(
          `Filter "${fieldName}" must have one supported operator`
        )
      }
      ;[operator, rawValue] = operations[0]
    }
    if (operator === 'icontains' && !TEXT_TYPES.has(field.type)) {
      throw new EntryFilterValidationError(
        `icontains is only supported for text fields`
      )
    }
    if (field.type === 'relation') {
      const id =
        typeof rawValue === 'string' && /^[0-9]+$/.test(rawValue)
          ? Number(rawValue)
          : rawValue
      if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
        throw new EntryFilterValidationError(
          `Relation filter "${fieldName}" must be a positive integer entry ID`
        )
      }
      filters.push({ field: fieldName, value: id })
      continue
    }

    if (TEXT_TYPES.has(field.type)) {
      if (typeof rawValue !== 'string') {
        throw new EntryFilterValidationError(
          `Filter "${fieldName}" must be a string`
        )
      }
      filters.push(
        operator === 'icontains'
          ? { field: fieldName, value: rawValue, operator: 'icontains' }
          : { field: fieldName, value: rawValue }
      )
      continue
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
