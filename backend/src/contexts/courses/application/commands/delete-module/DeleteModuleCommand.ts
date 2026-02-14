/**
 * DeleteModuleCommand
 * Represents the intent to delete a module from a course
 */
export class DeleteModuleCommand {
  constructor(
    public readonly courseId: string,
    public readonly moduleId: string
  ) {}
}
