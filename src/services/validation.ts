import { z } from 'zod';
import { dataSchema, fieldsSchema } from '../types';

type OfficerResponse = string | null;

export function enforceRules({
  data,
  fields,
}: {
  fields: z.infer<typeof fieldsSchema> | undefined | null;
  data: z.infer<typeof dataSchema> | undefined | null;
}) {
  const brokenRules = [];

  if (!fields) {
    return [];
  }

  for (const field of Object.values(fields)) {
    const value = data?.[field.id]?.value;

    if (field.validation.required && !value) {
      brokenRules.push(`${field.name} is required`);
    }

    if (value === undefined || value === null) {
      continue;
    }

    switch (field.type) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'SELECT': {
        const stringBrokenRule = stringOfficer({ field, value: value as string });
        if (stringBrokenRule) {
          brokenRules.push(stringBrokenRule);
        }
        break;
      }
      case 'NUMBER': {
        const numBrokenRule = numberOfficer({ field, value: value as number });
        if (numBrokenRule) {
          brokenRules.push(numBrokenRule);
        }
        break;
      }

      case 'MULTI_SELECT': {
        const arrayBrokenRule = arrayOfficer({ field, value: value as string[] });
        if (arrayBrokenRule) {
          brokenRules.push(arrayBrokenRule);
        }
        break;
      }

      default:
        break;
    }
  }

  return brokenRules;
}

export function stringOfficer({
  field,
  value,
}: {
  value: string;
  field: z.infer<typeof fieldsSchema>[number];
}): OfficerResponse {
  if (field.validation.minLength && value.length < field.validation.minLength) {
    return `${field.name} must be at least ${field.validation.minLength} characters`;
  }

  if (field.validation.maxLength && value.length > field.validation.maxLength) {
    return `${field.name} must be at most ${field.validation.maxLength} characters`;
  }

  return null;
}

export function numberOfficer({
  field,
  value,
}: {
  value: number;
  field: z.infer<typeof fieldsSchema>[number];
}): OfficerResponse {
  if (field.validation.minLength && value < field.validation.minLength) {
    return `${field.name} must be at least ${field.validation.minLength}`;
  }

  if (field.validation.maxLength && value > field.validation.maxLength) {
    return `${field.name} must be at most ${field.validation.maxLength}`;
  }

  return null;
}

export function arrayOfficer({
  field,
  value,
}: {
  value: string[];
  field: z.infer<typeof fieldsSchema>[number];
}): OfficerResponse {
  if (field.validation.minLength && value.length < field.validation.minLength) {
    return `${field.name} must have at least ${field.validation.minLength} items`;
  }

  if (field.validation.maxLength && value.length > field.validation.maxLength) {
    return `${field.name} must have at most ${field.validation.maxLength} items`;
  }

  return null;
}
