import { isDatabaseHealthy, DatabaseProvider, closeDatabase } from '../database/connection.ts';
import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';

import { AuthContainer } from './AuthContainer.ts';
import { CoursesContainer } from './CoursesContainer.ts';
import { AiContainer } from './AiContainer.ts';
import { ExportImportAdminController } from '@courses/presentation/http/ExportImportAdminController.ts';

// Re-export sub-containers for direct access if needed
export { AuthContainer, CoursesContainer, AiContainer };

/**
 * DI Container — Orchestrator
 * Delegates to per-context containers (AuthContainer, CoursesContainer, AiContainer)
 * while maintaining the same public API for backward compatibility.
 */
export class Container {
  private static databaseProvider: IDatabaseProvider | null = null;

  private static _auth: AuthContainer | null = null;
  private static _courses: CoursesContainer | null = null;
  private static _ai: AiContainer | null = null;

  private static getDatabaseProvider(): IDatabaseProvider {
    if (!this.databaseProvider) {
      this.databaseProvider = new DatabaseProvider();
    }
    return this.databaseProvider;
  }

  // ========== Sub-container accessors ==========

  static get auth(): AuthContainer {
    if (!this._auth) {
      this._auth = new AuthContainer(() => this.getDatabaseProvider());
    }
    return this._auth;
  }

  static get courses(): CoursesContainer {
    if (!this._courses) {
      this._courses = new CoursesContainer(
        () => this.getDatabaseProvider(),
        () => this.auth.createTokenService(),
        () => this.auth.createUserRepository()
      );
    }
    return this._courses;
  }

  static get ai(): AiContainer {
    if (!this._ai) {
      this._ai = new AiContainer(
        () => this.getDatabaseProvider(),
        () => this.auth.createTokenService()
      );
    }
    return this._ai;
  }

  // ========== Health Check ==========

  static async checkDatabaseHealth(): Promise<boolean> {
    return isDatabaseHealthy();
  }

  // ========== Auth Context (delegated) ==========

  static createRoleRepository() { return this.auth.createRoleRepository(); }
  static createPermissionRepository() { return this.auth.createPermissionRepository(); }
  static createPermissionService() { return this.auth.createPermissionService(); }
  static createUserRepository() { return this.auth.createUserRepository(); }
  static createRefreshTokenRepository() { return this.auth.createRefreshTokenRepository(); }
  static createPasswordHasher() { return this.auth.createPasswordHasher(); }
  static createTokenService() { return this.auth.createTokenService(); }
  static createOAuthService() { return this.auth.createOAuthService(); }
  static createOAuthConnectionRepository() { return this.auth.createOAuthConnectionRepository(); }

  static createRegisterUserHandler() { return this.auth.createRegisterUserHandler(); }
  static createGetUserHandler() { return this.auth.createGetUserHandler(); }
  static createLoginHandler() { return this.auth.createLoginHandler(); }
  static createRefreshTokenHandler() { return this.auth.createRefreshTokenHandler(); }
  static createLogoutHandler() { return this.auth.createLogoutHandler(); }
  static createUpdateProfileHandler() { return this.auth.createUpdateProfileHandler(); }
  static createChangePasswordHandler() { return this.auth.createChangePasswordHandler(); }
  static createDeleteAccountHandler() { return this.auth.createDeleteAccountHandler(); }
  static createUploadPhotoHandler() { return this.auth.createUploadPhotoHandler(); }
  static createAssignRoleHandler() { return this.auth.createAssignRoleHandler(); }
  static createRemoveRoleHandler() { return this.auth.createRemoveRoleHandler(); }

  static createCreateRoleHandler() { return this.auth.createCreateRoleHandler(); }
  static createUpdateRoleHandler() { return this.auth.createUpdateRoleHandler(); }
  static createDeleteRoleHandler() { return this.auth.createDeleteRoleHandler(); }
  static createListRolesHandler() { return this.auth.createListRolesHandler(); }

