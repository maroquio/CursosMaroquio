/**
 * GetActiveBundleQuery
 * Query to get the active bundle for a lesson
 */
export class GetActiveBundleQuery {
  constructor(public readonly lessonId: string) {}
}
