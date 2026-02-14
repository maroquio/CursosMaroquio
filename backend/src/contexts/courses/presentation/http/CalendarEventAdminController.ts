import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { handleRoute } from '@shared/presentation/http/routeHandler.ts';
import { CreateCalendarEventCommand } from '../../application/commands/create-calendar-event/CreateCalendarEventCommand.ts';
import { CreateCalendarEventHandler } from '../../application/commands/create-calendar-event/CreateCalendarEventHandler.ts';
import { UpdateCalendarEventCommand } from '../../application/commands/update-calendar-event/UpdateCalendarEventCommand.ts';
import { UpdateCalendarEventHandler } from '../../application/commands/update-calendar-event/UpdateCalendarEventHandler.ts';
import { DeleteCalendarEventCommand } from '../../application/commands/delete-calendar-event/DeleteCalendarEventCommand.ts';
import { DeleteCalendarEventHandler } from '../../application/commands/delete-calendar-event/DeleteCalendarEventHandler.ts';
import { ListCalendarEventsQuery } from '../../application/queries/list-calendar-events/ListCalendarEventsQuery.ts';
import { ListCalendarEventsHandler } from '../../application/queries/list-calendar-events/ListCalendarEventsHandler.ts';

/**
 * CalendarEventAdminController
 * Handles admin endpoints for calendar events
 */
export class CalendarEventAdminController {
  constructor(
    private tokenService: ITokenService,
    private createCalendarEventHandler: CreateCalendarEventHandler,
    private updateCalendarEventHandler: UpdateCalendarEventHandler,
    private deleteCalendarEventHandler: DeleteCalendarEventHandler,
    private listCalendarEventsHandler: ListCalendarEventsHandler
  ) {}

  public routes(app: any) {
    const permissionMiddleware = createPermissionMiddleware(this.tokenService, 'courses:*');

    // List all calendar events (admin)
    app.get(
      '/v1/admin/calendar-events',
      handleRoute({
        middleware: permissionMiddleware,
        handler: async () =>
          this.listCalendarEventsHandler.execute(new ListCalendarEventsQuery()),
      }),
      {
        detail: {
          tags: ['Admin Calendar Events'],
          summary: 'List all calendar events',
          description: 'Returns all calendar events (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Create calendar event (admin)
    app.post(
      '/v1/admin/calendar-events',
      handleRoute({
        middleware: permissionMiddleware,
        handler: async (ctx, user) =>
          this.createCalendarEventHandler.execute(
            new CreateCalendarEventCommand(
              ctx.body.title,
              ctx.body.date,
              ctx.body.type,
              user!.userId,
              ctx.body.description,
              ctx.body.time,
              ctx.body.courseId
            )
          ),
        successStatus: 201,
      }),
      {
        body: schema.Object({
          title: schema.String({ minLength: 1, maxLength: 200 }),
          date: schema.String(),
          type: schema.Union([
            schema.Literal('live'),
            schema.Literal('deadline'),
            schema.Literal('mentoring'),
            schema.Literal('other'),
          ]),
          description: schema.Optional(schema.Nullable(schema.String())),
          time: schema.Optional(schema.Nullable(schema.String({ maxLength: 10 }))),
          courseId: schema.Optional(schema.Nullable(schema.String())),
        }),
        detail: {
          tags: ['Admin Calendar Events'],
          summary: 'Create calendar event',
          description: 'Creates a new calendar event (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Update calendar event (admin)
    app.put(
      '/v1/admin/calendar-events/:id',
      async ({ request, set, params, body }: any) => {
        const authResult = await permissionMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const command = new UpdateCalendarEventCommand(
          params.id,
          body.title,
          body.date,
          body.type,
          body.description,
          body.time,
          body.courseId
        );

        const result = await this.updateCalendarEventHandler.execute(command);

        if (result.isFailure) {
          const error = String(result.getError());
          if (error === 'CALENDAR_EVENT_NOT_FOUND') {
            set.status = 404;
          } else {
            set.status = 400;
          }
          return { statusCode: set.status, success: false, error };
        }

        return { statusCode: 200, success: true, data: result.getValue() };
      },
      {
        params: schema.Object({
          id: schema.String(),
        }),
        body: schema.Object({
          title: schema.String({ minLength: 1, maxLength: 200 }),
          date: schema.String(),
          type: schema.Union([
            schema.Literal('live'),
            schema.Literal('deadline'),
            schema.Literal('mentoring'),
            schema.Literal('other'),
          ]),
          description: schema.Optional(schema.Nullable(schema.String())),
          time: schema.Optional(schema.Nullable(schema.String({ maxLength: 10 }))),
          courseId: schema.Optional(schema.Nullable(schema.String())),
        }),
        detail: {
          tags: ['Admin Calendar Events'],
          summary: 'Update calendar event',
          description: 'Updates an existing calendar event (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Delete calendar event (admin)
    app.delete(
      '/v1/admin/calendar-events/:id',
      async ({ request, set, params }: any) => {
        const authResult = await permissionMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = authResult.status;
          return authResult.json();
        }

        const command = new DeleteCalendarEventCommand(params.id);
        const result = await this.deleteCalendarEventHandler.execute(command);

        if (result.isFailure) {
          const error = String(result.getError());
          if (error === 'CALENDAR_EVENT_NOT_FOUND') {
            set.status = 404;
          } else {
            set.status = 400;
          }
          return { statusCode: set.status, success: false, error };
        }

        return { statusCode: 200, success: true, message: 'Calendar event deleted successfully' };
      },
      {
        params: schema.Object({
          id: schema.String(),
        }),
        detail: {
          tags: ['Admin Calendar Events'],
          summary: 'Delete calendar event',
          description: 'Deletes a calendar event (admin only)',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
