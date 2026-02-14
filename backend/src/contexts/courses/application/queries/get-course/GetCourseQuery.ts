/**
 * GetCourseQuery
 * Query to get a course by ID or slug
 */
export class GetCourseQuery {
  constructor(
    public readonly courseId?: string,
    public readonly slug?: string
  ) {}
}