  static createListUsersHandler() { return this.auth.createListUsersHandler(); }
  static createGetUserAdminHandler() { return this.auth.createGetUserAdminHandler(); }
  static createCreateUserAdminHandler() { return this.auth.createCreateUserAdminHandler(); }
  static createUpdateUserAdminHandler() { return this.auth.createUpdateUserAdminHandler(); }
  static createDeactivateUserHandler() { return this.auth.createDeactivateUserHandler(); }
  static createActivateUserHandler() { return this.auth.createActivateUserHandler(); }
  static createResetPasswordAdminHandler() { return this.auth.createResetPasswordAdminHandler(); }

  static createCreatePermissionHandler() { return this.auth.createCreatePermissionHandler(); }
  static createListPermissionsHandler() { return this.auth.createListPermissionsHandler(); }
  static createAssignPermissionToRoleHandler() { return this.auth.createAssignPermissionToRoleHandler(); }
  static createRemovePermissionFromRoleHandler() { return this.auth.createRemovePermissionFromRoleHandler(); }
  static createAssignPermissionToUserHandler() { return this.auth.createAssignPermissionToUserHandler(); }
  static createRemovePermissionFromUserHandler() { return this.auth.createRemovePermissionFromUserHandler(); }
  static createGetUserPermissionsHandler() { return this.auth.createGetUserPermissionsHandler(); }

  static createOAuthLoginHandler() { return this.auth.createOAuthLoginHandler(); }
  static createLinkOAuthAccountHandler() { return this.auth.createLinkOAuthAccountHandler(); }
  static createUnlinkOAuthAccountHandler() { return this.auth.createUnlinkOAuthAccountHandler(); }
  static createGetOAuthAuthorizationUrlHandler() { return this.auth.createGetOAuthAuthorizationUrlHandler(); }
  static createGetUserOAuthConnectionsHandler() { return this.auth.createGetUserOAuthConnectionsHandler(); }

  static createAuthController() { return this.auth.createAuthController(); }
  static createProfileController() { return this.auth.createProfileController(); }
  static createRoleController() { return this.auth.createRoleController(); }
  static createUserRoleController() { return this.auth.createUserRoleController(); }
  static createPermissionController() { return this.auth.createPermissionController(); }
  static createOAuthController() { return this.auth.createOAuthController(); }
  static createOAuthAccountController() { return this.auth.createOAuthAccountController(); }
  static createUserAdminController() { return this.auth.createUserAdminController(); }

  /** @deprecated Use createTokenService() instead */
  static getTokenService() { return this.auth.createTokenService(); }

  static createAuthControllerWithProvider(dbProvider: IDatabaseProvider) {
    return this.auth.createAuthControllerWithProvider(dbProvider);
  }

  // ========== Courses Context (delegated) ==========

  static createCourseRepository() { return this.courses.createCourseRepository(); }
  static createEnrollmentRepository() { return this.courses.createEnrollmentRepository(); }
  static createLessonProgressRepository() { return this.courses.createLessonProgressRepository(); }
  static createLessonBundleRepository() { return this.courses.createLessonBundleRepository(); }
  static createSectionBundleRepository() { return this.courses.createSectionBundleRepository(); }
  static createModuleRepository() { return this.courses.createModuleRepository(); }
  static createSectionRepository() { return this.courses.createSectionRepository(); }
  static createSectionProgressRepository() { return this.courses.createSectionProgressRepository(); }
  static createStorageService() { return this.courses.createStorageService(); }
  static createCategoryRepository() { return this.courses.createCategoryRepository(); }
  static createCertificateRepository() { return this.courses.createCertificateRepository(); }
  static createCalendarEventRepository() { return this.courses.createCalendarEventRepository(); }

