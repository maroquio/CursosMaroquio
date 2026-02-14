import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { CreateManufacturerCommand } from '../../application/commands/create-manufacturer/CreateManufacturerCommand.ts';
import { CreateManufacturerHandler } from '../../application/commands/create-manufacturer/CreateManufacturerHandler.ts';
import { UpdateManufacturerCommand } from '../../application/commands/update-manufacturer/UpdateManufacturerCommand.ts';
import { UpdateManufacturerHandler } from '../../application/commands/update-manufacturer/UpdateManufacturerHandler.ts';
import { DeleteManufacturerCommand } from '../../application/commands/delete-manufacturer/DeleteManufacturerCommand.ts';
import { DeleteManufacturerHandler } from '../../application/commands/delete-manufacturer/DeleteManufacturerHandler.ts';
import { ListManufacturersQuery } from '../../application/queries/list-manufacturers/ListManufacturersQuery.ts';
import { ListManufacturersHandler } from '../../application/queries/list-manufacturers/ListManufacturersHandler.ts';
import { GetManufacturerQuery } from '../../application/queries/get-manufacturer/GetManufacturerQuery.ts';
import { GetManufacturerHandler } from '../../application/queries/get-manufacturer/GetManufacturerHandler.ts';

/**
 * LlmManufacturerAdminController
 * Handles HTTP endpoints for LLM manufacturer administration
 */
export class LlmManufacturerAdminController {
  constructor(
    private tokenService: ITokenService,
    private createHandler: CreateManufacturerHandler,
    private updateHandler: UpdateManufacturerHandler,
    private deleteHandler: DeleteManufacturerHandler,
    private listHandler: ListManufacturersHandler,
    private getHandler: GetManufacturerHandler
  ) {}

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'ai:*');

    // List manufacturers
    app.get(
      '/v1/admin/llm-manufacturers',
      handleRoute({
        middleware: adminMiddleware,
        handler: async () => this.listHandler.execute(new ListManufacturersQuery()),
      }),
      {
        detail: {
          tags: ['LLM Manufacturers Admin'],
          summary: 'List all LLM manufacturers',
          description: 'Lists all LLM manufacturers ordered by name (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get manufacturer by ID
    app.get(
      '/v1/admin/llm-manufacturers/:id',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.getHandler.execute(new GetManufacturerQuery(ctx.params.id)),
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        detail: {
          tags: ['LLM Manufacturers Admin'],
          summary: 'Get an LLM manufacturer',
          description: 'Gets an LLM manufacturer by ID (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Create manufacturer
    app.post(
      '/v1/admin/llm-manufacturers',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.createHandler.execute(
            new CreateManufacturerCommand(ctx.body.name, ctx.body.slug)
          ),
        successStatus: 201,
      }),
      {
        body: schema.Object({
          name: schema.String({ minLength: 1, maxLength: 100 }),
          slug: schema.String({ minLength: 1, maxLength: 100 }),
        }),
        detail: {
          tags: ['LLM Manufacturers Admin'],
          summary: 'Create a new LLM manufacturer',
          description: 'Creates a new LLM manufacturer (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update manufacturer
    app.put(
      '/v1/admin/llm-manufacturers/:id',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.updateHandler.execute(
            new UpdateManufacturerCommand(ctx.params.id, ctx.body.name, ctx.body.slug)
          ),
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        body: schema.Object({
          name: schema.Optional(schema.String({ minLength: 1, maxLength: 100 })),
          slug: schema.Optional(schema.String({ minLength: 1, maxLength: 100 })),
        }),
        detail: {
          tags: ['LLM Manufacturers Admin'],
          summary: 'Update an LLM manufacturer',
          description: 'Updates an existing LLM manufacturer (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete manufacturer
    app.delete(
      '/v1/admin/llm-manufacturers/:id',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.deleteHandler.execute(new DeleteManufacturerCommand(ctx.params.id)),
        successStatus: 204,
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        detail: {
          tags: ['LLM Manufacturers Admin'],
          summary: 'Delete an LLM manufacturer',
          description: 'Deletes an LLM manufacturer (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
