/**
 * EnrollmentStatus enum
 * Represents the states of a student's enrollment in a course
 */
export enum EnrollmentStatus {
  /** Student is actively enrolled and can access course content */
  ACTIVE = 'active',

  /** Student has completed the course */
  COMPLETED = 'completed',

  /** Enrollment was cancelled (by student or admin) */
  CANCELLED = 'cancelled',
}

/**
 * Check if a value is a valid EnrollmentStatus
 */
export function isValidEnrollmentStatus(value: string): value is EnrollmentStatus {
  return Object.values(EnrollmentStatus).includes(value as EnrollmentStatus);
}

/**
 * Get EnrollmentStatus from string
 */
export function parseEnrollmentStatus(value: string): EnrollmentStatus | null {
  if (isValidEnrollmentStatus(value)) {
    return value;
  }
  return null;
}
