import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createAuthMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { GetStudentCertificatesQuery } from '../../application/queries/get-student-certificates/GetStudentCertificatesQuery.ts';
import { GetStudentCertificatesHandler } from '../../application/queries/get-student-certificates/GetStudentCertificatesHandler.ts';
import { VerifyCertificateQuery } from '../../application/queries/verify-certificate/VerifyCertificateQuery.ts';
import { VerifyCertificateHandler } from '../../application/queries/verify-certificate/VerifyCertificateHandler.ts';
import { GenerateCertificateCommand } from '../../application/commands/generate-certificate/GenerateCertificateCommand.ts';
import { GenerateCertificateHandler } from '../../application/commands/generate-certificate/GenerateCertificateHandler.ts';

/**
 * CertificateController
 * Handles HTTP endpoints for certificates
 */
export class CertificateController {
  constructor(
    private tokenService: ITokenService,
    private getStudentCertificatesHandler: GetStudentCertificatesHandler,
    private verifyCertificateHandler: VerifyCertificateHandler,
    private generateCertificateHandler: GenerateCertificateHandler
  ) {}

  public routes(app: any) {
    const authMiddleware = createAuthMiddleware(this.tokenService);

    // Get student's certificates (authenticated)
    app.get(
      '/v1/certificates/me',
      handleRoute({
        middleware: authMiddleware,
        handler: async (_ctx, user) =>
          this.getStudentCertificatesHandler.execute(
            new GetStudentCertificatesQuery(user!.userId)
          ),
      }),
      {
        detail: {
          tags: ['Certificates'],
          summary: 'Get my certificates',
          description: 'Returns all certificates for the authenticated student',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Generate certificate for enrollment (authenticated)
    app.post(
      '/v1/certificates/generate/:enrollmentId',
      async ({ request, set, params }: any) => {
        const authResult = await authMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const userId = authResult.user.userId;
        const command = new GenerateCertificateCommand(params.enrollmentId, userId);
        const result = await this.generateCertificateHandler.execute(command);

        if (result.isFailure) {
          const error = String(result.getError());
          if (error === 'ENROLLMENT_NOT_FOUND' || error === 'COURSE_NOT_FOUND' || error === 'USER_NOT_FOUND') {
            set.status = 404;
          } else if (error === 'FORBIDDEN') {
            set.status = 403;
          } else {
            set.status = 400;
          }
          return { statusCode: set.status, success: false, error };
        }

        set.status = 201;
        return { statusCode: 201, success: true, data: result.getValue() };
      },
      {
        params: schema.Object({
          enrollmentId: schema.String(),
        }),
        detail: {
          tags: ['Certificates'],
          summary: 'Generate certificate',
          description: 'Generates a certificate for a completed enrollment',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Verify certificate (public)
    app.get(
      '/v1/certificates/verify/:certificateNumber',
      async ({ params, set }: any) => {
        const query = new VerifyCertificateQuery(params.certificateNumber);
        const result = await this.verifyCertificateHandler.execute(query);

        if (result.isFailure) {
          set.status = 400;
          return { statusCode: 400, success: false, error: String(result.getError()) };
        }

        const certificate = result.getValue();
        if (!certificate) {
          set.status = 404;
          return { statusCode: 404, success: false, error: 'CERTIFICATE_NOT_FOUND' };
        }

        return { statusCode: 200, success: true, data: certificate };
      },
      {
        params: schema.Object({
          certificateNumber: schema.String(),
        }),
        detail: {
          tags: ['Certificates'],
          summary: 'Verify certificate',
          description: 'Verifies a certificate by its number (public endpoint)',
        },
      }
    );

    return app;
  }
}
