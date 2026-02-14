/**
 * LessonProgressStatus enum
 * Represents the progress status of a lesson for a student
 */
export enum LessonProgressStatus {
  /** Student has not started the lesson */
  NOT_STARTED = 'not_started',

  /** Student is currently watching/reading the lesson */
  IN_PROGRESS = 'in_progress',

  /** Student has completed the lesson */
  COMPLETED = 'completed',
}

/**
 * Check if a value is a valid LessonProgressStatus
 */
export function isValidLessonProgressStatus(value: string): value is LessonProgressStatus {
  return Object.values(LessonProgressStatus).includes(value as LessonProgressStatus);
}

/**
 * Get LessonProgressStatus from string
 */
export function parseLessonProgressStatus(value: string): LessonProgressStatus | null {
  if (isValidLessonProgressStatus(value)) {
    return value;
  }
  return null;
}
