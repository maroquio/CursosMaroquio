import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createAuthMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { EnrollStudentCommand } from '../../application/commands/enroll-student/EnrollStudentCommand.ts';
import { EnrollStudentHandler } from '../../application/commands/enroll-student/EnrollStudentHandler.ts';
import { UpdateLessonProgressCommand } from '../../application/commands/update-lesson-progress/UpdateLessonProgressCommand.ts';
import { UpdateLessonProgressHandler } from '../../application/commands/update-lesson-progress/UpdateLessonProgressHandler.ts';
import { GetStudentEnrollmentsQuery } from '../../application/queries/get-student-enrollments/GetStudentEnrollmentsQuery.ts';
import { GetStudentEnrollmentsHandler } from '../../application/queries/get-student-enrollments/GetStudentEnrollmentsHandler.ts';
import { GetCourseProgressQuery } from '../../application/queries/get-course-progress/GetCourseProgressQuery.ts';
import { GetCourseProgressHandler } from '../../application/queries/get-course-progress/GetCourseProgressHandler.ts';
import { CompleteSectionCommand } from '../../application/commands/complete-section/CompleteSectionCommand.ts';
import { CompleteSectionHandler } from '../../application/commands/complete-section/CompleteSectionHandler.ts';
import { GetSectionProgressQuery } from '../../application/queries/get-section-progress/GetSectionProgressQuery.ts';
import { GetSectionProgressHandler } from '../../application/queries/get-section-progress/GetSectionProgressHandler.ts';
import { GetEnrollmentByCourseQuery } from '../../application/queries/get-enrollment-by-course/GetEnrollmentByCourseQuery.ts';
import { GetEnrollmentByCourseHandler } from '../../application/queries/get-enrollment-by-course/GetEnrollmentByCourseHandler.ts';

/**
 * EnrollmentController
 * Handles student enrollment and progress endpoints
 */
export class EnrollmentController {
  constructor(
    private tokenService: ITokenService,
    private enrollStudentHandler: EnrollStudentHandler,
    private updateLessonProgressHandler: UpdateLessonProgressHandler,
    private getStudentEnrollmentsHandler: GetStudentEnrollmentsHandler,
    private getCourseProgressHandler: GetCourseProgressHandler,
    private completeSectionHandler: CompleteSectionHandler,
    private getSectionProgressHandler: GetSectionProgressHandler,
    private getEnrollmentByCourseHandler: GetEnrollmentByCourseHandler
  ) {}

  public routes(app: any) {
    const authMiddleware = createAuthMiddleware(this.tokenService);

    // Enroll in a course
    app.post(
      '/v1/enrollments',
      handleRoute({
        middleware: authMiddleware,
        handler: async (ctx, user) =>
          this.enrollStudentHandler.execute(
            new EnrollStudentCommand(ctx.body.courseId, user!.userId)
          ),
        successStatus: 201,
      }),
      {
        body: schema.Object({
          courseId: schema.String(),
        }),
        detail: {
          tags: ['Student Enrollments'],
          summary: 'Enroll in a course',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get my enrollments
    app.get(
      '/v1/enrollments/me',
      handleRoute({
        middleware: authMiddleware,
        handler: async (ctx, user) =>
          this.getStudentEnrollmentsHandler.execute(
            new GetStudentEnrollmentsQuery(user!.userId, ctx.query.status)
          ),
      }),
      {
        query: schema.Object({
          status: schema.Optional(schema.String()),
        }),
        detail: {
          tags: ['Student Enrollments'],
          summary: 'Get my enrollments',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get enrollment by course
    app.get(
      '/v1/enrollments/course/:courseId',
      handleRoute({
        middleware: authMiddleware,
        handler: async (ctx, user) =>
          this.getEnrollmentByCourseHandler.execute(
            new GetEnrollmentByCourseQuery(user!.userId, ctx.params.courseId)
          ),
      }),
      {
        params: schema.Object({
          courseId: schema.String(),
        }),
        detail: {
          tags: ['Student Enrollments'],
          summary: 'Get enrollment by course',
          description: 'Returns the enrollment for the authenticated user in the specified course, or null if not enrolled',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get course progress
    app.get(
      '/v1/enrollments/:enrollmentId/progress',
      handleRoute({
        middleware: authMiddleware,
        handler: async (ctx) =>
          this.getCourseProgressHandler.execute(
            new GetCourseProgressQuery(ctx.params.enrollmentId)
          ),
      }),
      {
        params: schema.Object({
          enrollmentId: schema.String(),
        }),
        detail: {
          tags: ['Student Enrollments'],
          summary: 'Get course progress',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update lesson progress
    app.post(
      '/v1/enrollments/:enrollmentId/lessons/:lessonId/progress',
      handleRoute({
        middleware: authMiddleware,
        handler: async (ctx) =>
          this.updateLessonProgressHandler.execute(
            new UpdateLessonProgressCommand(
              ctx.params.enrollmentId,
              ctx.params.lessonId,
              ctx.body.watchedSeconds,
              ctx.body.completed
            )
          ),
      }),
      {
        params: schema.Object({
          enrollmentId: schema.String(),
          lessonId: schema.String(),
        }),
        body: schema.Object({
          watchedSeconds: schema.Optional(schema.Number()),
          completed: schema.Optional(schema.Boolean()),
        }),
        detail: {
          tags: ['Student Enrollments'],
          summary: 'Update lesson progress',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get section progress for a lesson
    app.get(
      '/v1/enrollments/:enrollmentId/lessons/:lessonId/sections',
      handleRoute({
        middleware: authMiddleware,
        handler: async (ctx) =>
          this.getSectionProgressHandler.execute(
            new GetSectionProgressQuery(ctx.params.enrollmentId, ctx.params.lessonId)
          ),
      }),
      {
        params: schema.Object({
          enrollmentId: schema.String(),
          lessonId: schema.String(),
        }),
        detail: {
          tags: ['Student Enrollments'],
          summary: 'Get section progress for a lesson',
          description: 'Returns progress for all sections in a lesson',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Complete a section
    app.post(
      '/v1/enrollments/:enrollmentId/sections/:sectionId/complete',
      handleRoute({
        middleware: authMiddleware,
        handler: async (ctx) =>
          this.completeSectionHandler.execute(
            new CompleteSectionCommand(ctx.params.enrollmentId, ctx.params.sectionId)
          ),
      }),
      {
        params: schema.Object({
          enrollmentId: schema.String(),
          sectionId: schema.String(),
        }),
        detail: {
          tags: ['Student Enrollments'],
          summary: 'Complete a section',
          description: 'Marks a section as complete. If all sections in the lesson are complete, the lesson is also marked complete.',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
