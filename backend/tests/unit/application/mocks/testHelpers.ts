import { User } from '@auth/domain/entities/User.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { Role, SystemRoles } from '@auth/domain/value-objects/Role.ts';
import { PermissionId } from '@auth/domain/value-objects/PermissionId.ts';
import { RoleId } from '@auth/domain/value-objects/RoleId.ts';
import type { PermissionEntity } from '@auth/domain/repositories/IPermissionRepository.ts';
import type { RoleEntity } from '@auth/domain/repositories/IRoleRepository.ts';

/**
 * Create a test user with basic 'user' role
 */
export function createTestUser(emailStr = 'user@example.com'): User {
  const email = Email.create(emailStr).getValue();
  // Password.create expects a hashed password (minimum 20 chars)
  const password = Password.create('$2a$10$hashedpasswordvalue123456789').getValue();
  const role = Role.create(SystemRoles.USER).getValue();
  const fullName = 'Test User';
  const phone = '11999999999';
  return User.reconstruct(
    User.create(email, password, fullName, phone).getValue().getId(),
    email,
    password,
    fullName,
    phone,
    true, // isActive
    new Date(),
    [role]
  );
}

/**
 * Create a test user with admin role
 */
export function createTestAdmin(emailStr = 'admin@example.com'): User {
  const email = Email.create(emailStr).getValue();
  // Password.create expects a hashed password (minimum 20 chars)
  const password = Password.create('$2a$10$hashedpasswordvalue123456789').getValue();
  const adminRole = Role.create(SystemRoles.ADMIN).getValue();
  const fullName = 'Test Admin';
  const phone = '11999998888';
  return User.reconstruct(
    User.create(email, password, fullName, phone).getValue().getId(),
    email,
    password,
    fullName,
    phone,
    true, // isActive
    new Date(),
    [adminRole]
  );
}

/**
 * Create a test permission entity
 */
export function createTestPermission(
  name: string,
  description: string | null = null
): PermissionEntity {
  const [resource, action] = name.split(':');
  return {
    id: PermissionId.create(),
    name,
    resource: resource!,
    action: action!,
    description,
    createdAt: new Date(),
  };
}

/**
 * Create a test role entity
 */
export function createTestRole(
  name: string,
  description: string | null = null,
  isSystem = false
): RoleEntity {
  return {
    id: RoleId.create(),
    name,
    description,
    isSystem,
    createdAt: new Date(),
    updatedAt: null,
  };
}
