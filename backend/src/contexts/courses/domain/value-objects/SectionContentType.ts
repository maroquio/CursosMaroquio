/**
 * Section Content Type Value Object
 * Represents the type of content within a section
 */
export enum SectionContentType {
  TEXT = 'text',
  VIDEO = 'video',
  QUIZ = 'quiz',
  EXERCISE = 'exercise',
  INTERACTIVE = 'interactive',
}

/**
 * Valid section content types
 */
export const VALID_CONTENT_TYPES = ['text', 'video', 'quiz', 'exercise', 'interactive'] as const;

/**
 * Parse a string to SectionContentType
 * @param value The string to parse
 * @returns SectionContentType or null if invalid
 */
export function parseSectionContentType(value: string): SectionContentType | null {
  switch (value) {
    case 'text':
      return SectionContentType.TEXT;
    case 'video':
      return SectionContentType.VIDEO;
    case 'quiz':
      return SectionContentType.QUIZ;
    case 'exercise':
      return SectionContentType.EXERCISE;
    case 'interactive':
      return SectionContentType.INTERACTIVE;
    default:
      return null;
  }
}

/**
 * Check if a string is a valid section content type
 * @param value The string to check
 * @returns True if the string is a valid section content type
 */
export function isValidSectionContentType(value: string): value is SectionContentType {
  return VALID_CONTENT_TYPES.includes(value as SectionContentType);
}
