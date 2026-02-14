import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { VerifyExerciseCommand } from './VerifyExerciseCommand.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { type ILlmManufacturerRepository } from '../../../domain/repositories/ILlmManufacturerRepository.ts';
import { PromptResolutionService } from '../../services/PromptResolutionService.ts';
import { ExerciseCorrectionAgentService, type ExerciseCorrectionResult } from '../../../infrastructure/services/ExerciseCorrectionAgentService.ts';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { sectionsTable, lessonsTable, modulesTable, coursesTable } from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { createLogger } from '@shared/infrastructure/logging/Logger.ts';

const logger = createLogger('VerifyExercise');

export class VerifyExerciseHandler implements ICommandHandler<VerifyExerciseCommand, ExerciseCorrectionResult> {
  constructor(
    private dbProvider: IDatabaseProvider,
    private llmModelRepository: ILlmModelRepository,
    private llmManufacturerRepository: ILlmManufacturerRepository,
    private promptResolutionService: PromptResolutionService,
    private agentService: ExerciseCorrectionAgentService
  ) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async execute(command: VerifyExerciseCommand): Promise<Result<ExerciseCorrectionResult>> {
    try {
      // 1. Find section and validate it's an exercise
      const sectionRows = await this.db
        .select()
        .from(sectionsTable)
        .where(eq(sectionsTable.id, command.sectionId));

      if (!sectionRows || sectionRows.length === 0) {
        return Result.fail(ErrorCode.SECTION_NOT_FOUND);
      }

      const section = sectionRows[0]!;
      if (section.contentType !== 'exercise') {
        return Result.fail(ErrorCode.SECTION_NOT_EXERCISE);
      }

      // Extract problem from section content
      const content = section.content as any;
      const problem = content?.problem || content?.description || '';

      // 2. Get lesson, module, course for prompt hierarchy
      const lessonRows = await this.db
        .select()
        .from(lessonsTable)
        .where(eq(lessonsTable.id, section.lessonId));

      const lesson = lessonRows[0];

      let moduleRow: any = null;
      let courseRow: any = null;

      if (lesson) {
        const moduleRows = await this.db
          .select()
          .from(modulesTable)
          .where(eq(modulesTable.id, lesson.moduleId));
        moduleRow = moduleRows[0];

        if (moduleRow) {
          const courseRows = await this.db
            .select()
            .from(coursesTable)
            .where(eq(coursesTable.id, moduleRow.courseId));
          courseRow = courseRows[0];
        }
      }

      // 3. Resolve prompt hierarchically
      const correctionPrompt = await this.promptResolutionService.resolveFromHierarchy(
        lesson?.exerciseCorrectionPrompt ?? null,
        moduleRow?.exerciseCorrectionPrompt ?? null,
        courseRow?.exerciseCorrectionPrompt ?? null
      );

      // 4. Get default LLM model
      const defaultModel = await this.llmModelRepository.findDefault();
      if (!defaultModel) {
        return Result.fail(ErrorCode.NO_DEFAULT_LLM_MODEL);
      }

      // 5. Get manufacturer for the model
      const manufacturer = await this.llmManufacturerRepository.findById(defaultModel.getManufacturerId());
      if (!manufacturer) {
        return Result.fail(ErrorCode.MANUFACTURER_NOT_FOUND);
      }

      // 6. Call the agent service
      const result = await this.agentService.evaluate({
        problem,
        studentCode: command.studentCode,
        correctionPrompt,
        modelTechnicalName: defaultModel.getTechnicalName(),
        manufacturerSlug: manufacturer.getSlug(),
      });

      return Result.ok(result);
    } catch (error) {
      logger.error('Exercise verification failed', error instanceof Error ? error : new Error(String(error)));
      return Result.fail(ErrorCode.EXERCISE_VERIFICATION_FAILED);
    }
  }
}
