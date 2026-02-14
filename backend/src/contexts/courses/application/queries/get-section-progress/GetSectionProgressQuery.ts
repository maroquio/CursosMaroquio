/**
 * GetSectionProgressQuery
 * Query to get section progress for a lesson within an enrollment
 */
export class GetSectionProgressQuery {
  constructor(
    public readonly enrollmentId: string,
    public readonly lessonId: string
  ) {}
}
