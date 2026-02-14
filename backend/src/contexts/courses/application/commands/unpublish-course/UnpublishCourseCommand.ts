/**
 * UnpublishCourseCommand
 * Represents the intent to unpublish a course
 */
export class UnpublishCourseCommand {
  constructor(public readonly courseId: string) {}
}
