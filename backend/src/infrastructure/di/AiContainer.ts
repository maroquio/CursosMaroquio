import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';

// AI Context - Repositories
import { DrizzleLlmManufacturerRepository } from '@ai/infrastructure/persistence/drizzle/DrizzleLlmManufacturerRepository.ts';
import { DrizzleLlmModelRepository } from '@ai/infrastructure/persistence/drizzle/DrizzleLlmModelRepository.ts';

// AI Context - Services
import { PromptResolutionService } from '@ai/application/services/PromptResolutionService.ts';
import { ExerciseCorrectionAgentService } from '@ai/infrastructure/services/ExerciseCorrectionAgentService.ts';

// AI Context - Command Handlers
import { CreateManufacturerHandler } from '@ai/application/commands/create-manufacturer/CreateManufacturerHandler.ts';
import { UpdateManufacturerHandler } from '@ai/application/commands/update-manufacturer/UpdateManufacturerHandler.ts';
import { DeleteManufacturerHandler } from '@ai/application/commands/delete-manufacturer/DeleteManufacturerHandler.ts';
import { CreateModelHandler } from '@ai/application/commands/create-model/CreateModelHandler.ts';
import { UpdateModelHandler } from '@ai/application/commands/update-model/UpdateModelHandler.ts';
import { DeleteModelHandler } from '@ai/application/commands/delete-model/DeleteModelHandler.ts';
import { SetDefaultModelHandler } from '@ai/application/commands/set-default-model/SetDefaultModelHandler.ts';
import { VerifyExerciseHandler } from '@ai/application/commands/verify-exercise/VerifyExerciseHandler.ts';

// AI Context - Query Handlers
import { ListManufacturersHandler } from '@ai/application/queries/list-manufacturers/ListManufacturersHandler.ts';
import { GetManufacturerHandler } from '@ai/application/queries/get-manufacturer/GetManufacturerHandler.ts';
import { ListModelsHandler } from '@ai/application/queries/list-models/ListModelsHandler.ts';
import { GetModelHandler } from '@ai/application/queries/get-model/GetModelHandler.ts';
import { GetDefaultModelHandler } from '@ai/application/queries/get-default-model/GetDefaultModelHandler.ts';

// AI Context - Presentation
import { LlmManufacturerAdminController } from '@ai/presentation/http/LlmManufacturerAdminController.ts';
import { LlmModelAdminController } from '@ai/presentation/http/LlmModelAdminController.ts';
import { ExerciseVerificationController } from '@ai/presentation/http/ExerciseVerificationController.ts';

/**
 * AI Context DI Container
 * Factory methods for AI bounded context dependencies
 *
 * Note: Uses create* naming convention (standardized from get*)
 */
export class AiContainer {
  constructor(
    private getDatabaseProvider: () => IDatabaseProvider,
    private getTokenService: () => ITokenService
  ) {}

  // ========== Infrastructure ==========

  createLlmManufacturerRepository(): DrizzleLlmManufacturerRepository {
    return new DrizzleLlmManufacturerRepository(this.getDatabaseProvider());
  }

  createLlmModelRepository(): DrizzleLlmModelRepository {
    return new DrizzleLlmModelRepository(this.getDatabaseProvider());
  }

  createPromptResolutionService(): PromptResolutionService {
    return new PromptResolutionService();
  }

  createExerciseCorrectionAgentService(): ExerciseCorrectionAgentService {
    return new ExerciseCorrectionAgentService();
  }

  // ========== Command Handlers ==========

  createCreateManufacturerHandler(): CreateManufacturerHandler {
    return new CreateManufacturerHandler(this.createLlmManufacturerRepository());
  }

  createUpdateManufacturerHandler(): UpdateManufacturerHandler {
    return new UpdateManufacturerHandler(this.createLlmManufacturerRepository());
  }

  createDeleteManufacturerHandler(): DeleteManufacturerHandler {
    return new DeleteManufacturerHandler(this.createLlmManufacturerRepository(), this.createLlmModelRepository());
  }

  createCreateModelHandler(): CreateModelHandler {
    return new CreateModelHandler(this.createLlmModelRepository(), this.createLlmManufacturerRepository());
  }

  createUpdateModelHandler(): UpdateModelHandler {
    return new UpdateModelHandler(this.createLlmModelRepository());
  }

  createDeleteModelHandler(): DeleteModelHandler {
    return new DeleteModelHandler(this.createLlmModelRepository());
  }

  createSetDefaultModelHandler(): SetDefaultModelHandler {
    return new SetDefaultModelHandler(this.createLlmModelRepository());
  }

  createVerifyExerciseHandler(): VerifyExerciseHandler {
    return new VerifyExerciseHandler(
      this.getDatabaseProvider(),
      this.createLlmModelRepository(),
      this.createLlmManufacturerRepository(),
      this.createPromptResolutionService(),
      this.createExerciseCorrectionAgentService()
    );
  }

  // ========== Query Handlers ==========

  createListManufacturersHandler(): ListManufacturersHandler {
    return new ListManufacturersHandler(this.createLlmManufacturerRepository());
  }

  createGetManufacturerHandler(): GetManufacturerHandler {
    return new GetManufacturerHandler(this.createLlmManufacturerRepository());
  }

  createListModelsHandler(): ListModelsHandler {
    return new ListModelsHandler(this.createLlmModelRepository());
  }

  createGetModelHandler(): GetModelHandler {
    return new GetModelHandler(this.createLlmModelRepository());
  }

  createGetDefaultModelHandler(): GetDefaultModelHandler {
    return new GetDefaultModelHandler(this.createLlmModelRepository());
  }

  // ========== Presentation ==========

  createLlmManufacturerAdminController(): LlmManufacturerAdminController {
    return new LlmManufacturerAdminController(
      this.getTokenService(),
      this.createCreateManufacturerHandler(),
      this.createUpdateManufacturerHandler(),
      this.createDeleteManufacturerHandler(),
      this.createListManufacturersHandler(),
      this.createGetManufacturerHandler()
    );
  }

  createLlmModelAdminController(): LlmModelAdminController {
    return new LlmModelAdminController(
      this.getTokenService(),
      this.createCreateModelHandler(),
      this.createUpdateModelHandler(),
      this.createDeleteModelHandler(),
      this.createSetDefaultModelHandler(),
      this.createListModelsHandler(),
      this.createGetModelHandler(),
      this.createGetDefaultModelHandler()
    );
  }

  createExerciseVerificationController(): ExerciseVerificationController {
    return new ExerciseVerificationController(
      this.getTokenService(),
      this.createVerifyExerciseHandler()
    );
  }
}
