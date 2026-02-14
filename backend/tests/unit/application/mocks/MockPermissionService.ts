import type { IPermissionService } from '@auth/domain/services/IPermissionService.ts';
import type { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Permission } from '@auth/domain/value-objects/Permission.ts';

/**
 * Mock PermissionService for testing handlers
 * Allows full control over permission checking behavior
 */
export class MockPermissionService implements IPermissionService {
  private userPermissions: Map<string, string[]> = new Map(); // userId -> permission names
  private invalidatedUsers: Set<string> = new Set();
  private _shouldThrowOnCheck = false;

  async getEffectivePermissions(userId: UserId): Promise<Permission[]> {
    const permNames = this.userPermissions.get(userId.toValue()) ?? [];
    const permissions: Permission[] = [];

    for (const name of permNames) {
      const result = Permission.create(name);
      if (result.isOk) {
        permissions.push(result.getValue());
      }
    }

    return permissions;
  }

  async getEffectivePermissionNames(userId: UserId): Promise<string[]> {
    return this.userPermissions.get(userId.toValue()) ?? [];
  }

  async userHasPermission(userId: UserId, permission: string): Promise<boolean> {
    if (this._shouldThrowOnCheck) {
      throw new Error('Permission service error');
    }

    const userPerms = this.userPermissions.get(userId.toValue()) ?? [];

    // Check exact match
    if (userPerms.includes(permission)) {
      return true;
    }

    // Check wildcard patterns
    for (const perm of userPerms) {
      if (perm.endsWith(':*')) {
        const resource = perm.slice(0, -2);
        if (permission.startsWith(resource + ':')) {
          return true;
        }
      }
      if (perm === '*') {
        return true;
      }
    }

    return false;
  }

  async userHasAnyPermission(userId: UserId, permissions: string[]): Promise<boolean> {
    for (const perm of permissions) {
      if (await this.userHasPermission(userId, perm)) {
        return true;
      }
    }
    return false;
  }

  async userHasAllPermissions(userId: UserId, permissions: string[]): Promise<boolean> {
    for (const perm of permissions) {
      if (!(await this.userHasPermission(userId, perm))) {
        return false;
      }
    }
    return true;
  }

  async invalidateUserPermissions(userId: UserId): Promise<void> {
    this.invalidatedUsers.add(userId.toValue());
  }

  // ========== Test Helpers ==========

  setUserPermissions(userId: string, permissions: string[]): void {
    this.userPermissions.set(userId, permissions);
  }

  addUserPermission(userId: string, permission: string): void {
    const existing = this.userPermissions.get(userId) ?? [];
    if (!existing.includes(permission)) {
      existing.push(permission);
      this.userPermissions.set(userId, existing);
    }
  }

  removeUserPermission(userId: string, permission: string): void {
    const existing = this.userPermissions.get(userId) ?? [];
    const index = existing.indexOf(permission);
    if (index > -1) {
      existing.splice(index, 1);
      this.userPermissions.set(userId, existing);
    }
  }

  wasInvalidated(userId: string): boolean {
    return this.invalidatedUsers.has(userId);
  }

  clear(): void {
    this.userPermissions.clear();
    this.invalidatedUsers.clear();
  }

  simulateError(shouldThrow: boolean): void {
    this._shouldThrowOnCheck = shouldThrow;
  }
}
