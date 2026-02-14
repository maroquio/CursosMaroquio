/**
 * CompleteSectionCommand
 * Represents the intent to mark a section as complete
 */
export class CompleteSectionCommand {
  constructor(
    public readonly enrollmentId: string,
    public readonly sectionId: string
  ) {}
}
