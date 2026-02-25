import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CompleteSectionCommand } from './CompleteSectionCommand.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { type ISectionProgressRepository } from '../../../domain/repositories/ISectionProgressRepository.ts';
import { type ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { type ILessonProgressRepository } from '../../../domain/repositories/ILessonProgressRepository.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { LessonProgressStatus } from '../../../domain/value-objects/LessonProgressStatus.ts';
import { LessonProgress } from '../../../domain/entities/LessonProgress.ts';
import { type SectionProgressDto } from '../../dtos/EnrollmentDto.ts';

/**
 * CompleteSectionHandler
 * Handles marking a section as complete and updates lesson progress if all sections are done
 */
export class CompleteSectionHandler implements ICommandHandler<CompleteSectionCommand, SectionProgressDto> {
  constructor(
    private enrollmentRepository: IEnrollmentRepository,
    private sectionProgressRepository: ISectionProgressRepository,
    private sectionRepository: ISectionRepository,
    private lessonProgressRepository: ILessonProgressRepository
  ) {}

  async execute(command: CompleteSectionCommand): Promise<Result<SectionProgressDto>> {
    // Validate enrollment ID
    const enrollmentIdResult = EnrollmentId.createFromString(command.enrollmentId);
    if (enrollmentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);
    }

    // Validate section ID
    const sectionIdResult = SectionId.createFromString(command.sectionId);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
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

    // Find section to get lesson ID
    const section = await this.sectionRepository.findById(sectionIdResult.getValue());
    if (!section) {
      return Result.fail(ErrorCode.SECTION_NOT_FOUND);
    }

    // Get or create section progress
    const sectionProgress = await this.sectionProgressRepository.getOrCreate(
      enrollmentIdResult.getValue(),
      sectionIdResult.getValue()
    );

    // Mark as completed if not already
    if (!sectionProgress.isCompleted()) {
      const completeResult = sectionProgress.complete();
      if (completeResult.isFailure) {
        return Result.fail(completeResult.getError() as string);
      }

      // Persist section progress
      try {
        await this.sectionProgressRepository.save(sectionProgress);
      } catch (error) {
        return Result.fail(ErrorCode.INTERNAL_ERROR);
      }

      // Publish section completed event
      const eventPublisher = getDomainEventPublisher();
      await eventPublisher.publishEventsForAggregate(sectionProgress);
    }

    // Check if all sections of the lesson are completed
    const lessonId = section.getLessonId();
    const totalSections = await this.sectionRepository.countByLesson(lessonId);
    const allSectionsCompleted = await this.sectionProgressRepository.areAllSectionsCompleted(
      enrollmentIdResult.getValue(),
      lessonId,
      totalSections
    );

    // If all sections completed, mark lesson as completed
    if (allSectionsCompleted) {
      let lessonProgress = await this.lessonProgressRepository.findByEnrollmentAndLesson(
        enrollmentIdResult.getValue(),
        lessonId
      );

      if (!lessonProgress) {
        const createResult = LessonProgress.create(
          enrollmentIdResult.getValue(),
          lessonId
        );

        if (createResult.isOk) {
          lessonProgress = createResult.getValue();
        }
      }

      if (lessonProgress && !lessonProgress.isCompleted()) {
        lessonProgress.complete();
        await this.lessonProgressRepository.save(lessonProgress);

        // Publish lesson completed event
        const eventPublisher = getDomainEventPublisher();
        await eventPublisher.publishEventsForAggregate(lessonProgress);
      }
    }

    // Return DTO
    const dto: SectionProgressDto = {
      id: sectionProgress.getId().toValue(),
      enrollmentId: sectionProgress.getEnrollmentId().toValue(),
      sectionId: sectionProgress.getSectionId().toValue(),
      status: sectionProgress.getStatus() as LessonProgressStatus,
      completedAt: sectionProgress.getCompletedAt()?.toISOString() ?? null,
      lastViewedAt: sectionProgress.getLastViewedAt()?.toISOString() ?? null,
    };

    return Result.ok(dto);
  }
}
