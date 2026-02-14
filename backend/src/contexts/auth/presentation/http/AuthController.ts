import type { Elysia } from 'elysia';
import { t as schema } from 'elysia';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { UUID_V7_PATTERN } from '@shared/constants/validation.ts';
import { RegisterUserCommand } from '../../application/commands/register-user/RegisterUserCommand.ts';
import { RegisterUserHandler } from '../../application/commands/register-user/RegisterUserHandler.ts';
import { GetUserQuery } from '../../application/queries/get-user/GetUserQuery.ts';
import { GetUserHandler } from '../../application/queries/get-user/GetUserHandler.ts';
import { LoginCommand } from '../../application/commands/login/LoginCommand.ts';
import { LoginHandler } from '../../application/commands/login/LoginHandler.ts';
import { RefreshTokenCommand } from '../../application/commands/refresh-token/RefreshTokenCommand.ts';
import { RefreshTokenHandler } from '../../application/commands/refresh-token/RefreshTokenHandler.ts';
import { LogoutCommand } from '../../application/commands/logout/LogoutCommand.ts';
import { LogoutHandler } from '../../application/commands/logout/LogoutHandler.ts';
import type { ITokenService } from '../../domain/services/ITokenService.ts';
import {
  createAuthMiddleware,
  extractClientInfo,
  type AuthenticatedUser,
} from '../middleware/AuthMiddleware.ts';
import { authMetrics } from '@shared/infrastructure/observability/index.ts';
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
} from '@shared/presentation/http/CookieHelper.ts';
import { createLogger } from '@shared/infrastructure/logging/Logger.ts';

const logger = createLogger('AuthController');

// Response schemas for OpenAPI documentation

// Generic error responses
const ValidationErrorResponse = schema.Object({
  statusCode: schema.Literal(400),
  success: schema.Literal(false),
  error: schema.String({
    description: 'Mensagem de erro de validação',
    example: 'Email inválido ou senha não atende aos requisitos mínimos',
  }),
});

const UnauthorizedResponse = schema.Object({
  statusCode: schema.Literal(401),
  success: schema.Literal(false),
  error: schema.String({
    description: 'Credenciais inválidas ou token expirado',
    example: 'Credenciais inválidas',
  }),
});

const NotFoundResponse = schema.Object({
  statusCode: schema.Literal(404),
  success: schema.Literal(false),
  error: schema.String({
    description: 'Recurso não encontrado',
    example: 'Usuário não encontrado',
  }),
});

const ConflictResponse = schema.Object({
  statusCode: schema.Literal(409),
  success: schema.Literal(false),
  error: schema.String({
    description: 'Conflito de recurso (ex: email já cadastrado)',
    example: 'Email já está em uso',
  }),
});

const RateLimitResponse = schema.Object({
  statusCode: schema.Literal(429),
  success: schema.Literal(false),
  error: schema.String({
    description: 'Muitas requisições. Tente novamente mais tarde.',
    example: 'Limite de requisições excedido. Aguarde 60 segundos.',
  }),
});

// Domain-specific schemas
const UserResponse = schema.Object({
  id: schema.String({
    description: 'Identificador único do usuário no formato UUID v7',
    example: '019123ab-cdef-7890-abcd-ef1234567890',
    pattern: UUID_V7_PATTERN,
  }),
  email: schema.String({
    format: 'email',
    description: 'Endereço de email do usuário',
    example: 'usuario@exemplo.com',
  }),
  fullName: schema.String({
    description: 'Nome completo do usuário',
    example: 'João da Silva',
  }),
  phone: schema.String({
    description: 'Telefone do usuário',
    example: '11999998888',
  }),
  createdAt: schema.String({
    format: 'date-time',
    description: 'Data e hora de criação da conta no formato ISO 8601',
    example: '2025-12-18T10:30:00.000Z',
  }),
});

const TokenResponse = schema.Object({
  accessToken: schema.String({
    description: 'Token JWT de acesso válido por 15 minutos',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTkxMjNhYi1jZGVmLTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJpYXQiOjE3MDAwMDAwMDB9.xxx',
  }),
  refreshToken: schema.String({
    description: 'Token de renovação válido por 7 dias para obter novos access tokens',
    example: '019123ab-cdef-7890-abcd-ef1234567890_refresh_token_secure',
  }),
  expiresIn: schema.Number({
    description: 'Tempo de expiração do access token em segundos',
    example: 900,
  }),
});

