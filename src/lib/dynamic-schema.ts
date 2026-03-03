import { z } from 'zod';

export type FieldDefinition = {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  required: boolean;
};

/**
 * Dynamically constructs a Zod schema from an array of field definitions.
 */
export function buildZodSchema(fields: FieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let validator: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
        validator = z.string();
        break;
      case 'number':
        validator = z.number();
        break;
      case 'boolean':
        validator = z.boolean();
        break;
      case 'date':
        // we can accept a string date or a date object, simplifying to string timestamp for now
        validator = z.string().datetime({ message: "Invalid datetime string! Must be UTC." });
        break;
      default:
        validator = z.any();
    }

    if (!field.required) {
      validator = validator.optional();
    }

    shape[field.name] = validator;
  }

  return z.object(shape);
}
