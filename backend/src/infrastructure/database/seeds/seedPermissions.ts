import { eq, and } from 'drizzle-orm';
import { getDatabase } from '../connection.ts';
import {
  permissionsTable,
  rolesTable,
  rolePermissionsTable,
} from '@auth/infrastructure/persistence/drizzle/schema.ts';
import { PermissionId } from '@auth/domain/value-objects/PermissionId.ts';
import { SystemRoles } from '@auth/domain/value-objects/Role.ts';
import { env } from '@shared/config/env.ts';

/**
 * Permission definition for seeding
 */
interface PermissionSeed {
  name: string;
  resource: string;
  action: string;
  description: string;
}

/**
 * Initial permissions to seed
 * These are the default permissions available in the system
 *
 * Format: resource:action
 * - Resource: The entity being accessed (users, roles, permissions, etc.)
 * - Action: The operation (create, read, update, delete, or custom actions)
 *
 * Special wildcards:
 * - *:* grants access to everything (super admin)
 * - resource:* grants all actions on a resource
 */
const INITIAL_PERMISSIONS: PermissionSeed[] = [
  // ========== User Management ==========
  {
    name: 'users:create',
    resource: 'users',
    action: 'create',
    description: 'Create new users',
  },
  {
    name: 'users:read',
    resource: 'users',
    action: 'read',
    description: 'View user information',
  },
  {
    name: 'users:update',
    resource: 'users',
    action: 'update',
    description: 'Update user information',
  },
  {
    name: 'users:delete',
    resource: 'users',
    action: 'delete',
    description: 'Delete users',
  },
  {
    name: 'users:list',
    resource: 'users',
    action: 'list',
    description: 'List all users',
  },

  // ========== Role Management ==========
  {
    name: 'roles:create',
    resource: 'roles',
    action: 'create',
    description: 'Create new roles',
  },
  {
    name: 'roles:read',
    resource: 'roles',
    action: 'read',
    description: 'View role information',
  },
  {
    name: 'roles:update',
    resource: 'roles',
    action: 'update',
    description: 'Update role information',
  },
  {
    name: 'roles:delete',
    resource: 'roles',
    action: 'delete',
    description: 'Delete roles',
  },
  {
    name: 'roles:list',
    resource: 'roles',
    action: 'list',
    description: 'List all roles',
  },
  {
    name: 'roles:assign',
    resource: 'roles',
    action: 'assign',
    description: 'Assign roles to users',
  },
  {
    name: 'roles:remove',
    resource: 'roles',
    action: 'remove',
    description: 'Remove roles from users',
  },

  // ========== Permission Management ==========
  {
    name: 'permissions:create',
    resource: 'permissions',
    action: 'create',
    description: 'Create new permissions',
  },
  {
    name: 'permissions:read',
    resource: 'permissions',
    action: 'read',
    description: 'View permission information',
  },
  {
    name: 'permissions:update',
    resource: 'permissions',
    action: 'update',
    description: 'Update permission information',
  },
  {
    name: 'permissions:delete',
    resource: 'permissions',
    action: 'delete',
    description: 'Delete permissions',
  },
  {
    name: 'permissions:list',
    resource: 'permissions',
    action: 'list',
    description: 'List all permissions',
  },
  {
    name: 'permissions:assign',
    resource: 'permissions',
    action: 'assign',
    description: 'Assign permissions to roles or users',
  },
  {
    name: 'permissions:remove',
    resource: 'permissions',
    action: 'remove',
    description: 'Remove permissions from roles or users',
  },

  // ========== Admin Wildcard ==========
  {
    name: 'admin:*',
    resource: 'admin',
    action: '*',
    description: 'Full administrative access (wildcard)',
  },

  // ========== Course Management ==========
  {
    name: 'courses:create',
    resource: 'courses',
    action: 'create',
    description: 'Create new courses',
  },
  {
    name: 'courses:read',
    resource: 'courses',
    action: 'read',
    description: 'View course information',
  },
  {
    name: 'courses:update',
    resource: 'courses',
    action: 'update',
    description: 'Update course information',
  },
  {
    name: 'courses:delete',
    resource: 'courses',
    action: 'delete',
    description: 'Delete courses',
  },
  {
    name: 'courses:list',
    resource: 'courses',
    action: 'list',
    description: 'List all courses (including unpublished)',
  },
  {
    name: 'courses:publish',
    resource: 'courses',
    action: 'publish',
    description: 'Publish or unpublish courses',
  },
  {
    name: 'courses:*',
    resource: 'courses',
    action: '*',
    description: 'Full course management access',
  },

  // ========== Lesson Management ==========
  {
    name: 'lessons:create',
    resource: 'lessons',
    action: 'create',
    description: 'Add lessons to courses',
  },
  {
    name: 'lessons:read',
    resource: 'lessons',
    action: 'read',
    description: 'View lesson information',
  },
  {
    name: 'lessons:update',
    resource: 'lessons',
    action: 'update',
    description: 'Update lesson information',
  },
  {
    name: 'lessons:delete',
    resource: 'lessons',
    action: 'delete',
    description: 'Delete lessons from courses',
  },

  // ========== AI Management ==========
  {
    name: 'ai:*',
    resource: 'ai',
    action: '*',
    description: 'Full AI management access (LLM manufacturers, models, exercise verification)',
  },

  // ========== Enrollment Management ==========
  {
    name: 'enrollments:create',
    resource: 'enrollments',
    action: 'create',
    description: 'Enroll in courses',
  },
  {
    name: 'enrollments:read',
    resource: 'enrollments',
    action: 'read',
    description: 'View enrollment information',
  },
  {
    name: 'enrollments:cancel',
    resource: 'enrollments',
    action: 'cancel',
    description: 'Cancel enrollments',
  },
  {
    name: 'enrollments:list',
    resource: 'enrollments',
    action: 'list',
    description: 'List all enrollments (admin)',
  },
];

