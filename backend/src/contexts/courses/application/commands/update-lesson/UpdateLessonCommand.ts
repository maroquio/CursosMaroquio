/**
 * UpdateLessonCommand
 * Represents the intent to update a lesson
 */
export class UpdateLessonCommand {
  constructor(
    public readonly lessonId: string,
    public readonly title?: string,
    public readonly description?: string | null,
    public readonly videoUrl?: string | null,
    public readonly duration?: number,
    public readonly exerciseCorrectionPrompt?: string | null
  ) {}
}
