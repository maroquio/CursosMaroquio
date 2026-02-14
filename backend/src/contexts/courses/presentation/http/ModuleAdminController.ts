import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { CreateModuleCommand } from '../../application/commands/create-module/CreateModuleCommand.ts';
import { CreateModuleHandler } from '../../application/commands/create-module/CreateModuleHandler.ts';
import { UpdateModuleCommand } from '../../application/commands/update-module/UpdateModuleCommand.ts';
import { UpdateModuleHandler } from '../../application/commands/update-module/UpdateModuleHandler.ts';
import { DeleteModuleCommand } from '../../application/commands/delete-module/DeleteModuleCommand.ts';
import { DeleteModuleHandler } from '../../application/commands/delete-module/DeleteModuleHandler.ts';
import { ReorderModulesCommand } from '../../application/commands/reorder-modules/ReorderModulesCommand.ts';
import { ReorderModulesHandler } from '../../application/commands/reorder-modules/ReorderModulesHandler.ts';

/**
 * ModuleAdminController
 * Handles HTTP endpoints for module administration
 */
export class ModuleAdminController {
  constructor(
    private tokenService: ITokenService,
    private createModuleHandler: CreateModuleHandler,
    private updateModuleHandler: UpdateModuleHandler,
    private deleteModuleHandler: DeleteModuleHandler,
    private reorderModulesHandler: ReorderModulesHandler
  ) {}

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'courses:*');

    // Create module
    app.post(
      '/v1/admin/courses/:courseId/modules',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.createModuleHandler.execute(
            new CreateModuleCommand(ctx.params.courseId, ctx.body.title, ctx.body.description)
          ),
        successStatus: 201,
      }),
      {
        params: schema.Object({
          courseId: schema.String(),
        }),
        body: schema.Object({
          title: schema.String({ minLength: 1 }),
          description: schema.Optional(schema.Nullable(schema.String())),
        }),
        detail: {
          tags: ['Modules Admin'],
          summary: 'Create a new module',
          description: 'Creates a new module in a course (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update module
    app.put(
      '/v1/admin/courses/:courseId/modules/:moduleId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.updateModuleHandler.execute(
            new UpdateModuleCommand(
              ctx.params.moduleId,
              ctx.body.title,
              ctx.body.description,
              ctx.body.exerciseCorrectionPrompt
            )
          ),
      }),
      {
        params: schema.Object({
          courseId: schema.String(),
          moduleId: schema.String(),
        }),
        body: schema.Object({
          title: schema.Optional(schema.String({ minLength: 1 })),
          description: schema.Optional(schema.Nullable(schema.String())),
          exerciseCorrectionPrompt: schema.Optional(schema.Nullable(schema.String())),
        }),
        detail: {
          tags: ['Modules Admin'],
          summary: 'Update a module',
          description: 'Updates an existing module (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete module
    app.delete(
      '/v1/admin/courses/:courseId/modules/:moduleId',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.deleteModuleHandler.execute(
            new DeleteModuleCommand(ctx.params.courseId, ctx.params.moduleId)
          ),
        successStatus: 204,
      }),
      {
        params: schema.Object({
          courseId: schema.String(),
          moduleId: schema.String(),
        }),
        detail: {
          tags: ['Modules Admin'],
          summary: 'Delete a module',
          description: 'Deletes a module from a course (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Reorder modules
    app.post(
      '/v1/admin/courses/:courseId/modules/reorder',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.reorderModulesHandler.execute(
            new ReorderModulesCommand(ctx.params.courseId, ctx.body.modules)
          ),
      }),
      {
        params: schema.Object({
          courseId: schema.String(),
        }),
        body: schema.Object({
          modules: schema.Array(
            schema.Object({
              id: schema.String(),
              order: schema.Number({ minimum: 1 }),
            })
          ),
        }),
        detail: {
          tags: ['Modules Admin'],
          summary: 'Reorder modules',
          description: 'Reorders modules within a course (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
