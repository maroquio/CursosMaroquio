import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetCourseProgressQuery } from './GetCourseProgressQuery.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { type ILessonProgressRepository } from '../../../domain/repositories/ILessonProgressRepository.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { LessonProgressStatus } from '../../../domain/value-objects/LessonProgressStatus.ts';
import { type CourseProgressDto, type LessonProgressDto } from '../../dtos/EnrollmentDto.ts';

/**
 * GetCourseProgressHandler
 * Handles retrieving a student's progress in a course
 */
export class GetCourseProgressHandler implements IQueryHandler<GetCourseProgressQuery, CourseProgressDto> {
  constructor(
    private enrollmentRepository: IEnrollmentRepository,
    private courseRepository: ICourseRepository,
    private lessonProgressRepository: ILessonProgressRepository
  ) {}

  async execute(query: GetCourseProgressQuery): Promise<Result<CourseProgressDto>> {
    // Validate enrollment ID
    const enrollmentIdResult = EnrollmentId.createFromString(query.enrollmentId);
    if (enrollmentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);
    }

    // Get enrollment
    const enrollment = await this.enrollmentRepository.findById(enrollmentIdResult.getValue());
    if (!enrollment) {
      return Result.fail(ErrorCode.ENROLLMENT_NOT_FOUND);
    }

    // Get course
    const course = await this.courseRepository.findById(enrollment.getCourseId());
    if (!course) {
      return Result.fail(ErrorCode.COURSE_NOT_FOUND);
    }

    // Get all lesson progress
    const progressList = await this.lessonProgressRepository.findByEnrollment(
      enrollmentIdResult.getValue()
    );

    // Create a map for quick lookup
    const progressMap = new Map(
      progressList.map(p => [p.getLessonId().toValue(), p])
    );

    // Build lessons progress DTO by iterating through modules
    const lessonsProgress: LessonProgressDto[] = [];
    let completedCount = 0;

    for (const module of course.getModules()) {
      for (const lesson of module.getLessons()) {
        const lessonId = lesson.getId().toValue();
        const progress = progressMap.get(lessonId);

        const lessonProgressDto: LessonProgressDto = {
          id: progress?.getProgressId() ?? '',
          enrollmentId: enrollment.getId().toValue(),
          lessonId,
          lessonTitle: lesson.getTitle(),
          lessonOrder: lesson.getOrder(),
          status: progress?.getStatus() ?? LessonProgressStatus.NOT_STARTED,
          watchedSeconds: progress?.getWatchedSeconds() ?? 0,
          lessonDuration: lesson.getDuration(),
          completedAt: progress?.getCompletedAt()?.toISOString() ?? null,
          lastWatchedAt: progress?.getLastWatchedAt()?.toISOString() ?? null,
        };

        if (progress?.isCompleted()) {
          completedCount++;
        }

        lessonsProgress.push(lessonProgressDto);
      }
    }

    // Sort by lesson order
    lessonsProgress.sort((a, b) => a.lessonOrder - b.lessonOrder);

    const dto: CourseProgressDto = {
      enrollmentId: enrollment.getId().toValue(),
      courseId: course.getId().toValue(),
      courseTitle: course.getTitle(),
      overallProgress: enrollment.getProgress(),
      lessonsProgress,
      completedLessons: completedCount,
      totalLessons: course.getLessonCount(),
    };

    return Result.ok(dto);
  }
}
