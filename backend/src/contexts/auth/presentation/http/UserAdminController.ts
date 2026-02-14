import { t as schema } from 'elysia';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';

// Queries
import { ListUsersQuery } from '../../application/queries/list-users/ListUsersQuery.ts';
import type { ListUsersHandler } from '../../application/queries/list-users/ListUsersHandler.ts';
import { GetUserAdminQuery } from '../../application/queries/get-user-admin/GetUserAdminQuery.ts';
import type { GetUserAdminHandler } from '../../application/queries/get-user-admin/GetUserAdminHandler.ts';

// Commands
import { CreateUserAdminCommand } from '../../application/commands/create-user-admin/CreateUserAdminCommand.ts';
import type { CreateUserAdminHandler } from '../../application/commands/create-user-admin/CreateUserAdminHandler.ts';
import { UpdateUserAdminCommand } from '../../application/commands/update-user-admin/UpdateUserAdminCommand.ts';
import type { UpdateUserAdminHandler } from '../../application/commands/update-user-admin/UpdateUserAdminHandler.ts';
import { DeactivateUserCommand } from '../../application/commands/deactivate-user/DeactivateUserCommand.ts';
import type { DeactivateUserHandler } from '../../application/commands/deactivate-user/DeactivateUserHandler.ts';
import { ActivateUserCommand } from '../../application/commands/activate-user/ActivateUserCommand.ts';
import type { ActivateUserHandler } from '../../application/commands/activate-user/ActivateUserHandler.ts';
import { ResetPasswordAdminCommand } from '../../application/commands/reset-password-admin/ResetPasswordAdminCommand.ts';
import type { ResetPasswordAdminHandler } from '../../application/commands/reset-password-admin/ResetPasswordAdminHandler.ts';

// Domain
import type { ITokenService } from '../../domain/services/ITokenService.ts';
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
  error: schema.String({ description: 'Validation error message' }),
});

const UnauthorizedResponse = schema.Object({
  statusCode: schema.Literal(401),
  success: schema.Literal(false),
  error: schema.String({ description: 'Access token missing or invalid' }),
});

const ForbiddenResponse = schema.Object({
  statusCode: schema.Literal(403),
  success: schema.Literal(false),
  error: schema.String({ description: 'Permission denied. Requires admin privilege.' }),
});

const NotFoundResponse = schema.Object({
  statusCode: schema.Literal(404),
  success: schema.Literal(false),
  error: schema.String({ description: 'Resource not found' }),
});

