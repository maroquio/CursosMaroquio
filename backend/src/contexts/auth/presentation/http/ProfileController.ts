import { t as schema } from 'elysia';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { UpdateProfileCommand } from '../../application/commands/update-profile/UpdateProfileCommand.ts';
import { UpdateProfileHandler } from '../../application/commands/update-profile/UpdateProfileHandler.ts';
import { ChangePasswordCommand } from '../../application/commands/change-password/ChangePasswordCommand.ts';
import { ChangePasswordHandler } from '../../application/commands/change-password/ChangePasswordHandler.ts';
import { DeleteAccountCommand } from '../../application/commands/delete-account/DeleteAccountCommand.ts';
import { DeleteAccountHandler } from '../../application/commands/delete-account/DeleteAccountHandler.ts';
import { UploadPhotoCommand } from '../../application/commands/upload-photo/UploadPhotoCommand.ts';
import { UploadPhotoHandler } from '../../application/commands/upload-photo/UploadPhotoHandler.ts';
import type { ITokenService } from '../../domain/services/ITokenService.ts';
import {
  createAuthMiddleware,
  type AuthenticatedUser,
} from '../middleware/AuthMiddleware.ts';

// Response schemas for OpenAPI documentation

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

/**
 * ProfileController
 * Handles HTTP requests for user profile management
 * Extracted from AuthController for better separation of concerns
 *
 * Routes: updateProfile, uploadPhoto, changePassword, deleteAccount
 */
export class ProfileController {
  constructor(
    private tokenService: ITokenService,
    private updateProfileHandler: UpdateProfileHandler,
    private changePasswordHandler: ChangePasswordHandler,
    private deleteAccountHandler: DeleteAccountHandler,
    private uploadPhotoHandler: UploadPhotoHandler
  ) {}

  /**
   * Register routes for profile management
   * Routes are registered under /v1/auth/* prefix
   */
  public routes(app: any) {
    const authMiddleware = createAuthMiddleware(this.tokenService);

    this.registerProfileRoutes(app, '/v1/auth', authMiddleware);

    return app;
  }

  /**
   * Register profile routes under a specific base path
   */
  private registerProfileRoutes(
    app: any,
    basePath: string,
    authMiddleware: (ctx: any) => Promise<any>
  ) {
    this.registerUpdateProfileRoute(app, basePath, authMiddleware);
    this.registerUploadPhotoRoute(app, basePath, authMiddleware);
    this.registerChangePasswordRoute(app, basePath, authMiddleware);
    this.registerDeleteAccountRoute(app, basePath, authMiddleware);

    return app;
  }

  // =====================
  // Profile Management Endpoints
  // =====================

