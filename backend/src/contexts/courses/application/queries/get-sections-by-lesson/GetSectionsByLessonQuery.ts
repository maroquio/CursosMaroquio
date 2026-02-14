/**
 * GetSectionsByLessonQuery
 * Query to get all sections for a lesson
 */
export class GetSectionsByLessonQuery {
  constructor(
    public readonly lessonId: string
  ) {}
}
