import { EnrollmentStatus } from '../../../domain/value-objects/EnrollmentStatus.ts';

/**
 * GetStudentEnrollmentsQuery
 * Query to get all enrollments for a student
 */
export class GetStudentEnrollmentsQuery {
  constructor(
    public readonly studentId: string,
    public readonly status?: EnrollmentStatus
  ) {}
}
