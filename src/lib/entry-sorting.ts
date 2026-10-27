import { asc, desc, sql } from 'drizzle-orm'
import { entries } from '../db/schema.js'
import type { FieldDefinition } from './dynamic-schema.js'

export class EntrySortValidationError extends Error {}

const SORTABLE_TYPES = new Set(['number', 'text', 'email', 'date', 'boolean'])

/** Sort stored content before pagination. System field names take precedence. */
export function entryOrderBy(
  fields: FieldDefinition[],
  sortBy?: string | null,
  sortDir?: string | null
) {
  if (sortDir != null && sortDir !== 'asc' && sortDir !== 'desc') {
    throw new EntrySortValidationError('sortDir must be asc or desc')
  }
  const direction = sortDir === 'asc' ? asc : desc
  const fieldName = sortBy ?? 'createdAt'
  if (fieldName === 'id') return [direction(entries.id)]
  if (fieldName === 'createdAt')
    return [direction(entries.createdAt), asc(entries.id)]

  const field = fields.find((field) => field.name === fieldName)
  if (
    !/^[A-Za-z][A-Za-z0-9_]*$/.test(fieldName) ||
    !field ||
    !SORTABLE_TYPES.has(field.type) ||
    field.multiple
  ) {
    throw new EntrySortValidationError(
      `Sorting is not supported for field "${fieldName}"`
    )
  }
  const value = sql`${entries.content}->>${fieldName}`
  const type = sql`jsonb_typeof(${entries.content}->${fieldName})`
  let expression
  if (field.type === 'number') {
    // Only cast JSON numbers; malformed legacy values become NULL instead of failing the query.
    expression = sql`case when ${type} = 'number' then (${value})::numeric end`
  } else if (field.type === 'boolean') {
    expression = sql`case when ${type} = 'boolean' then (${value})::boolean end`
  } else if (field.type === 'date') {
    // Validate the calendar before comparing ISO strings; avoid date casts on legacy content.
    const year = sql`substring(${value} from 1 for 4)::integer`
    const month = sql`substring(${value} from 6 for 2)::integer`
    const day = sql`substring(${value} from 9 for 2)::integer`
    const daysInMonth = sql`case when ${month} = 2 then
      case when (${year} % 4 = 0 and (${year} % 100 <> 0 or ${year} % 400 = 0)) then 29 else 28 end
      when ${month} in (4, 6, 9, 11) then 30 else 31 end`
    expression = sql`case when ${type} = 'string' and ${value} ~ ${'^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'}
      then case when ${year} > 0 and ${day} <= ${daysInMonth} then ${value} end end`
  } else {
    expression = sql`case when ${type} = 'string' then lower(nullif(${value}, '')) end`
  }
  return [sql`${direction(expression)} nulls last`, asc(entries.id)]
}
