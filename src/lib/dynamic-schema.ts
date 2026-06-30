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
  | 'group'

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
  enableCopyButton?: boolean
  helperText?: string
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
        if (field.validation?.minLength !== undefined) {
          const minL = Math.max(field.validation.minLength, field.required ? 1 : 0)
          strValidator = strValidator.min(minL, minL === 1 && field.required ? 'Required' : undefined)
        } else if (field.required) {
          strValidator = strValidator.min(1, 'Required')
        }
        if (field.validation?.maxLength !== undefined)
          strValidator = strValidator.max(field.validation.maxLength)
        validator = strValidator
        break
      }
      case 'email': {
        let emailValidator = z.string().email('Invalid email address')
        if (field.validation?.minLength !== undefined) {
          const minL = Math.max(field.validation.minLength, field.required ? 1 : 0)
          emailValidator = emailValidator.min(minL, minL === 1 && field.required ? 'Required' : undefined)
        } else if (field.required) {
          emailValidator = emailValidator.min(1, 'Required')
        }
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
      case 'time': {
        let strValidator = z.string()
        if (field.required) {
          strValidator = strValidator.min(1, 'Required')
        }
        validator = strValidator
        break
      }
      case 'select':
      case 'radio': {
        const optionValues = field.options?.map((o) => o.value).filter(Boolean) || []
        if (optionValues.length > 0) {
          const enumValidator = z.enum(optionValues as [string, ...string[]])
          if (field.type === 'select' && field.multiple) {
            validator = z.array(enumValidator)
          } else {
            validator = enumValidator
          }
        } else {
          let strValidator = z.string()
          if (field.required) {
            strValidator = strValidator.min(1, 'Required')
          }
          if (field.type === 'select' && field.multiple) {
            validator = z.array(strValidator)
          } else {
            validator = strValidator
          }
        }
        break
      }
      case 'slug': {
        let strValidator = z.string()
        if (field.required) {
          strValidator = strValidator.min(1, 'Required')
        }
        validator = strValidator
        break
      }
      case 'checkbox': {
        const optionValues = field.options?.map((o) => o.value).filter(Boolean) || []
        if (optionValues.length > 0) {
          validator = z.array(z.enum(optionValues as [string, ...string[]]))
        } else {
          validator = z.array(z.string())
        }
        break
      }
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
      case 'group':
        if (field.fields && field.fields.length > 0) {
          validator = buildZodSchema(field.fields)
        } else {
          validator = z.object({})
        }
        break
      default:
        validator = z.any()
    }

    if (field.type === 'group') {
      validator = validator.default({})
    } else if (!field.required) {
      validator = z.preprocess(
        (val) => (val === '' || val === null ? undefined : val),
        validator.optional()
      )
    }

    shape[field.name] = validator
  }

  return z.object(shape)
}
