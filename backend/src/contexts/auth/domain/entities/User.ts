import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UserId } from '../value-objects/UserId.ts';
import { Email } from '../value-objects/Email.ts';
import { Password } from '../value-objects/Password.ts';
import { Role, SystemRoles } from '../value-objects/Role.ts';
import { Permission } from '../value-objects/Permission.ts';
import { UserCreated } from '../events/UserCreated.ts';
import { RoleAssigned } from '../events/RoleAssigned.ts';
import { RoleRemoved } from '../events/RoleRemoved.ts';
import { PermissionAssignedToUser } from '../events/PermissionAssignedToUser.ts';
import { PermissionRemovedFromUser } from '../events/PermissionRemovedFromUser.ts';

/**
 * User Aggregate Root
 * Represents a user in the system
 * Contains business logic for user operations
 *
 * Users can have:
 * - Roles: Groups of permissions (inherited from role)
 * - Individual Permissions: Extra permissions assigned directly to the user
 *
 * Effective permissions = role permissions + individual permissions
 */
export class User extends Entity<UserId> {
  private constructor(
    id: UserId,
    private email: Email,
    private password: Password,
    private fullName: string,
    private phone: string,
    private _isActive: boolean,
    private createdAt: Date,
    private roles: Role[] = [],
    private individualPermissions: Permission[] = [],
    private photoUrl: string | null = null
  ) {
    super(id);
  }

  /**
   * Create a new user
   * Emits UserCreated domain event
   * New users are assigned the 'user' role by default
   */
  public static create(
    email: Email,
    password: Password,
    fullName: string,
    phone: string,
    roles?: Role[],
    isActive: boolean = true,
    photoUrl: string | null = null
  ): Result<User> {
    const userId = UserId.create();
    // Default role is 'user' if no roles specified
    const userRoles = roles && roles.length > 0 ? roles : [Role.user()];
    const user = new User(userId, email, password, fullName, phone, isActive, new Date(), userRoles, [], photoUrl);

    // Emit domain event
    user.addDomainEvent(new UserCreated(userId, email));

    return Result.ok(user);
  }

  /**
   * Reconstruct a user from persistence
   * Does not emit domain events (already persisted)
   */
  public static reconstruct(
    id: UserId,
    email: Email,
    password: Password,
    fullName: string,
    phone: string,
    isActive: boolean,
    createdAt: Date,
    roles: Role[] = [],
    individualPermissions: Permission[] = [],
    photoUrl: string | null = null
  ): User {
    return new User(id, email, password, fullName, phone, isActive, createdAt, roles, individualPermissions, photoUrl);
  }

  /**
   * Get the user's email
   */
  public getEmail(): Email {
    return this.email;
  }

  /**
   * Get the user's password hash
   */
  public getPassword(): Password {
    return this.password;
  }

  /**
   * Get creation timestamp
   */
  public getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Get the user's full name
   */
  public getFullName(): string {
    return this.fullName;
  }

  /**
   * Get the user's phone
   */
  public getPhone(): string {
    return this.phone;
  }

  /**
   * Get the user's photo URL
   */
  public getPhotoUrl(): string | null {
    return this.photoUrl;
  }

  /**
   * Update the user's profile information
   */
  public updateProfile(fullName: string, phone?: string, photoUrl?: string): void {
    this.fullName = fullName;
    if (phone !== undefined) {
      this.phone = phone;
    }
    if (photoUrl !== undefined) {
      this.photoUrl = photoUrl;
    }
  }

  /**
   * Update the user's photo URL
   */
  public updatePhotoUrl(photoUrl: string | null): void {
    this.photoUrl = photoUrl;
  }

  /**
   * Check if user account is active
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * Deactivate the user account (soft delete)
   * Note: Business rule to prevent self-deactivation should be enforced at handler level
   */
  public deactivate(): void {
    this._isActive = false;
  }

  /**
   * Activate the user account
   */
  public activate(): void {
    this._isActive = true;
  }

  /**
   * Verify a password against the stored hash
   * This method should be called from application layer with a password hasher
   */
  public hasPasswordHash(hash: string): boolean {
    return this.password.getHash() === hash;
  }

  /**
   * Update the user's email
   * Called from admin operations
   */
  public updateEmail(email: Email): void {
    this.email = email;
  }

  /**
   * Update the user's password
   * Called from admin password reset or user password change
   */
  public updatePassword(password: Password): void {
    this.password = password;
  }

  // ========== Role Management Methods ==========

