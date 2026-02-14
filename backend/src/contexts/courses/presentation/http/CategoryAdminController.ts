import type { Elysia } from 'elysia';
import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { CreateCategoryCommand } from '../../application/commands/create-category/CreateCategoryCommand.ts';
import { CreateCategoryHandler } from '../../application/commands/create-category/CreateCategoryHandler.ts';
import { UpdateCategoryCommand } from '../../application/commands/update-category/UpdateCategoryCommand.ts';
import { UpdateCategoryHandler } from '../../application/commands/update-category/UpdateCategoryHandler.ts';
import { DeleteCategoryCommand } from '../../application/commands/delete-category/DeleteCategoryCommand.ts';
import { DeleteCategoryHandler } from '../../application/commands/delete-category/DeleteCategoryHandler.ts';
import { ListCategoriesQuery } from '../../application/queries/list-categories/ListCategoriesQuery.ts';
import { ListCategoriesHandler } from '../../application/queries/list-categories/ListCategoriesHandler.ts';

/**
 * CategoryAdminController
 * Handles HTTP endpoints for category administration
 */
export class CategoryAdminController {
  constructor(
    private tokenService: ITokenService,
    private createCategoryHandler: CreateCategoryHandler,
    private updateCategoryHandler: UpdateCategoryHandler,
    private deleteCategoryHandler: DeleteCategoryHandler,
    private listCategoriesHandler: ListCategoriesHandler
  ) {}

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'courses:*');

    // List categories
    app.get(
      '/v1/admin/categories',
      handleRoute({
        middleware: adminMiddleware,
        handler: async () => this.listCategoriesHandler.execute(new ListCategoriesQuery()),
      }),
      {
        detail: {
          tags: ['Categories Admin'],
          summary: 'List all categories',
          description: 'Lists all categories ordered by name (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Create category
    app.post(
      '/v1/admin/categories',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.createCategoryHandler.execute(
            new CreateCategoryCommand(ctx.body.name, ctx.body.description)
          ),
        successStatus: 201,
      }),
      {
        body: schema.Object({
          name: schema.String({ minLength: 1, maxLength: 100 }),
          description: schema.Optional(schema.Nullable(schema.String())),
        }),
        detail: {
          tags: ['Categories Admin'],
          summary: 'Create a new category',
          description: 'Creates a new category (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update category
    app.put(
      '/v1/admin/categories/:id',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.updateCategoryHandler.execute(
            new UpdateCategoryCommand(ctx.params.id, ctx.body.name, ctx.body.description)
          ),
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        body: schema.Object({
          name: schema.String({ minLength: 1, maxLength: 100 }),
          description: schema.Optional(schema.Nullable(schema.String())),
        }),
        detail: {
          tags: ['Categories Admin'],
          summary: 'Update a category',
          description: 'Updates an existing category (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete category
    app.delete(
      '/v1/admin/categories/:id',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.deleteCategoryHandler.execute(new DeleteCategoryCommand(ctx.params.id)),
        successStatus: 204,
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        detail: {
          tags: ['Categories Admin'],
          summary: 'Delete a category',
          description: 'Deletes a category (admin only). Cannot delete if category has courses.',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
