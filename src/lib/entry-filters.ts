import { sql, type SQLWrapper } from 'drizzle-orm'
import type { ExactEntryFilter } from './entry-filter-validation.js'

export * from './entry-filter-validation.js'

/** Shared SQL for REST and GraphQL; values and field names stay parameterized. */
export function entryFilterCondition(
  content: SQLWrapper,
  filter: ExactEntryFilter
) {
  if (filter.operator === 'gte' || filter.operator === 'lte') {
    // ISO date strings sort chronologically. Avoid casts that could fail on legacy empty values.
    const comparison =
      filter.operator === 'gte'
        ? sql`${content}->>${filter.field} >= ${filter.value}`
        : sql`${content}->>${filter.field} <= ${filter.value}`
    return sql`(jsonb_typeof(${content}->${filter.field}) = 'string' and ${content}->>${filter.field} ~ ${'^\\d{4}-\\d{2}-\\d{2}$'} and ${comparison})`
  }
  if (filter.operator === 'icontains') {
    const escaped = String(filter.value).replace(/[\\%_]/g, '\\$&')
    return sql`(jsonb_typeof(${content}->${filter.field}) = 'string' and ${content}->>${filter.field} ilike ${`%${escaped}%`} escape ${'\\'})`
  }
  return sql`${content} @> ${JSON.stringify({ [filter.field]: filter.value })}::jsonb`
}
