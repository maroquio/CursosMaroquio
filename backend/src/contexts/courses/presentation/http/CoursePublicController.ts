import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createOptionalAuthMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { GetCourseQuery } from '../../application/queries/get-course/GetCourseQuery.ts';
import { GetCourseHandler } from '../../application/queries/get-course/GetCourseHandler.ts';
import { ListCoursesQuery } from '../../application/queries/list-courses/ListCoursesQuery.ts';
import { ListCoursesHandler } from '../../application/queries/list-courses/ListCoursesHandler.ts';

/**
 * CoursePublicController
 * Handles public endpoints for viewing courses
 */
export class CoursePublicController {
  constructor(
    private getCourseHandler: GetCourseHandler,
    private listCoursesHandler: ListCoursesHandler,
    private tokenService: ITokenService
  ) {}

  public routes(app: any) {
    // List published courses
    app.get(
      '/v1/courses',
      handleRoute({
        handler: async (ctx) =>
          this.listCoursesHandler.execute(
            new ListCoursesQuery(
              Number(ctx.query.page) || 1,
              Number(ctx.query.limit) || 10,
              undefined,
              undefined,
              ctx.query.search,
              true // publicOnly
            )
          ),
      }),
      {
        query: schema.Object({
          page: schema.Optional(schema.String()),
          limit: schema.Optional(schema.String()),
          search: schema.Optional(schema.String()),
        }),
        detail: {
          tags: ['Public Courses'],
          summary: 'List published courses',
        },
      }
    );

    // Get course by slug
    app.get(
      '/v1/courses/:slug',
      async ({ params, set, request }: any) => {
        const query = new GetCourseQuery(undefined, params.slug);
        const result = await this.getCourseHandler.execute(query);

        if (result.isFailure) {
          set.status = 404;
          return { statusCode: 404, success: false, error: String(result.getError()) };
        }

        const course = result.getValue();

        // Check if admin can preview draft courses
        let canPreviewDraft = false;
        const optionalAuthMiddleware = createOptionalAuthMiddleware(this.tokenService);
        const authResult = await optionalAuthMiddleware({ request } as any);
        if (authResult.user) {
          // Admin role has permission to view all courses
          const isAdmin = authResult.user.roles.includes('admin');
          if (isAdmin) {
            canPreviewDraft = true;
          }
        }

        // Only return published courses (unless admin)
        if (course.status !== 'published' && !canPreviewDraft) {
          set.status = 404;
          return { statusCode: 404, success: false, error: 'Course not found' };
        }

        return { statusCode: 200, success: true, data: course };
      },
      {
        params: schema.Object({
          slug: schema.String(),
        }),
        detail: {
          tags: ['Public Courses'],
          summary: 'Get course by slug',
        },
      }
    );

    return app;
  }
}
