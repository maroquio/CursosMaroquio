import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetEnrollmentByCourseQuery } from './GetEnrollmentByCourseQuery.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { type ILessonProgressRepository } from '../../../domain/repositories/ILessonProgressRepository.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { type EnrollmentWithCourseDto } from '../../dtos/EnrollmentDto.ts';

/**
 * GetEnrollmentByCourseHandler
 * Handles retrieving enrollment by student and course
 */
export class GetEnrollmentByCourseHandler implements IQueryHandler<GetEnrollmentByCourseQuery, EnrollmentWithCourseDto | null> {
  constructor(
    private enrollmentRepository: IEnrollmentRepository,
    private courseRepository: ICourseRepository,
    private lessonProgressRepository: ILessonProgressRepository
  ) {}

  async execute(query: GetEnrollmentByCourseQuery): Promise<Result<EnrollmentWithCourseDto | null>> {
    // Validate student ID
    const studentIdResult = UserId.createFromString(query.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    // Validate course ID
    const courseIdResult = CourseId.createFromString(query.courseId);
    if (courseIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_COURSE_ID);
    }

    // Get enrollment
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      studentIdResult.getValue(),
      courseIdResult.getValue()
    );

    if (!enrollment) {
      return Result.ok(null);
    }

    // Get course info
    const course = await this.courseRepository.findById(enrollment.getCourseId());
    if (!course) {
      return Result.ok(null);
    }

    // Get completed lessons count
    const completedLessons = await this.lessonProgressRepository.countCompletedByEnrollment(
      enrollment.getId()
    );

    const dto: EnrollmentWithCourseDto = {
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
    };

    return Result.ok(dto);
  }
}