  static createCreateCourseHandler() { return this.courses.createCreateCourseHandler(); }
  static createUpdateCourseHandler() { return this.courses.createUpdateCourseHandler(); }
  static createPublishCourseHandler() { return this.courses.createPublishCourseHandler(); }
  static createUnpublishCourseHandler() { return this.courses.createUnpublishCourseHandler(); }
  static createAddLessonHandler() { return this.courses.createAddLessonHandler(); }
  static createUpdateLessonHandler() { return this.courses.createUpdateLessonHandler(); }
  static createDeleteLessonHandler() { return this.courses.createDeleteLessonHandler(); }
  static createReorderLessonsHandler() { return this.courses.createReorderLessonsHandler(); }
  static createCreateModuleHandler() { return this.courses.createCreateModuleHandler(); }
  static createUpdateModuleHandler() { return this.courses.createUpdateModuleHandler(); }
  static createDeleteModuleHandler() { return this.courses.createDeleteModuleHandler(); }
  static createReorderModulesHandler() { return this.courses.createReorderModulesHandler(); }
  static createCreateSectionHandler() { return this.courses.createCreateSectionHandler(); }
  static createUpdateSectionHandler() { return this.courses.createUpdateSectionHandler(); }
  static createDeleteSectionHandler() { return this.courses.createDeleteSectionHandler(); }
  static createReorderSectionsHandler() { return this.courses.createReorderSectionsHandler(); }
  static createCompleteSectionHandler() { return this.courses.createCompleteSectionHandler(); }
  static createEnrollStudentHandler() { return this.courses.createEnrollStudentHandler(); }
  static createUpdateLessonProgressHandler() { return this.courses.createUpdateLessonProgressHandler(); }

  static createCreateLessonBundleHandler() { return this.courses.createCreateLessonBundleHandler(); }
  static createActivateLessonBundleHandler() { return this.courses.createActivateLessonBundleHandler(); }
  static createDeleteLessonBundleHandler() { return this.courses.createDeleteLessonBundleHandler(); }
  static createCreateSectionBundleHandler() { return this.courses.createCreateSectionBundleHandler(); }
  static createActivateSectionBundleHandler() { return this.courses.createActivateSectionBundleHandler(); }
  static createDeleteSectionBundleHandler() { return this.courses.createDeleteSectionBundleHandler(); }

  static createCreateCategoryHandler() { return this.courses.createCreateCategoryHandler(); }
  static createUpdateCategoryHandler() { return this.courses.createUpdateCategoryHandler(); }
  static createDeleteCategoryHandler() { return this.courses.createDeleteCategoryHandler(); }
  static createListCategoriesHandler() { return this.courses.createListCategoriesHandler(); }

  static createGenerateCertificateHandler() { return this.courses.createGenerateCertificateHandler(); }
  static createGetStudentCertificatesHandler() { return this.courses.createGetStudentCertificatesHandler(); }
  static createVerifyCertificateHandler() { return this.courses.createVerifyCertificateHandler(); }

  static createCreateCalendarEventHandler() { return this.courses.createCreateCalendarEventHandler(); }
  static createUpdateCalendarEventHandler() { return this.courses.createUpdateCalendarEventHandler(); }
  static createDeleteCalendarEventHandler() { return this.courses.createDeleteCalendarEventHandler(); }
  static createListCalendarEventsHandler() { return this.courses.createListCalendarEventsHandler(); }
  static createGetStudentCalendarEventsHandler() { return this.courses.createGetStudentCalendarEventsHandler(); }

  static createGetCourseHandler() { return this.courses.createGetCourseHandler(); }
  static createListCoursesHandler() { return this.courses.createListCoursesHandler(); }
  static createGetStudentEnrollmentsHandler() { return this.courses.createGetStudentEnrollmentsHandler(); }
  static createGetCourseProgressHandler() { return this.courses.createGetCourseProgressHandler(); }
  static createGetEnrollmentByCourseHandler() { return this.courses.createGetEnrollmentByCourseHandler(); }
  static createGetSectionsByLessonHandler() { return this.courses.createGetSectionsByLessonHandler(); }
  static createGetSectionProgressHandler() { return this.courses.createGetSectionProgressHandler(); }
  static createGetLessonBundlesHandler() { return this.courses.createGetLessonBundlesHandler(); }
  static createGetActiveBundleHandler() { return this.courses.createGetActiveBundleHandler(); }
  static createGetSectionBundlesHandler() { return this.courses.createGetSectionBundlesHandler(); }
  static createGetActiveSectionBundleHandler() { return this.courses.createGetActiveSectionBundleHandler(); }

