import { eq, and, count, inArray } from 'drizzle-orm';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import type {
  DrizzleDatabase,
  IDatabaseProvider,
} from '@shared/infrastructure/database/types.ts';
import type {
  IRoleRepository,
  RoleEntity,
  PaginatedRoles,
} from '../../../domain/repositories/IRoleRepository.ts';
import { RoleId } from '../../../domain/value-objects/RoleId.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { Role } from '../../../domain/value-objects/Role.ts';
import { Permission } from '../../../domain/value-objects/Permission.ts';
import { PermissionId } from '../../../domain/value-objects/PermissionId.ts';
import {
  rolesTable,
  userRolesTable,
  rolePermissionsTable,
  permissionsTable,
} from './schema.ts';

/**
 * DrizzleRoleRepository
 * Implements IRoleRepository using Drizzle ORM with PostgreSQL
 * Handles all database operations for roles, user-role assignments, and role-permission management
 */
export class DrizzleRoleRepository implements IRoleRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  /**
   * Maps a database row to a RoleEntity
   */
  private mapToEntity(row: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date | null;
  }): RoleEntity {
    return {
      id: RoleId.create(row.id),
      name: row.name,
      description: row.description,
      isSystem: row.isSystem,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // ========== Basic CRUD Operations ==========

  async findById(id: RoleId): Promise<RoleEntity | null> {
    const result = await this.db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]!);
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    const result = await this.db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.name, name.toLowerCase()));

    if (!result || result.length === 0) {
      return null;
    }

    return this.mapToEntity(result[0]!);
  }

  async findAll(): Promise<RoleEntity[]> {
    const result = await this.db.select().from(rolesTable);

    return result.map((row) => this.mapToEntity(row));
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedRoles> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.db
      .select({ count: count() })
      .from(rolesTable);
    const total = countResult[0]?.count ?? 0;

    // Get paginated roles
    const result = await this.db
      .select()
      .from(rolesTable)
      .limit(limit)
      .offset(offset);

    const roles = result.map((row) => this.mapToEntity(row));
    const totalPages = Math.ceil(total / limit);

    return {
      roles,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async save(role: RoleEntity): Promise<void> {
    await this.db
      .insert(rolesTable)
      .values({
        id: role.id.toValue(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })
      .onConflictDoNothing({ target: rolesTable.name });
  }

  async update(role: RoleEntity): Promise<void> {
    await this.db
      .update(rolesTable)
      .set({
        name: role.name,
        description: role.description,
        updatedAt: new Date(),
      })
      .where(eq(rolesTable.id, role.id.toValue()));
  }

  async delete(id: RoleId): Promise<void> {
    // Check if it's a system role before deletion
    const role = await this.findById(id);
    if (role?.isSystem) {
      throw new Error(ErrorCode.ROLE_CANNOT_DELETE_SYSTEM);
    }

    await this.db.delete(rolesTable).where(eq(rolesTable.id, id.toValue()));
  }

  async existsByName(name: string): Promise<boolean> {
    const result = await this.db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, name.toLowerCase()))
      .limit(1);

    return result.length > 0;
  }

  // ========== User-Role Operations ==========

  async findByUserId(userId: UserId): Promise<Role[]> {
    const result = await this.db
      .select({ name: rolesTable.name })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, userId.toValue()));

    return result
      .map((row) => Role.create(row.name))
      .filter((r) => r.isOk)
      .map((r) => r.getValue());
  }

  async assignRoleToUser(
    userId: UserId,
    roleId: RoleId,
    assignedBy?: UserId
  ): Promise<void> {
    await this.db
      .insert(userRolesTable)
      .values({
        userId: userId.toValue(),
        roleId: roleId.toValue(),
        assignedAt: new Date(),
        assignedBy: assignedBy?.toValue() ?? null,
      })
      .onConflictDoNothing();
  }

  async removeRoleFromUser(userId: UserId, roleId: RoleId): Promise<void> {
    await this.db
      .delete(userRolesTable)
      .where(
        and(
          eq(userRolesTable.userId, userId.toValue()),
          eq(userRolesTable.roleId, roleId.toValue())
        )
      );
  }

  async userHasRole(userId: UserId, roleName: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(
        and(
          eq(userRolesTable.userId, userId.toValue()),
          eq(rolesTable.name, roleName.toLowerCase())
        )
      );

    return result && result.length > 0;
  }

  // ========== Role-Permission Operations ==========

  async findPermissionsByRoleId(roleId: RoleId): Promise<Permission[]> {
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

  async assignPermissionToRole(
    roleId: RoleId,
    permissionId: PermissionId,
    assignedBy?: UserId
  ): Promise<void> {
    await this.db
      .insert(rolePermissionsTable)
      .values({
        roleId: roleId.toValue(),
        permissionId: permissionId.toValue(),
        assignedAt: new Date(),
        assignedBy: assignedBy?.toValue() ?? null,
      })
      .onConflictDoNothing();
  }

  async removePermissionFromRole(
    roleId: RoleId,
    permissionId: PermissionId
  ): Promise<void> {
    await this.db
      .delete(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.roleId, roleId.toValue()),
          eq(rolePermissionsTable.permissionId, permissionId.toValue())
        )
      );
  }

  async roleHasPermission(
    roleId: RoleId,
    permissionName: string
  ): Promise<boolean> {
    const result = await this.db
      .select()
      .from(rolePermissionsTable)
      .innerJoin(
        permissionsTable,
        eq(rolePermissionsTable.permissionId, permissionsTable.id)
      )
      .where(
        and(
          eq(rolePermissionsTable.roleId, roleId.toValue()),
          eq(permissionsTable.name, permissionName.toLowerCase())
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async setRolePermissions(
    roleId: RoleId,
    permissionIds: PermissionId[],
    assignedBy?: UserId
  ): Promise<void> {
    // Use a transaction to ensure atomicity
    await this.db.transaction(async (tx) => {
      // Remove all existing permissions for this role
      await tx
        .delete(rolePermissionsTable)
        .where(eq(rolePermissionsTable.roleId, roleId.toValue()));

      // Insert new permissions if any
      if (permissionIds.length > 0) {
        const now = new Date();
        const values = permissionIds.map((permId) => ({
          roleId: roleId.toValue(),
          permissionId: permId.toValue(),
          assignedAt: now,
          assignedBy: assignedBy?.toValue() ?? null,
        }));

        await tx.insert(rolePermissionsTable).values(values);
      }
    });
  }
}
