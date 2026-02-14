/**
 * CreateModuleCommand
 * Represents the intent to create a new module in a course
 */
export class CreateModuleCommand {
  constructor(
    public readonly courseId: string,
    public readonly title: string,
    public readonly description?: string | null
  ) {}
}
