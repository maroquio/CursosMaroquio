import { SectionContentType } from '../../../domain/value-objects/SectionContentType.ts';
import { type SectionContent } from '../../../domain/entities/Section.ts';

/**
 * UpdateSectionCommand
 * Represents the intent to update a section
 */
export class UpdateSectionCommand {
  constructor(
    public readonly sectionId: string,
    public readonly title?: string,
    public readonly description?: string | null,
    public readonly contentType?: SectionContentType,
    public readonly content?: SectionContent
  ) {}
}
