import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { CreateModelCommand } from '../../application/commands/create-model/CreateModelCommand.ts';
import { CreateModelHandler } from '../../application/commands/create-model/CreateModelHandler.ts';
import { UpdateModelCommand } from '../../application/commands/update-model/UpdateModelCommand.ts';
import { UpdateModelHandler } from '../../application/commands/update-model/UpdateModelHandler.ts';
import { DeleteModelCommand } from '../../application/commands/delete-model/DeleteModelCommand.ts';
import { DeleteModelHandler } from '../../application/commands/delete-model/DeleteModelHandler.ts';
import { SetDefaultModelCommand } from '../../application/commands/set-default-model/SetDefaultModelCommand.ts';
import { SetDefaultModelHandler } from '../../application/commands/set-default-model/SetDefaultModelHandler.ts';
import { ListModelsQuery } from '../../application/queries/list-models/ListModelsQuery.ts';
import { ListModelsHandler } from '../../application/queries/list-models/ListModelsHandler.ts';
import { GetModelQuery } from '../../application/queries/get-model/GetModelQuery.ts';
import { GetModelHandler } from '../../application/queries/get-model/GetModelHandler.ts';
import { GetDefaultModelQuery } from '../../application/queries/get-default-model/GetDefaultModelQuery.ts';
import { GetDefaultModelHandler } from '../../application/queries/get-default-model/GetDefaultModelHandler.ts';

/**
 * LlmModelAdminController
 * Handles HTTP endpoints for LLM model administration
 */
export class LlmModelAdminController {
  constructor(
    private tokenService: ITokenService,
    private createHandler: CreateModelHandler,
    private updateHandler: UpdateModelHandler,
    private deleteHandler: DeleteModelHandler,
    private setDefaultHandler: SetDefaultModelHandler,
    private listHandler: ListModelsHandler,
    private getHandler: GetModelHandler,
    private getDefaultHandler: GetDefaultModelHandler
  ) {}

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'ai:*');

    // List models
    app.get(
      '/v1/admin/llm-models',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) => {
          const url = new URL(ctx.request.url);
          const manufacturerId = url.searchParams.get('manufacturerId') ?? undefined;
          return this.listHandler.execute(new ListModelsQuery(manufacturerId));
        },
      }),
      {
        detail: {
          tags: ['LLM Models Admin'],
          summary: 'List all LLM models',
          description: 'Lists all LLM models, optionally filtered by manufacturer (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get default model — MUST be registered before /:id
    app.get(
      '/v1/admin/llm-models/default',
      handleRoute({
        middleware: adminMiddleware,
        handler: async () => this.getDefaultHandler.execute(new GetDefaultModelQuery()),
      }),
      {
        detail: {
          tags: ['LLM Models Admin'],
          summary: 'Get the default LLM model',
          description: 'Gets the currently configured default LLM model (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Get model by ID
    app.get(
      '/v1/admin/llm-models/:id',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.getHandler.execute(new GetModelQuery(ctx.params.id)),
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        detail: {
          tags: ['LLM Models Admin'],
          summary: 'Get an LLM model',
          description: 'Gets an LLM model by ID (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Create model
    app.post(
      '/v1/admin/llm-models',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.createHandler.execute(
            new CreateModelCommand(
              ctx.body.manufacturerId,
              ctx.body.name,
              ctx.body.technicalName,
              ctx.body.pricePerMillionInputTokens,
              ctx.body.pricePerMillionOutputTokens,
              ctx.body.isDefault
            )
          ),
        successStatus: 201,
      }),
      {
        body: schema.Object({
          manufacturerId: schema.String({ minLength: 1 }),
          name: schema.String({ minLength: 1, maxLength: 200 }),
          technicalName: schema.String({ minLength: 1, maxLength: 200 }),
          pricePerMillionInputTokens: schema.Optional(schema.Nullable(schema.Number())),
          pricePerMillionOutputTokens: schema.Optional(schema.Nullable(schema.Number())),
          isDefault: schema.Optional(schema.Boolean()),
        }),
        detail: {
          tags: ['LLM Models Admin'],
          summary: 'Create a new LLM model',
          description: 'Creates a new LLM model (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update model
    app.put(
      '/v1/admin/llm-models/:id',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.updateHandler.execute(
            new UpdateModelCommand(
              ctx.params.id,
              ctx.body.name,
              ctx.body.technicalName,
              ctx.body.pricePerMillionInputTokens,
              ctx.body.pricePerMillionOutputTokens,
              ctx.body.isDefault
            )
          ),
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        body: schema.Object({
          name: schema.Optional(schema.String({ minLength: 1, maxLength: 200 })),
          technicalName: schema.Optional(schema.String({ minLength: 1, maxLength: 200 })),
          pricePerMillionInputTokens: schema.Optional(schema.Nullable(schema.Number())),
          pricePerMillionOutputTokens: schema.Optional(schema.Nullable(schema.Number())),
          isDefault: schema.Optional(schema.Boolean()),
        }),
        detail: {
          tags: ['LLM Models Admin'],
          summary: 'Update an LLM model',
          description: 'Updates an existing LLM model (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete model
    app.delete(
      '/v1/admin/llm-models/:id',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.deleteHandler.execute(new DeleteModelCommand(ctx.params.id)),
        successStatus: 204,
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        detail: {
          tags: ['LLM Models Admin'],
          summary: 'Delete an LLM model',
          description: 'Deletes an LLM model (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Set default model
    app.post(
      '/v1/admin/llm-models/:id/set-default',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) =>
          this.setDefaultHandler.execute(new SetDefaultModelCommand(ctx.params.id)),
      }),
      {
        params: schema.Object({
          id: schema.String(),
        }),
        detail: {
          tags: ['LLM Models Admin'],
          summary: 'Set default LLM model',
          description: 'Sets an LLM model as the default model (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
