import { t as schema } from 'elysia';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { ROLE_NAME_PATTERN, PERMISSION_KEY_PATTERN } from '@shared/constants/validation.ts';

// Commands
import { CreateRoleCommand } from '../../application/commands/create-role/CreateRoleCommand.ts';
import type { CreateRoleHandler } from '../../application/commands/create-role/CreateRoleHandler.ts';
import { UpdateRoleCommand } from '../../application/commands/update-role/UpdateRoleCommand.ts';
import type { UpdateRoleHandler } from '../../application/commands/update-role/UpdateRoleHandler.ts';
import { DeleteRoleCommand } from '../../application/commands/delete-role/DeleteRoleCommand.ts';
import type { DeleteRoleHandler } from '../../application/commands/delete-role/DeleteRoleHandler.ts';
import { AssignPermissionToRoleCommand } from '../../application/commands/assign-permission-to-role/AssignPermissionToRoleCommand.ts';
import type { AssignPermissionToRoleHandler } from '../../application/commands/assign-permission-to-role/AssignPermissionToRoleHandler.ts';
import { RemovePermissionFromRoleCommand } from '../../application/commands/remove-permission-from-role/RemovePermissionFromRoleCommand.ts';
import type { RemovePermissionFromRoleHandler } from '../../application/commands/remove-permission-from-role/RemovePermissionFromRoleHandler.ts';

// Queries
import { ListRolesQuery } from '../../application/queries/list-roles/ListRolesQuery.ts';
import type { ListRolesHandler } from '../../application/queries/list-roles/ListRolesHandler.ts';

// Domain
import type { ITokenService } from '../../domain/services/ITokenService.ts';
import type { IRoleRepository } from '../../domain/repositories/IRoleRepository.ts';
import { RoleId } from '../../domain/value-objects/RoleId.ts';
import {
  createPermissionMiddleware,
  type AuthenticatedUser,
} from '../middleware/AuthMiddleware.ts';

// Response schemas for OpenAPI documentation
const ErrorResponse = schema.Object({
  statusCode: schema.Number({ example: 400 }),
  success: schema.Literal(false),
  error: schema.String(),
});

const ValidationErrorResponse = schema.Object({
  statusCode: schema.Literal(400),
  success: schema.Literal(false),
  error: schema.String({ description: 'Mensagem de erro de validação' }),
});

const UnauthorizedResponse = schema.Object({
  statusCode: schema.Literal(401),
  success: schema.Literal(false),
  error: schema.String({ description: 'Token de acesso ausente ou inválido' }),
});

const ForbiddenResponse = schema.Object({
  statusCode: schema.Literal(403),
  success: schema.Literal(false),
  error: schema.String({ description: 'Permissão negada. Requer privilégio de administrador.' }),
});

const NotFoundResponse = schema.Object({
  statusCode: schema.Literal(404),
  success: schema.Literal(false),
  error: schema.String({ description: 'Recurso não encontrado' }),
});

const ConflictResponse = schema.Object({
  statusCode: schema.Literal(409),
  success: schema.Literal(false),
  error: schema.String({ description: 'Role já existe no sistema' }),
});

const RoleResponse = schema.Object({
  id: schema.String({
    description: 'ID único da role (UUID v7)',
    example: '019123ab-cdef-7890-abcd-ef1234567890'
  }),
  name: schema.String({
    description: 'Nome da role (lowercase, alfanumérico e underscore)',
    example: 'manager'
  }),
  description: schema.Union([schema.String(), schema.Null()], {
    description: 'Descrição da role',
    example: 'Gerente com permissões de leitura e escrita',
  }),
  isSystem: schema.Boolean({
    description: 'Indica se é uma role do sistema (não pode ser excluída)',
    example: false
  }),
  createdAt: schema.String({
    description: 'Data de criação (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z'
  }),
  updatedAt: schema.Union([schema.String(), schema.Null()], {
    description: 'Data da última atualização (ISO 8601)',
    example: '2024-01-16T14:20:00.000Z',
  }),
  permissions: schema.Optional(schema.Array(schema.String({
    description: 'Nome da permissão',
    example: 'users:read',
  }))),
});

/**
 * RoleController
 * Handles HTTP requests for role CRUD and role-permission management
 * All endpoints require admin privileges
 */
