import { eq } from 'drizzle-orm';
import { getDatabase } from '../connection.ts';
import {
  usersTable,
  rolesTable,
  userRolesTable,
} from '@auth/infrastructure/persistence/drizzle/schema.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { SystemRoles } from '@auth/domain/value-objects/Role.ts';
import { env } from '@shared/config/env.ts';

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (password) return password;
  if (env.NODE_ENV === 'production') {
    throw new Error('ADMIN_PASSWORD must be set in production environment');
  }
  return '1234aA@#';
}

/**
 * Default admin user credentials
 * This user is created only if no admin exists in the system
 */
const DEFAULT_ADMIN = {
  fullName: 'Administrador do Sistema',
  email: 'ricardo@maroquio.com',
  phone: '(28) 99999-9999',
};

/**
 * Seed default admin user into the database
 * This function is idempotent - it will only create an admin if none exists
 *
 * The function checks if any user with the 'admin' role exists.
 * If not, it creates the default admin user and assigns the admin role.
 *
 * @returns Promise<void>
 */
export async function seedAdminUser(): Promise<void> {
  const db = getDatabase();
  const now = new Date();

  // 1. Find the admin role
  const adminRoleResult = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.name, SystemRoles.ADMIN))
    .limit(1);

  if (adminRoleResult.length === 0) {
    if (env.NODE_ENV !== 'test') {
      console.log('  ⚠ Admin role not found. Run seedRoles first.');
    }
    return;
  }

  const adminRole = adminRoleResult[0]!;

  // 2. Check if any user with admin role exists
  const existingAdminResult = await db
    .select({ userId: userRolesTable.userId })
    .from(userRolesTable)
    .where(eq(userRolesTable.roleId, adminRole.id))
    .limit(1);

  if (existingAdminResult.length > 0) {
    if (env.NODE_ENV !== 'test') {
      console.log('  → Admin user already exists');
    }
    return;
  }

  // 3. Check if a user with the default admin email already exists
  const existingUserResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, DEFAULT_ADMIN.email))
    .limit(1);

  let adminUserId: string;

  if (existingUserResult.length > 0) {
    // User exists but doesn't have admin role - assign the role
    adminUserId = existingUserResult[0]!.id;
    if (env.NODE_ENV !== 'test') {
      console.log(`  → User ${DEFAULT_ADMIN.email} exists, assigning admin role...`);
    }
  } else {
    // 4. Create the admin user
    adminUserId = UserId.create().toValue();
    const hashedPassword = await Bun.password.hash(getAdminPassword());

    await db.insert(usersTable).values({
      id: adminUserId,
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      fullName: DEFAULT_ADMIN.fullName,
      phone: DEFAULT_ADMIN.phone,
      isActive: true,
      createdAt: now,
    });

    if (env.NODE_ENV !== 'test') {
      console.log(`  ✓ Created admin user: ${DEFAULT_ADMIN.email}`);
    }
  }

  // 5. Assign admin role to the user
  await db.insert(userRolesTable).values({
    userId: adminUserId,
    roleId: adminRole.id,
    assignedAt: now,
    assignedBy: null, // System created
  });

  if (env.NODE_ENV !== 'test') {
    console.log(`  ✓ Assigned admin role to: ${DEFAULT_ADMIN.email}`);
  }
}

/**
 * Run seeds standalone
 * Usage: bun run src/infrastructure/database/seeds/seedAdminUser.ts
 */
if (import.meta.main) {
  console.log('Seeding admin user...');
  seedAdminUser()
    .then(() => {
      console.log('Admin user seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed admin user:', error);
      process.exit(1);
    });
}
