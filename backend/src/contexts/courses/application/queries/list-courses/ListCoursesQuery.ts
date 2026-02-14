import { CourseStatus } from '../../../domain/value-objects/CourseStatus.ts';

/**
 * ListCoursesQuery
 * Query to list courses with pagination and filters
 */
export class ListCoursesQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly status?: CourseStatus,
    public readonly instructorId?: string,
    public readonly search?: string,
    public readonly publicOnly: boolean = false
  ) {}
}
