import { t as schema } from 'elysia';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { UUID_V7_PATTERN, PERMISSION_KEY_PATTERN } from '@shared/constants/validation.ts';

// Commands
import { CreatePermissionCommand } from '../../application/commands/create-permission/CreatePermissionCommand.ts';
import type { CreatePermissionHandler } from '../../application/commands/create-permission/CreatePermissionHandler.ts';
import { AssignPermissionToUserCommand } from '../../application/commands/assign-permission-to-user/AssignPermissionToUserCommand.ts';
import type { AssignPermissionToUserHandler } from '../../application/commands/assign-permission-to-user/AssignPermissionToUserHandler.ts';
import { RemovePermissionFromUserCommand } from '../../application/commands/remove-permission-from-user/RemovePermissionFromUserCommand.ts';
import type { RemovePermissionFromUserHandler } from '../../application/commands/remove-permission-from-user/RemovePermissionFromUserHandler.ts';

// Queries
import { ListPermissionsQuery } from '../../application/queries/list-permissions/ListPermissionsQuery.ts';
import type { ListPermissionsHandler } from '../../application/queries/list-permissions/ListPermissionsHandler.ts';
import { GetUserPermissionsQuery } from '../../application/queries/get-user-permissions/GetUserPermissionsQuery.ts';
import type { GetUserPermissionsHandler } from '../../application/queries/get-user-permissions/GetUserPermissionsHandler.ts';

// Domain
import type { ITokenService } from '../../domain/services/ITokenService.ts';
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

const ConflictResponse = schema.Object({
  statusCode: schema.Literal(409),
  success: schema.Literal(false),
  error: schema.String({ description: 'Permissão já existe no sistema' }),
});

const PermissionResponse = schema.Object({
  id: schema.String({
    description: 'ID único da permissão (UUID v7)',
    example: '019123ab-cdef-7890-abcd-ef1234567890'
  }),
  name: schema.String({
    description: 'Nome completo da permissão (formato: resource:action)',
    example: 'users:read'
  }),
  resource: schema.String({
    description: 'Recurso ao qual a permissão se aplica',
    example: 'users'
  }),
  action: schema.String({
    description: 'Ação permitida no recurso',
    example: 'read'
  }),
  description: schema.Union([schema.String(), schema.Null()], {
    description: 'Descrição da permissão',
    example: 'Permite visualizar dados de usuários',
  }),
  createdAt: schema.String({
    description: 'Data de criação (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z'
  }),
});

/**
 * PermissionController
 * Handles HTTP requests for permission management
 * Most endpoints require admin privileges
 */
export class PermissionController {
  constructor(
    private tokenService: ITokenService,
    private createPermissionHandler?: CreatePermissionHandler,
    private listPermissionsHandler?: ListPermissionsHandler,
    private getUserPermissionsHandler?: GetUserPermissionsHandler,
    private assignPermissionToUserHandler?: AssignPermissionToUserHandler,
    private removePermissionFromUserHandler?: RemovePermissionFromUserHandler
  ) {}

  /**
   * Register routes for permission management
   */
  public routes(app: any) {
    const authMiddleware = createAuthMiddleware(this.tokenService);
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'admin:*');

    // Permission CRUD endpoints
    this.registerListPermissionsRoute(app, adminMiddleware);
    this.registerCreatePermissionRoute(app, adminMiddleware);

    // User permission management
    this.registerGetUserPermissionsRoute(app, authMiddleware);
    this.registerAssignPermissionToUserRoute(app, adminMiddleware);
    this.registerRemovePermissionFromUserRoute(app, adminMiddleware);

