import JSZip from 'jszip';
import { Result } from '@shared/domain/Result.ts';
import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import {
  usersTable,
  rolesTable,
  userRolesTable,
  permissionsTable,
  userPermissionsTable,
} from '@auth/infrastructure/persistence/drizzle/schema.ts';
import {
  enrollmentsTable,
  lessonProgressTable,
  sectionProgressTable,
} from '@courses/infrastructure/persistence/drizzle/schema.ts';

export interface ImportUsersResult {
  usersUpserted: number;
  rolesUpserted: number;
  userRolesUpserted: number;
  permissionsUpserted: number;
  userPermissionsUpserted: number;
  enrollmentsUpserted: number;
  progressUpserted: number;
  errors: string[];
}

/**
 * ImportUsersHandler
 * Imports users from a ZIP exported by ExportUsersHandler.
 * Uses upsert (ON CONFLICT DO UPDATE) to handle existing records.
 * Password hashes are preserved as-is from the export.
 */
export class ImportUsersHandler {
  constructor(private dbProvider: IDatabaseProvider) {}

  async execute(zipBuffer: Buffer): Promise<Result<ImportUsersResult>> {
    const errors: string[] = [];
    const result: ImportUsersResult = {
      usersUpserted: 0,
      rolesUpserted: 0,
      userRolesUpserted: 0,
      permissionsUpserted: 0,
      userPermissionsUpserted: 0,
      enrollmentsUpserted: 0,
      progressUpserted: 0,
      errors,
    };

    try {
      const zip = await JSZip.loadAsync(zipBuffer);

      const dataFile = zip.file('data.json');
      if (!dataFile) {
        return Result.fail('Invalid ZIP: missing data.json');
      }

      const dataJson = await dataFile.async('string');
      const data = JSON.parse(dataJson);

      const db = this.dbProvider.getDb();

      // Upsert roles first (users depend on them)
      if (data.roles?.length) {
        for (const role of data.roles) {
          try {
            await db
              .insert(rolesTable)
              .values(role)
              .onConflictDoUpdate({
                target: rolesTable.id,
                set: {
                  name: role.name,
                  description: role.description,
                  isSystem: role.isSystem,
                  updatedAt: role.updatedAt,
                },
              });
            result.rolesUpserted++;
          } catch (err) {
            errors.push(`Role ${role.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert permissions
      if (data.permissions?.length) {
        for (const permission of data.permissions) {
          try {
            await db
              .insert(permissionsTable)
              .values(permission)
              .onConflictDoUpdate({
                target: permissionsTable.id,
                set: {
                  name: permission.name,
                  resource: permission.resource,
                  action: permission.action,
                  description: permission.description,
                },
              });
            result.permissionsUpserted++;
          } catch (err) {
            errors.push(`Permission ${permission.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert users
      if (data.users?.length) {
        for (const user of data.users) {
          try {
            await db
              .insert(usersTable)
              .values(user)
              .onConflictDoUpdate({
                target: usersTable.id,
                set: {
                  email: user.email,
                  password: user.password,
                  fullName: user.fullName,
                  phone: user.phone,
                  isActive: user.isActive,
                  photoUrl: user.photoUrl,
                },
              });
            result.usersUpserted++;
          } catch (err) {
            errors.push(`User ${user.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert user-roles (junction table with composite PK)
      if (data.userRoles?.length) {
        for (const ur of data.userRoles) {
          try {
            await db
              .insert(userRolesTable)
              .values(ur)
              .onConflictDoNothing();
            result.userRolesUpserted++;
          } catch (err) {
            errors.push(`UserRole ${ur.userId}/${ur.roleId}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert user-permissions (junction table with composite PK)
      if (data.userPermissions?.length) {
        for (const up of data.userPermissions) {
          try {
            await db
              .insert(userPermissionsTable)
              .values(up)
              .onConflictDoNothing();
            result.userPermissionsUpserted++;
          } catch (err) {
            errors.push(`UserPermission ${up.userId}/${up.permissionId}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert enrollments
      if (data.enrollments?.length) {
        for (const enrollment of data.enrollments) {
          try {
            await db
              .insert(enrollmentsTable)
              .values(enrollment)
              .onConflictDoUpdate({
                target: enrollmentsTable.id,
                set: {
                  status: enrollment.status,
                  progress: enrollment.progress,
                  lastAccessedAt: enrollment.lastAccessedAt,
                  completedAt: enrollment.completedAt,
                  cancelledAt: enrollment.cancelledAt,
                  expiresAt: enrollment.expiresAt,
                },
              });
            result.enrollmentsUpserted++;
          } catch (err) {
            errors.push(`Enrollment ${enrollment.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert lesson progress
      if (data.lessonProgress?.length) {
        for (const lp of data.lessonProgress) {
          try {
            await db
              .insert(lessonProgressTable)
              .values(lp)
              .onConflictDoUpdate({
                target: lessonProgressTable.id,
                set: {
                  status: lp.status,
                  watchedSeconds: lp.watchedSeconds,
                  completedAt: lp.completedAt,
                  lastWatchedAt: lp.lastWatchedAt,
                },
              });
            result.progressUpserted++;
          } catch (err) {
            errors.push(`LessonProgress ${lp.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert section progress
      if (data.sectionProgress?.length) {
        for (const sp of data.sectionProgress) {
          try {
            await db
              .insert(sectionProgressTable)
              .values(sp)
              .onConflictDoUpdate({
                target: sectionProgressTable.id,
                set: {
                  status: sp.status,
                  completedAt: sp.completedAt,
                  lastViewedAt: sp.lastViewedAt,
                },
              });
            result.progressUpserted++;
          } catch (err) {
            errors.push(`SectionProgress ${sp.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
