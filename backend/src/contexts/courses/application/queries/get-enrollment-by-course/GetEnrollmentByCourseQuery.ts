/**
 * GetEnrollmentByCourseQuery
 * Query to get enrollment by student and course
 */
export class GetEnrollmentByCourseQuery {
  constructor(
    public readonly studentId: string,
    public readonly courseId: string
  ) {}
}
