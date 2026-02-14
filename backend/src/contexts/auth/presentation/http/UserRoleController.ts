import { t as schema } from 'elysia';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { ROLE_NAME_PATTERN } from '@shared/constants/validation.ts';

// Commands
import { AssignRoleCommand } from '../../application/commands/assign-role/AssignRoleCommand.ts';
import type { AssignRoleHandler } from '../../application/commands/assign-role/AssignRoleHandler.ts';
import { RemoveRoleCommand } from '../../application/commands/remove-role/RemoveRoleCommand.ts';
import type { RemoveRoleHandler } from '../../application/commands/remove-role/RemoveRoleHandler.ts';

// Domain
import type { ITokenService } from '../../domain/services/ITokenService.ts';
import type { IRoleRepository } from '../../domain/repositories/IRoleRepository.ts';
import { UserId } from '../../domain/value-objects/UserId.ts';
import {
  createAuthMiddleware,
  createPermissionMiddleware,
  type AuthenticatedUser,
} from '../middleware/AuthMiddleware.ts';

// Response schemas for OpenAPI documentation
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

/**
 * UserRoleController
 * Handles HTTP requests for user-role assignment management
 * Routes under /v1/users/:userId/roles
 */
export class UserRoleController {
  constructor(
    private tokenService: ITokenService,
    private assignRoleHandler: AssignRoleHandler,
    private removeRoleHandler: RemoveRoleHandler,
    private roleRepository: IRoleRepository
  ) {}

  /**
   * Register routes for user-role management
   * Routes are registered under /v1/users/:userId/roles/*
   */
  public routes(app: any) {
    const authMiddleware = createAuthMiddleware(this.tokenService);
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'admin:*');

    // User role management endpoints
    this.registerGetUserRolesRoute(app, authMiddleware);
    this.registerAssignRoleRoute(app, adminMiddleware);
    this.registerRemoveRoleRoute(app, adminMiddleware);

    return app;
  }

  // =====================
  // User role management endpoints
  // =====================

  /**
   * GET /v1/users/:userId/roles - Get user roles (admin or self)
   */
  private registerGetUserRolesRoute(
    app: any,
    authMiddleware: (ctx: any) => Promise<any>
  ) {
    app.get(
      '/v1/users/:userId/roles',
      async ({
        params,
        request,
        set,
        t,
      }: {
        params: { userId: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        // Auth check
        const authResult = await authMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;

        // Allow admin or the user themselves
        if (!user.roles.includes('admin') && user.userId !== params.userId) {
          set.status = 403;
          return { statusCode: 403, success: false as const, error: t.middleware.insufficientPermissions() };
        }

        const userIdResult = UserId.createFromString(params.userId);
        if (userIdResult.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: t.id.invalidUserId() };
        }

        const roles = await this.roleRepository.findByUserId(userIdResult.getValue());

        return {
          statusCode: 200,
          success: true,
          data: roles.map((r) => r.getValue()),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'ID do usuário (formato UUID v7)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Array(schema.String({
              description: 'Nome da role',
              example: 'admin',
            })),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Listar roles do usuário',
          description: `
Retorna todas as roles atribuídas a um usuário específico.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ser administrador OU o próprio usuário consultado

**Controle de acesso:**
- Administradores podem consultar qualquer usuário
- Usuários comuns só podem consultar suas próprias roles
- Retorna 403 se usuário tenta consultar outro usuário sem ser admin

**Validações:**
- ID do usuário deve ser um UUID v7 válido
- Usuário deve existir no sistema

**Comportamento:**
- Retorna array com nomes das roles (strings)
- Array vazio se usuário não possui roles
- Roles do sistema (admin, user) aparecem na lista

**Resposta:**
- Lista ordenada de nomes de roles
- Exemplo: ["admin", "manager", "user"]

**Erros possíveis:**
- 400: ID do usuário inválido
- 401: Token ausente ou inválido
- 403: Usuário não tem permissão para consultar outro usuário
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * POST /v1/users/:userId/roles - Assign role to user (admin only)
   */
  private registerAssignRoleRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      '/v1/users/:userId/roles',
      async ({
        params,
        body,
        request,
        set,
        t,
      }: {
        params: { userId: string };
        body: { role: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new AssignRoleCommand(params.userId, body.role, user.userId, t);
        const result = await this.assignRoleHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: String(result.getError()) };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.auth.role.assigned({ role: body.role }),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'ID do usuário que receberá a role (formato UUID v7)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        body: schema.Object({
          role: schema.String({
            description: 'Nome da role a ser atribuída ao usuário',
            pattern: ROLE_NAME_PATTERN,
            minLength: 2,
            maxLength: 50,
            example: 'manager',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação da atribuição',
              example: 'Role manager atribuída ao usuário com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Atribuir role ao usuário',
          description: `
Atribui uma role específica a um usuário no sistema.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ter privilégio de administrador

**Validações:**
- ID do usuário deve ser um UUID v7 válido
- Usuário deve existir no sistema
- Role deve existir no sistema
- Nome da role deve ser lowercase
- Usuário não pode já possuir a role

**Comportamento:**
- Adiciona a role ao usuário
- Usuário passa a ter todas as permissões da role imediatamente
- Não remove roles existentes do usuário
- Se usuário já possui a role, retorna erro

**Casos de uso comuns:**
- Promover usuário comum a administrador: role="admin"
- Atribuir role customizada: role="manager", role="supervisor"
- Dar acesso especial: role="moderator"

**Erros possíveis:**
- 400: ID inválido, role não existe ou usuário já possui a role
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 404: Usuário ou role não encontrada
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * DELETE /v1/users/:userId/roles/:role - Remove role from user (admin only)
   */
  private registerRemoveRoleRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.delete(
      '/v1/users/:userId/roles/:role',
      async ({
        params,
        request,
        set,
        t,
      }: {
        params: { userId: string; role: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new RemoveRoleCommand(params.userId, params.role, user.userId, t);
        const result = await this.removeRoleHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: String(result.getError()) };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.auth.role.removed({ role: params.role }),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'ID do usuário do qual a role será removida (formato UUID v7)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
          role: schema.String({
            description: 'Nome da role a ser removida do usuário',
            pattern: ROLE_NAME_PATTERN,
            minLength: 2,
            maxLength: 50,
            example: 'manager',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação da remoção',
              example: 'Role manager removida do usuário com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Roles'],
          summary: 'Remover role do usuário',
          description: `
Remove uma role específica de um usuário no sistema.

**Pré-requisitos:**
- Usuário autenticado com token JWT válido
- Usuário deve ter privilégio de administrador

**Restrições IMPORTANTES:**
- Administrador NÃO pode remover sua própria role de admin
- Esta proteção evita que admin perca acesso acidentalmente
- Para remover admin de si mesmo, outro admin deve fazer

**Validações:**
- ID do usuário deve ser um UUID v7 válido
- Usuário deve existir no sistema
- Role deve existir no sistema
- Usuário deve possuir a role
- Nome da role deve ser lowercase

**Comportamento:**
- Remove a role do usuário
- Usuário perde todas as permissões da role imediatamente
- Não afeta outras roles do usuário
- Se usuário não possui a role, retorna erro

**Casos de uso comuns:**
- Remover privilégios: remover role "admin" ou "manager"
- Revogar acesso especial: remover role "moderator"
- Reorganização de acessos

**Erros possíveis:**
- 400: ID inválido, role não existe, usuário não possui role, ou tentativa de auto-remoção de admin
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 404: Usuário ou role não encontrada
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }
}
