import { eq } from 'drizzle-orm';
import { getDatabase } from '../connection.ts';
import { rolesTable } from '@auth/infrastructure/persistence/drizzle/schema.ts';
import { RoleId } from '@auth/domain/value-objects/RoleId.ts';
import { SystemRoles } from '@auth/domain/value-objects/Role.ts';
import { env } from '@shared/config/env.ts';

/**
 * Initial roles to seed
 * These are the default roles available in the system
 * Only 'admin' is a system role (protected from deletion)
 */
const INITIAL_ROLES = [
  {
    name: SystemRoles.ADMIN,
    description: 'Administrator with full system access',
    isSystem: true, // Protected - cannot be deleted
  },
  {
    name: SystemRoles.USER,
    description: 'Standard user with basic access',
    isSystem: false, // Configurable by admin
  },
];

/**
 * Seed initial roles into the database
 * This function is idempotent - it will only create roles that don't exist
 *
 * @returns Promise<void>
 */
export async function seedRoles(): Promise<void> {
  const db = getDatabase();
  const now = new Date();

  for (const role of INITIAL_ROLES) {
    // Check if role already exists
    const existingRole = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.name, role.name))
      .limit(1);

    if (existingRole.length === 0) {
      // Create new role with UUID v7
      await db.insert(rolesTable).values({
        id: RoleId.create().toValue(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        createdAt: now,
      });

      if (env.NODE_ENV !== 'test') {
        console.log(`  ✓ Created role: ${role.name}`);
      }
    } else if (env.NODE_ENV !== 'test') {
      console.log(`  → Role already exists: ${role.name}`);
    }
  }
}

/**
 * Run seeds standalone
 * Usage: bun run src/infrastructure/database/seeds/seedRoles.ts
 */
if (import.meta.main) {
  console.log('Seeding roles...');
  seedRoles()
    .then(() => {
      console.log('Roles seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed roles:', error);
      process.exit(1);
    });
}
