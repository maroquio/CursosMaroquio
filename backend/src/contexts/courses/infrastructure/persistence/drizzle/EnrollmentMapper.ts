import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { Enrollment } from '../../../domain/entities/Enrollment.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { EnrollmentStatus, parseEnrollmentStatus } from '../../../domain/value-objects/EnrollmentStatus.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type EnrollmentSchema } from './schema.ts';

/**
 * EnrollmentMapper
 * Converts between Enrollment aggregate and database schema
 */
export class EnrollmentMapper {
  /**
   * Convert Enrollment aggregate to database row
   */
  public static toPersistence(enrollment: Enrollment) {
    return {
      id: enrollment.getId().toValue(),
      courseId: enrollment.getCourseId().toValue(),
      studentId: enrollment.getStudentId().toValue(),
      status: enrollment.getStatus(),
      progress: enrollment.getProgress(),
      enrolledAt: enrollment.getEnrolledAt(),
      expiresAt: enrollment.getExpiresAt(),
      lastAccessedAt: enrollment.getLastAccessedAt(),
      completedAt: enrollment.getCompletedAt(),
      cancelledAt: enrollment.getCancelledAt(),
    };
  }

  /**
   * Convert database row to Enrollment aggregate
   */
  public static toDomain(raw: EnrollmentSchema): Result<Enrollment> {
    const enrollmentIdResult = EnrollmentId.createFromString(raw.id);
    if (enrollmentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);
    }

    const courseIdResult = CourseId.createFromString(raw.courseId);
    if (courseIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_COURSE_ID);
    }

    const studentIdResult = UserId.createFromString(raw.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    const status = parseEnrollmentStatus(raw.status);
    if (!status) {
      return Result.fail(ErrorCode.VALIDATION_ERROR);
    }

    const enrollment = Enrollment.reconstruct(
      enrollmentIdResult.getValue(),
      courseIdResult.getValue(),
      studentIdResult.getValue(),
      status,
      raw.progress,
      raw.enrolledAt,
      raw.expiresAt,
      raw.lastAccessedAt,
      raw.completedAt,
      raw.cancelledAt
    );

    return Result.ok(enrollment);
  }
}