const LoginResponse = schema.Object({
  statusCode: schema.Literal(200),
  success: schema.Literal(true),
  data: schema.Object({
    ...TokenResponse.properties,
    user: schema.Object({
      id: schema.String({
        description: 'Identificador único do usuário',
        example: '019123ab-cdef-7890-abcd-ef1234567890',
      }),
      email: schema.String({
        format: 'email',
        description: 'Email do usuário autenticado',
        example: 'usuario@exemplo.com',
      }),
      fullName: schema.String({
        description: 'Nome completo do usuário',
        example: 'João da Silva',
      }),
      phone: schema.String({
        description: 'Telefone do usuário',
        example: '11999998888',
      }),
      photoUrl: schema.Union([schema.String(), schema.Null()], {
        description: 'URL da foto de perfil do usuário',
        example: '/avatars/019123ab-cdef-7890-abcd-ef1234567890_1234567890.jpg',
      }),
      roles: schema.Array(schema.String(), {
        description: 'Papéis do usuário no sistema',
        example: ['user'],
      }),
    }),
  }),
});

/**
 * AuthController
 * Handles HTTP requests for authentication context
 * Converts HTTP input to commands/queries
 * Converts results back to HTTP responses
 *
 * Each endpoint is implemented in a separate method for better
 * maintainability and adherence to Single Responsibility Principle.
 */
export class AuthController {
  constructor(
    private registerUserHandler: RegisterUserHandler,
    private getUserHandler: GetUserHandler,
    private loginHandler: LoginHandler,
    private refreshTokenHandler: RefreshTokenHandler,
    private logoutHandler: LogoutHandler,
    private tokenService: ITokenService
  ) {}

  /**
   * Register routes for authentication
   * Routes are registered under /v1/auth/* prefix
   */
  public routes(app: any) {
    const authMiddleware = createAuthMiddleware(this.tokenService);

    // Register versioned routes
    this.registerAuthRoutes(app, '/v1/auth', authMiddleware);

    return app;
  }

  /**
   * Register auth routes under a specific base path
   */
  private registerAuthRoutes(
    app: any,
    basePath: string,
    authMiddleware: (ctx: any) => Promise<any>
  ) {
    // Public endpoints
    this.registerRegisterRoute(app, basePath);
    this.registerLoginRoute(app, basePath);
    this.registerRefreshRoute(app, basePath);
    this.registerLogoutRoute(app, basePath);

    // Protected endpoints
    this.registerMeRoute(app, basePath, authMiddleware);
    this.registerGetUserByIdRoute(app, basePath);

    return app;
  }

  // =====================
  // Public endpoints
  // =====================

