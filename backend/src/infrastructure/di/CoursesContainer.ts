import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';

// Courses Context - Repositories
import { DrizzleCourseRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleCourseRepository.ts';
import { DrizzleEnrollmentRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleEnrollmentRepository.ts';
import { DrizzleLessonProgressRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleLessonProgressRepository.ts';
import { DrizzleLessonBundleRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleLessonBundleRepository.ts';
import { DrizzleSectionBundleRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleSectionBundleRepository.ts';
import { DrizzleModuleRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleModuleRepository.ts';
import { DrizzleSectionRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleSectionRepository.ts';
import { DrizzleSectionProgressRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleSectionProgressRepository.ts';
import { DrizzleCategoryRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleCategoryRepository.ts';
import { DrizzleCertificateRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleCertificateRepository.ts';
import { DrizzleCalendarEventRepository } from '@courses/infrastructure/persistence/drizzle/DrizzleCalendarEventRepository.ts';

// Courses Context - Storage Services
import { LocalStorageService } from '@courses/infrastructure/storage/LocalStorageService.ts';
import type { IStorageService } from '@courses/infrastructure/storage/IStorageService.ts';

// Courses Context - Command Handlers
import { CreateCourseHandler } from '@courses/application/commands/create-course/CreateCourseHandler.ts';
import { UpdateCourseHandler } from '@courses/application/commands/update-course/UpdateCourseHandler.ts';
import { PublishCourseHandler } from '@courses/application/commands/publish-course/PublishCourseHandler.ts';
import { UnpublishCourseHandler } from '@courses/application/commands/unpublish-course/UnpublishCourseHandler.ts';
import { AddLessonHandler } from '@courses/application/commands/add-lesson/AddLessonHandler.ts';
import { UpdateLessonHandler } from '@courses/application/commands/update-lesson/UpdateLessonHandler.ts';
import { DeleteLessonHandler } from '@courses/application/commands/delete-lesson/DeleteLessonHandler.ts';
import { ReorderLessonsHandler } from '@courses/application/commands/reorder-lessons/ReorderLessonsHandler.ts';
import { EnrollStudentHandler } from '@courses/application/commands/enroll-student/EnrollStudentHandler.ts';
import { UpdateLessonProgressHandler } from '@courses/application/commands/update-lesson-progress/UpdateLessonProgressHandler.ts';

// Courses Context - Module Command Handlers
import { CreateModuleHandler } from '@courses/application/commands/create-module/CreateModuleHandler.ts';
import { UpdateModuleHandler } from '@courses/application/commands/update-module/UpdateModuleHandler.ts';
import { DeleteModuleHandler } from '@courses/application/commands/delete-module/DeleteModuleHandler.ts';
import { ReorderModulesHandler } from '@courses/application/commands/reorder-modules/ReorderModulesHandler.ts';

// Courses Context - Section Command Handlers
import { CreateSectionHandler } from '@courses/application/commands/create-section/CreateSectionHandler.ts';
import { UpdateSectionHandler } from '@courses/application/commands/update-section/UpdateSectionHandler.ts';
import { DeleteSectionHandler } from '@courses/application/commands/delete-section/DeleteSectionHandler.ts';
import { ReorderSectionsHandler } from '@courses/application/commands/reorder-sections/ReorderSectionsHandler.ts';
import { CompleteSectionHandler } from '@courses/application/commands/complete-section/CompleteSectionHandler.ts';

// Courses Context - LessonBundle Command Handlers
import { CreateLessonBundleHandler } from '@courses/application/commands/create-lesson-bundle/CreateLessonBundleHandler.ts';
import { ActivateLessonBundleHandler } from '@courses/application/commands/activate-lesson-bundle/ActivateLessonBundleHandler.ts';
import { DeleteLessonBundleHandler } from '@courses/application/commands/delete-lesson-bundle/DeleteLessonBundleHandler.ts';

// Courses Context - SectionBundle Command Handlers
import { CreateSectionBundleHandler } from '@courses/application/commands/create-section-bundle/CreateSectionBundleHandler.ts';
import { ActivateSectionBundleHandler } from '@courses/application/commands/activate-section-bundle/ActivateSectionBundleHandler.ts';
import { DeleteSectionBundleHandler } from '@courses/application/commands/delete-section-bundle/DeleteSectionBundleHandler.ts';

// Courses Context - Category Command Handlers
import { CreateCategoryHandler } from '@courses/application/commands/create-category/CreateCategoryHandler.ts';
import { UpdateCategoryHandler } from '@courses/application/commands/update-category/UpdateCategoryHandler.ts';
import { DeleteCategoryHandler } from '@courses/application/commands/delete-category/DeleteCategoryHandler.ts';

// Courses Context - Certificate Command Handlers
import { GenerateCertificateHandler } from '@courses/application/commands/generate-certificate/GenerateCertificateHandler.ts';

// Courses Context - Calendar Event Command Handlers
import { CreateCalendarEventHandler } from '@courses/application/commands/create-calendar-event/CreateCalendarEventHandler.ts';
import { UpdateCalendarEventHandler } from '@courses/application/commands/update-calendar-event/UpdateCalendarEventHandler.ts';
import { DeleteCalendarEventHandler } from '@courses/application/commands/delete-calendar-event/DeleteCalendarEventHandler.ts';

// Courses Context - Query Handlers
import { GetCourseHandler } from '@courses/application/queries/get-course/GetCourseHandler.ts';
import { ListCoursesHandler } from '@courses/application/queries/list-courses/ListCoursesHandler.ts';
import { GetStudentEnrollmentsHandler } from '@courses/application/queries/get-student-enrollments/GetStudentEnrollmentsHandler.ts';
import { GetCourseProgressHandler } from '@courses/application/queries/get-course-progress/GetCourseProgressHandler.ts';
import { GetEnrollmentByCourseHandler } from '@courses/application/queries/get-enrollment-by-course/GetEnrollmentByCourseHandler.ts';

// Courses Context - Section Query Handlers
import { GetSectionsByLessonHandler } from '@courses/application/queries/get-sections-by-lesson/GetSectionsByLessonHandler.ts';
import { GetSectionProgressHandler } from '@courses/application/queries/get-section-progress/GetSectionProgressHandler.ts';

// Courses Context - LessonBundle Query Handlers
import { GetLessonBundlesHandler } from '@courses/application/queries/get-lesson-bundles/GetLessonBundlesHandler.ts';
import { GetActiveBundleHandler } from '@courses/application/queries/get-active-bundle/GetActiveBundleHandler.ts';

// Courses Context - SectionBundle Query Handlers
import { GetSectionBundlesHandler } from '@courses/application/queries/get-section-bundles/GetSectionBundlesHandler.ts';
import { GetActiveSectionBundleHandler } from '@courses/application/queries/get-active-section-bundle/GetActiveSectionBundleHandler.ts';

// Courses Context - Category Query Handlers
import { ListCategoriesHandler } from '@courses/application/queries/list-categories/ListCategoriesHandler.ts';

// Courses Context - Certificate Query Handlers
import { GetStudentCertificatesHandler } from '@courses/application/queries/get-student-certificates/GetStudentCertificatesHandler.ts';
import { VerifyCertificateHandler } from '@courses/application/queries/verify-certificate/VerifyCertificateHandler.ts';

// Courses Context - Calendar Event Query Handlers
import { ListCalendarEventsHandler } from '@courses/application/queries/list-calendar-events/ListCalendarEventsHandler.ts';
import { GetStudentCalendarEventsHandler } from '@courses/application/queries/get-student-calendar-events/GetStudentCalendarEventsHandler.ts';

// Courses Context - Export/Import Handlers
import { ExportCoursesHandler } from '@courses/application/queries/export-courses/ExportCoursesHandler.ts';
import { ImportCoursesHandler } from '@courses/application/commands/import-courses/ImportCoursesHandler.ts';

// Courses Context - Presentation
import { CourseAdminController } from '@courses/presentation/http/CourseAdminController.ts';
import { CoursePublicController } from '@courses/presentation/http/CoursePublicController.ts';
import { EnrollmentController } from '@courses/presentation/http/EnrollmentController.ts';
import { ModuleAdminController } from '@courses/presentation/http/ModuleAdminController.ts';
import { SectionAdminController } from '@courses/presentation/http/SectionAdminController.ts';
import { LessonBundleAdminController } from '@courses/presentation/http/LessonBundleAdminController.ts';
import { SectionBundleAdminController } from '@courses/presentation/http/SectionBundleAdminController.ts';
import { CategoryAdminController } from '@courses/presentation/http/CategoryAdminController.ts';
import { CategoryPublicController } from '@courses/presentation/http/CategoryPublicController.ts';
import { CertificateController } from '@courses/presentation/http/CertificateController.ts';
import { CalendarEventAdminController } from '@courses/presentation/http/CalendarEventAdminController.ts';
import { CalendarEventPublicController } from '@courses/presentation/http/CalendarEventPublicController.ts';
import { ExportImportAdminController } from '@courses/presentation/http/ExportImportAdminController.ts';

// Repository Interfaces
import type { ICourseRepository } from '@courses/domain/repositories/ICourseRepository.ts';
import type { IEnrollmentRepository } from '@courses/domain/repositories/IEnrollmentRepository.ts';
import type { ILessonProgressRepository } from '@courses/domain/repositories/ILessonProgressRepository.ts';
import type { ILessonBundleRepository } from '@courses/domain/repositories/ILessonBundleRepository.ts';
import type { ISectionBundleRepository } from '@courses/domain/repositories/ISectionBundleRepository.ts';
import type { IModuleRepository } from '@courses/domain/repositories/IModuleRepository.ts';
import type { ISectionRepository } from '@courses/domain/repositories/ISectionRepository.ts';
import type { ISectionProgressRepository } from '@courses/domain/repositories/ISectionProgressRepository.ts';
import type { ICategoryRepository } from '@courses/domain/repositories/ICategoryRepository.ts';
import type { ICertificateRepository } from '@courses/domain/repositories/ICertificateRepository.ts';
import type { ICalendarEventRepository } from '@courses/domain/repositories/ICalendarEventRepository.ts';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import type { DrizzleUserRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleUserRepository.ts';

/**
 * Courses Context DI Container
 * Factory methods for Courses bounded context dependencies
 */
export class CoursesContainer {
  private static courseRepository: ICourseRepository | null = null;
  private static enrollmentRepository: IEnrollmentRepository | null = null;
  private static lessonProgressRepository: ILessonProgressRepository | null = null;
  private static lessonBundleRepository: ILessonBundleRepository | null = null;
  private static sectionBundleRepository: ISectionBundleRepository | null = null;
  private static moduleRepository: IModuleRepository | null = null;
  private static sectionRepository: ISectionRepository | null = null;
  private static sectionProgressRepository: ISectionProgressRepository | null = null;
  private static storageService: IStorageService | null = null;
  private static categoryRepository: ICategoryRepository | null = null;
  private static certificateRepository: ICertificateRepository | null = null;
  private static calendarEventRepository: ICalendarEventRepository | null = null;

  constructor(
    private getDatabaseProvider: () => IDatabaseProvider,
    private getTokenService: () => ITokenService,
    private createUserRepository: () => DrizzleUserRepository
  ) {}

  // ========== Infrastructure ==========

  createCourseRepository(): ICourseRepository {
    if (!CoursesContainer.courseRepository) {
      CoursesContainer.courseRepository = new DrizzleCourseRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.courseRepository;
  }

  createEnrollmentRepository(): IEnrollmentRepository {
    if (!CoursesContainer.enrollmentRepository) {
      CoursesContainer.enrollmentRepository = new DrizzleEnrollmentRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.enrollmentRepository;
  }

  createLessonProgressRepository(): ILessonProgressRepository {
    if (!CoursesContainer.lessonProgressRepository) {
      CoursesContainer.lessonProgressRepository = new DrizzleLessonProgressRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.lessonProgressRepository;
  }

  createLessonBundleRepository(): ILessonBundleRepository {
    if (!CoursesContainer.lessonBundleRepository) {
      CoursesContainer.lessonBundleRepository = new DrizzleLessonBundleRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.lessonBundleRepository;
  }

  createSectionBundleRepository(): ISectionBundleRepository {
    if (!CoursesContainer.sectionBundleRepository) {
      CoursesContainer.sectionBundleRepository = new DrizzleSectionBundleRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.sectionBundleRepository;
  }

  createModuleRepository(): IModuleRepository {
    if (!CoursesContainer.moduleRepository) {
      CoursesContainer.moduleRepository = new DrizzleModuleRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.moduleRepository;
  }

  createSectionRepository(): ISectionRepository {
    if (!CoursesContainer.sectionRepository) {
      CoursesContainer.sectionRepository = new DrizzleSectionRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.sectionRepository;
  }

  createSectionProgressRepository(): ISectionProgressRepository {
    if (!CoursesContainer.sectionProgressRepository) {
      CoursesContainer.sectionProgressRepository = new DrizzleSectionProgressRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.sectionProgressRepository;
  }

  createStorageService(): IStorageService {
    if (!CoursesContainer.storageService) {
      CoursesContainer.storageService = new LocalStorageService('./uploads/bundles');
    }
    return CoursesContainer.storageService;
  }

  createCategoryRepository(): ICategoryRepository {
    if (!CoursesContainer.categoryRepository) {
      CoursesContainer.categoryRepository = new DrizzleCategoryRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.categoryRepository;
  }

  createCertificateRepository(): ICertificateRepository {
    if (!CoursesContainer.certificateRepository) {
      CoursesContainer.certificateRepository = new DrizzleCertificateRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.certificateRepository;
  }

  createCalendarEventRepository(): ICalendarEventRepository {
    if (!CoursesContainer.calendarEventRepository) {
      CoursesContainer.calendarEventRepository = new DrizzleCalendarEventRepository(this.getDatabaseProvider());
    }
    return CoursesContainer.calendarEventRepository;
  }

  // ========== Command Handlers ==========

  createCreateCourseHandler(): CreateCourseHandler {
    return new CreateCourseHandler(this.createCourseRepository());
  }

  createUpdateCourseHandler(): UpdateCourseHandler {
    return new UpdateCourseHandler(this.createCourseRepository());
  }

  createPublishCourseHandler(): PublishCourseHandler {
    return new PublishCourseHandler(this.createCourseRepository());
  }

  createUnpublishCourseHandler(): UnpublishCourseHandler {
    return new UnpublishCourseHandler(this.createCourseRepository());
  }

  createAddLessonHandler(): AddLessonHandler {
    return new AddLessonHandler(this.createModuleRepository());
  }

  createUpdateLessonHandler(): UpdateLessonHandler {
    return new UpdateLessonHandler(this.createModuleRepository());
  }

  createDeleteLessonHandler(): DeleteLessonHandler {
    return new DeleteLessonHandler(this.createModuleRepository());
  }

  createReorderLessonsHandler(): ReorderLessonsHandler {
    return new ReorderLessonsHandler(this.createModuleRepository());
  }

  createCreateModuleHandler(): CreateModuleHandler {
    return new CreateModuleHandler(this.createCourseRepository());
  }

  createUpdateModuleHandler(): UpdateModuleHandler {
    return new UpdateModuleHandler(this.createModuleRepository());
  }

  createDeleteModuleHandler(): DeleteModuleHandler {
    return new DeleteModuleHandler(this.createCourseRepository());
  }

  createReorderModulesHandler(): ReorderModulesHandler {
    return new ReorderModulesHandler(this.createCourseRepository());
  }

  createCreateSectionHandler(): CreateSectionHandler {
    return new CreateSectionHandler(this.createSectionRepository());
  }

  createUpdateSectionHandler(): UpdateSectionHandler {
    return new UpdateSectionHandler(this.createSectionRepository());
  }

  createDeleteSectionHandler(): DeleteSectionHandler {
    return new DeleteSectionHandler(this.createSectionRepository());
  }

  createReorderSectionsHandler(): ReorderSectionsHandler {
    return new ReorderSectionsHandler(this.createSectionRepository());
  }

  createCompleteSectionHandler(): CompleteSectionHandler {
    return new CompleteSectionHandler(
      this.createEnrollmentRepository(),
      this.createSectionProgressRepository(),
      this.createSectionRepository(),
      this.createLessonProgressRepository()
    );
  }

  createEnrollStudentHandler(): EnrollStudentHandler {
    return new EnrollStudentHandler(
      this.createCourseRepository(),
      this.createEnrollmentRepository()
    );
  }

  createUpdateLessonProgressHandler(): UpdateLessonProgressHandler {
    return new UpdateLessonProgressHandler(
      this.createEnrollmentRepository(),
      this.createLessonProgressRepository(),
      this.createCourseRepository()
    );
  }

  createCreateLessonBundleHandler(): CreateLessonBundleHandler {
    return new CreateLessonBundleHandler(
      this.createLessonBundleRepository(),
      this.createCourseRepository(),
      this.createStorageService()
    );
  }

  createActivateLessonBundleHandler(): ActivateLessonBundleHandler {
    return new ActivateLessonBundleHandler(
      this.createLessonBundleRepository(),
      this.createStorageService()
    );
  }

  createDeleteLessonBundleHandler(): DeleteLessonBundleHandler {
    return new DeleteLessonBundleHandler(
      this.createLessonBundleRepository(),
      this.createStorageService()
    );
  }

  createCreateSectionBundleHandler(): CreateSectionBundleHandler {
    return new CreateSectionBundleHandler(
      this.createSectionBundleRepository(),
      this.createSectionRepository(),
      this.createStorageService()
    );
  }

  createActivateSectionBundleHandler(): ActivateSectionBundleHandler {
    return new ActivateSectionBundleHandler(
      this.createSectionBundleRepository(),
      this.createStorageService()
    );
  }

  createDeleteSectionBundleHandler(): DeleteSectionBundleHandler {
    return new DeleteSectionBundleHandler(
      this.createSectionBundleRepository(),
      this.createStorageService()
    );
  }

  createCreateCategoryHandler(): CreateCategoryHandler {
    return new CreateCategoryHandler(this.createCategoryRepository());
  }

  createUpdateCategoryHandler(): UpdateCategoryHandler {
    return new UpdateCategoryHandler(this.createCategoryRepository());
  }

  createDeleteCategoryHandler(): DeleteCategoryHandler {
    return new DeleteCategoryHandler(this.createCategoryRepository());
  }

  createGenerateCertificateHandler(): GenerateCertificateHandler {
    return new GenerateCertificateHandler(
      this.createCertificateRepository(),
      this.createEnrollmentRepository(),
      this.createCourseRepository(),
      this.createUserRepository()
    );
  }

  createCreateCalendarEventHandler(): CreateCalendarEventHandler {
    return new CreateCalendarEventHandler(this.createCalendarEventRepository());
  }

  createUpdateCalendarEventHandler(): UpdateCalendarEventHandler {
    return new UpdateCalendarEventHandler(this.createCalendarEventRepository());
  }

  createDeleteCalendarEventHandler(): DeleteCalendarEventHandler {
    return new DeleteCalendarEventHandler(this.createCalendarEventRepository());
  }

  // ========== Query Handlers ==========

  createGetCourseHandler(): GetCourseHandler {
    return new GetCourseHandler(
      this.createCourseRepository(),
      this.createEnrollmentRepository()
    );
  }

  createListCoursesHandler(): ListCoursesHandler {
    return new ListCoursesHandler(
      this.createCourseRepository(),
      this.createEnrollmentRepository()
    );
  }

  createGetStudentEnrollmentsHandler(): GetStudentEnrollmentsHandler {
    return new GetStudentEnrollmentsHandler(
      this.createEnrollmentRepository(),
      this.createCourseRepository(),
      this.createLessonProgressRepository()
    );
  }

  createGetCourseProgressHandler(): GetCourseProgressHandler {
    return new GetCourseProgressHandler(
      this.createEnrollmentRepository(),
      this.createCourseRepository(),
      this.createLessonProgressRepository()
    );
  }

  createGetEnrollmentByCourseHandler(): GetEnrollmentByCourseHandler {
    return new GetEnrollmentByCourseHandler(
      this.createEnrollmentRepository(),
      this.createCourseRepository(),
      this.createLessonProgressRepository()
    );
  }

  createGetSectionsByLessonHandler(): GetSectionsByLessonHandler {
    return new GetSectionsByLessonHandler(this.createSectionRepository());
  }

  createGetSectionProgressHandler(): GetSectionProgressHandler {
    return new GetSectionProgressHandler(
      this.createEnrollmentRepository(),
      this.createSectionProgressRepository(),
      this.createSectionRepository()
    );
  }

  createGetLessonBundlesHandler(): GetLessonBundlesHandler {
    return new GetLessonBundlesHandler(
      this.createLessonBundleRepository(),
      this.createStorageService()
    );
  }

  createGetActiveBundleHandler(): GetActiveBundleHandler {
    return new GetActiveBundleHandler(
      this.createLessonBundleRepository(),
      this.createStorageService()
    );
  }

  createGetSectionBundlesHandler(): GetSectionBundlesHandler {
    return new GetSectionBundlesHandler(
      this.createSectionBundleRepository(),
      this.createStorageService()
    );
  }

  createGetActiveSectionBundleHandler(): GetActiveSectionBundleHandler {
    return new GetActiveSectionBundleHandler(
      this.createSectionBundleRepository(),
      this.createStorageService()
    );
  }

  createListCategoriesHandler(): ListCategoriesHandler {
    return new ListCategoriesHandler(this.createCategoryRepository());
  }

  createGetStudentCertificatesHandler(): GetStudentCertificatesHandler {
    return new GetStudentCertificatesHandler(this.createCertificateRepository());
  }

  createVerifyCertificateHandler(): VerifyCertificateHandler {
    return new VerifyCertificateHandler(this.createCertificateRepository());
  }

  createListCalendarEventsHandler(): ListCalendarEventsHandler {
    return new ListCalendarEventsHandler(
      this.createCalendarEventRepository(),
      this.createCourseRepository()
    );
  }

  createGetStudentCalendarEventsHandler(): GetStudentCalendarEventsHandler {
    return new GetStudentCalendarEventsHandler(
      this.createCalendarEventRepository(),
      this.createEnrollmentRepository(),
      this.createCourseRepository()
    );
  }

  // ========== Presentation ==========

  createCourseAdminController(): CourseAdminController {
    return new CourseAdminController(
      this.getTokenService(),
      this.createCreateCourseHandler(),
      this.createUpdateCourseHandler(),
      this.createPublishCourseHandler(),
      this.createUnpublishCourseHandler(),
      this.createAddLessonHandler(),
      this.createUpdateLessonHandler(),
      this.createDeleteLessonHandler(),
      this.createReorderLessonsHandler(),
      this.createGetCourseHandler(),
      this.createListCoursesHandler(),
      this.createCourseRepository(),
      this.createEnrollmentRepository()
    );
  }

  createCoursePublicController(): CoursePublicController {
    return new CoursePublicController(
      this.createGetCourseHandler(),
      this.createListCoursesHandler(),
      this.getTokenService()
    );
  }

  createEnrollmentController(): EnrollmentController {
    return new EnrollmentController(
      this.getTokenService(),
      this.createEnrollStudentHandler(),
      this.createUpdateLessonProgressHandler(),
      this.createGetStudentEnrollmentsHandler(),
      this.createGetCourseProgressHandler(),
      this.createCompleteSectionHandler(),
      this.createGetSectionProgressHandler(),
      this.createGetEnrollmentByCourseHandler()
    );
  }

  createModuleAdminController(): ModuleAdminController {
    return new ModuleAdminController(
      this.getTokenService(),
      this.createCreateModuleHandler(),
      this.createUpdateModuleHandler(),
      this.createDeleteModuleHandler(),
      this.createReorderModulesHandler()
    );
  }

  createSectionAdminController(): SectionAdminController {
    return new SectionAdminController(
      this.getTokenService(),
      this.createCreateSectionHandler(),
      this.createUpdateSectionHandler(),
      this.createDeleteSectionHandler(),
      this.createReorderSectionsHandler(),
      this.createGetSectionsByLessonHandler()
    );
  }

  createLessonBundleAdminController(): LessonBundleAdminController {
    return new LessonBundleAdminController(
      this.getTokenService(),
      this.createCreateLessonBundleHandler(),
      this.createActivateLessonBundleHandler(),
      this.createDeleteLessonBundleHandler(),
      this.createGetLessonBundlesHandler(),
      this.createGetActiveBundleHandler()
    );
  }

  createSectionBundleAdminController(): SectionBundleAdminController {
    return new SectionBundleAdminController(
      this.getTokenService(),
      this.createCreateSectionBundleHandler(),
      this.createActivateSectionBundleHandler(),
      this.createDeleteSectionBundleHandler(),
      this.createGetSectionBundlesHandler(),
      this.createGetActiveSectionBundleHandler()
    );
  }

  createCategoryAdminController(): CategoryAdminController {
    return new CategoryAdminController(
      this.getTokenService(),
      this.createCreateCategoryHandler(),
      this.createUpdateCategoryHandler(),
      this.createDeleteCategoryHandler(),
      this.createListCategoriesHandler()
    );
  }

  createCategoryPublicController(): CategoryPublicController {
    return new CategoryPublicController(this.createListCategoriesHandler());
  }

  createCertificateController(): CertificateController {
    return new CertificateController(
      this.getTokenService(),
      this.createGetStudentCertificatesHandler(),
      this.createVerifyCertificateHandler(),
      this.createGenerateCertificateHandler()
    );
  }

  createCalendarEventAdminController(): CalendarEventAdminController {
    return new CalendarEventAdminController(
      this.getTokenService(),
      this.createCreateCalendarEventHandler(),
      this.createUpdateCalendarEventHandler(),
      this.createDeleteCalendarEventHandler(),
      this.createListCalendarEventsHandler()
    );
  }

  createCalendarEventPublicController(): CalendarEventPublicController {
    return new CalendarEventPublicController(
      this.getTokenService(),
      this.createGetStudentCalendarEventsHandler()
    );
  }

  // ========== Export/Import ==========

  createExportCoursesHandler(): ExportCoursesHandler {
    return new ExportCoursesHandler(this.getDatabaseProvider());
  }

  createImportCoursesHandler(): ImportCoursesHandler {
    return new ImportCoursesHandler(this.getDatabaseProvider());
  }

  // ========== Cleanup ==========

  static reset(): void {
    CoursesContainer.courseRepository = null;
    CoursesContainer.enrollmentRepository = null;
    CoursesContainer.lessonProgressRepository = null;
    CoursesContainer.lessonBundleRepository = null;
    CoursesContainer.sectionBundleRepository = null;
    CoursesContainer.moduleRepository = null;
    CoursesContainer.sectionRepository = null;
    CoursesContainer.sectionProgressRepository = null;
    CoursesContainer.storageService = null;
    CoursesContainer.categoryRepository = null;
    CoursesContainer.certificateRepository = null;
    CoursesContainer.calendarEventRepository = null;
  }
}