    return app;
  }

  // =====================
  // Permission CRUD endpoints
  // =====================

  /**
   * GET /v1/permissions - List all permissions (admin only)
   */
  private registerListPermissionsRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.get(
      '/v1/permissions',
      async ({ request, set, query, t }: { request: Request; set: any; query: any; t: TranslationFunctions }) => {
        if (!this.listPermissionsHandler) {
          set.status = 501;
          return { statusCode: 501, success: false as const, error: t.common.notImplemented() };
        }

        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const resource = query.resource as string | undefined;

        const listQuery = new ListPermissionsQuery(page, limit, resource, t);
        const result = await this.listPermissionsHandler.execute(listQuery);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          data: result.getValue(),
        };
      },
      {
        query: schema.Object({
          page: schema.Optional(schema.String({
            description: 'Número da página (inicia em 1)',
            example: '1',
          })),
          limit: schema.Optional(schema.String({
            description: 'Quantidade de registros por página',
            example: '10',
          })),
          resource: schema.Optional(schema.String({
            description: 'Filtrar por nome do recurso',
            example: 'users',
          })),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Object({
              permissions: schema.Array(PermissionResponse, {
                description: 'Lista de permissões cadastradas',
              }),
              total: schema.Number({ description: 'Total de registros' }),
              page: schema.Number({ description: 'Página atual' }),
              limit: schema.Number({ description: 'Registros por página' }),
              totalPages: schema.Number({ description: 'Total de páginas' }),
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
        },
        detail: {
          tags: ['Permissions'],
          summary: 'Listar todas as permissões',
          description: `
Retorna todas as permissões disponíveis no sistema com suporte a paginação.

**Quem pode acessar:**
- Apenas administradores

**Formato das permissões:**
- Cada permissão segue o formato \`resource:action\`
- resource: representa o recurso (ex: users, reports, settings)
- action: representa a ação (ex: read, write, delete, export)

**Exemplos de permissões:**
- \`users:read\`: Permite visualizar usuários
- \`users:write\`: Permite criar/editar usuários
- \`reports:export\`: Permite exportar relatórios

**Paginação:**
- Padrão: 10 registros por página
- Inicia na página 1

**Filtros:**
- resource: filtra permissões por recurso específico

**Exemplo de retorno:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "019123ab-cdef-7890-abcd-ef1234567890",
        "name": "users:read",
        "resource": "users",
        "action": "read",
        "description": "Permite visualizar dados de usuários",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
\`\`\`

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
   * POST /v1/permissions - Create a new permission (admin only)
   */
  private registerCreatePermissionRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      '/v1/permissions',
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
        if (!this.createPermissionHandler) {
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
        const command = new CreatePermissionCommand(
          body.name,
          body.description ?? null,
          user.userId,
          t
        );
        const result = await this.createPermissionHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        const permission = result.getValue();
        set.status = 201;
        return {
          statusCode: 201,
          success: true,
          data: {
            id: permission.id.toValue(),
            name: permission.name,
            resource: permission.resource,
            action: permission.action,
            description: permission.description,
            createdAt: permission.createdAt.toISOString(),
          },
        };
      },
      {
        body: schema.Object({
          name: schema.String({
            description: 'Nome da permissão no formato resource:action',
            example: 'reports:export',
            pattern: PERMISSION_KEY_PATTERN,
          }),
          description: schema.Optional(schema.String({
            description: 'Descrição detalhada do que a permissão permite fazer',
            example: 'Permite exportar relatórios em diversos formatos',
          })),
        }),
        response: {
          201: schema.Object({
            statusCode: schema.Literal(201),
            success: schema.Literal(true),
            data: PermissionResponse,
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          409: ConflictResponse,
        },
        detail: {
          tags: ['Permissions'],
          summary: 'Criar nova permissão',
          description: `
Cria uma nova permissão no sistema.

**Quem pode acessar:**
- Apenas administradores

**Formato da permissão:**
O nome deve seguir o padrão \`resource:action\`:
- resource: nome do recurso em snake_case (ex: users, user_settings, reports)
- action: ação permitida em snake_case (ex: read, write, delete, export)

**Regras de validação:**
- O nome deve ser único no sistema
- Não pode conter espaços ou caracteres especiais
- Deve estar em minúsculas
- Resource e action devem ser separados por ":"

**Exemplos válidos:**
- \`users:read\`
- \`reports:export\`
- \`user_settings:write\`
- \`analytics:view_dashboard\`

**Exemplos inválidos:**
- \`Users:Read\` (maiúsculas)
- \`users read\` (faltando ":")
- \`users-read\` (usando hífen em vez de ":")

**Exemplo de requisição:**
\`\`\`json
{
  "name": "reports:export",
  "description": "Permite exportar relatórios em diversos formatos"
}
\`\`\`

**Exemplo de retorno:**
\`\`\`json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": "019123ab-cdef-7890-abcd-ef1234567890",
    "name": "reports:export",
    "resource": "reports",
    "action": "export",
    "description": "Permite exportar relatórios em diversos formatos",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
\`\`\`

**Erros possíveis:**
- 400: Nome de permissão inválido ou formato incorreto
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 409: Permissão com esse nome já existe
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  // =====================
  // User permission management
  // =====================

  /**
   * GET /v1/users/:userId/permissions - Get user's effective permissions (admin or self)
   */
  private registerGetUserPermissionsRoute(
    app: any,
    authMiddleware: (ctx: any) => Promise<any>
  ) {
    app.get(
      '/v1/users/:userId/permissions',
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
        if (!this.getUserPermissionsHandler) {
          set.status = 501;
          return { statusCode: 501, success: false as const, error: t.common.notImplemented() };
        }

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

        const query = new GetUserPermissionsQuery(params.userId, t);
        const result = await this.getUserPermissionsHandler.execute(query);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          data: result.getValue(),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'ID do usuário (UUID v7)',
            pattern: UUID_V7_PATTERN,
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Object({
              userId: schema.String({
                description: 'ID do usuário',
                example: '019123ab-cdef-7890-abcd-ef1234567890',
              }),
              permissions: schema.Array(schema.String({
                description: 'Nome da permissão (formato: resource:action)',
                example: 'users:read',
              }), {
                description: 'Lista de permissões efetivas (combinação de roles + individuais)',
              }),
              roles: schema.Array(schema.String({
                description: 'Nome da role',
                example: 'admin',
              }), {
                description: 'Roles atribuídas ao usuário',
              }),
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Permissions'],
          summary: 'Obter permissões efetivas do usuário',
          description: `
Retorna todas as permissões efetivas de um usuário, combinando:
- Permissões herdadas das roles atribuídas
- Permissões individuais atribuídas diretamente

**Quem pode acessar:**
- Administradores podem consultar qualquer usuário
- Usuários podem consultar apenas suas próprias permissões

**Formato das permissões:**
- Cada permissão segue o formato \`resource:action\`
- Exemplos: users:read, users:write, reports:export

**Diferença entre permissões de role vs individuais:**
- **Permissões de role**: Herdadas automaticamente das roles do usuário
  - Exemplo: Um usuário com role "admin" herda todas as permissões dessa role
- **Permissões individuais**: Atribuídas diretamente ao usuário
  - Exemplo: Permissão especial "reports:export" dada apenas para usuários específicos

**Como funciona o cálculo de permissões efetivas:**
1. Sistema busca todas as roles do usuário
2. Coleta todas as permissões dessas roles
3. Adiciona permissões individuais do usuário
4. Remove duplicatas
5. Retorna lista consolidada

**Exemplo de retorno:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "userId": "019123ab-cdef-7890-abcd-ef1234567890",
    "permissions": [
      "users:read",
      "users:write",
      "reports:export"
    ],
    "roles": [
      "admin",
      "manager"
    ]
  }
}
\`\`\`

**Casos de uso:**
- Verificar o que um usuário pode fazer no sistema
- Auditoria de permissões
- Depuração de problemas de acesso

**Erros possíveis:**
- 400: ID de usuário inválido
- 401: Token ausente ou inválido
- 403: Não é admin e está tentando ver outro usuário
- 404: Usuário não encontrado
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * POST /v1/users/:userId/permissions - Assign permission to user (admin only)
   */
  private registerAssignPermissionToUserRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      '/v1/users/:userId/permissions',
      async ({
        params,
        body,
        request,
        set,
        t,
      }: {
        params: { userId: string };
        body: { permission: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        if (!this.assignPermissionToUserHandler) {
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
        const command = new AssignPermissionToUserCommand(
          params.userId,
          body.permission,
          user.userId,
          t
        );
        const result = await this.assignPermissionToUserHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.auth.permission.assignedToUser({ permission: body.permission }),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'ID do usuário (UUID v7)',
            pattern: UUID_V7_PATTERN,
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        body: schema.Object({
          permission: schema.String({
            description: 'Nome da permissão no formato resource:action',
            example: 'reports:export',
            pattern: PERMISSION_KEY_PATTERN,
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação',
              example: 'Permissão reports:export atribuída ao usuário com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Permissions'],
          summary: 'Atribuir permissão ao usuário',
          description: `
Atribui uma permissão individual diretamente a um usuário específico.

**Quem pode acessar:**
- Apenas administradores

**O que são permissões individuais:**
- Permissões atribuídas diretamente ao usuário, independente de suas roles
- Útil para casos especiais onde um usuário precisa de permissão específica
- Complementam as permissões herdadas das roles do usuário

**Formato da permissão:**
- Deve seguir o padrão \`resource:action\`
- A permissão deve existir previamente no sistema
- Exemplos: users:read, reports:export, settings:write

**Diferença entre permissões de role vs individuais:**
- **Permissões de role**: Herdadas automaticamente quando uma role é atribuída
  - Afetam todos os usuários com aquela role
  - Gerenciadas através de roles
- **Permissões individuais**: Atribuídas diretamente ao usuário
  - Afetam apenas um usuário específico
  - Gerenciadas através deste endpoint

**Quando usar permissões individuais:**
- Exceções temporárias (ex: acesso especial por período limitado)
- Permissões específicas que não justificam criar uma nova role
- Testes de novas funcionalidades com usuários específicos

**Exemplo de requisição:**
\`\`\`json
{
  "permission": "reports:export"
}
\`\`\`

**Exemplo de retorno:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "message": "Permissão reports:export atribuída ao usuário com sucesso"
}
\`\`\`

**Comportamento:**
- Se a permissão já existe (via role ou individual), não há erro
- A operação é idempotente

**Erros possíveis:**
- 400: Nome de permissão inválido ou permissão não existe no sistema
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 404: Usuário não encontrado
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * DELETE /v1/users/:userId/permissions/:permission - Remove permission from user (admin only)
   */
  private registerRemovePermissionFromUserRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.delete(
      '/v1/users/:userId/permissions/:permission',
      async ({
        params,
        request,
        set,
        t,
      }: {
        params: { userId: string; permission: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        if (!this.removePermissionFromUserHandler) {
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
        const command = new RemovePermissionFromUserCommand(
          params.userId,
          params.permission,
          user.userId,
          t
        );
        const result = await this.removePermissionFromUserHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.auth.permission.removedFromUser({ permission: params.permission }),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'ID do usuário (UUID v7)',
            pattern: UUID_V7_PATTERN,
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
          permission: schema.String({
            description: 'Nome da permissão no formato resource:action',
            example: 'reports:export',
            pattern: PERMISSION_KEY_PATTERN,
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação',
              example: 'Permissão reports:export removida do usuário com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Permissions'],
          summary: 'Remover permissão do usuário',
          description: `
Remove uma permissão individual atribuída diretamente a um usuário.

**Quem pode acessar:**
- Apenas administradores

**O que este endpoint remove:**
- Remove APENAS permissões individuais do usuário
- NÃO remove permissões herdadas de roles
- Se o usuário ainda tiver a permissão via role, ela permanecerá

**Importante:**
- Este endpoint remove apenas a atribuição individual da permissão
- Para remover permissões herdadas de role, você deve remover a role do usuário
- A permissão em si não é deletada do sistema, apenas a atribuição ao usuário

**Formato da permissão:**
- Deve seguir o padrão \`resource:action\`
- Exemplos: users:read, reports:export, settings:write

**Diferença entre permissões de role vs individuais:**
- **Permissões de role**: Herdadas automaticamente das roles
  - Para remover: desatribuir a role do usuário
- **Permissões individuais**: Atribuídas diretamente ao usuário
  - Para remover: usar este endpoint

**Exemplo de cenário:**
1. Usuário tem role "viewer" que dá permissão "reports:read"
2. Usuário recebeu permissão individual "reports:export"
3. Remover "reports:export" via este endpoint:
   - Remove permissão individual "reports:export"
   - Mantém "reports:read" da role "viewer"

**Exemplo de retorno:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "message": "Permissão reports:export removida do usuário com sucesso"
}
\`\`\`

**Comportamento:**
- Se a permissão não estava atribuída individualmente, retorna 400
- Se a permissão só existe via role, retorna 400
- A operação NÃO é idempotente (diferente da atribuição)

**Casos de uso:**
- Revogar acesso temporário concedido anteriormente
- Remover exceções de permissões
- Ajustar permissões individuais após reestruturação de roles

**Erros possíveis:**
- 400: Permissão inválida ou não está atribuída individualmente ao usuário
- 401: Token ausente ou inválido
- 403: Usuário não é administrador
- 404: Usuário não encontrado
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }
}
