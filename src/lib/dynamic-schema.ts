import { z } from 'zod'

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'media'
  | 'documents'
  | 'rich-text'
  | 'textarea'
  | 'relation'
  | 'slug'
  | 'boolean'
  | 'email'
  | 'array'

export type FieldOption = {
  label: string
  value: string
}

export type FieldDefinition = {
  id: string // for drag and drop / reordering identification
  name: string
  label: string
  type: FieldType
  required: boolean
  multiple?: boolean // for media, select
  options?: FieldOption[] // for select, radio, checkbox
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    step?: number
    pattern?: string
  }
  relationCollectionId?: number
  relationLabelField?: string
  fieldId?: string // used for internal UI state
  slugSourceField?: string
  fields?: FieldDefinition[] // for array type
}

/**
 * Dynamically constructs a Zod schema from an array of field definitions.
 */
export function buildZodSchema(fields: FieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    let validator: z.ZodTypeAny

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'rich-text': {
        let strValidator = z.string()
        if (field.validation?.minLength !== undefined)
          strValidator = strValidator.min(field.validation.minLength)
        if (field.validation?.maxLength !== undefined)
          strValidator = strValidator.max(field.validation.maxLength)
        validator = strValidator
        break
      }
      case 'email': {
        let emailValidator = z.string().email('Invalid email address')
        if (field.validation?.minLength !== undefined)
          emailValidator = emailValidator.min(field.validation.minLength)
        if (field.validation?.maxLength !== undefined)
          emailValidator = emailValidator.max(field.validation.maxLength)
        validator = emailValidator
        break
      }
      case 'number': {
        let numValidator = z.number()
        if (field.validation?.min !== undefined)
          numValidator = numValidator.min(field.validation.min)
        if (field.validation?.max !== undefined)
          numValidator = numValidator.max(field.validation.max)
        validator = numValidator
        break
      }
      case 'date':
      case 'datetime':
      case 'time':
        validator = z.string() // refined later if needed
        break
      case 'select':
      case 'radio':
      case 'slug':
        validator = z.string()
        break
      case 'checkbox':
        validator = z.array(z.string())
        break
      case 'media':
        validator = z.any() // could be a media ID or URL
        break
      case 'relation':
        validator = z.number() // entry ID
        break
      case 'boolean':
        validator = z.boolean()
        break
      case 'array':
        if (field.fields && field.fields.length > 0) {
          validator = z.array(buildZodSchema(field.fields))
        } else {
          validator = z.array(z.any())
        }
        break
      default:
        validator = z.any()
    }

    if (!field.required) {
      validator = validator.optional()
    }

    shape[field.name] = validator
  }

  return z.object(shape)
}
