import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { CreateLessonBundleCommand } from '../../application/commands/create-lesson-bundle/CreateLessonBundleCommand.ts';
import { CreateLessonBundleHandler } from '../../application/commands/create-lesson-bundle/CreateLessonBundleHandler.ts';
import { ActivateLessonBundleCommand } from '../../application/commands/activate-lesson-bundle/ActivateLessonBundleCommand.ts';
import { ActivateLessonBundleHandler } from '../../application/commands/activate-lesson-bundle/ActivateLessonBundleHandler.ts';
import { DeleteLessonBundleCommand } from '../../application/commands/delete-lesson-bundle/DeleteLessonBundleCommand.ts';
import { DeleteLessonBundleHandler } from '../../application/commands/delete-lesson-bundle/DeleteLessonBundleHandler.ts';
import { GetLessonBundlesQuery } from '../../application/queries/get-lesson-bundles/GetLessonBundlesQuery.ts';
import { GetLessonBundlesHandler } from '../../application/queries/get-lesson-bundles/GetLessonBundlesHandler.ts';
import { GetActiveBundleQuery } from '../../application/queries/get-active-bundle/GetActiveBundleQuery.ts';
import { GetActiveBundleHandler } from '../../application/queries/get-active-bundle/GetActiveBundleHandler.ts';

/**
 * LessonBundleAdminController
 * Handles admin endpoints for lesson bundle management
 */
export class LessonBundleAdminController {
  constructor(
    private tokenService: ITokenService,
    private createBundleHandler: CreateLessonBundleHandler,
    private activateBundleHandler: ActivateLessonBundleHandler,
    private deleteBundleHandler: DeleteLessonBundleHandler,
    private getBundlesHandler: GetLessonBundlesHandler,
    private getActiveBundleHandler: GetActiveBundleHandler
  ) {}

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'courses:*');

    // Upload new bundle
    app.post(
      '/v1/admin/lessons/:lessonId/bundles',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) => {
          const file = ctx.body.file;
          if (!file) {
            return Result.fail('File is required');
          }

          let fileBuffer: Buffer;
          try {
            const arrayBuffer = await file.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
          } catch {
            return Result.fail('Failed to read file');
          }

          // Validate ZIP magic bytes (PK\x03\x04)
          if (fileBuffer.length < 4 || fileBuffer[0] !== 0x50 || fileBuffer[1] !== 0x4B || fileBuffer[2] !== 0x03 || fileBuffer[3] !== 0x04) {
            return Result.fail('File is not a valid ZIP archive');
          }

          return this.createBundleHandler.execute(
            new CreateLessonBundleCommand(
              ctx.params.lessonId,
              fileBuffer,
              ctx.body.activateImmediately === 'true' || ctx.body.activateImmediately === true
            )
          );
        },
        successStatus: 201,
      }),
      {
        params: schema.Object({
          lessonId: schema.String(),
        }),
        body: schema.Object({
          file: schema.File({
            type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
            maxSize: '50m',
          }),
          activateImmediately: schema.Optional(schema.Union([schema.Boolean(), schema.String()])),
        }),
        detail: {
          tags: ['Admin Lesson Bundles'],
          summary: 'Upload a new lesson bundle',
          description: 'Upload a ZIP file containing the lesson bundle (HTML/CSS/JS)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // List bundles for a lesson
    app.get(
      '/v1/admin/lessons/:lessonId/bundles',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.getBundlesHandler.execute(new GetLessonBundlesQuery(ctx.params.lessonId)),
      }),
      {
        params: schema.Object({
          lessonId: schema.String(),
        }),
        detail: {
          tags: ['Admin Lesson Bundles'],
          summary: 'List all bundles for a lesson',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Activate a bundle version
    app.post(
      '/v1/admin/bundles/:bundleId/activate',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.activateBundleHandler.execute(new ActivateLessonBundleCommand(ctx.params.bundleId)),
      }),
      {
        params: schema.Object({
          bundleId: schema.String(),
        }),
        detail: {
          tags: ['Admin Lesson Bundles'],
          summary: 'Activate a specific bundle version',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete a bundle version
    app.delete(
      '/v1/admin/bundles/:bundleId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.deleteBundleHandler.execute(new DeleteLessonBundleCommand(ctx.params.bundleId)),
      }),
      {
        params: schema.Object({
          bundleId: schema.String(),
        }),
        detail: {
          tags: ['Admin Lesson Bundles'],
          summary: 'Delete a bundle version',
          description: 'Cannot delete an active bundle',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get active bundle for a lesson (public endpoint)
    app.get(
      '/v1/lessons/:lessonId/bundle',
      async ({ set, params }: any) => {
        const query = new GetActiveBundleQuery(params.lessonId);
        const result = await this.getActiveBundleHandler.execute(query);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false, error: String(result.getError()) };
        }

        const bundle = result.getValue();
        if (!bundle) {
          set.status = 404;
          return { statusCode: 404, success: false, error: 'No active bundle found' };
        }

        return { statusCode: 200, success: true, data: bundle };
      },
      {
        params: schema.Object({
          lessonId: schema.String(),
        }),
        detail: {
          tags: ['Lesson Bundles'],
          summary: 'Get the active bundle for a lesson',
          description: 'Returns the currently active bundle version for a lesson',
        },
      }
    );

    return app;
  }
}
