/**
 * DeleteSectionCommand
 * Represents the intent to delete a section from a lesson
 */
export class DeleteSectionCommand {
  constructor(
    public readonly sectionId: string
  ) {}
}
