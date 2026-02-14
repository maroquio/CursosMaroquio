import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetStudentEnrollmentsQuery } from './GetStudentEnrollmentsQuery.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { type ILessonProgressRepository } from '../../../domain/repositories/ILessonProgressRepository.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type EnrollmentWithCourseDto } from '../../dtos/EnrollmentDto.ts';

/**
 * GetStudentEnrollmentsHandler
 * Handles retrieving all enrollments for a student
 */
export class GetStudentEnrollmentsHandler implements IQueryHandler<GetStudentEnrollmentsQuery, EnrollmentWithCourseDto[]> {
  constructor(
    private enrollmentRepository: IEnrollmentRepository,
    private courseRepository: ICourseRepository,
    private lessonProgressRepository: ILessonProgressRepository
  ) {}

  async execute(query: GetStudentEnrollmentsQuery): Promise<Result<EnrollmentWithCourseDto[]>> {
    // Validate student ID
    const studentIdResult = UserId.createFromString(query.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    // Get enrollments
    const enrollments = await this.enrollmentRepository.findByStudent(
      studentIdResult.getValue(),
      query.status
    );

    // Map to DTOs with course info
    const dtos: EnrollmentWithCourseDto[] = [];

    for (const enrollment of enrollments) {
      const course = await this.courseRepository.findById(enrollment.getCourseId());
      if (!course) continue;

      const completedLessons = await this.lessonProgressRepository.countCompletedByEnrollment(
        enrollment.getId()
      );

      dtos.push({
        id: enrollment.getId().toValue(),
        courseId: enrollment.getCourseId().toValue(),
        studentId: enrollment.getStudentId().toValue(),
        status: enrollment.getStatus(),
        progress: enrollment.getProgress(),
        enrolledAt: enrollment.getEnrolledAt().toISOString(),
        completedAt: enrollment.getCompletedAt()?.toISOString() ?? null,
        cancelledAt: enrollment.getCancelledAt()?.toISOString() ?? null,
        courseTitle: course.getTitle(),
        courseSlug: course.getSlug().getValue(),
        courseThumbnailUrl: course.getThumbnailUrl(),
        totalLessons: course.getLessonCount(),
        completedLessons,
      });
    }

    return Result.ok(dtos);
  }
}
