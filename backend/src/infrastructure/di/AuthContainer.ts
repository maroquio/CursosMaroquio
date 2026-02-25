import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';

// Auth Context - Repositories
import { DrizzleUserRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleUserRepository.ts';
import { DrizzleRefreshTokenRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleRefreshTokenRepository.ts';
import { DrizzleRoleRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleRoleRepository.ts';
import { DrizzlePermissionRepository } from '@auth/infrastructure/persistence/drizzle/DrizzlePermissionRepository.ts';

// Auth Context - Services
import { BunPasswordHasher } from '@auth/infrastructure/services/BunPasswordHasher.ts';
import { JwtTokenService } from '@auth/infrastructure/services/JwtTokenService.ts';
import { NoOpEmailService } from '@auth/infrastructure/services/NoOpEmailService.ts';
import { PermissionService } from '@auth/infrastructure/services/PermissionService.ts';

// Auth Context - Command Handlers
import { RegisterUserHandler } from '@auth/application/commands/register-user/RegisterUserHandler.ts';
import { GetUserHandler } from '@auth/application/queries/get-user/GetUserHandler.ts';
import { LoginHandler } from '@auth/application/commands/login/LoginHandler.ts';
import { RefreshTokenHandler } from '@auth/application/commands/refresh-token/RefreshTokenHandler.ts';
import { LogoutHandler } from '@auth/application/commands/logout/LogoutHandler.ts';
import { AssignRoleHandler } from '@auth/application/commands/assign-role/AssignRoleHandler.ts';
import { RemoveRoleHandler } from '@auth/application/commands/remove-role/RemoveRoleHandler.ts';
import { UpdateProfileHandler } from '@auth/application/commands/update-profile/UpdateProfileHandler.ts';
import { ChangePasswordHandler } from '@auth/application/commands/change-password/ChangePasswordHandler.ts';
import { DeleteAccountHandler } from '@auth/application/commands/delete-account/DeleteAccountHandler.ts';
import { UploadPhotoHandler } from '@auth/application/commands/upload-photo/UploadPhotoHandler.ts';

// Auth Context - Role CRUD Handlers
import { CreateRoleHandler } from '@auth/application/commands/create-role/CreateRoleHandler.ts';
import { UpdateRoleHandler } from '@auth/application/commands/update-role/UpdateRoleHandler.ts';
import { DeleteRoleHandler } from '@auth/application/commands/delete-role/DeleteRoleHandler.ts';
import { ListRolesHandler } from '@auth/application/queries/list-roles/ListRolesHandler.ts';

// Auth Context - User Admin Handlers
import { ListUsersHandler } from '@auth/application/queries/list-users/ListUsersHandler.ts';
import { GetUserAdminHandler } from '@auth/application/queries/get-user-admin/GetUserAdminHandler.ts';
import { CreateUserAdminHandler } from '@auth/application/commands/create-user-admin/CreateUserAdminHandler.ts';
import { UpdateUserAdminHandler } from '@auth/application/commands/update-user-admin/UpdateUserAdminHandler.ts';
import { DeactivateUserHandler } from '@auth/application/commands/deactivate-user/DeactivateUserHandler.ts';
import { ActivateUserHandler } from '@auth/application/commands/activate-user/ActivateUserHandler.ts';
import { ResetPasswordAdminHandler } from '@auth/application/commands/reset-password-admin/ResetPasswordAdminHandler.ts';

// Auth Context - Permission Handlers
import { CreatePermissionHandler } from '@auth/application/commands/create-permission/CreatePermissionHandler.ts';
import { ListPermissionsHandler } from '@auth/application/queries/list-permissions/ListPermissionsHandler.ts';
import { AssignPermissionToRoleHandler } from '@auth/application/commands/assign-permission-to-role/AssignPermissionToRoleHandler.ts';
import { RemovePermissionFromRoleHandler } from '@auth/application/commands/remove-permission-from-role/RemovePermissionFromRoleHandler.ts';
import { AssignPermissionToUserHandler } from '@auth/application/commands/assign-permission-to-user/AssignPermissionToUserHandler.ts';
import { RemovePermissionFromUserHandler } from '@auth/application/commands/remove-permission-from-user/RemovePermissionFromUserHandler.ts';
import { GetUserPermissionsHandler } from '@auth/application/queries/get-user-permissions/GetUserPermissionsHandler.ts';

// Auth Context - Export/Import Handlers
import { ExportUsersHandler } from '@auth/application/queries/export-users/ExportUsersHandler.ts';
import { ImportUsersHandler } from '@auth/application/commands/import-users/ImportUsersHandler.ts';

// Auth Context - Event Handlers
import { LogUserCreatedHandler, SendWelcomeEmailHandler } from '@auth/application/event-handlers/index.ts';

// Auth Context - OAuth Handlers
import { OAuthLoginHandler } from '@auth/application/commands/oauth-login/OAuthLoginHandler.ts';
import { LinkOAuthAccountHandler } from '@auth/application/commands/link-oauth-account/LinkOAuthAccountHandler.ts';
import { UnlinkOAuthAccountHandler } from '@auth/application/commands/unlink-oauth-account/UnlinkOAuthAccountHandler.ts';
import { GetOAuthAuthorizationUrlHandler } from '@auth/application/queries/get-oauth-authorization-url/GetOAuthAuthorizationUrlHandler.ts';
import { GetUserOAuthConnectionsHandler } from '@auth/application/queries/get-user-oauth-connections/GetUserOAuthConnectionsHandler.ts';

// Auth Context - OAuth Infrastructure
import { ArcticOAuthService } from '@auth/infrastructure/services/oauth/ArcticOAuthService.ts';
import { DrizzleOAuthConnectionRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleOAuthConnectionRepository.ts';

// Auth Context - Presentation
import { AuthController } from '@auth/presentation/http/AuthController.ts';
import { ProfileController } from '@auth/presentation/http/ProfileController.ts';
import { RoleController } from '@auth/presentation/http/RoleController.ts';
import { UserRoleController } from '@auth/presentation/http/UserRoleController.ts';
import { PermissionController } from '@auth/presentation/http/PermissionController.ts';
import { OAuthController } from '@auth/presentation/http/OAuthController.ts';
import { OAuthAccountController } from '@auth/presentation/http/OAuthAccountController.ts';
import { UserAdminController } from '@auth/presentation/http/UserAdminController.ts';

// Domain Services Interfaces
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import type { IRoleRepository } from '@auth/domain/repositories/IRoleRepository.ts';
import type { IPermissionRepository } from '@auth/domain/repositories/IPermissionRepository.ts';
import type { IPermissionService } from '@auth/domain/services/IPermissionService.ts';
import type { IOAuthService } from '@auth/domain/services/IOAuthService.ts';
import type { IOAuthConnectionRepository } from '@auth/domain/repositories/IOAuthConnectionRepository.ts';

/**
 * Auth Context DI Container
 * Factory methods for Auth bounded context dependencies
 */
export class AuthContainer {
  private static tokenService: ITokenService | null = null;
  private static roleRepository: IRoleRepository | null = null;
  private static permissionRepository: IPermissionRepository | null = null;
  private static permissionService: IPermissionService | null = null;
  private static oauthService: IOAuthService | null = null;
  private static oauthConnectionRepository: IOAuthConnectionRepository | null = null;

  constructor(private getDatabaseProvider: () => IDatabaseProvider) {}

  // ========== Infrastructure ==========

  createRoleRepository(): IRoleRepository {
    if (!AuthContainer.roleRepository) {
      AuthContainer.roleRepository = new DrizzleRoleRepository(this.getDatabaseProvider());
    }
    return AuthContainer.roleRepository;
  }

  createPermissionRepository(): IPermissionRepository {
    if (!AuthContainer.permissionRepository) {
      AuthContainer.permissionRepository = new DrizzlePermissionRepository(this.getDatabaseProvider());
    }
    return AuthContainer.permissionRepository;
  }

  createPermissionService(): IPermissionService {
    if (!AuthContainer.permissionService) {
      AuthContainer.permissionService = new PermissionService(
        this.createPermissionRepository(),
        this.createRoleRepository()
      );
    }
    return AuthContainer.permissionService;
  }

  createUserRepository(): DrizzleUserRepository {
    return new DrizzleUserRepository(
      this.getDatabaseProvider(),
      this.createRoleRepository()
    );
  }

  createRefreshTokenRepository(): DrizzleRefreshTokenRepository {
    return new DrizzleRefreshTokenRepository(this.getDatabaseProvider());
  }

  createPasswordHasher(): BunPasswordHasher {
    return new BunPasswordHasher();
  }

  createTokenService(): ITokenService {
    if (!AuthContainer.tokenService) {
      AuthContainer.tokenService = new JwtTokenService();
    }
    return AuthContainer.tokenService;
  }

  createOAuthService(): IOAuthService {
    if (!AuthContainer.oauthService) {
      AuthContainer.oauthService = new ArcticOAuthService();
    }
    return AuthContainer.oauthService;
  }

  createOAuthConnectionRepository(): IOAuthConnectionRepository {
    if (!AuthContainer.oauthConnectionRepository) {
      AuthContainer.oauthConnectionRepository = new DrizzleOAuthConnectionRepository(this.getDatabaseProvider());
    }
    return AuthContainer.oauthConnectionRepository;
  }

  // ========== Application Handlers ==========

  createRegisterUserHandler(): RegisterUserHandler {
    return new RegisterUserHandler(
      this.createUserRepository(),
      this.createPasswordHasher()
    );
  }

  createGetUserHandler(): GetUserHandler {
    return new GetUserHandler(this.createUserRepository());
  }

  createLoginHandler(): LoginHandler {
    return new LoginHandler(
      this.createUserRepository(),
      this.createRefreshTokenRepository(),
      this.createPasswordHasher(),
      this.createTokenService()
    );
  }

  createRefreshTokenHandler(): RefreshTokenHandler {
    return new RefreshTokenHandler(
      this.createUserRepository(),
      this.createRefreshTokenRepository(),
      this.createTokenService()
    );
  }

  createLogoutHandler(): LogoutHandler {
    return new LogoutHandler(this.createRefreshTokenRepository());
  }

  createUpdateProfileHandler(): UpdateProfileHandler {
    return new UpdateProfileHandler(this.createUserRepository());
  }

  createChangePasswordHandler(): ChangePasswordHandler {
    return new ChangePasswordHandler(
      this.createUserRepository(),
      this.createPasswordHasher(),
      this.createRefreshTokenRepository()
    );
  }

  createDeleteAccountHandler(): DeleteAccountHandler {
    return new DeleteAccountHandler(
      this.createUserRepository(),
      this.createPasswordHasher(),
      this.createRefreshTokenRepository()
    );
  }

  createUploadPhotoHandler(): UploadPhotoHandler {
    return new UploadPhotoHandler(
      this.createUserRepository(),
      './uploads/avatars'
    );
  }

  createAssignRoleHandler(): AssignRoleHandler {
    return new AssignRoleHandler(this.createUserRepository(), this.createRoleRepository());
  }

  createRemoveRoleHandler(): RemoveRoleHandler {
    return new RemoveRoleHandler(this.createUserRepository());
  }

  // ========== Role CRUD Handlers ==========

  createCreateRoleHandler(): CreateRoleHandler {
    return new CreateRoleHandler(this.createUserRepository(), this.createRoleRepository());
  }

  createUpdateRoleHandler(): UpdateRoleHandler {
    return new UpdateRoleHandler(this.createUserRepository(), this.createRoleRepository());
  }

  createDeleteRoleHandler(): DeleteRoleHandler {
    return new DeleteRoleHandler(
      this.createUserRepository(),
      this.createRoleRepository()
    );
  }

  createListRolesHandler(): ListRolesHandler {
    return new ListRolesHandler(this.createRoleRepository());
  }

  // ========== User Admin Handlers ==========

  createListUsersHandler(): ListUsersHandler {
    return new ListUsersHandler(this.createUserRepository());
  }

  createGetUserAdminHandler(): GetUserAdminHandler {
    return new GetUserAdminHandler(this.createUserRepository());
  }

  createCreateUserAdminHandler(): CreateUserAdminHandler {
    return new CreateUserAdminHandler(
      this.createUserRepository(),
      this.createRoleRepository(),
      this.createPasswordHasher()
    );
  }

  createUpdateUserAdminHandler(): UpdateUserAdminHandler {
    return new UpdateUserAdminHandler(this.createUserRepository());
  }

  createDeactivateUserHandler(): DeactivateUserHandler {
    return new DeactivateUserHandler(this.createUserRepository());
  }

  createActivateUserHandler(): ActivateUserHandler {
    return new ActivateUserHandler(this.createUserRepository());
  }

  createResetPasswordAdminHandler(): ResetPasswordAdminHandler {
    return new ResetPasswordAdminHandler(
      this.createUserRepository(),
      this.createPasswordHasher()
    );
  }

  // ========== Permission Handlers ==========

  createCreatePermissionHandler(): CreatePermissionHandler {
    return new CreatePermissionHandler(
      this.createUserRepository(),
      this.createPermissionRepository()
    );
  }

  createListPermissionsHandler(): ListPermissionsHandler {
    return new ListPermissionsHandler(this.createPermissionRepository());
  }

  createAssignPermissionToRoleHandler(): AssignPermissionToRoleHandler {
    return new AssignPermissionToRoleHandler(
      this.createUserRepository(),
      this.createRoleRepository(),
      this.createPermissionRepository()
    );
  }

  createRemovePermissionFromRoleHandler(): RemovePermissionFromRoleHandler {
    return new RemovePermissionFromRoleHandler(
      this.createUserRepository(),
      this.createRoleRepository(),
      this.createPermissionRepository()
    );
  }

  createAssignPermissionToUserHandler(): AssignPermissionToUserHandler {
    return new AssignPermissionToUserHandler(
      this.createUserRepository(),
      this.createPermissionRepository(),
      this.createPermissionService()
    );
  }

  createRemovePermissionFromUserHandler(): RemovePermissionFromUserHandler {
    return new RemovePermissionFromUserHandler(
      this.createUserRepository(),
      this.createPermissionRepository(),
      this.createPermissionService()
    );
  }

  createGetUserPermissionsHandler(): GetUserPermissionsHandler {
    return new GetUserPermissionsHandler(
      this.createUserRepository(),
      this.createPermissionService()
    );
  }

  // ========== OAuth Handlers ==========

  createOAuthLoginHandler(): OAuthLoginHandler {
    return new OAuthLoginHandler(
      this.createUserRepository(),
      this.createOAuthConnectionRepository(),
      this.createRefreshTokenRepository(),
      this.createOAuthService(),
      this.createTokenService()
    );
  }

  createLinkOAuthAccountHandler(): LinkOAuthAccountHandler {
    return new LinkOAuthAccountHandler(
      this.createUserRepository(),
      this.createOAuthConnectionRepository(),
      this.createOAuthService()
    );
  }

  createUnlinkOAuthAccountHandler(): UnlinkOAuthAccountHandler {
    return new UnlinkOAuthAccountHandler(
      this.createUserRepository(),
      this.createOAuthConnectionRepository(),
      this.createOAuthService()
    );
  }

  createGetOAuthAuthorizationUrlHandler(): GetOAuthAuthorizationUrlHandler {
    return new GetOAuthAuthorizationUrlHandler(this.createOAuthService());
  }

  createGetUserOAuthConnectionsHandler(): GetUserOAuthConnectionsHandler {
    return new GetUserOAuthConnectionsHandler(
      this.createUserRepository(),
      this.createOAuthConnectionRepository()
    );
  }

  // ========== Presentation ==========

  createAuthController(): AuthController {
    return new AuthController(
      this.createRegisterUserHandler(),
      this.createGetUserHandler(),
      this.createLoginHandler(),
      this.createRefreshTokenHandler(),
      this.createLogoutHandler(),
      this.createTokenService()
    );
  }

  createProfileController(): ProfileController {
    return new ProfileController(
      this.createTokenService(),
      this.createUpdateProfileHandler(),
      this.createChangePasswordHandler(),
      this.createDeleteAccountHandler(),
      this.createUploadPhotoHandler()
    );
  }

  createRoleController(): RoleController {
    return new RoleController(
      this.createRoleRepository(),
      this.createTokenService(),
      this.createCreateRoleHandler(),
      this.createUpdateRoleHandler(),
      this.createDeleteRoleHandler(),
      this.createListRolesHandler(),
      this.createAssignPermissionToRoleHandler(),
      this.createRemovePermissionFromRoleHandler()
    );
  }

  createUserRoleController(): UserRoleController {
    return new UserRoleController(
      this.createTokenService(),
      this.createAssignRoleHandler(),
      this.createRemoveRoleHandler(),
      this.createRoleRepository()
    );
  }

  createPermissionController(): PermissionController {
    return new PermissionController(
      this.createTokenService(),
      this.createCreatePermissionHandler(),
      this.createListPermissionsHandler(),
      this.createGetUserPermissionsHandler(),
      this.createAssignPermissionToUserHandler(),
      this.createRemovePermissionFromUserHandler()
    );
  }

  createOAuthController(): OAuthController {
    return new OAuthController(
      this.createOAuthLoginHandler(),
      this.createGetOAuthAuthorizationUrlHandler(),
      this.createTokenService(),
      this.createOAuthService()
    );
  }

  createOAuthAccountController(): OAuthAccountController {
    return new OAuthAccountController(
      this.createLinkOAuthAccountHandler(),
      this.createUnlinkOAuthAccountHandler(),
      this.createGetUserOAuthConnectionsHandler(),
      this.createTokenService()
    );
  }

  createUserAdminController(): UserAdminController {
    return new UserAdminController(
      this.createTokenService(),
      this.createListUsersHandler(),
      this.createGetUserAdminHandler(),
      this.createCreateUserAdminHandler(),
      this.createUpdateUserAdminHandler(),
      this.createDeactivateUserHandler(),
      this.createActivateUserHandler(),
      this.createResetPasswordAdminHandler()
    );
  }

  // ========== Export/Import Handlers ==========

  createExportUsersHandler(): ExportUsersHandler {
    return new ExportUsersHandler(this.getDatabaseProvider());
  }

  createImportUsersHandler(): ImportUsersHandler {
    return new ImportUsersHandler(this.getDatabaseProvider());
  }

  // ========== Event Handlers ==========

  createLogUserCreatedHandler(): LogUserCreatedHandler {
    return new LogUserCreatedHandler();
  }

  createSendWelcomeEmailHandler(): SendWelcomeEmailHandler {
    return new SendWelcomeEmailHandler(this.createEmailService());
  }

  createEmailService(): NoOpEmailService {
    return new NoOpEmailService();
  }

  // ========== Testing ==========

  createAuthControllerWithProvider(dbProvider: IDatabaseProvider): AuthController {
    const roleRepository = new DrizzleRoleRepository(dbProvider);
    const userRepository = new DrizzleUserRepository(dbProvider, roleRepository);
    const refreshTokenRepository = new DrizzleRefreshTokenRepository(dbProvider);
    const passwordHasher = new BunPasswordHasher();
    const tokenService = this.createTokenService();

    const registerUserHandler = new RegisterUserHandler(userRepository, passwordHasher);
    const getUserHandler = new GetUserHandler(userRepository);
    const loginHandler = new LoginHandler(
      userRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenService
    );
    const refreshTokenHandler = new RefreshTokenHandler(
      userRepository,
      refreshTokenRepository,
      tokenService
    );
    const logoutHandler = new LogoutHandler(refreshTokenRepository);

    return new AuthController(
      registerUserHandler,
      getUserHandler,
      loginHandler,
      refreshTokenHandler,
      logoutHandler,
      tokenService
    );
  }

  // ========== Cleanup ==========

  static reset(): void {
    AuthContainer.tokenService = null;
    AuthContainer.roleRepository = null;
    AuthContainer.permissionRepository = null;
    AuthContainer.permissionService = null;
    AuthContainer.oauthService = null;
    AuthContainer.oauthConnectionRepository = null;
  }
}
