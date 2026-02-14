/**
 * Lesson Type Value Object
 * Represents the type of lesson content
 */
export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}

/**
 * Valid lesson types
 */
export const VALID_LESSON_TYPES = ['video', 'text', 'quiz', 'assignment'] as const;

/**
 * Parse a string to LessonType
 * @param value The string to parse
 * @returns LessonType or null if invalid
 */
export function parseLessonType(value: string): LessonType | null {
  switch (value) {
    case 'video':
      return LessonType.VIDEO;
    case 'text':
      return LessonType.TEXT;
    case 'quiz':
      return LessonType.QUIZ;
    case 'assignment':
      return LessonType.ASSIGNMENT;
    default:
      return null;
  }
}

/**
 * Check if a string is a valid lesson type
 * @param value The string to check
 * @returns True if the string is a valid lesson type
 */
export function isValidLessonType(value: string): value is LessonType {
  return VALID_LESSON_TYPES.includes(value as LessonType);
}