  /**
   * POST /register - Create a new user account
   */
  private registerRegisterRoute(app: any, basePath: string) {
    app.post(
      `${basePath}/register`,
      async (ctx: { body: { email: string; password: string; fullName: string; phone: string }; t: TranslationFunctions }) => {
        // Pass translator to command for localized error messages
        const command = new RegisterUserCommand(
          ctx.body.email,
          ctx.body.password,
          ctx.body.fullName,
          ctx.body.phone,
          ctx.t
        );
        const result = await this.registerUserHandler.execute(command);

        if (result.isFailure) {
          return {
            statusCode: 400,
            success: false,
            error: String(result.getError()),
          };
        }

        return {
          statusCode: 201,
          success: true,
          message: ctx.t.auth.user.registeredSuccess(),
        };
      },
      {
        body: schema.Object({
          email: schema.String({
            format: 'email',
            description: 'Endereço de email válido para registro no sistema',
            example: 'usuario@exemplo.com',
          }),
          password: schema.String({
            minLength: 8,
            description:
              'Senha do usuário (mínimo 8 caracteres, deve conter letra maiúscula, minúscula e número)',
            example: 'MinhaSenh@123',
          }),
          fullName: schema.String({
            minLength: 3,
            description: 'Nome completo do usuário',
            example: 'João da Silva',
          }),
          phone: schema.String({
            minLength: 10,
            description: 'Telefone móvel do usuário (apenas números)',
            example: '11999998888',
          }),
        }),
        response: {
          201: schema.Object({
            statusCode: schema.Literal(201),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação do registro',
              example: 'Usuário registrado com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          409: ConflictResponse,
          429: RateLimitResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Registrar novo usuário',
          description: `
Cria uma nova conta de usuário com email, senha, nome completo e telefone.

**Pré-requisitos:**
- Email não pode estar cadastrado no sistema
- Senha deve atender aos requisitos de complexidade
- Nome completo deve ter no mínimo 3 caracteres
- Telefone deve ter no mínimo 10 dígitos

**Requisitos de senha:**
- Mínimo de 8 caracteres
- Deve conter pelo menos uma letra maiúscula
- Deve conter pelo menos uma letra minúscula
- Deve conter pelo menos um número

**Rate Limiting:**
- Limite: 10 registros por hora por IP
- Após exceder, aguardar 60 minutos

**Comportamento:**
- Cria novo usuário no sistema
- Senha é armazenada usando hash Argon2id
- Email deve ser único no sistema

**Erros possíveis:**
- 400: Email em formato inválido ou senha não atende aos requisitos
- 409: Email já cadastrado no sistema
- 429: Rate limit excedido
          `,
        },
      }
    );
  }

  /**
   * POST /login - Authenticate user and return tokens
   */
  private registerLoginRoute(app: any, basePath: string) {
    app.post(
      `${basePath}/login`,
      async (ctx: any) => {
        try {
          const { userAgent, ipAddress } = extractClientInfo({ request: ctx.request } as any);
          // Pass translator to command for localized error messages
          const command = new LoginCommand(
            ctx.body.email,
            ctx.body.password,
            userAgent,
            ipAddress,
            ctx.t
          );
          const result = await this.loginHandler.execute(command);

          if (result.isFailure) {
            authMetrics.recordLoginAttempt(false);
            ctx.set.status = 401;
            return {
              statusCode: 401,
              success: false as const,
              error: String(result.getError()),
            };
          }

          authMetrics.recordLoginAttempt(true);
          const data = result.getValue();

          // Set refresh token as HttpOnly cookie
          setRefreshTokenCookie(ctx.set, data.refreshToken);

          return {
            statusCode: 200,
            success: true,
            data: {
              accessToken: data.accessToken,
              expiresIn: data.expiresIn,
              user: data.user,
            },
          };
        } catch (error) {
          logger.error('Login error', error instanceof Error ? error : new Error(String(error)));
          authMetrics.recordLoginAttempt(false);
          ctx.set.status = 500;
          return {
            statusCode: 500,
            success: false,
            error: String(error),
          };
        }
      },
      {
        body: schema.Object({
          email: schema.String({
            format: 'email',
            description: 'Email do usuário cadastrado no sistema',
            example: 'usuario@exemplo.com',
          }),
          password: schema.String({
            description: 'Senha do usuário',
            example: 'MinhaSenh@123',
          }),
        }),
        response: {
          200: LoginResponse,
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          429: RateLimitResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Autenticar usuário',
          description: `
Autentica um usuário com email e senha, retornando tokens JWT.

**Pré-requisitos:**
- Usuário deve estar cadastrado no sistema
- Conta não pode estar bloqueada ou desativada

**Rate Limiting:**
- Limite: 5 tentativas por minuto por IP
- Após exceder, aguardar 60 segundos
- Proteção contra ataques de força bruta

**Tokens retornados:**
- \`accessToken\`: Token JWT válido por 15 minutos para autenticação de requisições
- \`refreshToken\`: Token de renovação válido por 7 dias para obter novos access tokens

**Comportamento:**
- Valida credenciais do usuário
- Gera par de tokens (access + refresh)
- Registra informações da sessão (user agent, IP)
- Incrementa contador de tentativas de login
- Retorna dados do usuário autenticado

**Erros possíveis:**
- 400: Email ou senha em formato inválido
- 401: Credenciais incorretas ou conta desativada
- 429: Rate limit excedido (muitas tentativas de login)
          `,
        },
      }
    );
  }

  /**
   * POST /refresh - Exchange refresh token for new token pair
   */
  private registerRefreshRoute(app: any, basePath: string) {
    app.post(
      `${basePath}/refresh`,
      async ({ body, request, set, cookie, t }: { body: { refreshToken?: string }; request: Request; set: any; cookie: any; t: TranslationFunctions }) => {
        // Read refresh token from HttpOnly cookie (preferred) or body (backward compatibility)
        const refreshToken = getRefreshTokenFromCookie(cookie) || body?.refreshToken;

        if (!refreshToken) {
          authMetrics.recordTokenRefresh(false);
          set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: t.common.unauthorized(),
          };
        }

        const { userAgent, ipAddress } = extractClientInfo({ request } as any);
        const command = new RefreshTokenCommand(refreshToken, userAgent, ipAddress, t);
        const result = await this.refreshTokenHandler.execute(command);

        if (result.isFailure) {
          authMetrics.recordTokenRefresh(false);
          set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: String(result.getError()),
          };
        }

        authMetrics.recordTokenRefresh(true);
        const data = result.getValue();

        // Set new refresh token as HttpOnly cookie
        setRefreshTokenCookie(set, data.refreshToken);

        return {
          statusCode: 200,
          success: true,
          data: {
            accessToken: data.accessToken,
            expiresIn: data.expiresIn,
          },
        };
      },
      {
        body: schema.Optional(schema.Object({
          refreshToken: schema.Optional(schema.String({
            description: 'Token de renovação (deprecated - usar cookie HttpOnly)',
            example: '019123ab-cdef-7890-abcd-ef1234567890_refresh_token_secure',
          })),
        })),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: TokenResponse,
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          429: RateLimitResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Renovar tokens de acesso',
          description: `
Utiliza um refresh token para obter um novo par de tokens (access + refresh).

**Pré-requisitos:**
- Refresh token deve ser válido e não expirado
- Token não pode ter sido revogado ou usado anteriormente
- Usuário associado ao token deve estar ativo

**Rate Limiting:**
- Limite: 10 renovações por minuto por usuário
- Após exceder, aguardar 60 segundos

**Comportamento (Token Rotation):**
- Valida o refresh token fornecido
- Invalida o refresh token antigo (segurança adicional)
- Gera novo par de tokens (access + refresh)
- Atualiza informações da sessão (última atividade)
- O token antigo não pode mais ser reutilizado

**Tokens retornados:**
- \`accessToken\`: Novo token JWT válido por 15 minutos
- \`refreshToken\`: Novo token de renovação válido por 7 dias
- \`expiresIn\`: Tempo de expiração em segundos (900)

**Erros possíveis:**
- 400: Refresh token em formato inválido
- 401: Token expirado, revogado ou inválido
- 429: Rate limit excedido (muitas tentativas de renovação)
          `,
        },
      }
    );
  }

  /**
   * POST /logout - Invalidate refresh token
   */
  private registerLogoutRoute(app: any, basePath: string) {
    app.post(
      `${basePath}/logout`,
      async (ctx: { body: { refreshToken?: string; logoutAll?: boolean }; cookie: any; set: any; t: TranslationFunctions }) => {
        // Read refresh token from HttpOnly cookie (preferred) or body (backward compatibility)
        const refreshToken = getRefreshTokenFromCookie(ctx.cookie) || ctx.body?.refreshToken;

        if (refreshToken) {
          const command = new LogoutCommand(refreshToken, ctx.body?.logoutAll ?? false, ctx.t);
          await this.logoutHandler.execute(command);
        }

        authMetrics.recordLogout();

        // Clear the refresh token cookie
        clearRefreshTokenCookie(ctx.set);

        return {
          statusCode: 200,
          success: true,
          message: ctx.t.auth.user.logoutSuccess(),
        };
      },
      {
        body: schema.Optional(schema.Object({
          refreshToken: schema.Optional(schema.String({
            description: 'Token de renovação a ser invalidado (deprecated - usar cookie HttpOnly)',
            example: '019123ab-cdef-7890-abcd-ef1234567890_refresh_token_secure',
          })),
          logoutAll: schema.Optional(
            schema.Boolean({
              description: 'Se verdadeiro, encerra todas as sessões do usuário em todos os dispositivos',
              default: false,
              example: false,
            })
          ),
        })),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação do logout',
              example: 'Logout realizado com sucesso',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Encerrar sessão',
          description: `
Invalida o refresh token, encerrando a sessão do usuário.

**Pré-requisitos:**
- Refresh token deve ser válido
- Token deve pertencer a um usuário existente

**Modos de logout:**

1. **Logout simples** (\`logoutAll: false\` ou não informado):
   - Invalida apenas o refresh token fornecido
   - Outras sessões do usuário permanecem ativas
   - Útil para logout de um dispositivo específico

2. **Logout global** (\`logoutAll: true\`):
   - Revoga TODAS as sessões do usuário
   - Invalida todos os refresh tokens associados
   - Força logout em todos os dispositivos
   - Útil para segurança (troca de senha, dispositivo comprometido)

**Comportamento:**
- Marca o refresh token como revogado no banco
- Access tokens continuam válidos até expirarem (15 min)
- Registra evento de logout para auditoria
- Não retorna erro se token já estava revogado

**Erros possíveis:**
- 400: Refresh token em formato inválido
- 401: Token não encontrado ou já expirado
          `,
        },
      }
    );
  }

  // =====================
  // Protected endpoints
  // =====================

  /**
   * GET /me - Get current authenticated user
   */
  private registerMeRoute(app: any, basePath: string, authMiddleware: (ctx: any) => Promise<any>) {
    app.get(
      `${basePath}/me`,
      async ({ request, set, t }: { request: Request; set: any; t: TranslationFunctions }) => {
        const authResult = await authMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: t.common.unauthorized(),
          };
        }

        const user = authResult.user as AuthenticatedUser;
        const query = new GetUserQuery(user.userId, t);
        const result = await this.getUserHandler.execute(query);

        if (result.isFailure) {
          set.status = 404;
          return {
            statusCode: 404,
            success: false as const,
            error: String(result.getError()),
          };
        }

        const userData = result.getValue();
        return {
          statusCode: 200 as const,
          success: true as const,
          data: {
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName,
            phone: userData.phone,
            photoUrl: userData.photoUrl,
            createdAt: userData.createdAt.toISOString(),
          },
        };
      },
      {
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Object({
              ...UserResponse.properties,
              photoUrl: schema.Union([schema.String(), schema.Null()]),
            }),
          }),
          401: UnauthorizedResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Obter usuário autenticado',
          description: `
Retorna informações do usuário atualmente autenticado.

**Pré-requisitos:**
- Requisição deve incluir access token JWT válido no header Authorization
- Token não pode estar expirado
- Usuário associado ao token deve existir e estar ativo

**Autenticação:**
- Header: \`Authorization: Bearer <accessToken>\`
- Token obtido no login ou refresh

**Rate Limiting:**
- Limite: 60 requisições por minuto por usuário
- Após exceder, aguardar 60 segundos

**Comportamento:**
- Extrai userId do token JWT
- Busca dados do usuário no banco
- Retorna informações básicas do perfil
- Endpoint útil para validar sessão e obter dados atuais

**Dados retornados:**
- ID do usuário (UUID v7)
- Email cadastrado
- Data de criação da conta

**Erros possíveis:**
- 401: Token ausente, inválido, expirado ou malformado
- 404: Usuário não encontrado (conta deletada após emissão do token)
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * GET /:userId - Get user by ID
   */
  private registerGetUserByIdRoute(app: any, basePath: string) {
    app.get(
      `${basePath}/:userId`,
      async ({ params, t }: { params: { userId: string }; t: TranslationFunctions }) => {
        const query = new GetUserQuery(params.userId, t);
        const result = await this.getUserHandler.execute(query);

        if (result.isFailure) {
          return {
            statusCode: 404,
            success: false,
            error: t.auth.user.notFound(),
          };
        }

        const userData = result.getValue();
        return {
          statusCode: 200,
          success: true,
          data: {
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName,
            phone: userData.phone,
            createdAt: userData.createdAt.toISOString(),
          },
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'Identificador único do usuário no formato UUID v7',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
            pattern: UUID_V7_PATTERN,
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: UserResponse,
          }),
          400: ValidationErrorResponse,
          404: NotFoundResponse,
          429: RateLimitResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Buscar usuário por ID',
          description: `
Busca e retorna informações de um usuário específico pelo seu identificador único.

**Pré-requisitos:**
- ID do usuário deve ser um UUID v7 válido
- Usuário deve existir no sistema

**Formato do ID:**
- UUID versão 7 (time-ordered)
- Formato: 8-4-4-4-12 caracteres hexadecimais
- Exemplo: 019123ab-cdef-7890-abcd-ef1234567890

**Rate Limiting:**
- Limite: 30 requisições por minuto por IP
- Após exceder, aguardar 60 segundos

**Comportamento:**
- Valida formato do UUID fornecido
- Busca usuário no banco de dados
- Retorna dados públicos do perfil
- Não expõe informações sensíveis (senha, tokens)

**Dados retornados:**
- ID do usuário (UUID v7)
- Email cadastrado
- Data de criação da conta

**Casos de uso:**
- Buscar perfil de outro usuário
- Validar existência de usuário
- Obter dados básicos para integração

**Erros possíveis:**
- 400: ID em formato inválido (não é UUID v7)
- 404: Usuário não encontrado ou conta desativada
- 429: Rate limit excedido
          `,
        },
      }
    );
  }
}
