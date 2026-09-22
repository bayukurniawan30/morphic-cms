import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { entries } from '../db/schema.js'

function collectRelationIds(
  content: any,
  fields: any[],
  neededIds: Record<number, Set<number>>
) {
  if (!content || !fields) return

  for (const field of fields) {
    const value = content[field.name]
    if (value === undefined || value === null) continue

    if (field.type === 'relation' && field.relationCollectionId) {
      const relationCollectionId = field.relationCollectionId
      neededIds[relationCollectionId] ||= new Set()
      const values = Array.isArray(value) ? value : [value]

      for (const relation of values) {
        const id = typeof relation === 'number' ? relation : relation?.id
        if (typeof id === 'number') neededIds[relationCollectionId].add(id)
      }
    } else if (field.type === 'group' && field.fields) {
      collectRelationIds(value, field.fields, neededIds)
    } else if (field.type === 'array' && field.fields && Array.isArray(value)) {
      for (const item of value) {
        collectRelationIds(item, field.fields, neededIds)
      }
    }
  }
}

function replaceRelationIds(
  content: any,
  fields: any[],
  relationData: Record<number, Record<number, any>>
): any {
  if (!content || !fields) return content
  const populatedContent = { ...content }

  for (const field of fields) {
    const value = content[field.name]
    if (value === undefined || value === null) continue

    if (field.type === 'relation' && field.relationCollectionId) {
      const relationCollectionId = field.relationCollectionId
      const populate = (relation: any) => {
        const id = typeof relation === 'number' ? relation : relation?.id
        const entry =
          typeof id === 'number'
            ? relationData[relationCollectionId]?.[id]
            : null
        return entry ? { id: entry.id, ...entry.content } : relation
      }

      populatedContent[field.name] = Array.isArray(value)
        ? value.map(populate)
        : populate(value)
    } else if (field.type === 'group' && field.fields) {
      populatedContent[field.name] = replaceRelationIds(
        value,
        field.fields,
        relationData
      )
    } else if (field.type === 'array' && field.fields && Array.isArray(value)) {
      populatedContent[field.name] = value.map((item) =>
        replaceRelationIds(item, field.fields, relationData)
      )
    }
  }

  return populatedContent
}

/** Populates published relation fields exactly as public entry REST responses do. */
export const populateEntryRelations = async (
  entriesList: any[],
  fields: any[],
  tenantId: number | null
) => {
  if (entriesList.length === 0) return entriesList

  const relationData: Record<number, Record<number, any>> = {}
  const neededIdsByCollection: Record<number, Set<number>> = {}

  for (const entry of entriesList) {
    collectRelationIds(entry.content, fields, neededIdsByCollection)
  }

  for (const [collectionId, ids] of Object.entries(neededIdsByCollection)) {
    const entryIds = [...ids]
    if (entryIds.length === 0) continue

    const conditions = [
      eq(entries.collectionId, Number(collectionId)),
      inArray(entries.id, entryIds),
      isNull(entries.deletedAt),
      eq(entries.status, 'published'),
    ]
    if (tenantId) conditions.push(eq(entries.tenantId, tenantId))

    const relatedEntries = await db
      .select()
      .from(entries)
      .where(and(...conditions))

    relationData[Number(collectionId)] = Object.fromEntries(
      relatedEntries.map((entry) => [entry.id, entry])
    )
  }

  return entriesList.map((entry) => ({
    ...entry,
    content: replaceRelationIds(entry.content, fields, relationData),
  }))
}
