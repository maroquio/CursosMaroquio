import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createAuthMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { GetStudentCalendarEventsQuery } from '../../application/queries/get-student-calendar-events/GetStudentCalendarEventsQuery.ts';
import { GetStudentCalendarEventsHandler } from '../../application/queries/get-student-calendar-events/GetStudentCalendarEventsHandler.ts';

/**
 * CalendarEventPublicController
 * Handles public/student endpoints for calendar events
 */
export class CalendarEventPublicController {
  constructor(
    private tokenService: ITokenService,
    private getStudentCalendarEventsHandler: GetStudentCalendarEventsHandler
  ) {}

  public routes(app: any) {
    const authMiddleware = createAuthMiddleware(this.tokenService);

    // Get student's calendar events (enrolled courses + global)
    app.get(
      '/v1/calendar-events',
      handleRoute({
        middleware: authMiddleware,
        handler: async (_ctx, user) =>
          this.getStudentCalendarEventsHandler.execute(
            new GetStudentCalendarEventsQuery(user!.userId)
          ),
      }),
      {
        detail: {
          tags: ['Calendar Events'],
          summary: 'Get my calendar events',
          description: 'Returns calendar events for the authenticated student (enrolled courses + global)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
