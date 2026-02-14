/**
 * CreateCourseCommand
 * Represents the intent to create a new course
 */
export class CreateCourseCommand {
  constructor(
    public readonly title: string,
    public readonly instructorId: string,
    public readonly description?: string | null,
    public readonly thumbnailUrl?: string | null,
    public readonly bannerUrl?: string | null,
    public readonly shortDescription?: string | null,
    public readonly price?: number,
    public readonly currency?: string,
    public readonly level?: string | null,
    public readonly categoryId?: string | null,
    public readonly tags?: string[]
  ) {}
}
