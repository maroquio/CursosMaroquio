import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetSectionsByLessonQuery } from './GetSectionsByLessonQuery.ts';
import { type ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { type SectionDto } from '../../dtos/CourseDto.ts';

/**
 * GetSectionsByLessonHandler
 * Handles retrieving all sections for a lesson
 */
export class GetSectionsByLessonHandler implements IQueryHandler<GetSectionsByLessonQuery, SectionDto[]> {
  constructor(private sectionRepository: ISectionRepository) {}

  async execute(query: GetSectionsByLessonQuery): Promise<Result<SectionDto[]>> {
    // Validate lesson ID
    const lessonIdResult = LessonId.createFromString(query.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    // Get sections
    const sections = await this.sectionRepository.findByLesson(lessonIdResult.getValue());

    // Map to DTOs
    const dtos: SectionDto[] = sections.map(section => ({
      id: section.getId().toValue(),
      lessonId: section.getLessonId().toValue(),
      title: section.getTitle(),
      description: section.getDescription(),
      contentType: section.getContentType(),
      content: section.getContent(),
      order: section.getOrder(),
      createdAt: section.getCreatedAt().toISOString(),
      updatedAt: section.getUpdatedAt().toISOString(),
    }));

    return Result.ok(dtos);
  }
}
