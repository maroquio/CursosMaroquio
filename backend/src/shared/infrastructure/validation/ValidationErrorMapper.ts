import type { TranslationFunctions } from '../i18n/i18n-types.js';

/**
 * Mapped validation error with localized message
 */
export interface MappedValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Raw validation error from Elysia/TypeBox
 * Based on TypeBox ValueError structure
 */
interface RawValidationError {
  type?: number;
  path?: string;
  message?: string;
  summary?: string;
  schema?: {
    format?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    minItems?: number;
    maxItems?: number;
    type?: string;
    pattern?: string;
  };
  value?: unknown;
}

/**
 * TypeBox ValueErrorType codes
 * @see https://github.com/sinclairzx81/typebox
 */
const TypeBoxErrorCodes = {
  // Format errors (50-59)
  StringFormat: 50,
  StringMinLength: 52,
  StringMaxLength: 53,
  StringPattern: 54,

  // Type errors (40-49)
  Type: 42,
  String: 43,
  Number: 44,
  Boolean: 45,
  Integer: 46,
  Object: 47,
  Array: 48,
  Null: 49,

  // Required/missing (60-69)
  ObjectRequiredProperty: 45,
  Required: 45,

  // Range errors (30-39)
  NumberMinimum: 32,
  NumberMaximum: 33,
  NumberExclusiveMinimum: 34,
  NumberExclusiveMaximum: 35,

  // Array errors (70-79)
  ArrayMinItems: 72,
  ArrayMaxItems: 73,
  ArrayUniqueItems: 74,

  // Enum
  Enum: 55,

  // Additional properties
  AdditionalProperties: 56,
} as const;

/**
 * ValidationErrorMapper
 *
 * Maps Elysia/TypeBox validation errors to localized messages.
 * Uses the i18n translation system to provide user-friendly error messages
 * in the user's preferred language.
 *
 * @example
 * ```typescript
 * const mapper = new ValidationErrorMapper(t);
 * const errors = mapper.mapElysiaError(validationError);
 * // Returns: [{ field: 'email', message: 'Field email must be a valid email', code: 'emailFormat' }]
 * ```
 */
export class ValidationErrorMapper {
  constructor(private readonly t: TranslationFunctions) {}

  /**
   * Map an Elysia ValidationError to localized error messages
   * @param error The ValidationError from Elysia's onError handler
   * @returns Array of mapped validation errors with localized messages
   */
  mapElysiaError(error: unknown): MappedValidationError[] {
    const errors: MappedValidationError[] = [];

    // Try to extract errors from various possible structures
    const rawErrors = this.extractRawErrors(error);

    for (const rawError of rawErrors) {
      errors.push(this.mapSingleError(rawError));
    }

    // If no errors could be extracted, return a generic error
    if (errors.length === 0) {
      errors.push({
        field: 'unknown',
        message: this.t.validationErrors.unknownError(),
        code: 'unknownError',
      });
    }

    return errors;
  }

  /**
   * Extract raw errors from various Elysia error structures
   */
  private extractRawErrors(error: unknown): RawValidationError[] {
    const errors: RawValidationError[] = [];

    if (!error) return errors;

    // Try to access error.all if it exists (Elysia ValidationError)
    if (typeof error === 'object' && 'all' in error) {
      const allErrors = (error as { all: RawValidationError[] }).all;
      if (Array.isArray(allErrors)) {
        return allErrors;
      }
    }

    // Try to access error.validator.Errors() for TypeBox TypeCheck
    if (typeof error === 'object' && 'validator' in error) {
      const validator = (error as { validator: { Errors?: () => Iterable<RawValidationError> } })
        .validator;
      if (validator && typeof validator.Errors === 'function') {
        try {
          const typeboxErrors = validator.Errors();
          if (typeboxErrors && typeof typeboxErrors[Symbol.iterator] === 'function') {
            return [...typeboxErrors];
          }
        } catch {
          // Ignore errors from Errors() call
        }
      }
    }

    // Try to parse stringified JSON error (Elysia sometimes stringifies TypeBox errors)
    if (typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      try {
        const parsed = JSON.parse(message);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (parsed && typeof parsed === 'object') {
          return [parsed];
        }
      } catch {
        // Not JSON, try to extract field from message
        return [{ message, path: this.extractFieldFromMessage(message) }];
      }
    }

    // Fallback: wrap the error itself if it has expected properties
    if (typeof error === 'object') {
      const obj = error as Record<string, unknown>;
      if ('path' in obj || 'message' in obj || 'type' in obj) {
        return [obj as RawValidationError];
      }
    }

    return errors;
  }

