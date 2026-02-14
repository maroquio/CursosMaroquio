import { t as schema } from 'elysia';
import { mkdir, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { CreateCourseCommand } from '../../application/commands/create-course/CreateCourseCommand.ts';
import { CreateCourseHandler } from '../../application/commands/create-course/CreateCourseHandler.ts';
import { UpdateCourseCommand } from '../../application/commands/update-course/UpdateCourseCommand.ts';
import { UpdateCourseHandler } from '../../application/commands/update-course/UpdateCourseHandler.ts';
import { PublishCourseCommand } from '../../application/commands/publish-course/PublishCourseCommand.ts';
import { PublishCourseHandler } from '../../application/commands/publish-course/PublishCourseHandler.ts';
import { UnpublishCourseCommand } from '../../application/commands/unpublish-course/UnpublishCourseCommand.ts';
import { UnpublishCourseHandler } from '../../application/commands/unpublish-course/UnpublishCourseHandler.ts';
import { AddLessonCommand } from '../../application/commands/add-lesson/AddLessonCommand.ts';
import { AddLessonHandler } from '../../application/commands/add-lesson/AddLessonHandler.ts';
import { UpdateLessonCommand } from '../../application/commands/update-lesson/UpdateLessonCommand.ts';
import { UpdateLessonHandler } from '../../application/commands/update-lesson/UpdateLessonHandler.ts';
import { DeleteLessonCommand } from '../../application/commands/delete-lesson/DeleteLessonCommand.ts';
import { DeleteLessonHandler } from '../../application/commands/delete-lesson/DeleteLessonHandler.ts';
import { ReorderLessonsCommand } from '../../application/commands/reorder-lessons/ReorderLessonsCommand.ts';
import { ReorderLessonsHandler } from '../../application/commands/reorder-lessons/ReorderLessonsHandler.ts';
import { GetCourseQuery } from '../../application/queries/get-course/GetCourseQuery.ts';
import { GetCourseHandler } from '../../application/queries/get-course/GetCourseHandler.ts';
import { ListCoursesQuery } from '../../application/queries/list-courses/ListCoursesQuery.ts';
import { ListCoursesHandler } from '../../application/queries/list-courses/ListCoursesHandler.ts';
import { CourseStatus } from '../../domain/value-objects/CourseStatus.ts';
import { CourseId } from '../../domain/value-objects/CourseId.ts';
import type { ICourseRepository } from '../../domain/repositories/ICourseRepository.ts';
import type { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository.ts';
import { EnrollmentStatus } from '../../domain/value-objects/EnrollmentStatus.ts';
import { createLogger } from '@shared/infrastructure/logging/Logger.ts';

const logger = createLogger('CourseAdminController');

// Allowed MIME types for thumbnails
const ALLOWED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB
const THUMBNAILS_STORAGE_PATH = './uploads/thumbnails';

/**
 * CourseAdminController
 * Handles admin endpoints for course management
 */
export class CourseAdminController {
  constructor(
    private tokenService: ITokenService,
    private createCourseHandler: CreateCourseHandler,
    private updateCourseHandler: UpdateCourseHandler,
    private publishCourseHandler: PublishCourseHandler,
    private unpublishCourseHandler: UnpublishCourseHandler,
    private addLessonHandler: AddLessonHandler,
    private updateLessonHandler: UpdateLessonHandler,
    private deleteLessonHandler: DeleteLessonHandler,
    private reorderLessonsHandler: ReorderLessonsHandler,
    private getCourseHandler: GetCourseHandler,
    private listCoursesHandler: ListCoursesHandler,
    private courseRepository: ICourseRepository,
    private enrollmentRepository: IEnrollmentRepository
  ) {}

  /**
   * Get file extension from MIME type
   */
  private getExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg';
    }
  }

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'courses:*');

    // Dashboard stats (admin)
    app.get(
      '/v1/admin/dashboard',
      async ({ request, set }: any) => {
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        try {
          // Get course counts
          const [totalCourses, publishedCourses, draftCourses] = await Promise.all([
            this.courseRepository.count(),
            this.courseRepository.count({ status: CourseStatus.PUBLISHED }),
            this.courseRepository.count({ status: CourseStatus.DRAFT }),
          ]);

          // Get enrollment counts
          const [totalEnrollments, activeEnrollments, completedEnrollments] = await Promise.all([
            this.enrollmentRepository.countAll(),
            this.enrollmentRepository.countAll(EnrollmentStatus.ACTIVE),
            this.enrollmentRepository.countAll(EnrollmentStatus.COMPLETED),
          ]);

          // Get recent enrollments
          const recentEnrollments = await this.enrollmentRepository.findRecent(10);

          const stats = {
            totalCourses,
            publishedCourses,
            draftCourses,
            totalEnrollments,
            activeEnrollments,
            completedEnrollments,
            totalRevenue: 0, // Not implemented yet
            averageRating: 0, // Not implemented yet
            recentEnrollments: recentEnrollments.map((e) => ({
              id: e.getId().toValue(),
              courseId: e.getCourseId().toValue(),
              studentId: e.getStudentId().toValue(),
              status: e.getStatus(),
              startedAt: e.getEnrolledAt().toISOString(),
              completedAt: e.getCompletedAt()?.toISOString() || null,
            })),
            popularCourses: [],
            monthlyEnrollments: [],
          };

          return { statusCode: 200, success: true, data: stats };
        } catch (error) {
          logger.error('Dashboard stats error', error instanceof Error ? error : new Error(String(error)));
          set.status = 500;
          return { statusCode: 500, success: false, error: 'Failed to fetch dashboard stats' };
        }
      }
    );

    // List courses (admin)
    app.get(
      '/v1/admin/courses',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.listCoursesHandler.execute(
            new ListCoursesQuery(
              Number(ctx.query.page) || 1,
              Number(ctx.query.limit) || 10,
              ctx.query.status as CourseStatus | undefined,
              ctx.query.instructorId,
              ctx.query.search,
              false
            )
          ),
      }),
      {
        query: schema.Object({
          page: schema.Optional(schema.String()),
          limit: schema.Optional(schema.String()),
          status: schema.Optional(schema.String()),
          instructorId: schema.Optional(schema.String()),
          search: schema.Optional(schema.String()),
        }),
        detail: {
          tags: ['Admin Courses'],
          summary: 'List all courses (admin)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get course by ID (admin)
    app.get(
      '/v1/admin/courses/:courseId',
      async ({ request, set, params }: any) => {
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const query = new GetCourseQuery(params.courseId);
        const result = await this.getCourseHandler.execute(query);

        if (result.isFailure) {
          set.status = 404;
          return { statusCode: 404, success: false, error: String(result.getError()) };
        }

        return { statusCode: 200, success: true, data: result.getValue() };
      },
      {
        params: schema.Object({
          courseId: schema.String(),
        }),
        detail: {
          tags: ['Admin Courses'],
          summary: 'Get course by ID (admin)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Create course
    app.post(
      '/v1/admin/courses',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx, user) =>
          this.createCourseHandler.execute(
            new CreateCourseCommand(
              ctx.body.title,
              user!.userId,
              ctx.body.description,
              ctx.body.thumbnailUrl,
              ctx.body.shortDescription,
              ctx.body.price,
              ctx.body.currency,
              ctx.body.level,
              ctx.body.categoryId,
              ctx.body.tags
            )
          ),
        successStatus: 201,
      }),
      {
        body: schema.Object({
          title: schema.String({ minLength: 3, maxLength: 200 }),
          description: schema.Optional(schema.String({ maxLength: 2000 })),
          thumbnailUrl: schema.Optional(schema.String()),
          shortDescription: schema.Optional(schema.String({ maxLength: 500 })),
          price: schema.Optional(schema.Number({ minimum: 0 })),
          currency: schema.Optional(schema.String({ minLength: 3, maxLength: 3 })),
          level: schema.Optional(schema.String()),
          categoryId: schema.Optional(schema.String()),
          tags: schema.Optional(schema.Array(schema.String())),
        }),
        detail: {
          tags: ['Admin Courses'],
          summary: 'Create a new course',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update course
    app.put(
      '/v1/admin/courses/:courseId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.updateCourseHandler.execute(
            new UpdateCourseCommand(
              ctx.params.courseId,
              ctx.body.title,
              ctx.body.description,
              ctx.body.thumbnailUrl,
              ctx.body.shortDescription,
              ctx.body.price,
              ctx.body.currency,
              ctx.body.level,
              ctx.body.categoryId,
              ctx.body.tags,
              ctx.body.exerciseCorrectionPrompt
            )
          ),
      }),
      {
        params: schema.Object({
          courseId: schema.String(),
        }),
        body: schema.Object({
          title: schema.Optional(schema.String({ minLength: 3, maxLength: 200 })),
          description: schema.Optional(schema.String({ maxLength: 2000 })),
          thumbnailUrl: schema.Optional(schema.String()),
          shortDescription: schema.Optional(schema.String({ maxLength: 500 })),
          price: schema.Optional(schema.Number({ minimum: 0 })),
          currency: schema.Optional(schema.String({ minLength: 3, maxLength: 3 })),
          level: schema.Optional(schema.String()),
          categoryId: schema.Optional(schema.String()),
          tags: schema.Optional(schema.Array(schema.String())),
          exerciseCorrectionPrompt: schema.Optional(schema.Nullable(schema.String())),
        }),
        detail: {
          tags: ['Admin Courses'],
          summary: 'Update a course',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Publish course
    app.post(
      '/v1/admin/courses/:courseId/publish',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.publishCourseHandler.execute(
            new PublishCourseCommand(ctx.params.courseId)
          ),
      }),
      {
        params: schema.Object({
          courseId: schema.String(),
        }),
        detail: {
          tags: ['Admin Courses'],
          summary: 'Publish a course',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Unpublish course
    app.post(
      '/v1/admin/courses/:courseId/unpublish',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.unpublishCourseHandler.execute(
            new UnpublishCourseCommand(ctx.params.courseId)
          ),
      }),
      {
        params: schema.Object({
          courseId: schema.String(),
        }),
        detail: {
          tags: ['Admin Courses'],
          summary: 'Unpublish a course',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Upload course thumbnail
    app.post(
      '/v1/admin/courses/:courseId/thumbnail',
      async ({ request, set, params, body }: any) => {
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        // Validate course ID
        const courseIdResult = CourseId.createFromString(params.courseId);
        if (courseIdResult.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false, error: 'Invalid course ID' };
        }
        const courseId = courseIdResult.getValue();

        // Find course
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
          set.status = 404;
          return { statusCode: 404, success: false, error: 'Course not found' };
        }

        // Get the file from the request body
        const file = body.thumbnail;
        if (!file || !(file instanceof File)) {
          set.status = 400;
          return { statusCode: 400, success: false, error: 'No thumbnail file provided' };
        }

        // Validate file type
        if (!ALLOWED_THUMBNAIL_TYPES.includes(file.type)) {
          set.status = 400;
          return { statusCode: 400, success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' };
        }

        // Validate file size
        if (file.size > MAX_THUMBNAIL_SIZE) {
          set.status = 400;
          return { statusCode: 400, success: false, error: 'File too large. Maximum size: 2MB' };
        }

        // Create storage directory if it doesn't exist
        try {
          await mkdir(THUMBNAILS_STORAGE_PATH, { recursive: true });
        } catch {
          set.status = 500;
          return { statusCode: 500, success: false, error: 'Failed to create storage directory' };
        }

        // Generate unique filename
        const extension = this.getExtension(file.type);
        const filename = `${params.courseId}_${Date.now()}.${extension}`;
        const filepath = join(THUMBNAILS_STORAGE_PATH, filename);

        // Save file
        try {
          const arrayBuffer = await file.arrayBuffer();
          await Bun.write(filepath, arrayBuffer);
        } catch {
          set.status = 500;
          return { statusCode: 500, success: false, error: 'Failed to save file' };
        }

        // Delete old thumbnail if exists
        const oldThumbnailUrl = course.getThumbnailUrl();
        if (oldThumbnailUrl && oldThumbnailUrl.startsWith('/uploads/thumbnails/')) {
          const oldFilename = oldThumbnailUrl.split('/').pop();
          if (oldFilename) {
            const oldFilepath = join(THUMBNAILS_STORAGE_PATH, oldFilename);
            try {
              await access(oldFilepath);
              await rm(oldFilepath);
            } catch {
              // Ignore if old file doesn't exist
            }
          }
        }

        // Generate thumbnail URL
        const thumbnailUrl = `/uploads/thumbnails/${filename}`;

        // Update course thumbnailUrl
        course.updateThumbnailUrl(thumbnailUrl);

        // Persist updated course
        try {
          await this.courseRepository.save(course);
        } catch {
          // Try to delete the uploaded file on failure
          try {
            await rm(filepath);
          } catch {
            // Ignore
          }
          set.status = 500;
          return { statusCode: 500, success: false, error: 'Failed to update course' };
        }

        return { statusCode: 200, success: true, data: { url: thumbnailUrl } };
      },
      {
        params: schema.Object({
          courseId: schema.String(),
        }),
        body: schema.Object({
          thumbnail: schema.File({
            type: ALLOWED_THUMBNAIL_TYPES,
            maxSize: MAX_THUMBNAIL_SIZE,
          }),
        }),
        detail: {
          tags: ['Admin Courses'],
          summary: 'Upload course thumbnail',
          description: 'Upload a thumbnail image for the course. Accepts JPEG, PNG, or WebP files up to 2MB.',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Add lesson to module
    app.post(
      '/v1/admin/modules/:moduleId/lessons',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.addLessonHandler.execute(
            new AddLessonCommand(
              ctx.params.moduleId,
              ctx.body.title,
              ctx.body.description,
              ctx.body.videoUrl,
              ctx.body.duration
            )
          ),
        successStatus: 201,
      }),
      {
        params: schema.Object({
          moduleId: schema.String(),
        }),
        body: schema.Object({
          title: schema.String({ minLength: 1, maxLength: 200 }),
          description: schema.Optional(schema.String()),
          videoUrl: schema.Optional(schema.String()),
          duration: schema.Optional(schema.Number()),
        }),
        detail: {
          tags: ['Admin Lessons'],
          summary: 'Add a lesson to a module',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update lesson
    app.put(
      '/v1/admin/modules/:moduleId/lessons/:lessonId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.updateLessonHandler.execute(
            new UpdateLessonCommand(
              ctx.params.lessonId,
              ctx.body.title,
              ctx.body.description,
              ctx.body.videoUrl,
              ctx.body.duration,
              ctx.body.exerciseCorrectionPrompt
            )
          ),
      }),
      {
        params: schema.Object({
          moduleId: schema.String(),
          lessonId: schema.String(),
        }),
        body: schema.Object({
          title: schema.Optional(schema.String({ minLength: 1, maxLength: 200 })),
          description: schema.Optional(schema.Nullable(schema.String())),
          videoUrl: schema.Optional(schema.Nullable(schema.String())),
          duration: schema.Optional(schema.Number()),
          exerciseCorrectionPrompt: schema.Optional(schema.Nullable(schema.String())),
        }),
        detail: {
          tags: ['Admin Lessons'],
          summary: 'Update a lesson',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete lesson
    app.delete(
      '/v1/admin/modules/:moduleId/lessons/:lessonId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.deleteLessonHandler.execute(
            new DeleteLessonCommand(ctx.params.moduleId, ctx.params.lessonId)
          ),
        successStatus: 204,
      }),
      {
        params: schema.Object({
          moduleId: schema.String(),
          lessonId: schema.String(),
        }),
        detail: {
          tags: ['Admin Lessons'],
          summary: 'Delete a lesson from a module',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Reorder lessons within a module
    app.post(
      '/v1/admin/modules/:moduleId/lessons/reorder',
      async ({ request, set, params, body }: any) => {
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const command = new ReorderLessonsCommand(params.moduleId, body.lessons);
        const result = await this.reorderLessonsHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false, error: String(result.getError()) };
        }

        return { statusCode: 200, success: true, message: 'Lessons reordered successfully' };
      },
      {
        params: schema.Object({
          moduleId: schema.String(),
        }),
        body: schema.Object({
          lessons: schema.Array(
            schema.Object({
              id: schema.String(),
              order: schema.Number({ minimum: 1 }),
            })
          ),
        }),
        detail: {
          tags: ['Admin Lessons'],
          summary: 'Reorder lessons within a module',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
