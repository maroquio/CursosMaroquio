import { Elysia, t as schema } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { staticPlugin } from '@elysiajs/static';
import { Container } from './infrastructure/di/Container.ts';
import { env, validateEnv } from '@shared/config/env.ts';
import { createLogger } from '@shared/infrastructure/logging/Logger.ts';
import { getDatabase } from './infrastructure/database/connection.ts';
import { seedRoles, seedPermissions, seedAdminUser, seedHtmlCourse, seedPythonCourse, seedCssCourse } from './infrastructure/database/seeds/index.ts';
import {
  createRateLimiter,
  createSecurityHeaders,
  RateLimitPresets,
  destroyRateLimitStore,
  createRequestIdMiddleware,
  addRequestIdToResponse,
} from '@shared/infrastructure/middleware/index.ts';
import {
  initializeMetrics,
  createMetricsMiddleware,
  getMetrics,
} from '@shared/infrastructure/observability/index.ts';
import { API_VERSIONS } from '@shared/infrastructure/http/index.ts';
import {
  i18nPlugin,
  preloadAllLocales,
  localeDetector,
  getTranslatorSync,
} from '@shared/infrastructure/i18n/index.js';
import { ValidationErrorMapper } from '@shared/infrastructure/validation/ValidationErrorMapper.ts';

// Validate environment on startup
validateEnv();

const log = createLogger('main');

// Initialize database connection early to avoid issues with lazy initialization
// This ensures the database is ready before any HTTP requests are processed
getDatabase();

// Seed initial data (idempotent - safe to run on every startup)
if (env.NODE_ENV !== 'test') {
  log.info('Seeding initial data (roles, permissions, admin user)...');
}

// Seed roles first, then permissions, then admin user
// Each step depends on the previous one
seedRoles()
  .then(() => seedPermissions())
  .then(() => seedAdminUser())
  .then(() => seedHtmlCourse())
  .then(() => seedPythonCourse())
  .then(() => seedCssCourse())
  .catch((err) => {
    log.error('Failed to seed initial data', err instanceof Error ? err : new Error(String(err)));
  });

// Initialize application (register event handlers, etc.)
Container.initialize();

// Initialize metrics
initializeMetrics();

// Preload all i18n locales at startup
preloadAllLocales().catch((err) => {
  log.error('Failed to preload i18n locales', err instanceof Error ? err : new Error(String(err)));
});

// Metrics middleware instance
const metricsMiddleware = createMetricsMiddleware();

/**
 * Main Application Entry Point
 * Sets up Elysia server with all contexts and middleware
 */