  /**
   * Map a single raw validation error to a localized error
   */
  private mapSingleError(raw: RawValidationError): MappedValidationError {
    const field = this.extractFieldName(raw.path);
    const { message, code } = this.getLocalizedMessage(raw, field);

    return { field, message, code };
  }

  /**
   * Extract field name from TypeBox path format (e.g., "/email" -> "email")
   */
  private extractFieldName(path?: string): string {
    if (!path) return 'unknown';

    // TypeBox paths start with "/" (e.g., "/email", "/user/name")
    const cleanPath = path.replace(/^\//, '');

    // Get the last segment for nested paths
    const segments = cleanPath.split('/');
    return segments[segments.length - 1] || 'unknown';
  }

  /**
   * Try to extract field name from error message
   */
  private extractFieldFromMessage(message: string): string | undefined {
    // Common patterns in TypeBox messages
    const patterns = [
      /Expected .+ for '(\w+)'/i,
      /property '(\w+)'/i,
      /'(\w+)' must be/i,
      /field '(\w+)'/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match?.[1]) return match[1];
    }

    return undefined;
  }

  /**
   * Get localized message based on error type and schema
   */
  private getLocalizedMessage(
    raw: RawValidationError,
    field: string
  ): { message: string; code: string } {
    const schema = raw.schema || {};
    const t = this.t.validationErrors;

    // Check for format errors first (most specific)
    if (schema.format) {
      return this.getFormatMessage(schema.format, field);
    }

    // Check by error type code
    if (raw.type !== undefined) {
      return this.getMessageByTypeCode(raw.type, raw, field);
    }

    // Infer from schema properties
    if (schema.minLength !== undefined) {
      return {
        message: t.minLength({ field, min: String(schema.minLength) }),
        code: 'minLength',
      };
    }

    if (schema.maxLength !== undefined) {
      return {
        message: t.maxLength({ field, max: String(schema.maxLength) }),
        code: 'maxLength',
      };
    }

    if (schema.minimum !== undefined) {
      return {
        message: t.minimum({ field, min: String(schema.minimum) }),
        code: 'minimum',
      };
    }

    if (schema.maximum !== undefined) {
      return {
        message: t.maximum({ field, max: String(schema.maximum) }),
        code: 'maximum',
      };
    }

    if (schema.pattern !== undefined) {
      return {
        message: t.pattern({ field }),
        code: 'pattern',
      };
    }

    // Infer from schema type
    if (schema.type) {
      return this.getTypeMessage(schema.type, field);
    }

    // Check if it's a required field error from the message
    if (raw.message?.toLowerCase().includes('required')) {
      return {
        message: t.required({ field }),
        code: 'required',
      };
    }

    // Fallback to generic message
    return {
      message: t.invalidValue({ field }),
      code: 'invalidValue',
    };
  }

  /**
   * Get localized message for format validation errors
   */
  private getFormatMessage(format: string, field: string): { message: string; code: string } {
    const t = this.t.validationErrors;

    switch (format.toLowerCase()) {
      case 'email':
        return { message: t.emailFormat({ field }), code: 'emailFormat' };
      case 'uri':
      case 'url':
        return { message: t.urlFormat({ field }), code: 'urlFormat' };
      case 'uuid':
        return { message: t.uuidFormat({ field }), code: 'uuidFormat' };
      case 'date':
        return { message: t.dateFormat({ field }), code: 'dateFormat' };
      case 'date-time':
        return { message: t.dateTimeFormat({ field }), code: 'dateTimeFormat' };
      case 'time':
        return { message: t.timeFormat({ field }), code: 'timeFormat' };
      default:
        return { message: t.invalidValue({ field }), code: 'invalidValue' };
    }
  }

