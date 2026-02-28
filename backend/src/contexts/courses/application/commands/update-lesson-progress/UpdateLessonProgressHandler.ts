import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateLessonProgressCommand } from './UpdateLessonProgressCommand.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { type ILessonProgressRepository } from '../../../domain/repositories/ILessonProgressRepository.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { LessonProgress } from '../../../domain/entities/LessonProgress.ts';
import { type LessonProgressDto } from '../../dtos/EnrollmentDto.ts';

/**
 * UpdateLessonProgressHandler
 * Handles updating lesson progress for a student
 */
export class UpdateLessonProgressHandler implements ICommandHandler<UpdateLessonProgressCommand, LessonProgressDto> {
  constructor(
    private enrollmentRepository: IEnrollmentRepository,
    private lessonProgressRepository: ILessonProgressRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute(command: UpdateLessonProgressCommand): Promise<Result<LessonProgressDto>> {
    // Validate enrollment ID
    const enrollmentIdResult = EnrollmentId.createFromString(command.enrollmentId);
    if (enrollmentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);
    }

    // Validate lesson ID
    const lessonIdResult = LessonId.createFromString(command.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    // Find enrollment
    const enrollment = await this.enrollmentRepository.findById(enrollmentIdResult.getValue());
    if (!enrollment) {
      return Result.fail(ErrorCode.ENROLLMENT_NOT_FOUND);
    }

    // Block only cancelled enrollments; completed enrollments still have access
    if (enrollment.isCancelled()) {
      return Result.fail(ErrorCode.ENROLLMENT_NOT_ACTIVE);
    }

    // Find or create lesson progress
    let progress = await this.lessonProgressRepository.findByEnrollmentAndLesson(
      enrollmentIdResult.getValue(),
      lessonIdResult.getValue()
    );

    if (!progress) {
      const createResult = LessonProgress.create(
        enrollmentIdResult.getValue(),
        lessonIdResult.getValue()
      );

      if (createResult.isFailure) {
        return Result.fail(createResult.getError() as string);
      }

      progress = createResult.getValue();
    }

    // Update watched time if provided
    if (command.watchedSeconds !== undefined) {
      const updateResult = progress.updateWatchedTime(command.watchedSeconds);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError() as string);
      }
    }

    // Mark as completed if requested
    if (command.completed === true && !progress.isCompleted()) {
      const completeResult = progress.complete();
      if (completeResult.isFailure) {
        return Result.fail(completeResult.getError() as string);
      }
    }

    // Persist progress
    try {
      await this.lessonProgressRepository.save(progress);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // Update enrollment progress
    await this.updateEnrollmentProgress(enrollment, enrollmentIdResult.getValue());

    // Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(progress);

    // Get lesson info for DTO by iterating through modules
    const course = await this.courseRepository.findById(enrollment.getCourseId());
    let lesson = null;
    if (course) {
      for (const module of course.getModules()) {
        const found = module.getLessons().find(l => l.getId().equals(lessonIdResult.getValue()));
        if (found) {
          lesson = found;
          break;
        }
      }
    }

    // Return DTO
    const dto: LessonProgressDto = {
      id: progress.getProgressId(),
      enrollmentId: progress.getEnrollmentId().toValue(),
      lessonId: progress.getLessonId().toValue(),
      lessonTitle: lesson?.getTitle() ?? '',
      lessonOrder: lesson?.getOrder() ?? 0,
      status: progress.getStatus(),
      watchedSeconds: progress.getWatchedSeconds(),
      lessonDuration: lesson?.getDuration() ?? 0,
      completedAt: progress.getCompletedAt()?.toISOString() ?? null,
      lastWatchedAt: progress.getLastWatchedAt()?.toISOString() ?? null,
    };

    return Result.ok(dto);
  }

  private async updateEnrollmentProgress(
    enrollment: import('../../../domain/entities/Enrollment.ts').Enrollment,
    enrollmentId: EnrollmentId
  ): Promise<void> {
    // Skip unnecessary writes when enrollment is already completed
    if (enrollment.isCompleted()) return;

    // Get course to know total lessons
    const course = await this.courseRepository.findById(enrollment.getCourseId());
    if (!course) return;

    const totalLessons = course.getLessonCount();
    if (totalLessons === 0) return;

    // Count completed lessons
    const completedLessons = await this.lessonProgressRepository.countCompletedByEnrollment(enrollmentId);

    // Calculate progress percentage
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    // Update enrollment progress
    enrollment.updateProgress(progressPercentage);

    // Persist enrollment
    await this.enrollmentRepository.save(enrollment);
  }
}