const app = new Elysia()
  // i18n plugin (adds `locale` and `t` to context)
  .use(i18nPlugin)

  // Request ID middleware (generates/propagates X-Request-ID)
  .onBeforeHandle(createRequestIdMiddleware())

  // Add Request ID to response headers
  .onAfterHandle(addRequestIdToResponse())

  // Metrics middleware (before handle - start timer)
  .onBeforeHandle(metricsMiddleware.beforeHandle)

  // Metrics middleware (after handle - record metrics)
  .onAfterHandle(metricsMiddleware.afterHandle)

  // Security Headers (applied to all responses)
  .onBeforeHandle(createSecurityHeaders())

  // Rate limiting for auth endpoints
  .onBeforeHandle(async (ctx: any) => {
    const path = new URL(ctx.request.url).pathname;

    // IP-based key extractor for rate limiting
    const keyByIp = (prefix: string) => (c: any) => {
      const ip = c.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? c.request.headers.get('x-real-ip')
        ?? (c as any).server?.requestIP?.(c.request)?.address
        ?? 'unknown';
      return `${prefix}:${ip}`;
    };

    if (path === '/v1/auth/login') {
      // Key by email: multiple users from the same NAT/IP can login independently.
      // Each account gets its own 5 req/min bucket, preventing brute force per account
      // while not penalizing unrelated users sharing the same public IP.
      const rateLimiter = createRateLimiter({
        ...RateLimitPresets.strict,
        message: ctx.t.http.rateLimitExceeded(),
        keyExtractor: (reqCtx) => {
          const body = (reqCtx as any).body as { email?: string } | undefined;
          const email = body?.email?.toLowerCase().trim();
          if (email) return `login:email:${email}`;
          // Fallback to IP if email is not in body (malformed request)
          return keyByIp('login')(reqCtx);
        },
      });
      return rateLimiter(ctx);
    }

    if (path === '/v1/auth/register') {
      // Key by IP: multiple registrations from the same IP are suspicious.
      const rateLimiter = createRateLimiter({
        ...RateLimitPresets.strict,
        keyExtractor: keyByIp('register'),
        message: ctx.t.http.rateLimitExceeded(),
      });
      return rateLimiter(ctx);
    }

    if (path === '/v1/auth/refresh') {
      const rateLimiter = createRateLimiter({
        ...RateLimitPresets.standard,
        keyExtractor: keyByIp('refresh'),
        message: ctx.t.http.rateLimitRefresh(),
      });
      return rateLimiter(ctx);
    }

    if (path.match(/^\/v1\/auth\/oauth\/\w+\/callback$/)) {
      const rateLimiter = createRateLimiter({
        ...RateLimitPresets.strict,
        keyExtractor: keyByIp('oauth'),
        message: ctx.t.http.rateLimitOAuth(),
      });
      return rateLimiter(ctx);
    }

    return;
  })

  // CORS
  .use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true, // Allow cookies for refresh tokens
    })
  )

  // Static files (serve uploads directory for avatars)
  .use(
    staticPlugin({
      assets: 'uploads',
      prefix: '/uploads',
    })
  )

  // Redirects for legacy URLs (before /uploads prefix was added)
  .get('/avatars/*', ({ params, set }) => {
    set.redirect = `/uploads/avatars/${params['*']}`;
  })
  .get('/thumbnails/*', ({ params, set }) => {
    set.redirect = `/uploads/thumbnails/${params['*']}`;
  })
  .get('/bundles/*', ({ params, set }) => {
    set.redirect = `/uploads/bundles/${params['*']}`;
  })

  // Swagger/OpenAPI
  .use(
    swagger({
      documentation: {
        info: {
          title: 'TypeScript Bun Backend API',
          version: '1.0.0',
          description: 'Clean Architecture + DDD + CQRS Backend API with JWT Authentication',
          contact: {
            name: 'API Support',
          },
        },
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Auth', description: 'Authentication and user management' },
          { name: 'OAuth', description: 'OAuth social login (Google, Facebook, Apple)' },
          { name: 'Admin Users', description: 'User management for administrators' },
          { name: 'Roles', description: 'Role management (admin only)' },
          { name: 'Permissions', description: 'Permission management (admin only)' },
          { name: 'Admin Courses', description: 'Course management for administrators' },
          { name: 'Admin Lessons', description: 'Lesson management for administrators' },
          { name: 'Public Courses', description: 'Public course viewing endpoints' },
          { name: 'Student Enrollments', description: 'Student enrollment and progress' },
          { name: 'Observability', description: 'Metrics and monitoring endpoints' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Enter your JWT access token',
            },
          },
        },
      },
      path: '/swagger',
      exclude: ['/swagger', '/swagger/json'],
    })
  )

  // Favicon handler (returns 204 No Content to prevent 404 errors)
  .get('/favicon.ico', ({ set }) => {
    set.status = 204;
    return null;
  })

  // Health check endpoints
  .get(
    '/',
    ({ t, locale }) => ({
      message: t.http.welcome(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      locale,
    }),
    {
      response: {
        200: schema.Object({
          message: schema.String({
            description: 'Mensagem de boas-vindas',
            example: 'Bem-vindo à API!'
          }),
          timestamp: schema.String({
            format: 'date-time',
            description: 'Data/hora atual do servidor (ISO 8601)',
            example: '2024-01-15T10:30:00.000Z'
          }),
          version: schema.String({
            description: 'Versão da API',
            example: '1.0.0'
          }),
          locale: schema.String({
            description: 'Idioma detectado (pt-BR, en, es)',
            example: 'pt-BR'
          }),
        }),
      },
      detail: {
        tags: ['Health'],
        summary: 'Endpoint de boas-vindas',
        description: `
Retorna informações básicas do servidor e uma mensagem de boas-vindas localizada.

**Uso:**
- Verificação rápida de que a API está respondendo
- Identificar a versão da API em execução
- Verificar o idioma detectado

**Detecção de idioma:**
O idioma é detectado automaticamente via:
1. Header \`Accept-Language\`
2. Query parameter \`?lang=pt-BR\`
3. Fallback: \`en\` (inglês)

**Idiomas suportados:**
- \`pt-BR\`: Português brasileiro
- \`en\`: Inglês
- \`es\`: Espanhol
        `,
      },
    }
  )

  .get(
    '/health',
    async () => {
      const dbHealthy = await Container.checkDatabaseHealth();
      const status = dbHealthy ? ('ok' as const) : ('degraded' as const);

      return {
        status,
        timestamp: Date.now(),
        uptime: process.uptime(),
        checks: {
          database: dbHealthy ? ('healthy' as const) : ('unhealthy' as const),
        },
      };
    },
    {
      response: {
        200: schema.Object({
          status: schema.Union([schema.Literal('ok'), schema.Literal('degraded')], {
            description: 'Status geral da aplicação',
            example: 'ok',
          }),
          timestamp: schema.Number({
            description: 'Timestamp Unix em milissegundos',
            example: 1705315800000
          }),
          uptime: schema.Number({
            description: 'Tempo de execução do servidor em segundos',
            example: 3600.5
          }),
          checks: schema.Object({
            database: schema.Union([schema.Literal('healthy'), schema.Literal('unhealthy')], {
              description: 'Status da conexão com o banco de dados',
              example: 'healthy',
            }),
          }, {
            description: 'Verificações individuais de saúde',
          }),
        }),
      },
      detail: {
        tags: ['Health'],
        summary: 'Verificação de saúde da aplicação',
        description: `
Retorna o status de saúde da aplicação e suas dependências.

**Status possíveis:**
- \`ok\`: Todos os serviços funcionando normalmente
- \`degraded\`: Um ou mais serviços com problemas

**Verificações realizadas:**
- **database**: Conexão com PostgreSQL

**Uso em produção:**
- Load balancers podem usar este endpoint para health checks
- Kubernetes liveness/readiness probes
- Monitoramento de infraestrutura

**Exemplo de uso com curl:**
\`\`\`bash
curl http://localhost:8702/health
\`\`\`

**Resposta quando saudável:**
\`\`\`json
{
  "status": "ok",
  "timestamp": 1705315800000,
  "uptime": 3600.5,
  "checks": {
    "database": "healthy"
  }
}
\`\`\`
        `,
      },
    }
  )

  // Prometheus metrics endpoint
  .get(
    '/metrics',
    () => {
      return new Response(getMetrics(), {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      });
    },
    {
      detail: {
        tags: ['Observability'],
        summary: 'Métricas Prometheus',
        description: `
Retorna métricas da aplicação no formato Prometheus.

**Formato de saída:**
- Content-Type: text/plain; version=0.0.4
- Compatível com Prometheus, Grafana, Victoria Metrics

**Métricas disponíveis:**
- \`http_requests_total\`: Total de requisições HTTP (por método, path, status)
- \`http_request_duration_seconds\`: Duração das requisições (histogram)
- \`auth_login_attempts_total\`: Tentativas de login (sucesso/falha)
- \`auth_token_refresh_total\`: Renovações de token
- \`auth_logout_total\`: Logouts realizados
- \`process_uptime_seconds\`: Tempo de execução
- \`nodejs_*\`: Métricas do Node.js/Bun runtime

**Configuração no Prometheus:**
\`\`\`yaml
scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['localhost:8702']
    metrics_path: '/metrics'
    scrape_interval: 15s
\`\`\`

**Exemplo de query Grafana:**
\`\`\`promql
rate(http_requests_total[5m])
\`\`\`
        `,
      },
    }
  );

// Register Auth Context routes
const authController = Container.createAuthController();
authController.routes(app);

// Register Profile routes (update profile, change password, delete account, upload photo)
const profileController = Container.createProfileController();
profileController.routes(app);

// Register OAuth routes (social login)
const oauthController = Container.createOAuthController();
oauthController.routes(app);

// Register OAuth Account routes (link/unlink/connections)
const oauthAccountController = Container.createOAuthAccountController();
oauthAccountController.routes(app);

// Register Role Management routes (CRUD + role-permission assignment)
const roleController = Container.createRoleController();
roleController.routes(app);

// Register User-Role Assignment routes
const userRoleController = Container.createUserRoleController();
userRoleController.routes(app);

// Register Permission Management routes
const permissionController = Container.createPermissionController();
permissionController.routes(app);

// Register User Admin Management routes
const userAdminController = Container.createUserAdminController();
userAdminController.routes(app);

// Register Courses Context routes
const courseAdminController = Container.createCourseAdminController();
courseAdminController.routes(app);

const coursePublicController = Container.createCoursePublicController();
coursePublicController.routes(app);

const enrollmentController = Container.createEnrollmentController();
enrollmentController.routes(app);

// Register Module Admin routes
const moduleAdminController = Container.createModuleAdminController();
moduleAdminController.routes(app);

// Register Section Admin routes
const sectionAdminController = Container.createSectionAdminController();
sectionAdminController.routes(app);

// Register Lesson Bundle Admin routes
const lessonBundleAdminController = Container.createLessonBundleAdminController();
lessonBundleAdminController.routes(app);

// Register Section Bundle Admin routes
const sectionBundleAdminController = Container.createSectionBundleAdminController();
sectionBundleAdminController.routes(app);

// Register Category routes
const categoryAdminController = Container.createCategoryAdminController();
categoryAdminController.routes(app);

const categoryPublicController = Container.createCategoryPublicController();
categoryPublicController.routes(app);

// Certificate routes
const certificateController = Container.createCertificateController();
certificateController.routes(app);

// Calendar Event routes
const calendarEventAdminController = Container.createCalendarEventAdminController();
calendarEventAdminController.routes(app);

const calendarEventPublicController = Container.createCalendarEventPublicController();
calendarEventPublicController.routes(app);

// Export/Import routes
Container.createExportImportAdminController().routes(app);

// AI Context
Container.createLlmManufacturerAdminController().routes(app);
Container.createLlmModelAdminController().routes(app);
Container.createExerciseVerificationController().routes(app);

// Global error handler with i18n support
app.onError(({ error, code, set, request }) => {
  // Only log in non-test environments
  if (env.NODE_ENV !== 'test') {
    log.error(`Error [${code}]: ${request.method} ${request.url}`, error instanceof Error ? error : new Error(String(error)));
  }

  // Detect locale from request for localized error messages
  const locale = localeDetector.detect(request);
  const t = getTranslatorSync(locale);

  // Handle validation errors specifically with i18n support
  // Uses 422 Unprocessable Entity (RFC 4918) - semantically correct for validation errors
  if (code === 'VALIDATION') {
    const mapper = new ValidationErrorMapper(t);
    const errors = mapper.mapElysiaError(error);

    set.status = 422;
    return {
      statusCode: 422,
      success: false,
      message: t.common.validationError(),
      errors,
    };
  }

  // Handle not found errors
  if (code === 'NOT_FOUND') {
    set.status = 404;
    return {
      statusCode: 404,
      success: false,
      error: t.http.routeNotFound(),
    };
  }

  return {
    statusCode: 500,
    success: false,
    error: env.NODE_ENV === 'production' ? t.common.internalError() : String(error),
  };
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  if (env.NODE_ENV !== 'test') {
    log.info(`Received ${signal}, shutting down gracefully...`);
  }

  // Stop accepting new connections
  app.stop();

  // Cleanup rate limit store
  destroyRateLimitStore();

  // Close database connections and cleanup resources
  await Container.shutdown();

  if (env.NODE_ENV !== 'test') {
    log.info('Server stopped.');
  }

  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
app.listen(env.PORT);

if (env.NODE_ENV !== 'test') {
  log.info(`Server running at http://${app.server?.hostname}:${app.server?.port}`);

  log.info(`
+------------------------------------------------------------------------+
|   Clean Architecture + DDD + CQRS Backend - API v1                      |
|   Architecture: Layers separated by responsibility                      |
|   Domain: Entities, Value Objects, Events                               |
|   Application: Commands, Queries, Handlers                              |
|   Infrastructure: Database, HTTP, DI                                    |
|                                                                         |
|   API Endpoints (v1):                                                   |
|   GET    /                         - Welcome message                    |
|   GET    /health                   - Health check                       |
|   GET    /metrics                  - Prometheus metrics                 |
|   POST   /v1/auth/register         - Register new user                  |
|   POST   /v1/auth/login            - Login (returns JWT tokens)         |
|   POST   /v1/auth/refresh          - Refresh access token               |
|   POST   /v1/auth/logout           - Logout (revoke refresh token)      |
|   GET    /v1/auth/me               - Get current user (protected)       |
|   GET    /v1/auth/:userId          - Get user by ID                     |
|                                                                         |
|   OAuth Social Login:                                                   |
|   GET    /v1/auth/oauth/providers           - List enabled providers    |
|   GET    /v1/auth/oauth/:provider/authorize - Get authorization URL     |
|   POST   /v1/auth/oauth/:provider/callback  - OAuth login/register      |
|   POST   /v1/auth/oauth/:provider/link      - Link to account           |
|   DELETE /v1/auth/oauth/:provider/unlink    - Unlink from account       |
|   GET    /v1/auth/oauth/connections         - List linked accounts      |
|                                                                         |
|   Role Management (admin only):                                         |
|   GET    /v1/roles                 - List all roles                     |
|   POST   /v1/roles                 - Create new role                    |
|   PUT    /v1/roles/:roleId         - Update role                        |
|   DELETE /v1/roles/:roleId         - Delete role                        |
|   POST   /v1/roles/:id/permissions - Assign permission to role          |
|   DELETE /v1/roles/:id/permissions/:perm - Remove permission from role  |
|   GET    /v1/users/:id/roles       - Get user roles                     |
|   POST   /v1/users/:id/roles       - Assign role to user                |
|   DELETE /v1/users/:id/roles/:role - Remove role from user              |
|                                                                         |
|   Permission Management (admin only):                                   |
|   GET    /v1/permissions           - List all permissions               |
|   POST   /v1/permissions           - Create new permission              |
|   GET    /v1/users/:id/permissions - Get user effective permissions     |
|   POST   /v1/users/:id/permissions - Assign permission to user          |
|   DELETE /v1/users/:id/permissions/:perm - Remove permission from user  |
|                                                                         |
|   User Admin Management (admin only):                                   |
|   GET    /v1/admin/users           - List users (paginated)             |
|   GET    /v1/admin/users/:userId   - Get user by ID                     |
|   POST   /v1/admin/users           - Create new user                    |
|   PUT    /v1/admin/users/:userId   - Update user                        |
|   DELETE /v1/admin/users/:userId   - Deactivate user (soft delete)      |
|   POST   /v1/admin/users/:userId/activate - Reactivate user             |
|   POST   /v1/admin/users/:userId/reset-password - Reset user password   |
|                                                                         |
|   Course Management (admin only):                                       |
|   GET    /v1/admin/courses         - List all courses                   |
|   GET    /v1/admin/courses/:id     - Get course by ID                   |
|   POST   /v1/admin/courses         - Create new course                  |
|   PUT    /v1/admin/courses/:id     - Update course                      |
|   POST   /v1/admin/courses/:id/publish - Publish course                 |
|   POST   /v1/admin/courses/:id/lessons - Add lesson to course           |
|                                                                         |
|   Public Courses:                                                       |
|   GET    /v1/courses               - List published courses             |
|   GET    /v1/courses/:slug         - Get course by slug                 |
|                                                                         |
|   Student Enrollments:                                                  |
|   POST   /v1/enrollments           - Enroll in a course                 |
|   GET    /v1/enrollments/me        - Get my enrollments                 |
|   GET    /v1/enrollments/:id/progress - Get course progress             |
|   POST   /v1/enrollments/:id/lessons/:lessonId/progress - Update lesson |
|                                                                         |
|   Security:                                                             |
|   - JWT Access Token (15min) + Refresh Token (7d)                       |
|   - OAuth 2.0 with PKCE (Google, Facebook, Apple)                       |
|   - Rate limiting on auth endpoints                                     |
|   - RBAC (Role-Based Access Control) with granular permissions          |
|   - Security headers enabled                                            |
|   - X-Request-ID for traceability                                       |
|                                                                         |
|   Observability:                                                        |
|   - Prometheus metrics at /metrics                                      |
|   - Request ID in all responses (X-Request-ID header)                   |
|   - Response time header (X-Response-Time)                              |
|                                                                         |
|   Documentation:                                                        |
|   GET    /swagger                  - OpenAPI/Swagger UI                 |
|   GET    /swagger/json             - OpenAPI JSON spec                  |
+------------------------------------------------------------------------+
`);
}
