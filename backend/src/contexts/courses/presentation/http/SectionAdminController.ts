import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { CreateSectionCommand } from '../../application/commands/create-section/CreateSectionCommand.ts';
import { CreateSectionHandler } from '../../application/commands/create-section/CreateSectionHandler.ts';
import { UpdateSectionCommand } from '../../application/commands/update-section/UpdateSectionCommand.ts';
import { UpdateSectionHandler } from '../../application/commands/update-section/UpdateSectionHandler.ts';
import { DeleteSectionCommand } from '../../application/commands/delete-section/DeleteSectionCommand.ts';
import { DeleteSectionHandler } from '../../application/commands/delete-section/DeleteSectionHandler.ts';
import { ReorderSectionsCommand } from '../../application/commands/reorder-sections/ReorderSectionsCommand.ts';
import { ReorderSectionsHandler } from '../../application/commands/reorder-sections/ReorderSectionsHandler.ts';
import { GetSectionsByLessonQuery } from '../../application/queries/get-sections-by-lesson/GetSectionsByLessonQuery.ts';
import { GetSectionsByLessonHandler } from '../../application/queries/get-sections-by-lesson/GetSectionsByLessonHandler.ts';
import { SectionContentType } from '../../domain/value-objects/SectionContentType.ts';

/**
 * SectionAdminController
 * Handles HTTP endpoints for section administration
 */
export class SectionAdminController {
  constructor(
    private tokenService: ITokenService,
    private createSectionHandler: CreateSectionHandler,
    private updateSectionHandler: UpdateSectionHandler,
    private deleteSectionHandler: DeleteSectionHandler,
    private reorderSectionsHandler: ReorderSectionsHandler,
    private getSectionsByLessonHandler: GetSectionsByLessonHandler
  ) {}

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'courses:*');

    // Get all sections for a lesson
    app.get(
      '/v1/admin/lessons/:lessonId/sections',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.getSectionsByLessonHandler.execute(new GetSectionsByLessonQuery(ctx.params.lessonId)),
      }),
      {
        params: schema.Object({
          lessonId: schema.String(),
        }),
        detail: {
          tags: ['Sections Admin'],
          summary: 'Get sections for a lesson',
          description: 'Retrieves all sections for a lesson (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Create section
    app.post(
      '/v1/admin/lessons/:lessonId/sections',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) => {
          const contentType = (ctx.body.contentType as SectionContentType) ?? SectionContentType.TEXT;
          return this.createSectionHandler.execute(
            new CreateSectionCommand(
              ctx.params.lessonId,
              ctx.body.title,
              contentType,
              ctx.body.description,
              ctx.body.content
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
          title: schema.String({ minLength: 1 }),
          description: schema.Optional(schema.Nullable(schema.String())),
          contentType: schema.Optional(
            schema.Union([
              schema.Literal('text'),
              schema.Literal('video'),
              schema.Literal('quiz'),
              schema.Literal('exercise'),
            ])
          ),
          content: schema.Optional(schema.Any()),
        }),
        detail: {
          tags: ['Sections Admin'],
          summary: 'Create a new section',
          description: 'Creates a new section in a lesson (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update section
    app.put(
      '/v1/admin/lessons/:lessonId/sections/:sectionId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.updateSectionHandler.execute(
            new UpdateSectionCommand(
              ctx.params.sectionId,
              ctx.body.title,
              ctx.body.description,
              ctx.body.contentType as SectionContentType | undefined,
              ctx.body.content
            )
          ),
      }),
      {
        params: schema.Object({
          lessonId: schema.String(),
          sectionId: schema.String(),
        }),
        body: schema.Object({
          title: schema.Optional(schema.String({ minLength: 1 })),
          description: schema.Optional(schema.Nullable(schema.String())),
          contentType: schema.Optional(
            schema.Union([
              schema.Literal('text'),
              schema.Literal('video'),
              schema.Literal('quiz'),
              schema.Literal('exercise'),
            ])
          ),
          content: schema.Optional(schema.Any()),
        }),
        detail: {
          tags: ['Sections Admin'],
          summary: 'Update a section',
          description: 'Updates an existing section (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete section
    app.delete(
      '/v1/admin/lessons/:lessonId/sections/:sectionId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.deleteSectionHandler.execute(new DeleteSectionCommand(ctx.params.sectionId)),
        successStatus: 204,
      }),
      {
        params: schema.Object({
          lessonId: schema.String(),
          sectionId: schema.String(),
        }),
        detail: {
          tags: ['Sections Admin'],
          summary: 'Delete a section',
          description: 'Deletes a section from a lesson (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Reorder sections
    app.post(
      '/v1/admin/lessons/:lessonId/sections/reorder',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.reorderSectionsHandler.execute(
            new ReorderSectionsCommand(ctx.params.lessonId, ctx.body.sections)
          ),
      }),
      {
        params: schema.Object({
          lessonId: schema.String(),
        }),
        body: schema.Object({
          sections: schema.Array(
            schema.Object({
              id: schema.String(),
              order: schema.Number({ minimum: 1 }),
            })
          ),
        }),
        detail: {
          tags: ['Sections Admin'],
          summary: 'Reorder sections',
          description: 'Reorders sections within a lesson (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
