import JSZip from 'jszip';
import { Result } from '@shared/domain/Result.ts';
import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { usersTable, rolesTable, userRolesTable, permissionsTable, userPermissionsTable } from '@auth/infrastructure/persistence/drizzle/schema.ts';
import { enrollmentsTable, lessonProgressTable, sectionProgressTable } from '@courses/infrastructure/persistence/drizzle/schema.ts';

/**
 * ExportUsersHandler
 * Exports all users with roles, permissions, enrollments, and progress as a ZIP.
 * Includes password hashes for full restore capability.
 * Returns a Buffer containing the ZIP file.
 */
export class ExportUsersHandler {
  constructor(private dbProvider: IDatabaseProvider) {}

  async execute(): Promise<Result<Buffer>> {
    try {
      const db = this.dbProvider.getDb();

      const users = await db.select().from(usersTable);
      const roles = await db.select().from(rolesTable);
      const userRoles = await db.select().from(userRolesTable);
      const permissions = await db.select().from(permissionsTable);
      const userPermissions = await db.select().from(userPermissionsTable);
      const enrollments = await db.select().from(enrollmentsTable);
      const lessonProgress = await db.select().from(lessonProgressTable);
      const sectionProgress = await db.select().from(sectionProgressTable);

      const zip = new JSZip();

      const data = {
        exportedAt: new Date().toISOString(),
        users,
        roles,
        userRoles,
        permissions,
        userPermissions,
        enrollments,
        lessonProgress,
        sectionProgress,
      };

      zip.file('data.json', JSON.stringify(data, null, 2));

      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      return Result.ok(buffer);
    } catch (error) {
      return Result.fail(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
