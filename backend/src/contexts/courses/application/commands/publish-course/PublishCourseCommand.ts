/**
 * PublishCourseCommand
 * Represents the intent to publish a course
 */
export class PublishCourseCommand {
  constructor(public readonly courseId: string) {}
}
