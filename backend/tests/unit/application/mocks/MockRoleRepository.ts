import type {
  IRoleRepository,
  RoleEntity,
  PaginatedRoles,
} from '@auth/domain/repositories/IRoleRepository.ts';
import { Role } from '@auth/domain/value-objects/Role.ts';
import { Permission } from '@auth/domain/value-objects/Permission.ts';
import type { RoleId } from '@auth/domain/value-objects/RoleId.ts';
import type { UserId } from '@auth/domain/value-objects/UserId.ts';
import type { PermissionId } from '@auth/domain/value-objects/PermissionId.ts';

/**
 * Mock RoleRepository for testing handlers
 * Simulates database operations with in-memory storage
 */
export class MockRoleRepository implements IRoleRepository {
  private roles: Map<string, RoleEntity> = new Map();
  private userRoles: Map<string, Set<string>> = new Map(); // userId -> Set<roleId>
  private rolePermissions: Map<string, Set<string>> = new Map(); // roleId -> Set<permissionName>

  private _shouldThrowOnSave = false;

  // ========== Basic CRUD ==========

  async findById(id: RoleId): Promise<RoleEntity | null> {
    return this.roles.get(id.toValue()) ?? null;
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    for (const role of this.roles.values()) {
      if (role.name === name) {
        return role;
      }
    }
    return null;
  }

  async findAll(): Promise<RoleEntity[]> {
    return Array.from(this.roles.values());
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedRoles> {
    const all = Array.from(this.roles.values());
    const offset = (page - 1) * limit;
    const paginatedRoles = all.slice(offset, offset + limit);

    return {
      roles: paginatedRoles,
      total: all.length,
      page,
      limit,
      totalPages: Math.ceil(all.length / limit),
    };
  }

  async findByUserId(userId: UserId): Promise<Role[]> {
    const userRoleIds = this.userRoles.get(userId.toValue());
    if (!userRoleIds) return [];

    const roles: Role[] = [];
    for (const roleId of userRoleIds) {
      const entity = this.roles.get(roleId);
      if (entity) {
        const result = Role.create(entity.name);
        if (result.isOk) {
          roles.push(result.getValue());
        }
      }
    }
    return roles;
  }

  async assignRoleToUser(
    userId: UserId,
    roleId: RoleId,
    _assignedBy?: UserId
  ): Promise<void> {
    const userIdStr = userId.toValue();
    if (!this.userRoles.has(userIdStr)) {
      this.userRoles.set(userIdStr, new Set());
    }
    this.userRoles.get(userIdStr)!.add(roleId.toValue());
  }

  async removeRoleFromUser(userId: UserId, roleId: RoleId): Promise<void> {
    const userRoles = this.userRoles.get(userId.toValue());
    if (userRoles) {
      userRoles.delete(roleId.toValue());
    }
  }

  async userHasRole(userId: UserId, roleName: string): Promise<boolean> {
    const userRoleIds = this.userRoles.get(userId.toValue());
    if (!userRoleIds) return false;

    for (const roleId of userRoleIds) {
      const role = this.roles.get(roleId);
      if (role?.name === roleName) {
        return true;
      }
    }
    return false;
  }

  async save(role: RoleEntity): Promise<void> {
    if (this._shouldThrowOnSave) {
      throw new Error('Database error');
    }
    this.roles.set(role.id.toValue(), role);
  }

  async update(role: RoleEntity): Promise<void> {
    this.roles.set(role.id.toValue(), role);
  }

  async delete(id: RoleId): Promise<void> {
    this.roles.delete(id.toValue());
  }

  async existsByName(name: string): Promise<boolean> {
    for (const role of this.roles.values()) {
      if (role.name === name) {
        return true;
      }
    }
    return false;
  }

  // ========== Role-Permission Management ==========

  async findPermissionsByRoleId(roleId: RoleId): Promise<Permission[]> {
    const permNames = this.rolePermissions.get(roleId.toValue());
    if (!permNames) return [];

    const perms: Permission[] = [];
    for (const name of permNames) {
      const result = Permission.create(name);
      if (result.isOk) {
        perms.push(result.getValue());
      }
    }
    return perms;
  }

  async assignPermissionToRole(
    roleId: RoleId,
    permissionId: PermissionId,
    _assignedBy?: UserId
  ): Promise<void> {
    const roleIdStr = roleId.toValue();
    if (!this.rolePermissions.has(roleIdStr)) {
      this.rolePermissions.set(roleIdStr, new Set());
    }
    // Note: In real implementation this stores permissionId, but mock stores name for simplicity
    this.rolePermissions.get(roleIdStr)!.add(permissionId.toValue());
  }

  async removePermissionFromRole(roleId: RoleId, permissionId: PermissionId): Promise<void> {
    const rolePerms = this.rolePermissions.get(roleId.toValue());
    if (rolePerms) {
      rolePerms.delete(permissionId.toValue());
    }
  }

  async roleHasPermission(roleId: RoleId, permissionName: string): Promise<boolean> {
    const rolePerms = this.rolePermissions.get(roleId.toValue());
    if (!rolePerms) return false;
    return rolePerms.has(permissionName);
  }

  async setRolePermissions(
    roleId: RoleId,
    permissionIds: PermissionId[],
    _assignedBy?: UserId
  ): Promise<void> {
    this.rolePermissions.set(
      roleId.toValue(),
      new Set(permissionIds.map((id) => id.toValue()))
    );
  }

  // ========== Test Helpers ==========

  clear(): void {
    this.roles.clear();
    this.userRoles.clear();
    this.rolePermissions.clear();
  }

  addRole(role: RoleEntity): void {
    this.roles.set(role.id.toValue(), role);
  }

  setUserRoles(userId: string, roleIds: string[]): void {
    this.userRoles.set(userId, new Set(roleIds));
  }

  setPermissionsForRole(roleId: string, permissionNames: string[]): void {
    this.rolePermissions.set(roleId, new Set(permissionNames));
  }

  getAll(): RoleEntity[] {
    return Array.from(this.roles.values());
  }

  simulateSaveError(shouldThrow: boolean): void {
    this._shouldThrowOnSave = shouldThrow;
  }
}