  static createCourseAdminController() { return this.courses.createCourseAdminController(); }
  static createCoursePublicController() { return this.courses.createCoursePublicController(); }
  static createEnrollmentController() { return this.courses.createEnrollmentController(); }
  static createModuleAdminController() { return this.courses.createModuleAdminController(); }
  static createSectionAdminController() { return this.courses.createSectionAdminController(); }
  static createLessonBundleAdminController() { return this.courses.createLessonBundleAdminController(); }
  static createSectionBundleAdminController() { return this.courses.createSectionBundleAdminController(); }
  static createCategoryAdminController() { return this.courses.createCategoryAdminController(); }
  static createCategoryPublicController() { return this.courses.createCategoryPublicController(); }
  static createCertificateController() { return this.courses.createCertificateController(); }
  static createCalendarEventAdminController() { return this.courses.createCalendarEventAdminController(); }
  static createCalendarEventPublicController() { return this.courses.createCalendarEventPublicController(); }

  static createExportImportAdminController(): ExportImportAdminController {
    return new ExportImportAdminController(
      this.auth.createTokenService(),
      this.courses.createExportCoursesHandler(),
      this.courses.createImportCoursesHandler(),
      this.auth.createExportUsersHandler(),
      this.auth.createImportUsersHandler()
    );
  }

  // ========== AI Context (delegated) ==========

  static createLlmManufacturerRepository() { return this.ai.createLlmManufacturerRepository(); }
  static createLlmModelRepository() { return this.ai.createLlmModelRepository(); }
  static createPromptResolutionService() { return this.ai.createPromptResolutionService(); }
  static createExerciseCorrectionAgentService() { return this.ai.createExerciseCorrectionAgentService(); }

  static createCreateManufacturerHandler() { return this.ai.createCreateManufacturerHandler(); }
  static createUpdateManufacturerHandler() { return this.ai.createUpdateManufacturerHandler(); }
  static createDeleteManufacturerHandler() { return this.ai.createDeleteManufacturerHandler(); }
  static createCreateModelHandler() { return this.ai.createCreateModelHandler(); }
  static createUpdateModelHandler() { return this.ai.createUpdateModelHandler(); }
  static createDeleteModelHandler() { return this.ai.createDeleteModelHandler(); }
  static createSetDefaultModelHandler() { return this.ai.createSetDefaultModelHandler(); }
  static createVerifyExerciseHandler() { return this.ai.createVerifyExerciseHandler(); }

  static createListManufacturersHandler() { return this.ai.createListManufacturersHandler(); }
  static createGetManufacturerHandler() { return this.ai.createGetManufacturerHandler(); }
  static createListModelsHandler() { return this.ai.createListModelsHandler(); }
  static createGetModelHandler() { return this.ai.createGetModelHandler(); }
  static createGetDefaultModelHandler() { return this.ai.createGetDefaultModelHandler(); }

  static createLlmManufacturerAdminController() { return this.ai.createLlmManufacturerAdminController(); }
  static createLlmModelAdminController() { return this.ai.createLlmModelAdminController(); }
  static createExerciseVerificationController() { return this.ai.createExerciseVerificationController(); }

  // ========== Application Lifecycle ==========

  static initialize(): void {
    this.registerEventHandlers();
  }

  private static registerEventHandlers(): void {
    const eventPublisher = getDomainEventPublisher();
    eventPublisher.addSubscriber(this.auth.createLogUserCreatedHandler());
    eventPublisher.addSubscriber(this.auth.createSendWelcomeEmailHandler());
  }

  static createEmailService() { return this.auth.createEmailService(); }

  static async shutdown(): Promise<void> {
    await closeDatabase();
    this.databaseProvider = null;
    this._auth = null;
    this._courses = null;
    this._ai = null;
    AuthContainer.reset();
    CoursesContainer.reset();
  }
}
