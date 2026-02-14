import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ListCoursesQuery } from './ListCoursesQuery.ts';
import { type ICourseRepository, type CourseFilters } from '../../../domain/repositories/ICourseRepository.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { CourseStatus } from '../../../domain/value-objects/CourseStatus.ts';
import { type PaginatedCoursesDto, type CourseDto } from '../../dtos/CourseDto.ts';

/**
 * ListCoursesHandler
 * Handles listing courses with pagination and filters
 */
export class ListCoursesHandler implements IQueryHandler<ListCoursesQuery, PaginatedCoursesDto> {
  constructor(
    private courseRepository: ICourseRepository,
    private enrollmentRepository: IEnrollmentRepository
  ) {}

  async execute(query: ListCoursesQuery): Promise<Result<PaginatedCoursesDto>> {
    // Build filters
    const filters: CourseFilters = {};

    if (query.publicOnly) {
      filters.status = CourseStatus.PUBLISHED;
    } else if (query.status) {
      filters.status = query.status;
    }

    if (query.instructorId) {
      const instructorIdResult = UserId.createFromString(query.instructorId);
      if (instructorIdResult.isFailure) {
        return Result.fail(ErrorCode.INVALID_USER_ID);
      }
      filters.instructorId = instructorIdResult.getValue();
    }

    if (query.search) {
      filters.search = query.search;
    }

    // Fetch courses
    const result = await this.courseRepository.findAllPaginated(
      query.page,
      query.limit,
      filters
    );

    // Map to DTOs with enrollment counts
    const courses: CourseDto[] = await Promise.all(
      result.courses.map(async course => {
        const enrollmentCount = await this.enrollmentRepository.countByCourse(course.getId());
        return {
          id: course.getId().toValue(),
          title: course.getTitle(),
          slug: course.getSlug().getValue(),
          description: course.getDescription(),
          thumbnailUrl: course.getThumbnailUrl(),
          bannerUrl: course.getBannerUrl(),
          shortDescription: course.getShortDescription(),
          price: course.getPrice(),
          currency: course.getCurrency(),
          level: course.getLevel(),
          categoryId: course.getCategoryId(),
          tags: course.getTags(),
          status: course.getStatus(),
          instructorId: course.getInstructorId().toValue(),
          totalLessons: course.getLessonCount(),
          totalEnrollments: enrollmentCount,
          totalDuration: course.getTotalDuration(),
          exerciseCorrectionPrompt: course.getExerciseCorrectionPrompt(),
          createdAt: course.getCreatedAt().toISOString(),
          updatedAt: course.getUpdatedAt().toISOString(),
          publishedAt: course.getPublishedAt()?.toISOString() ?? null,
        };
      })
    );

    return Result.ok({
      courses,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }
}
