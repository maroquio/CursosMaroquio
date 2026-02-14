import type {
  IPermissionRepository,
  PermissionEntity,
  PaginatedPermissions,
} from '@auth/domain/repositories/IPermissionRepository.ts';
import { Permission } from '@auth/domain/value-objects/Permission.ts';
import type { PermissionId } from '@auth/domain/value-objects/PermissionId.ts';
import type { UserId } from '@auth/domain/value-objects/UserId.ts';
import type { RoleId } from '@auth/domain/value-objects/RoleId.ts';

/**
 * Mock PermissionRepository for testing handlers
 * Simulates database operations with in-memory storage
 */
export class MockPermissionRepository implements IPermissionRepository {
  private permissions: Map<string, PermissionEntity> = new Map();
  private userPermissions: Map<string, Set<string>> = new Map(); // userId -> Set<permissionId>
  private rolePermissions: Map<string, Set<string>> = new Map(); // roleId -> Set<permissionId>

  private _shouldThrowOnSave = false;

  // ========== Basic CRUD ==========

  async findById(id: PermissionId): Promise<PermissionEntity | null> {
    return this.permissions.get(id.toValue()) ?? null;
  }

  async findByName(name: string): Promise<PermissionEntity | null> {
    for (const perm of this.permissions.values()) {
      if (perm.name === name) {
        return perm;
      }
    }
    return null;
  }

  async findByResource(resource: string): Promise<PermissionEntity[]> {
    return Array.from(this.permissions.values()).filter(
      (p) => p.resource === resource
    );
  }

  async findAll(): Promise<PermissionEntity[]> {
    return Array.from(this.permissions.values());
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedPermissions> {
    const all = Array.from(this.permissions.values());
    const offset = (page - 1) * limit;
    const paginatedPermissions = all.slice(offset, offset + limit);

    return {
      permissions: paginatedPermissions,
      total: all.length,
      page,
      limit,
      totalPages: Math.ceil(all.length / limit),
    };
  }

  async save(permission: PermissionEntity): Promise<void> {
    if (this._shouldThrowOnSave) {
      throw new Error('Database error');
    }
    this.permissions.set(permission.id.toValue(), permission);
  }

  async update(permission: PermissionEntity): Promise<void> {
    this.permissions.set(permission.id.toValue(), permission);
  }

  async delete(id: PermissionId): Promise<void> {
    this.permissions.delete(id.toValue());
  }

  async existsByName(name: string): Promise<boolean> {
    for (const perm of this.permissions.values()) {
      if (perm.name === name) {
        return true;
      }
    }
    return false;
  }

  // ========== User-Permission Operations ==========

  async findByUserId(userId: UserId): Promise<Permission[]> {
    const userPermIds = this.userPermissions.get(userId.toValue());
    if (!userPermIds) return [];

    const perms: Permission[] = [];
    for (const permId of userPermIds) {
      const entity = this.permissions.get(permId);
      if (entity) {
        const result = Permission.create(entity.name);
        if (result.isOk) {
          perms.push(result.getValue());
        }
      }
    }
    return perms;
  }

  async assignToUser(
    permissionId: PermissionId,
    userId: UserId,
    _assignedBy?: UserId
  ): Promise<void> {
    const userIdStr = userId.toValue();
    if (!this.userPermissions.has(userIdStr)) {
      this.userPermissions.set(userIdStr, new Set());
    }
    this.userPermissions.get(userIdStr)!.add(permissionId.toValue());
  }

  async removeFromUser(permissionId: PermissionId, userId: UserId): Promise<void> {
    const userPerms = this.userPermissions.get(userId.toValue());
    if (userPerms) {
      userPerms.delete(permissionId.toValue());
    }
  }

  async userHasPermission(userId: UserId, permissionName: string): Promise<boolean> {
    const userPermIds = this.userPermissions.get(userId.toValue());
    if (!userPermIds) return false;

    for (const permId of userPermIds) {
      const perm = this.permissions.get(permId);
      if (perm?.name === permissionName) {
        return true;
      }
    }
    return false;
  }

  async setUserPermissions(
    userId: UserId,
    permissionIds: PermissionId[],
    _assignedBy?: UserId
  ): Promise<void> {
    this.userPermissions.set(
      userId.toValue(),
      new Set(permissionIds.map((id) => id.toValue()))
    );
  }

  // ========== Role-Permission Queries ==========

  async findByRoleId(roleId: RoleId): Promise<Permission[]> {
    const rolePermIds = this.rolePermissions.get(roleId.toValue());
    if (!rolePermIds) return [];

    const perms: Permission[] = [];
    for (const permId of rolePermIds) {
      const entity = this.permissions.get(permId);
      if (entity) {
        const result = Permission.create(entity.name);
        if (result.isOk) {
          perms.push(result.getValue());
        }
      }
    }
    return perms;
  }

  // ========== Bulk Operations ==========

  async findByIds(ids: PermissionId[]): Promise<PermissionEntity[]> {
    return ids
      .map((id) => this.permissions.get(id.toValue()))
      .filter((p): p is PermissionEntity => p !== undefined);
  }

  async findByNames(names: string[]): Promise<PermissionEntity[]> {
    return Array.from(this.permissions.values()).filter((p) =>
      names.includes(p.name)
    );
  }

  // ========== Test Helpers ==========

  clear(): void {
    this.permissions.clear();
    this.userPermissions.clear();
    this.rolePermissions.clear();
  }

  addPermission(permission: PermissionEntity): void {
    this.permissions.set(permission.id.toValue(), permission);
  }

  setRolePermissions(roleId: string, permissionIds: string[]): void {
    this.rolePermissions.set(roleId, new Set(permissionIds));
  }

  getAll(): PermissionEntity[] {
    return Array.from(this.permissions.values());
  }

  simulateSaveError(shouldThrow: boolean): void {
    this._shouldThrowOnSave = shouldThrow;
  }
}
