/**
 * GetCourseProgressQuery
 * Query to get a student's progress in a course
 */
export class GetCourseProgressQuery {
  constructor(
    public readonly enrollmentId: string
  ) {}
}
