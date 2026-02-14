/**
 * DeleteLessonCommand
 * Represents the intent to delete a lesson from a module
 */
export class DeleteLessonCommand {
  constructor(
    public readonly moduleId: string,
    public readonly lessonId: string
  ) {}
}