/**
 * Permissions to assign to the admin role by default
 * The admin role gets all permissions automatically
 */
const ADMIN_PERMISSIONS = INITIAL_PERMISSIONS.map((p) => p.name);

/**
 * Permissions to assign to the user role by default
 * Regular users can read their profile and enroll in courses
 */
const USER_PERMISSIONS = ['users:read', 'enrollments:create', 'enrollments:read'];

/**
 * Seed initial permissions into the database
 * This function is idempotent - it will only create permissions that don't exist
 *
 * @returns Promise<void>
 */
export async function seedPermissions(): Promise<void> {
  const db = getDatabase();
  const now = new Date();

  // Create permissions
  for (const permission of INITIAL_PERMISSIONS) {
    // Check if permission already exists
    const existing = await db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.name, permission.name))
      .limit(1);

    if (existing.length === 0) {
      // Create new permission with UUID v7
      await db.insert(permissionsTable).values({
        id: PermissionId.create().toValue(),
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        createdAt: now,
      });

      if (env.NODE_ENV !== 'test') {
        console.log(`  ✓ Created permission: ${permission.name}`);
      }
    } else if (env.NODE_ENV !== 'test') {
      console.log(`  → Permission already exists: ${permission.name}`);
    }
  }

  // Assign permissions to admin role
  await assignPermissionsToRole(db, SystemRoles.ADMIN, ADMIN_PERMISSIONS, now);

  // Assign permissions to user role
  await assignPermissionsToRole(db, SystemRoles.USER, USER_PERMISSIONS, now);
}

/**
 * Assign a list of permissions to a role
 */
async function assignPermissionsToRole(
  db: ReturnType<typeof getDatabase>,
  roleName: string,
  permissionNames: string[],
  now: Date
): Promise<void> {
  // Find the role
  const roleResult = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.name, roleName))
    .limit(1);

  if (roleResult.length === 0) {
    if (env.NODE_ENV !== 'test') {
      console.log(`  ⚠ Role not found: ${roleName}`);
    }
    return;
  }

  const role = roleResult[0]!;

  for (const permissionName of permissionNames) {
    // Find the permission
    const permResult = await db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.name, permissionName))
      .limit(1);

    if (permResult.length === 0) {
      continue;
    }

    const permission = permResult[0]!;

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.roleId, role.id),
          eq(rolePermissionsTable.permissionId, permission.id)
        )
      )
      .limit(1);

    if (existingAssignment.length === 0) {
      // Create the assignment
      await db.insert(rolePermissionsTable).values({
        roleId: role.id,
        permissionId: permission.id,
        assignedAt: now,
        assignedBy: null, // System assignment
      });

      if (env.NODE_ENV !== 'test') {
        console.log(`  ✓ Assigned ${permissionName} to ${roleName}`);
      }
    }
  }
}

/**
 * Run seeds standalone
 * Usage: bun run src/infrastructure/database/seeds/seedPermissions.ts
 */
if (import.meta.main) {
  console.log('Seeding permissions...');
  seedPermissions()
    .then(() => {
      console.log('Permissions seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed permissions:', error);
      process.exit(1);
    });
}
