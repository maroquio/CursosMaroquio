import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createAuthMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { t as schema } from 'elysia';
import { VerifyExerciseCommand } from '../../application/commands/verify-exercise/VerifyExerciseCommand.ts';
import { VerifyExerciseHandler } from '../../application/commands/verify-exercise/VerifyExerciseHandler.ts';

export class ExerciseVerificationController {
  constructor(
    private tokenService: ITokenService,
    private verifyExerciseHandler: VerifyExerciseHandler
  ) {}

  public routes(app: any) {
    // For now, require any authenticated user (enrollment check can be added later)
    const authMiddleware = createAuthMiddleware(this.tokenService);

    app.post(
      '/v1/sections/:sectionId/verify-exercise',
      async ({ request, set, params, body }: any) => {
        const authResult = await authMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        // Extract userId from auth context
        const userId = (authResult as any)?.userId ?? '';

        const command = new VerifyExerciseCommand(
          params.sectionId,
          body.code,
          userId
        );

        const result = await this.verifyExerciseHandler.execute(command);

        if (result.isFailure) {
          const error = String(result.getError());
          const status = error.includes('NOT_FOUND') ? 404 : 400;
          set.status = status;
          return { statusCode: status, success: false, error };
        }

        return { statusCode: 200, success: true, data: result.getValue() };
      },
      {
        params: schema.Object({
          sectionId: schema.String(),
        }),
        body: schema.Object({
          code: schema.String({ minLength: 1 }),
        }),
        detail: {
          tags: ['Exercise Verification'],
          summary: 'Verify exercise with AI',
          description: 'Submits student code to an AI agent for exercise verification',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
