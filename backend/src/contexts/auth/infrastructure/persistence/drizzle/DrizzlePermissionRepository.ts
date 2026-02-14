import { eq, and, count, inArray } from 'drizzle-orm';
import type {
  DrizzleDatabase,
  IDatabaseProvider,
} from '@shared/infrastructure/database/types.ts';
import type {
  IPermissionRepository,
  PermissionEntity,
  PaginatedPermissions,
} from '../../../domain/repositories/IPermissionRepository.ts';
import { Permission } from '../../../domain/value-objects/Permission.ts';
import { PermissionId } from '../../../domain/value-objects/PermissionId.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { RoleId } from '../../../domain/value-objects/RoleId.ts';
import {
  permissionsTable,
  userPermissionsTable,
  rolePermissionsTable,
} from './schema.ts';

/**
 * DrizzlePermissionRepository
 * Implements IPermissionRepository using Drizzle ORM with PostgreSQL
 * Handles all database operations for permissions and user-permission assignments
 */
export class DrizzlePermissionRepository implements IPermissionRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  /**
   * Maps a database row to a PermissionEntity
   */
  private mapToEntity(row: {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date;
  }): PermissionEntity {
    return {
      id: PermissionId.create(row.id),
      name: row.name,
      resource: row.resource,
      action: row.action,
      description: row.description,
      createdAt: row.createdAt,
    };
  }

  // ========== Basic CRUD Operations ==========

  async findById(id: PermissionId): Promise<PermissionEntity | null> {
    const result = await this.db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]!);
  }

  async findByName(name: string): Promise<PermissionEntity | null> {
    const result = await this.db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.name, name.toLowerCase()));

    if (!result || result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]!);
  }

  async findByResource(resource: string): Promise<PermissionEntity[]> {
    const result = await this.db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.resource, resource.toLowerCase()));

    return result.map((row) => this.mapToEntity(row));
  }

  async findAll(): Promise<PermissionEntity[]> {
    const result = await this.db.select().from(permissionsTable);

    return result.map((row) => this.mapToEntity(row));
  }

  async findAllPaginated(
    page: number,
    limit: number
  ): Promise<PaginatedPermissions> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.db
      .select({ count: count() })
      .from(permissionsTable);
    const total = countResult[0]?.count ?? 0;

    // Get paginated permissions
    const result = await this.db
      .select()
      .from(permissionsTable)
      .limit(limit)
      .offset(offset);

    const permissions = result.map((row) => this.mapToEntity(row));
    const totalPages = Math.ceil(total / limit);

    return {
      permissions,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async save(permission: PermissionEntity): Promise<void> {
    await this.db
      .insert(permissionsTable)
      .values({
        id: permission.id.toValue(),
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        createdAt: permission.createdAt,
      })
      .onConflictDoNothing({ target: permissionsTable.name });
  }

  async update(permission: PermissionEntity): Promise<void> {
    await this.db
      .update(permissionsTable)
      .set({
        description: permission.description,
        // Note: name, resource, action are immutable after creation
      })
      .where(eq(permissionsTable.id, permission.id.toValue()));
  }

  async delete(id: PermissionId): Promise<void> {
    await this.db
      .delete(permissionsTable)
      .where(eq(permissionsTable.id, id.toValue()));
  }

  async existsByName(name: string): Promise<boolean> {
    const result = await this.db
      .select({ id: permissionsTable.id })
      .from(permissionsTable)
      .where(eq(permissionsTable.name, name.toLowerCase()))
      .limit(1);

    return result.length > 0;
  }

  // ========== User-Permission Operations ==========

  async findByUserId(userId: UserId): Promise<Permission[]> {
    const result = await this.db
      .select({
        name: permissionsTable.name,
      })
      .from(userPermissionsTable)
      .innerJoin(
        permissionsTable,
        eq(userPermissionsTable.permissionId, permissionsTable.id)
      )
      .where(eq(userPermissionsTable.userId, userId.toValue()));

    return result
      .map((row) => Permission.create(row.name))
      .filter((p) => p.isOk)
      .map((p) => p.getValue());
  }

  async assignToUser(
    permissionId: PermissionId,
    userId: UserId,
    assignedBy?: UserId
  ): Promise<void> {
    await this.db
      .insert(userPermissionsTable)
      .values({
        userId: userId.toValue(),
        permissionId: permissionId.toValue(),
        assignedAt: new Date(),
        assignedBy: assignedBy?.toValue() ?? null,
      })
      .onConflictDoNothing();
  }

  async removeFromUser(
    permissionId: PermissionId,
    userId: UserId
  ): Promise<void> {
    await this.db
      .delete(userPermissionsTable)
      .where(
        and(
          eq(userPermissionsTable.userId, userId.toValue()),
          eq(userPermissionsTable.permissionId, permissionId.toValue())
        )
      );
  }

  async userHasPermission(
    userId: UserId,
    permissionName: string
  ): Promise<boolean> {
    const result = await this.db
      .select()
      .from(userPermissionsTable)
      .innerJoin(
        permissionsTable,
        eq(userPermissionsTable.permissionId, permissionsTable.id)
      )
      .where(
        and(
          eq(userPermissionsTable.userId, userId.toValue()),
          eq(permissionsTable.name, permissionName.toLowerCase())
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async setUserPermissions(
    userId: UserId,
    permissionIds: PermissionId[],
    assignedBy?: UserId
  ): Promise<void> {
    // Use a transaction to ensure atomicity
    await this.db.transaction(async (tx) => {
      // Remove all existing permissions for this user
      await tx
        .delete(userPermissionsTable)
        .where(eq(userPermissionsTable.userId, userId.toValue()));

      // Insert new permissions if any
      if (permissionIds.length > 0) {
        const now = new Date();
        const values = permissionIds.map((permId) => ({
          userId: userId.toValue(),
          permissionId: permId.toValue(),
          assignedAt: now,
          assignedBy: assignedBy?.toValue() ?? null,
        }));

        await tx.insert(userPermissionsTable).values(values);
      }
    });
  }

  // ========== Role-Permission Queries ==========

  async findByRoleId(roleId: RoleId): Promise<Permission[]> {
    const result = await this.db
      .select({
        name: permissionsTable.name,
      })
      .from(rolePermissionsTable)
      .innerJoin(
        permissionsTable,
        eq(rolePermissionsTable.permissionId, permissionsTable.id)
      )
      .where(eq(rolePermissionsTable.roleId, roleId.toValue()));

    return result
      .map((row) => Permission.create(row.name))
      .filter((p) => p.isOk)
      .map((p) => p.getValue());
  }

  // ========== Bulk Operations ==========

  async findByIds(ids: PermissionId[]): Promise<PermissionEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    const idValues = ids.map((id) => id.toValue());
    const result = await this.db
      .select()
      .from(permissionsTable)
      .where(inArray(permissionsTable.id, idValues));

    return result.map((row) => this.mapToEntity(row));
  }

  async findByNames(names: string[]): Promise<PermissionEntity[]> {
    if (names.length === 0) {
      return [];
    }

    const normalizedNames = names.map((n) => n.toLowerCase());
    const result = await this.db
      .select()
      .from(permissionsTable)
      .where(inArray(permissionsTable.name, normalizedNames));

    return result.map((row) => this.mapToEntity(row));
  }
}