export class RoleController {
  constructor(
    private roleRepository: IRoleRepository,
    private tokenService: ITokenService,
    private createRoleHandler?: CreateRoleHandler,
    private updateRoleHandler?: UpdateRoleHandler,
    private deleteRoleHandler?: DeleteRoleHandler,
    private listRolesHandler?: ListRolesHandler,
    private assignPermissionToRoleHandler?: AssignPermissionToRoleHandler,
    private removePermissionFromRoleHandler?: RemovePermissionFromRoleHandler
  ) {}

  /**
   * Register routes for role management
   * Routes are registered under /v1/roles/*
   */
  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'admin:*');

    // Role CRUD endpoints
    this.registerListRolesRoute(app, adminMiddleware);
    this.registerCreateRoleRoute(app, adminMiddleware);
    this.registerUpdateRoleRoute(app, adminMiddleware);
    this.registerDeleteRoleRoute(app, adminMiddleware);

    // Role-Permission management
    this.registerAssignPermissionToRoleRoute(app, adminMiddleware);
    this.registerRemovePermissionFromRoleRoute(app, adminMiddleware);

    return app;
  }

  // =====================
  // Role CRUD endpoints
  // =====================

  /**
   * GET /v1/roles - List all available roles (admin only)
   */
  private registerListRolesRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.get(
      '/v1/roles',
      async ({ request, set, query, t }: { request: Request; set: any; query: any; t: TranslationFunctions }) => {
        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        // Use handler if available, otherwise fallback to repository
        if (this.listRolesHandler) {
          const page = parseInt(query.page as string) || 1;
          const limit = parseInt(query.limit as string) || 10;
          const includePermissions = query.includePermissions === 'true';

          const listQuery = new ListRolesQuery(page, limit, includePermissions, t);
          const result = await this.listRolesHandler.execute(listQuery);

          if (result.isFailure) {
            set.status = 400;
            return { statusCode: 400, success: false as const, error: result.getError()! };
          }

          return {
            statusCode: 200,
            success: true,
            data: result.getValue(),
          };
        }

        // Fallback to simple repository call
        const roles = await this.roleRepository.findAll();
        return {
          statusCode: 200,
          success: true,
          data: roles.map((r) => ({
            id: r.id.toValue(),
            name: r.name,
            description: r.description,
            isSystem: r.isSystem,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt?.toISOString() ?? null,
          })),
        };
      },
      {
        query: schema.Object({
          page: schema.Optional(schema.String({
            description: 'Número da página para paginação (padrão: 1)',
            example: '1',
          })),
          limit: schema.Optional(schema.String({
            description: 'Quantidade de roles por página (padrão: 10)',
            example: '10',
          })),
          includePermissions: schema.Optional(schema.String({
            description: 'Incluir permissões de cada role na resposta (true/false)',
            example: 'true',
          })),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Union([
              schema.Array(RoleResponse),
              schema.Object({
                roles: schema.Array(RoleResponse),
                total: schema.Number(),
                page: schema.Number(),
                limit: schema.Number(),
                totalPages: schema.Number(),
              }),
            ]),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Listar todas as roles',
          description: `
Retorna todas as roles disponíveis no sistema para controle de acesso.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ter privilégio de administrador

**Parâmetros:**
- page: Página desejada (padrão: 1)
- limit: Quantidade de roles por página (padrão: 10)
- includePermissions: Se "true", inclui as permissões de cada role

**Comportamento:**
- Retorna roles do sistema (admin, user) e roles customizadas
- Paginação é aplicada quando usando o handler ListRolesHandler
- Fallback para listar todas as roles se handler não estiver disponível

**Erros possíveis:**
- 400: Parâmetros de paginação inválidos
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * POST /v1/roles - Create a new role (admin only)
   */
  private registerCreateRoleRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      '/v1/roles',
      async ({
        body,
        request,
        set,
        t,
      }: {
        body: { name: string; description?: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        if (!this.createRoleHandler) {
          set.status = 501;
          return { statusCode: 501, success: false as const, error: t.common.notImplemented() };
        }

        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new CreateRoleCommand(
          body.name,
          body.description ?? null,
          user.userId,
          t
        );
        const result = await this.createRoleHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        // Handler returns only roleId (CQRS pattern), fetch full role for response
        const { roleId } = result.getValue();
        const roleIdResult = RoleId.createFromString(roleId);
        if (roleIdResult.isFailure) {
          set.status = 500;
          return { statusCode: 500, success: false as const, error: t.id.invalidRoleId() };
        }

        const role = await this.roleRepository.findById(roleIdResult.getValue());

        if (!role) {
          set.status = 500;
          return { statusCode: 500, success: false as const, error: t.auth.role.notFound() };
        }

        set.status = 201;
        return {
          statusCode: 201,
          success: true,
          data: {
            id: role.id.toValue(),
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt?.toISOString() ?? null,
          },
        };
      },
      {
        body: schema.Object({
          name: schema.String({
            description: 'Nome da role (lowercase, apenas letras, números e underscore)',
            pattern: ROLE_NAME_PATTERN,
            minLength: 2,
            maxLength: 50,
            example: 'manager',
          }),
          description: schema.Optional(schema.String({
            description: 'Descrição opcional da role',
            maxLength: 255,
            example: 'Gerente com permissões de leitura e escrita',
          })),
        }),
        response: {
          201: schema.Object({
            statusCode: schema.Literal(201),
            success: schema.Literal(true),
            data: RoleResponse,
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          409: ConflictResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Criar nova role',
          description: `
Cria uma nova role no sistema para controle de acesso.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ter privilégio de administrador

**Validações:**
- Nome deve ser único no sistema
- Nome deve ser lowercase, apenas letras, números e underscore
- Nome deve começar com letra
- Nome deve ter entre 2 e 50 caracteres
- Descrição não pode exceder 255 caracteres

**Comportamento:**
- A role é criada com isSystem=false (não é role do sistema)
- Roles do sistema (admin, user) são criadas automaticamente no seed
- A role criada não possui permissões inicialmente

**Erros possíveis:**
- 400: Nome inválido ou formato incorreto
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 409: Role com este nome já existe
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * PUT /v1/roles/:roleId - Update a role (admin only)
   */
  private registerUpdateRoleRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.put(
      '/v1/roles/:roleId',
      async ({
        params,
        body,
        request,
        set,
        t,
      }: {
        params: { roleId: string };
        body: { name?: string; description?: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        if (!this.updateRoleHandler) {
          set.status = 501;
          return { statusCode: 501, success: false as const, error: t.common.notImplemented() };
        }

        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new UpdateRoleCommand(
          params.roleId,
          body.name ?? null,
          body.description ?? null,
          user.userId,
          t
        );
        const result = await this.updateRoleHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        const role = result.getValue();
        return {
          statusCode: 200,
          success: true,
          data: {
            id: role.id.toValue(),
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt?.toISOString() ?? null,
          },
        };
      },
      {
        params: schema.Object({
          roleId: schema.String({
            description: 'ID da role (formato UUID v7)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        body: schema.Object({
          name: schema.Optional(schema.String({
            description: 'Novo nome da role (lowercase, apenas letras, números e underscore)',
            pattern: ROLE_NAME_PATTERN,
            minLength: 2,
            maxLength: 50,
            example: 'senior_manager',
          })),
          description: schema.Optional(schema.String({
            description: 'Nova descrição da role',
            maxLength: 255,
            example: 'Gerente sênior com permissões avançadas',
          })),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: RoleResponse,
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Atualizar role',
          description: `
Atualiza os dados de uma role existente no sistema.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ter privilégio de administrador

**Restrições:**
- Roles do sistema (admin, user) NÃO podem ter o nome alterado
- Roles do sistema podem ter a descrição alterada
- O novo nome deve ser único no sistema

**Validações:**
- Nome deve ser lowercase, apenas letras, números e underscore
- Nome deve começar com letra
- Nome deve ter entre 2 e 50 caracteres
- Descrição não pode exceder 255 caracteres
- Pelo menos um campo (name ou description) deve ser fornecido

**Comportamento:**
- Atualiza apenas os campos fornecidos
- O campo updatedAt é automaticamente atualizado
- Retorna a role completa após atualização

**Erros possíveis:**
- 400: Parâmetros inválidos ou role do sistema
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 404: Role não encontrada
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * DELETE /v1/roles/:roleId - Delete a role (admin only)
   */
  private registerDeleteRoleRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.delete(
      '/v1/roles/:roleId',
      async ({
        params,
        request,
        set,
        t,
      }: {
        params: { roleId: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        if (!this.deleteRoleHandler) {
          set.status = 501;
          return { statusCode: 501, success: false as const, error: t.common.notImplemented() };
        }

        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new DeleteRoleCommand(params.roleId, user.userId, t);
        const result = await this.deleteRoleHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.auth.role.deleted(),
        };
      },
      {
        params: schema.Object({
          roleId: schema.String({
            description: 'ID da role a ser excluída (formato UUID v7)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação da exclusão',
              example: 'Role excluída com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Excluir role',
          description: `
Exclui uma role do sistema.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ter privilégio de administrador

**Restrições IMPORTANTES:**
- Roles do sistema (admin, user) NÃO podem ser excluídas
- A exclusão é permanente e não pode ser desfeita
- Usuários com a role removida perderão as permissões associadas

**Validações:**
- Role deve existir no sistema
- Role não pode ser uma role do sistema (isSystem=true)
- ID da role deve ser um UUID v7 válido

**Comportamento:**
- Remove a role do banco de dados
- Remove a associação da role de todos os usuários
- As permissões da role são removidas junto

**Erros possíveis:**
- 400: ID inválido ou tentativa de excluir role do sistema
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 404: Role não encontrada
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  // =====================
  // Role-Permission management
  // =====================

  /**
   * POST /v1/roles/:roleId/permissions - Assign permission to role (admin only)
   */
  private registerAssignPermissionToRoleRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      '/v1/roles/:roleId/permissions',
      async ({
        params,
        body,
        request,
        set,
        t,
      }: {
        params: { roleId: string };
        body: { permission: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        if (!this.assignPermissionToRoleHandler) {
          set.status = 501;
          return { statusCode: 501, success: false as const, error: t.common.notImplemented() };
        }

        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new AssignPermissionToRoleCommand(
          params.roleId,
          body.permission,
          user.userId,
          t
        );
        const result = await this.assignPermissionToRoleHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.auth.permission.assignedToRole({ permission: body.permission }),
        };
      },
      {
        params: schema.Object({
          roleId: schema.String({
            description: 'ID da role que receberá a permissão (formato UUID v7)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        body: schema.Object({
          permission: schema.String({
            description: 'Nome da permissão (formato: recurso:ação)',
            pattern: PERMISSION_KEY_PATTERN,
            example: 'users:read',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação da atribuição',
              example: 'Permissão users:read atribuída à role com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Atribuir permissão à role',
          description: `
Adiciona uma permissão específica a uma role existente.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ter privilégio de administrador

**Formato da permissão:**
- Padrão: "recurso:ação"
- Exemplos: "users:read", "users:write", "roles:manage"
- Recurso e ação devem ser lowercase
- Apenas letras, números e underscore

**Validações:**
- Role deve existir no sistema
- Permissão deve seguir o formato resource:action
- ID da role deve ser um UUID v7 válido
- A permissão não pode já estar atribuída à role

**Comportamento:**
- Adiciona a permissão à role
- Permissão passa a valer imediatamente para usuários com a role
- Não afeta outras roles ou suas permissões
- Se a permissão já existe, retorna erro

**Erros possíveis:**
- 400: ID inválido, formato de permissão incorreto ou permissão já existe
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 404: Role não encontrada
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * DELETE /v1/roles/:roleId/permissions/:permission - Remove permission from role (admin only)
   */
  private registerRemovePermissionFromRoleRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.delete(
      '/v1/roles/:roleId/permissions/:permission',
      async ({
        params,
        request,
        set,
        t,
      }: {
        params: { roleId: string; permission: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        if (!this.removePermissionFromRoleHandler) {
          set.status = 501;
          return { statusCode: 501, success: false as const, error: t.common.notImplemented() };
        }

        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new RemovePermissionFromRoleCommand(
          params.roleId,
          params.permission,
          user.userId,
          t
        );
        const result = await this.removePermissionFromRoleHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.auth.permission.removedFromRole({ permission: params.permission }),
        };
      },
      {
        params: schema.Object({
          roleId: schema.String({
            description: 'ID da role da qual a permissão será removida (formato UUID v7)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
          permission: schema.String({
            description: 'Nome da permissão a ser removida (formato: recurso:ação)',
            pattern: PERMISSION_KEY_PATTERN,
            example: 'users:write',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação da remoção',
              example: 'Permissão users:write removida da role com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Remover permissão da role',
          description: `
Remove uma permissão específica de uma role existente.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ter privilégio de administrador

**Formato da permissão:**
- Padrão: "recurso:ação"
- Exemplos: "users:read", "users:write", "roles:manage"
- Deve corresponder exatamente ao nome da permissão existente

**Validações:**
- Role deve existir no sistema
- Permissão deve existir na role
- ID da role deve ser um UUID v7 válido
- Formato da permissão deve ser resource:action

**Comportamento:**
- Remove a permissão da role
- Usuários com a role perdem imediatamente o acesso baseado nessa permissão
- Não afeta outras roles que possam ter a mesma permissão
- Se a permissão não existe na role, retorna erro

**Erros possíveis:**
- 400: ID inválido, formato de permissão incorreto ou permissão não existe na role
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 404: Role não encontrada
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }
}
