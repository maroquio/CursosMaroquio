import { t as schema } from 'elysia';
import type { ITokenService } from '@auth/domain/services/ITokenService.ts';
import { createPermissionMiddleware } from '@auth/presentation/middleware/AuthMiddleware.ts';
import type { ExportCoursesHandler } from '@courses/application/queries/export-courses/ExportCoursesHandler.ts';
import type { ImportCoursesHandler } from '@courses/application/commands/import-courses/ImportCoursesHandler.ts';
import type { ExportUsersHandler } from '@auth/application/queries/export-users/ExportUsersHandler.ts';
import type { ImportUsersHandler } from '@auth/application/commands/import-users/ImportUsersHandler.ts';

/**
 * ExportImportAdminController
 * Handles admin backup and restore endpoints for courses and users.
 * All routes require `courses:*` permission (admin only).
 */
export class ExportImportAdminController {
  constructor(
    private tokenService: ITokenService,
    private exportCoursesHandler: ExportCoursesHandler,
    private importCoursesHandler: ImportCoursesHandler,
    private exportUsersHandler: ExportUsersHandler,
    private importUsersHandler: ImportUsersHandler
  ) {}

  public routes(app: any) {
    const adminMiddleware = createPermissionMiddleware(this.tokenService, 'courses:*');

    // Export Courses
    app.get(
      '/v1/admin/export/courses',
      async (ctx: any) => {
        const authResult = await adminMiddleware({ request: ctx.request } as any);
        if (authResult instanceof Response) {
          ctx.set.status = authResult.status;
          return authResult.json();
        }

        const result = await this.exportCoursesHandler.execute();

        if (result.isFailure) {
          ctx.set.status = 500;
          return { statusCode: 500, success: false, error: String(result.getError()) };
        }

        const buffer = result.getValue();
        const filename = `courses_export_${Date.now()}.zip`;

        return new Response(buffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.length),
          },
        });
      },
      {
        detail: {
          tags: ['Admin Backup'],
          summary: 'Export all courses as ZIP',
          description: 'Exports all courses, modules, lessons, sections, and bundle files as a ZIP archive',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Import Courses
    app.post(
      '/v1/admin/import/courses',
      async (ctx: any) => {
        const authResult = await adminMiddleware({ request: ctx.request } as any);
        if (authResult instanceof Response) {
          ctx.set.status = authResult.status;
          return authResult.json();
        }

        const file = ctx.body.file;
        if (!file) {
          ctx.set.status = 400;
          return { statusCode: 400, success: false, error: 'File is required' };
        }

        let zipBuffer: Buffer;
        try {
          zipBuffer = Buffer.from(await file.arrayBuffer());
        } catch {
          ctx.set.status = 400;
          return { statusCode: 400, success: false, error: 'Failed to read file' };
        }

        const result = await this.importCoursesHandler.execute(zipBuffer);

        if (result.isFailure) {
          ctx.set.status = 400;
          return { statusCode: 400, success: false, error: String(result.getError()) };
        }

        return { statusCode: 200, success: true, data: result.getValue() };
      },
      {
        body: schema.Object({
          file: schema.File({
            type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
            maxSize: '200m',
          }),
        }),
        detail: {
          tags: ['Admin Backup'],
          summary: 'Import courses from ZIP',
          description: 'Imports courses from a previously exported ZIP. Uses upsert to handle existing records.',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Export Users
    app.get(
      '/v1/admin/export/users',
      async (ctx: any) => {
        const authResult = await adminMiddleware({ request: ctx.request } as any);
        if (authResult instanceof Response) {
          ctx.set.status = authResult.status;
          return authResult.json();
        }

        const result = await this.exportUsersHandler.execute();

        if (result.isFailure) {
          ctx.set.status = 500;
          return { statusCode: 500, success: false, error: String(result.getError()) };
        }

        const buffer = result.getValue();
        const filename = `users_export_${Date.now()}.zip`;

        return new Response(buffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.length),
          },
        });
      },
      {
        detail: {
          tags: ['Admin Backup'],
          summary: 'Export all users as ZIP',
          description: 'Exports all users with roles, permissions, enrollments, and progress as a ZIP archive',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    // Import Users
    app.post(
      '/v1/admin/import/users',
      async (ctx: any) => {
        const authResult = await adminMiddleware({ request: ctx.request } as any);
        if (authResult instanceof Response) {
          ctx.set.status = authResult.status;
          return authResult.json();
        }

        const file = ctx.body.file;
        if (!file) {
          ctx.set.status = 400;
          return { statusCode: 400, success: false, error: 'File is required' };
        }

        let zipBuffer: Buffer;
        try {
          zipBuffer = Buffer.from(await file.arrayBuffer());
        } catch {
          ctx.set.status = 400;
          return { statusCode: 400, success: false, error: 'Failed to read file' };
        }

        const result = await this.importUsersHandler.execute(zipBuffer);

        if (result.isFailure) {
          ctx.set.status = 400;
          return { statusCode: 400, success: false, error: String(result.getError()) };
        }

        return { statusCode: 200, success: true, data: result.getValue() };
      },
      {
        body: schema.Object({
          file: schema.File({
            type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
            maxSize: '200m',
          }),
        }),
        detail: {
          tags: ['Admin Backup'],
          summary: 'Import users from ZIP',
          description: 'Imports users from a previously exported ZIP. Uses upsert to handle existing records.',
          security: [{ bearerAuth: [] }],
        },
      }
    );

    return app;
  }
}
