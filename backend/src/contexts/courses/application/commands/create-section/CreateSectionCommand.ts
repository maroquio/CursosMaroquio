import { SectionContentType } from '../../../domain/value-objects/SectionContentType.ts';
import { type SectionContent } from '../../../domain/entities/Section.ts';

/**
 * CreateSectionCommand
 * Represents the intent to create a new section in a lesson
 */
export class CreateSectionCommand {
  constructor(
    public readonly lessonId: string,
    public readonly title: string,
    public readonly contentType: SectionContentType = SectionContentType.TEXT,
    public readonly description?: string | null,
    public readonly content?: SectionContent
  ) {}
}