  /**
   * Get all roles assigned to this user
   * Returns a copy to prevent external modification
   */
  public getRoles(): Role[] {
    return [...this.roles];
  }

  /**
   * Get role names as an array of strings
   * Useful for JWT payload and API responses
   */
  public getRoleNames(): string[] {
    return this.roles.map((r) => r.getValue());
  }

  /**
   * Check if user has a specific role
   */
  public hasRole(role: Role | string): boolean {
    const roleName = typeof role === 'string' ? role : role.getValue();
    return this.roles.some((r) => r.getValue() === roleName);
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasAnyRole(roles: (Role | string)[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  public hasAllRoles(roles: (Role | string)[]): boolean {
    return roles.every((role) => this.hasRole(role));
  }

  /**
   * Check if user is an admin
   */
  public isAdmin(): boolean {
    return this.hasRole(SystemRoles.ADMIN);
  }

  /**
   * Assign a role to this user
   * Emits RoleAssigned domain event
   */
  public assignRole(role: Role, assignedBy?: UserId): Result<void> {
    if (this.hasRole(role)) {
      return Result.fail(ErrorCode.USER_ALREADY_HAS_ROLE);
    }

    this.roles.push(role);
    this.addDomainEvent(new RoleAssigned(this.id, role, assignedBy));
    return Result.ok<void>(undefined);
  }

  /**
   * Remove a role from this user
   * Emits RoleRemoved domain event
   * Cannot remove the last role - user must have at least one role
   */
  public removeRole(role: Role, removedBy?: UserId): Result<void> {
    const index = this.roles.findIndex((r) => r.getValue() === role.getValue());

    if (index === -1) {
      return Result.fail(ErrorCode.USER_DOES_NOT_HAVE_ROLE);
    }

    // Prevent removing the last role
    if (this.roles.length === 1) {
      return Result.fail(ErrorCode.ROLE_CANNOT_REMOVE_LAST);
    }

    this.roles.splice(index, 1);
    this.addDomainEvent(new RoleRemoved(this.id, role, removedBy));
    return Result.ok<void>(undefined);
  }

  // ========== Individual Permission Management Methods ==========

  /**
   * Get all individual permissions assigned directly to this user
   * These are extra permissions beyond what roles provide
   * Returns a copy to prevent external modification
   */
  public getIndividualPermissions(): Permission[] {
    return [...this.individualPermissions];
  }

  /**
   * Get individual permission names as an array of strings
   * Useful for API responses
   */
  public getIndividualPermissionNames(): string[] {
    return this.individualPermissions.map((p) => p.getValue());
  }

  /**
   * Check if user has a specific individual permission
   * Note: This only checks individual permissions, not role permissions
   */
  public hasIndividualPermission(permission: Permission | string): boolean {
    const permName = typeof permission === 'string' ? permission : permission.getValue();
    return this.individualPermissions.some((p) => p.getValue() === permName);
  }

  /**
   * Check if user has a specific individual permission (with wildcard support)
   * Returns true if user has a permission that grants the requested permission
   */
  public hasIndividualPermissionGrant(permission: Permission): boolean {
    return this.individualPermissions.some((p) => p.grants(permission));
  }

  /**
   * Assign an individual permission to this user
   * Emits PermissionAssignedToUser domain event
   */
  public assignPermission(permission: Permission, assignedBy?: UserId): Result<void> {
    if (this.hasIndividualPermission(permission)) {
      return Result.fail(ErrorCode.USER_ALREADY_HAS_PERMISSION);
    }

    this.individualPermissions.push(permission);
    this.addDomainEvent(new PermissionAssignedToUser(this.id, permission, assignedBy));
    return Result.ok<void>(undefined);
  }

  /**
   * Remove an individual permission from this user
   * Emits PermissionRemovedFromUser domain event
   */
  public removePermission(permission: Permission, removedBy?: UserId): Result<void> {
    const index = this.individualPermissions.findIndex(
      (p) => p.getValue() === permission.getValue()
    );

    if (index === -1) {
      return Result.fail(ErrorCode.USER_DOES_NOT_HAVE_PERMISSION);
    }

    this.individualPermissions.splice(index, 1);
    this.addDomainEvent(new PermissionRemovedFromUser(this.id, permission, removedBy));
    return Result.ok<void>(undefined);
  }

  /**
   * Replace all individual permissions with a new set
   * Does not emit individual events - use for bulk operations
   */
  public setIndividualPermissions(permissions: Permission[]): void {
    this.individualPermissions = [...permissions];
  }
}
