import { pgTable, text, timestamp, index, primaryKey, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Users table schema
 * Maps User aggregate to database table
 */
export const usersTable = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export type UserSchema = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;

/**
 * Refresh tokens table schema
 * Stores refresh tokens for JWT authentication
 */
export const refreshTokensTable = pgTable(
  'refresh_tokens',
  {
    id: text('id').primaryKey().notNull(), // The token itself
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    replacedByToken: text('replaced_by_token'),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
  },
  (table) => [
    index('idx_refresh_tokens_user_id').on(table.userId),
    index('idx_refresh_tokens_expires_at').on(table.expiresAt),
  ]
);

export type RefreshTokenSchema = typeof refreshTokensTable.$inferSelect;
export type RefreshTokenInsert = typeof refreshTokensTable.$inferInsert;

/**
 * Roles table schema
 * Stores available roles in the system (admin, user, etc.)
 * Only 'admin' role has isSystem = true (protected from deletion)
 */
export const rolesTable = pgTable('roles', {
  id: text('id').primaryKey().notNull(),
  name: text('name').unique().notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export type RoleSchema = typeof rolesTable.$inferSelect;
export type RoleInsert = typeof rolesTable.$inferInsert;

/**
 * User-Roles junction table schema
 * Implements N:N relationship between users and roles
 * A user can have multiple roles simultaneously
 */
export const userRolesTable = pgTable(
  'user_roles',
  {
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull(),
    assignedBy: text('assigned_by').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('idx_user_roles_user_id').on(table.userId),
    index('idx_user_roles_role_id').on(table.roleId),
  ]
);

export type UserRoleSchema = typeof userRolesTable.$inferSelect;
export type UserRoleInsert = typeof userRolesTable.$inferInsert;

/**
 * Permissions table schema
 * Stores granular permissions in format resource:action
 * All permissions are configurable by admin (no system permissions)
 */
export const permissionsTable = pgTable(
  'permissions',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').unique().notNull(), // e.g., "users:read", "roles:delete"
    resource: text('resource').notNull(), // e.g., "users", "roles"
    action: text('action').notNull(), // e.g., "read", "create", "update", "delete"
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_permissions_resource').on(table.resource),
    index('idx_permissions_name').on(table.name),
    uniqueIndex('idx_permissions_resource_action').on(table.resource, table.action),
  ]
);

export type PermissionSchema = typeof permissionsTable.$inferSelect;
export type PermissionInsert = typeof permissionsTable.$inferInsert;

/**
 * Role-Permissions junction table schema
 * Implements N:N relationship between roles and permissions
 * Permissions assigned to a role are inherited by all users with that role
 */
export const rolePermissionsTable = pgTable(
  'role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissionsTable.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull(),
    assignedBy: text('assigned_by').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index('idx_role_permissions_role_id').on(table.roleId),
    index('idx_role_permissions_permission_id').on(table.permissionId),
  ]
);

export type RolePermissionSchema = typeof rolePermissionsTable.$inferSelect;
export type RolePermissionInsert = typeof rolePermissionsTable.$inferInsert;

/**
 * User-Permissions junction table schema
 * Implements N:N relationship for individual user permissions
 * These are extra permissions assigned directly to users, bypassing roles
 * User's effective permissions = role permissions + individual permissions
 */
export const userPermissionsTable = pgTable(
  'user_permissions',
  {
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissionsTable.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull(),
    assignedBy: text('assigned_by').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.permissionId] }),
    index('idx_user_permissions_user_id').on(table.userId),
    index('idx_user_permissions_permission_id').on(table.permissionId),
  ]
);

export type UserPermissionSchema = typeof userPermissionsTable.$inferSelect;
export type UserPermissionInsert = typeof userPermissionsTable.$inferInsert;

/**
 * OAuth Connections table schema
 * Stores OAuth provider connections for social login
 * Each user can have one connection per provider (Google, Facebook, Apple)
 * Allows account linking: users can have both email/password + OAuth providers
 */
export const oauthConnectionsTable = pgTable(
  'oauth_connections',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // 'google' | 'facebook' | 'apple'
    providerUserId: text('provider_user_id').notNull(), // User's ID at the provider
    email: text('email'), // Email from provider (may differ from user's primary email)
    name: text('name'), // Name from provider profile
    avatarUrl: text('avatar_url'), // Profile picture URL
    accessToken: text('access_token'), // Provider's access token (encrypted in production)
    refreshToken: text('refresh_token'), // Provider's refresh token (encrypted in production)
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // Ensure unique provider user ID per provider (one account per provider identity)
    uniqueIndex('idx_oauth_provider_user').on(table.provider, table.providerUserId),
    // Ensure one connection per provider per user (can't link same provider twice)
    uniqueIndex('idx_oauth_user_provider').on(table.userId, table.provider),
    // Index for querying user's connections
    index('idx_oauth_connections_user_id').on(table.userId),
  ]
);

export type OAuthConnectionSchema = typeof oauthConnectionsTable.$inferSelect;
export type OAuthConnectionInsert = typeof oauthConnectionsTable.$inferInsert;
