/**
 * CourseStatus enum
 * Represents the lifecycle states of a course
 */
export enum CourseStatus {
  /** Course is being created/edited, not visible to students */
  DRAFT = 'draft',

  /** Course is published and available for enrollment */
  PUBLISHED = 'published',

  /** Course is archived, no new enrollments, existing students can still access */
  ARCHIVED = 'archived',
}

/**
 * Check if a value is a valid CourseStatus
 */
export function isValidCourseStatus(value: string): value is CourseStatus {
  return Object.values(CourseStatus).includes(value as CourseStatus);
}

/**
 * Get CourseStatus from string
 */
export function parseCourseStatus(value: string): CourseStatus | null {
  if (isValidCourseStatus(value)) {
    return value;
  }
  return null;
}