const UserAdminResponse = schema.Object({
  id: schema.String({
    description: 'Unique user ID (UUID v7)',
    example: '019123ab-cdef-7890-abcd-ef1234567890',
  }),
  email: schema.String({
    description: 'User email address',
    example: 'user@example.com',
  }),
  fullName: schema.String({
    description: 'User full name',
    example: 'John Doe',
  }),
  phone: schema.String({
    description: 'User phone number',
    example: '11999998888',
  }),
  isActive: schema.Boolean({
    description: 'Whether the user account is active',
    example: true,
  }),
  roles: schema.Array(
    schema.String({
      description: 'Role name',
      example: 'user',
    })
  ),
  individualPermissions: schema.Array(
    schema.String({
      description: 'Individual permission',
      example: 'users:read',
    })
  ),
  createdAt: schema.String({
    description: 'Creation date (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  }),
});

const PaginatedUsersResponse = schema.Object({
  users: schema.Array(UserAdminResponse),
  total: schema.Number({ description: 'Total number of users', example: 100 }),
  page: schema.Number({ description: 'Current page', example: 1 }),
  limit: schema.Number({ description: 'Items per page', example: 20 }),
  totalPages: schema.Number({ description: 'Total number of pages', example: 5 }),
});

/**
 * UserAdminController
 * Handles HTTP requests for admin user management
 * All endpoints require admin privileges
 */
export class UserAdminController {
  constructor(
    private tokenService: ITokenService,
    private listUsersHandler: ListUsersHandler,
    private getUserAdminHandler: GetUserAdminHandler,
    private createUserAdminHandler: CreateUserAdminHandler,
    private updateUserAdminHandler: UpdateUserAdminHandler,
    private deactivateUserHandler: DeactivateUserHandler,
    private activateUserHandler: ActivateUserHandler,
    private resetPasswordAdminHandler: ResetPasswordAdminHandler
  ) {}

  /**
   * Register routes for admin user management
   * Routes are registered under /v1/admin/users/*
   */
  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'admin:*');

    // User CRUD endpoints
    this.registerListUsersRoute(app, adminMiddleware);
    this.registerGetUserRoute(app, adminMiddleware);
    this.registerCreateUserRoute(app, adminMiddleware);
    this.registerUpdateUserRoute(app, adminMiddleware);
    this.registerDeactivateUserRoute(app, adminMiddleware);
    this.registerActivateUserRoute(app, adminMiddleware);
    this.registerResetPasswordRoute(app, adminMiddleware);

    return app;
  }

  /**
   * GET /v1/admin/users - List all users (paginated, admin only)
   */
  private registerListUsersRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.get(
      '/v1/admin/users',
      handleRoute({
        middleware: adminMiddleware,
        handler: async (ctx) => {
          const { query, t } = ctx;

          // Parse query parameters
          const page = parseInt(query.page as string) || 1;
          const limit = parseInt(query.limit as string) || 20;

          // Build filters
          const filters: { isActive?: boolean; role?: string; search?: string } = {};
          if (query.isActive !== undefined) {
            filters.isActive = query.isActive === 'true';
          }
          if (query.role) {
            filters.role = query.role;
          }
          if (query.search) {
            filters.search = query.search;
          }

          const listQuery = new ListUsersQuery(page, limit, filters, t);
          return this.listUsersHandler.execute(listQuery);
        },
      }),
      {
        query: schema.Object({
          page: schema.Optional(
            schema.String({
              description: 'Page number (default: 1)',
              example: '1',
            })
          ),
          limit: schema.Optional(
            schema.String({
              description: 'Items per page (default: 20, max: 100)',
              example: '20',
            })
          ),
          isActive: schema.Optional(
            schema.String({
              description: 'Filter by active status (true/false)',
              example: 'true',
            })
          ),
          role: schema.Optional(
            schema.String({
              description: 'Filter by role name',
              example: 'admin',
            })
          ),
          search: schema.Optional(
            schema.String({
              description: 'Search by email (partial match)',
              example: 'user@example',
            })
          ),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: PaginatedUsersResponse,
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
        },
        detail: {
          tags: ['Admin Users'],
          summary: 'List all users',
          description: `
Returns a paginated list of all users in the system with admin details.

**Prerequisites:**
- Authenticated user with valid JWT token
- User must have admin privilege

**Parameters:**
- page: Desired page (default: 1)
- limit: Users per page (default: 20, max: 100)
- isActive: Filter by active status
- role: Filter by role name
- search: Search by email (partial match)

**Behavior:**
- Returns full user details including roles and permissions
- Results are sorted by creation date (newest first)
- Pagination metadata included in response

**Possible errors:**
- 400: Invalid pagination parameters
- 401: Token missing or invalid
- 403: User is not an administrator
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * GET /v1/admin/users/:userId - Get user by ID (admin only)
   */
  private registerGetUserRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.get(
      '/v1/admin/users/:userId',
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
        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const getQuery = new GetUserAdminQuery(params.userId, t);
        const result = await this.getUserAdminHandler.execute(getQuery);

        if (result.isFailure) {
          set.status = 404;
          return { statusCode: 404, success: false as const, error: result.getError()! };
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
            description: 'User ID (UUID v7 format)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: UserAdminResponse,
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Admin Users'],
          summary: 'Get user by ID',
          description: `
Returns full details of a specific user by ID.

**Prerequisites:**
- Authenticated user with valid JWT token
- User must have admin privilege

**Validations:**
- User ID must be a valid UUID v7
- User must exist in the system

**Response:**
- Full user data including roles, permissions, and active status

**Possible errors:**
- 400: Invalid user ID format
- 401: Token missing or invalid
- 403: User is not an administrator
- 404: User not found
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * POST /v1/admin/users - Create new user (admin only)
   */
  private registerCreateUserRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      '/v1/admin/users',
      async ({
        body,
        request,
        set,
        t,
      }: {
        body: { email: string; password: string; fullName: string; phone: string; roles?: string[]; isActive?: boolean };
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
        const command = new CreateUserAdminCommand(
          body.email,
          body.password,
          body.fullName,
          body.phone,
          user.userId,
          body.roles ?? [],
          body.isActive ?? true,
          t
        );
        const result = await this.createUserAdminHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        set.status = 201;
        return {
          statusCode: 201,
          success: true,
          data: result.getValue(),
          message: t.common.created(),
        };
      },
      {
        body: schema.Object({
          email: schema.String({
            format: 'email',
            description: 'User email address',
            example: 'newuser@example.com',
          }),
          password: schema.String({
            minLength: 8,
            description: 'User password (min 8 characters)',
            example: 'SecurePass123!',
          }),
          fullName: schema.String({
            minLength: 3,
            description: 'User full name',
            example: 'John Doe',
          }),
          phone: schema.String({
            minLength: 10,
            description: 'User phone number',
            example: '11999998888',
          }),
          roles: schema.Optional(
            schema.Array(
              schema.String({
                description: 'Role name',
                example: 'user',
              })
            )
          ),
          isActive: schema.Optional(
            schema.Boolean({
              description: 'Whether the account is active (default: true)',
              example: true,
            })
          ),
        }),
        response: {
          201: schema.Object({
            statusCode: schema.Literal(201),
            success: schema.Literal(true),
            data: UserAdminResponse,
            message: schema.String(),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
        },
        detail: {
          tags: ['Admin Users'],
          summary: 'Create new user',
          description: `
Creates a new user account with optional role assignment.

**Prerequisites:**
- Authenticated user with valid JWT token
- User must have admin privilege

**Request body:**
- email: Valid email address (required)
- password: Password with min 8 characters (required)
- roles: Array of role names to assign (optional, default: ["user"])
- isActive: Whether account is active (optional, default: true)

**Validations:**
- Email must be valid format and unique
- Password must meet security requirements
- All specified roles must exist in the system

**Behavior:**
- Creates user with specified or default settings
- Assigns roles if provided, otherwise assigns "user" role
- Returns created user details

**Possible errors:**
- 400: Invalid email/password, email already exists, or role not found
- 401: Token missing or invalid
- 403: User is not an administrator
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * PUT /v1/admin/users/:userId - Update user (admin only)
   */
  private registerUpdateUserRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.put(
      '/v1/admin/users/:userId',
      async ({
        params,
        body,
        request,
        set,
        t,
      }: {
        params: { userId: string };
        body: { email?: string };
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
        const command = new UpdateUserAdminCommand(
          params.userId,
          user.userId,
          body.email,
          t
        );
        const result = await this.updateUserAdminHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          data: result.getValue(),
          message: t.common.updated(),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'User ID (UUID v7 format)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        body: schema.Object({
          email: schema.Optional(
            schema.String({
              format: 'email',
              description: 'New email address',
              example: 'newemail@example.com',
            })
          ),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: UserAdminResponse,
            message: schema.String(),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Admin Users'],
          summary: 'Update user',
          description: `
Updates user details. Currently supports email change.

**Prerequisites:**
- Authenticated user with valid JWT token
- User must have admin privilege

**Request body:**
- email: New email address (optional)

**Validations:**
- User ID must be a valid UUID v7
- User must exist in the system
- New email must be valid and unique

**Behavior:**
- Updates only provided fields
- Returns updated user details

**Possible errors:**
- 400: Invalid parameters or email already in use
- 401: Token missing or invalid
- 403: User is not an administrator
- 404: User not found
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * DELETE /v1/admin/users/:userId - Deactivate user (soft delete, admin only)
   */
  private registerDeactivateUserRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.delete(
      '/v1/admin/users/:userId',
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
        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new DeactivateUserCommand(params.userId, user.userId, t);
        const result = await this.deactivateUserHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.admin.user.deactivated(),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'User ID to deactivate (UUID v7 format)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Deactivation confirmation message',
              example: 'User deactivated successfully',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Admin Users'],
          summary: 'Deactivate user (soft delete)',
          description: `
Deactivates a user account (soft delete). The user will no longer be able to log in.

**Prerequisites:**
- Authenticated user with valid JWT token
- User must have admin privilege

**IMPORTANT Restrictions:**
- Admin CANNOT deactivate their own account
- This protection prevents accidental self-lockout
- To deactivate an admin, another admin must do it

**Validations:**
- User ID must be a valid UUID v7
- User must exist in the system
- Cannot deactivate yourself

**Behavior:**
- Sets isActive to false
- User data is preserved (soft delete)
- User cannot log in while deactivated
- Can be reactivated using the activate endpoint

**Possible errors:**
- 400: Invalid user ID, already inactive, or self-deactivation attempt
- 401: Token missing or invalid
- 403: User is not an administrator
- 404: User not found
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * POST /v1/admin/users/:userId/activate - Reactivate user (admin only)
   */
  private registerActivateUserRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      '/v1/admin/users/:userId/activate',
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
        // Admin auth check
        const authResult = await adminMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new ActivateUserCommand(params.userId, user.userId, t);
        const result = await this.activateUserHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.admin.user.activated(),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'User ID to activate (UUID v7 format)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Activation confirmation message',
              example: 'User activated successfully',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Admin Users'],
          summary: 'Reactivate user',
          description: `
Reactivates a previously deactivated user account.

**Prerequisites:**
- Authenticated user with valid JWT token
- User must have admin privilege

**Validations:**
- User ID must be a valid UUID v7
- User must exist in the system
- User must be currently inactive

**Behavior:**
- Sets isActive to true
- User can log in again
- All previous roles and permissions are preserved

**Possible errors:**
- 400: Invalid user ID or user is already active
- 401: Token missing or invalid
- 403: User is not an administrator
- 404: User not found
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * POST /v1/admin/users/:userId/reset-password - Reset user password (admin only)
   */
  private registerResetPasswordRoute(
    app: any,
    adminMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      '/v1/admin/users/:userId/reset-password',
      async ({
        params,
        body,
        request,
        set,
        t,
      }: {
        params: { userId: string };
        body: { newPassword: string };
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
        const command = new ResetPasswordAdminCommand(
          params.userId,
          body.newPassword,
          user.userId,
          t
        );
        const result = await this.resetPasswordAdminHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false as const, error: result.getError()! };
        }

        return {
          statusCode: 200,
          success: true,
          message: t.admin.user.passwordReset(),
        };
      },
      {
        params: schema.Object({
          userId: schema.String({
            description: 'User ID whose password will be reset (UUID v7 format)',
            example: '019123ab-cdef-7890-abcd-ef1234567890',
          }),
        }),
        body: schema.Object({
          newPassword: schema.String({
            minLength: 8,
            description: 'New password (min 8 characters)',
            example: 'NewSecurePass123!',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Password reset confirmation message',
              example: 'Password reset successfully',
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          403: ForbiddenResponse,
          404: NotFoundResponse,
        },
        detail: {
          tags: ['Admin Users'],
          summary: 'Reset user password',
          description: `
Resets a user's password without requiring the old password.

**Prerequisites:**
- Authenticated user with valid JWT token
- User must have admin privilege

**Request body:**
- newPassword: New password (min 8 characters)

**Validations:**
- User ID must be a valid UUID v7
- User must exist in the system
- New password must meet security requirements

**Behavior:**
- Sets new password directly
- Does not require old password
- User must use new password on next login

**Use cases:**
- User forgot password
- Account recovery
- Security policy enforcement

**Possible errors:**
- 400: Invalid user ID or password doesn't meet requirements
- 401: Token missing or invalid
- 403: User is not an administrator
- 404: User not found
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }
}
