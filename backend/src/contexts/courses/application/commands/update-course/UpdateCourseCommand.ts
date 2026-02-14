/**
 * UpdateCourseCommand
 * Represents the intent to update a course
 */
export class UpdateCourseCommand {
  constructor(
    public readonly courseId: string,
    public readonly title?: string,
    public readonly description?: string | null,
    public readonly thumbnailUrl?: string | null,
    public readonly shortDescription?: string | null,
    public readonly price?: number,
    public readonly currency?: string,
    public readonly level?: string | null,
    public readonly categoryId?: string | null,
    public readonly tags?: string[],
    public readonly exerciseCorrectionPrompt?: string | null
  ) {}
}