  /**
   * PUT /profile - Update current user's profile
   */
  private registerUpdateProfileRoute(app: any, basePath: string, authMiddleware: (ctx: any) => Promise<any>) {
    app.put(
      `${basePath}/profile`,
      async (ctx: { body: { fullName: string; phone?: string }; request: Request; set: any; t: TranslationFunctions }) => {
        const authResult = await authMiddleware({ request: ctx.request } as any);
        if (authResult instanceof Response) {
          ctx.set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: ctx.t.common.unauthorized(),
          };
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new UpdateProfileCommand(
          user.userId,
          ctx.body.fullName,
          ctx.body.phone,
          ctx.t
        );
        const result = await this.updateProfileHandler.execute(command);

        if (result.isFailure) {
          ctx.set.status = 400;
          return {
            statusCode: 400,
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
        body: schema.Object({
          fullName: schema.String({
            minLength: 3,
            description: 'Nome completo do usuário',
            example: 'João da Silva',
          }),
          phone: schema.Optional(schema.String({
            description: 'Telefone do usuário',
            example: '11999998888',
          })),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Object({
              id: schema.String(),
              email: schema.String(),
              fullName: schema.String(),
              phone: schema.String(),
              photoUrl: schema.Union([schema.String(), schema.Null()]),
              createdAt: schema.String(),
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Atualizar perfil do usuário',
          description: 'Atualiza as informações do perfil do usuário autenticado.',
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * POST /profile/photo - Upload profile photo
   */
  private registerUploadPhotoRoute(app: any, basePath: string, authMiddleware: (ctx: any) => Promise<any>) {
    app.post(
      `${basePath}/profile/photo`,
      async (ctx: { body: { photo: File }; request: Request; set: any; t: TranslationFunctions }) => {
        const authResult = await authMiddleware({ request: ctx.request } as any);
        if (authResult instanceof Response) {
          ctx.set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: ctx.t.common.unauthorized(),
          };
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new UploadPhotoCommand(user.userId, ctx.body.photo, ctx.t);
        const result = await this.uploadPhotoHandler.execute(command);

        if (result.isFailure) {
          ctx.set.status = 400;
          return {
            statusCode: 400,
            success: false as const,
            error: String(result.getError()),
          };
        }

        return {
          statusCode: 200 as const,
          success: true as const,
          data: {
            photoUrl: result.getValue(),
          },
        };
      },
      {
        body: schema.Object({
          photo: schema.File({
            type: ['image/jpeg', 'image/png', 'image/webp'],
            maxSize: '2m',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Object({
              photoUrl: schema.String(),
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Upload de foto de perfil',
          description: 'Faz upload de uma nova foto de perfil. Tipos aceitos: JPEG, PNG, WebP. Tamanho máximo: 2MB.',
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * POST /change-password - Change password
   */
  private registerChangePasswordRoute(app: any, basePath: string, authMiddleware: (ctx: any) => Promise<any>) {
    app.post(
      `${basePath}/change-password`,
      async (ctx: { body: { currentPassword: string; newPassword: string }; request: Request; set: any; t: TranslationFunctions }) => {
        const authResult = await authMiddleware({ request: ctx.request } as any);
        if (authResult instanceof Response) {
          ctx.set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: ctx.t.common.unauthorized(),
          };
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new ChangePasswordCommand(
          user.userId,
          ctx.body.currentPassword,
          ctx.body.newPassword,
          ctx.t
        );
        const result = await this.changePasswordHandler.execute(command);

        if (result.isFailure) {
          ctx.set.status = 400;
          return {
            statusCode: 400,
            success: false as const,
            error: String(result.getError()),
          };
        }

        return {
          statusCode: 200 as const,
          success: true as const,
          message: 'Senha alterada com sucesso',
        };
      },
      {
        body: schema.Object({
          currentPassword: schema.String({
            description: 'Senha atual do usuário',
          }),
          newPassword: schema.String({
            minLength: 8,
            description: 'Nova senha (mínimo 8 caracteres)',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String(),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Alterar senha',
          description: 'Altera a senha do usuário autenticado. Requer a senha atual para confirmação.',
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * DELETE /account - Delete own account
   */
  private registerDeleteAccountRoute(app: any, basePath: string, authMiddleware: (ctx: any) => Promise<any>) {
    app.delete(
      `${basePath}/account`,
      async (ctx: { body: { password: string }; request: Request; set: any; t: TranslationFunctions }) => {
        const authResult = await authMiddleware({ request: ctx.request } as any);
        if (authResult instanceof Response) {
          ctx.set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: ctx.t.common.unauthorized(),
          };
        }

        const user = authResult.user as AuthenticatedUser;
        const command = new DeleteAccountCommand(user.userId, ctx.body.password, ctx.t);
        const result = await this.deleteAccountHandler.execute(command);

        if (result.isFailure) {
          ctx.set.status = 400;
          return {
            statusCode: 400,
            success: false as const,
            error: String(result.getError()),
          };
        }

        return {
          statusCode: 200 as const,
          success: true as const,
          message: 'Conta excluída com sucesso',
        };
      },
      {
        body: schema.Object({
          password: schema.String({
            description: 'Senha atual para confirmação',
          }),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String(),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Excluir conta',
          description: 'Exclui (desativa) a conta do usuário autenticado. Requer senha para confirmação. Ação irreversível.',
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }
}
