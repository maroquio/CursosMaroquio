/**
 * UpdateLessonProgressCommand
 * Represents the intent to update lesson progress
 */
export class UpdateLessonProgressCommand {
  constructor(
    public readonly enrollmentId: string,
    public readonly lessonId: string,
    public readonly watchedSeconds?: number,
    public readonly completed?: boolean
  ) {}
}
