/**
 * GetLessonBundlesQuery
 * Query to list all bundles for a lesson
 */
export class GetLessonBundlesQuery {
  constructor(public readonly lessonId: string) {}
}