  /**
   * Get localized message by TypeBox error type code
   */
  private getMessageByTypeCode(
    typeCode: number,
    raw: RawValidationError,
    field: string
  ): { message: string; code: string } {
    const t = this.t.validationErrors;
    const schema = raw.schema || {};

    switch (typeCode) {
      case TypeBoxErrorCodes.StringFormat:
        return this.getFormatMessage(schema.format || '', field);

      case TypeBoxErrorCodes.StringMinLength:
        return {
          message: t.minLength({ field, min: String(schema.minLength || 0) }),
          code: 'minLength',
        };

      case TypeBoxErrorCodes.StringMaxLength:
        return {
          message: t.maxLength({ field, max: String(schema.maxLength || 0) }),
          code: 'maxLength',
        };

      case TypeBoxErrorCodes.StringPattern:
        return { message: t.pattern({ field }), code: 'pattern' };

      case TypeBoxErrorCodes.Type:
      case TypeBoxErrorCodes.String:
        return { message: t.expectedString({ field }), code: 'expectedString' };

      case TypeBoxErrorCodes.Number:
        return { message: t.expectedNumber({ field }), code: 'expectedNumber' };

      case TypeBoxErrorCodes.Boolean:
        return { message: t.expectedBoolean({ field }), code: 'expectedBoolean' };

      case TypeBoxErrorCodes.Integer:
        return { message: t.expectedInteger({ field }), code: 'expectedInteger' };

      case TypeBoxErrorCodes.Object:
        return { message: t.expectedObject({ field }), code: 'expectedObject' };

      case TypeBoxErrorCodes.Array:
        return { message: t.expectedArray({ field }), code: 'expectedArray' };

      case TypeBoxErrorCodes.Null:
        return { message: t.expectedNull({ field }), code: 'expectedNull' };

      case TypeBoxErrorCodes.ObjectRequiredProperty:
        return { message: t.required({ field }), code: 'required' };

      case TypeBoxErrorCodes.NumberMinimum:
        return {
          message: t.minimum({ field, min: String(schema.minimum || 0) }),
          code: 'minimum',
        };

      case TypeBoxErrorCodes.NumberMaximum:
        return {
          message: t.maximum({ field, max: String(schema.maximum || 0) }),
          code: 'maximum',
        };

      case TypeBoxErrorCodes.NumberExclusiveMinimum:
        return {
          message: t.exclusiveMinimum({ field, min: String(schema.exclusiveMinimum || 0) }),
          code: 'exclusiveMinimum',
        };

      case TypeBoxErrorCodes.NumberExclusiveMaximum:
        return {
          message: t.exclusiveMaximum({ field, max: String(schema.exclusiveMaximum || 0) }),
          code: 'exclusiveMaximum',
        };

      case TypeBoxErrorCodes.ArrayMinItems:
        return {
          message: t.minItems({ field, min: String(schema.minItems || 0) }),
          code: 'minItems',
        };

      case TypeBoxErrorCodes.ArrayMaxItems:
        return {
          message: t.maxItems({ field, max: String(schema.maxItems || 0) }),
          code: 'maxItems',
        };

      case TypeBoxErrorCodes.ArrayUniqueItems:
        return { message: t.uniqueItems({ field }), code: 'uniqueItems' };

      case TypeBoxErrorCodes.Enum:
        return { message: t.enumMismatch({ field }), code: 'enumMismatch' };

      case TypeBoxErrorCodes.AdditionalProperties:
        return {
          message: t.additionalProperties({ property: field }),
          code: 'additionalProperties',
        };

      default:
        return { message: t.invalidValue({ field }), code: 'invalidValue' };
    }
  }

  /**
   * Get localized message for type validation errors
   */
  private getTypeMessage(type: string, field: string): { message: string; code: string } {
    const t = this.t.validationErrors;

    switch (type.toLowerCase()) {
      case 'string':
        return { message: t.expectedString({ field }), code: 'expectedString' };
      case 'number':
        return { message: t.expectedNumber({ field }), code: 'expectedNumber' };
      case 'integer':
        return { message: t.expectedInteger({ field }), code: 'expectedInteger' };
      case 'boolean':
        return { message: t.expectedBoolean({ field }), code: 'expectedBoolean' };
      case 'object':
        return { message: t.expectedObject({ field }), code: 'expectedObject' };
      case 'array':
        return { message: t.expectedArray({ field }), code: 'expectedArray' };
      case 'null':
        return { message: t.expectedNull({ field }), code: 'expectedNull' };
      default:
        return { message: t.invalidValue({ field }), code: 'invalidValue' };
    }
  }
}
