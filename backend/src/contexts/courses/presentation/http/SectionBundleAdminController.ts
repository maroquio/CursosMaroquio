import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { CreateSectionBundleCommand } from '../../application/commands/create-section-bundle/CreateSectionBundleCommand.ts';
import { CreateSectionBundleHandler } from '../../application/commands/create-section-bundle/CreateSectionBundleHandler.ts';
import { ActivateSectionBundleCommand } from '../../application/commands/activate-section-bundle/ActivateSectionBundleCommand.ts';
import { ActivateSectionBundleHandler } from '../../application/commands/activate-section-bundle/ActivateSectionBundleHandler.ts';
import { DeleteSectionBundleCommand } from '../../application/commands/delete-section-bundle/DeleteSectionBundleCommand.ts';
import { DeleteSectionBundleHandler } from '../../application/commands/delete-section-bundle/DeleteSectionBundleHandler.ts';
import { GetSectionBundlesQuery } from '../../application/queries/get-section-bundles/GetSectionBundlesQuery.ts';
import { GetSectionBundlesHandler } from '../../application/queries/get-section-bundles/GetSectionBundlesHandler.ts';
import { GetActiveSectionBundleQuery } from '../../application/queries/get-active-section-bundle/GetActiveSectionBundleQuery.ts';
import { GetActiveSectionBundleHandler } from '../../application/queries/get-active-section-bundle/GetActiveSectionBundleHandler.ts';

/**
 * SectionBundleAdminController
 * Handles admin endpoints for section bundle management
 */
export class SectionBundleAdminController {
  constructor(
    private tokenService: ITokenService,
    private createBundleHandler: CreateSectionBundleHandler,
    private activateBundleHandler: ActivateSectionBundleHandler,
    private deleteBundleHandler: DeleteSectionBundleHandler,
    private getBundlesHandler: GetSectionBundlesHandler,
    private getActiveBundleHandler: GetActiveSectionBundleHandler
  ) {}

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'courses:*');

    // Upload new bundle
    app.post(
      '/v1/admin/sections/:sectionId/bundles',
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
            new CreateSectionBundleCommand(
              ctx.params.sectionId,
              fileBuffer,
              ctx.body.activateImmediately === 'true' || ctx.body.activateImmediately === true
            )
          );
        },
        successStatus: 201,
      }),
      {
        params: schema.Object({
          sectionId: schema.String(),
        }),
        body: schema.Object({
          file: schema.File({
            type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
            maxSize: '50m',
          }),
          activateImmediately: schema.Optional(schema.Union([schema.Boolean(), schema.String()])),
        }),
        detail: {
          tags: ['Admin Section Bundles'],
          summary: 'Upload a new section bundle',
          description: 'Upload a ZIP file containing the section bundle (HTML/CSS/JS)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // List bundles for a section
    app.get(
      '/v1/admin/sections/:sectionId/bundles',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.getBundlesHandler.execute(new GetSectionBundlesQuery(ctx.params.sectionId)),
      }),
      {
        params: schema.Object({
          sectionId: schema.String(),
        }),
        detail: {
          tags: ['Admin Section Bundles'],
          summary: 'List all bundles for a section',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Activate a bundle version
    app.post(
      '/v1/admin/section-bundles/:bundleId/activate',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.activateBundleHandler.execute(new ActivateSectionBundleCommand(ctx.params.bundleId)),
      }),
      {
        params: schema.Object({
          bundleId: schema.String(),
        }),
        detail: {
          tags: ['Admin Section Bundles'],
          summary: 'Activate a specific section bundle version',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete a bundle version
    app.delete(
      '/v1/admin/section-bundles/:bundleId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.deleteBundleHandler.execute(new DeleteSectionBundleCommand(ctx.params.bundleId)),
      }),
      {
        params: schema.Object({
          bundleId: schema.String(),
        }),
        detail: {
          tags: ['Admin Section Bundles'],
          summary: 'Delete a section bundle version',
          description: 'Cannot delete an active bundle',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get active bundle for a section (public endpoint)
    app.get(
      '/v1/sections/:sectionId/bundle',
      async ({ set, params }: any) => {
        const query = new GetActiveSectionBundleQuery(params.sectionId);
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
          sectionId: schema.String(),
        }),
        detail: {
          tags: ['Section Bundles'],
          summary: 'Get the active bundle for a section',
          description: 'Returns the currently active bundle version for a section',
        },
      }
    );

    return app;
  }
}
