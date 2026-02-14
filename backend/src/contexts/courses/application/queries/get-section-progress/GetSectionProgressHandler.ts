import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetSectionProgressQuery } from './GetSectionProgressQuery.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { type ISectionProgressRepository } from '../../../domain/repositories/ISectionProgressRepository.ts';
import { type ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { LessonProgressStatus } from '../../../domain/value-objects/LessonProgressStatus.ts';
import { type SectionProgressDto } from '../../dtos/EnrollmentDto.ts';

/**
 * LessonSectionProgressDto
 * Progress data for all sections in a lesson
 */
export interface LessonSectionProgressDto {
  lessonId: string;
  sections: SectionProgressWithDetailsDto[];
  completedSections: number;
  totalSections: number;
  isLessonComplete: boolean;
}

/**
 * SectionProgressWithDetailsDto
 * Section progress with section details
 */
export interface SectionProgressWithDetailsDto extends SectionProgressDto {
  sectionTitle: string;
  sectionOrder: number;
}

/**
 * GetSectionProgressHandler
 * Handles retrieving section progress for a lesson
 */
export class GetSectionProgressHandler implements IQueryHandler<GetSectionProgressQuery, LessonSectionProgressDto> {
  constructor(
    private enrollmentRepository: IEnrollmentRepository,
    private sectionProgressRepository: ISectionProgressRepository,
    private sectionRepository: ISectionRepository
  ) {}

  async execute(query: GetSectionProgressQuery): Promise<Result<LessonSectionProgressDto>> {
    // Validate enrollment ID
    const enrollmentIdResult = EnrollmentId.createFromString(query.enrollmentId);
    if (enrollmentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);
    }

    // Validate lesson ID
    const lessonIdResult = LessonId.createFromString(query.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    // Verify enrollment exists
    const enrollment = await this.enrollmentRepository.findById(enrollmentIdResult.getValue());
    if (!enrollment) {
      return Result.fail(ErrorCode.ENROLLMENT_NOT_FOUND);
    }

    // Get all sections for the lesson
    const sections = await this.sectionRepository.findByLesson(lessonIdResult.getValue());

    // Get progress for all sections
    const progressList = await this.sectionProgressRepository.findByEnrollmentAndLesson(
      enrollmentIdResult.getValue(),
      lessonIdResult.getValue()
    );

    // Create a map for quick lookup
    const progressMap = new Map(
      progressList.map(p => [p.getSectionId().toValue(), p])
    );

    // Build section progress DTOs
    const sectionProgressDtos: SectionProgressWithDetailsDto[] = [];
    let completedCount = 0;

    for (const section of sections) {
      const sectionId = section.getId().toValue();
      const progress = progressMap.get(sectionId);
      const isCompleted = progress?.isCompleted() ?? false;

      if (isCompleted) {
        completedCount++;
      }

      sectionProgressDtos.push({
        id: progress?.getId().toValue() ?? '',
        enrollmentId: enrollment.getId().toValue(),
        sectionId,
        sectionTitle: section.getTitle(),
        sectionOrder: section.getOrder(),
        status: progress?.getStatus() as LessonProgressStatus ?? LessonProgressStatus.NOT_STARTED,
        completedAt: progress?.getCompletedAt()?.toISOString() ?? null,
        lastViewedAt: progress?.getLastViewedAt()?.toISOString() ?? null,
      });
    }

    // Sort by section order
    sectionProgressDtos.sort((a, b) => a.sectionOrder - b.sectionOrder);

    const dto: LessonSectionProgressDto = {
      lessonId: query.lessonId,
      sections: sectionProgressDtos,
      completedSections: completedCount,
      totalSections: sections.length,
      isLessonComplete: completedCount >= sections.length && sections.length > 0,
    };

    return Result.ok(dto);
  }
}
