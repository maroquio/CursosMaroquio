import { eq, and, ilike, sql, type SQL } from 'drizzle-orm';
import type {
  DrizzleDatabase,
  IDatabaseProvider,
} from '@shared/infrastructure/database/types.ts';
import {
  type IUserRepository,
  type UserFilters,
  type PaginatedUsers,
} from '../../../domain/repositories/IUserRepository.ts';
import { type IRoleRepository } from '../../../domain/repositories/IRoleRepository.ts';
import { User } from '../../../domain/entities/User.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { Email } from '../../../domain/value-objects/Email.ts';
import { usersTable, userRolesTable, rolesTable } from './schema.ts';
import { UserMapper } from './UserMapper.ts';

/**
 * DrizzleUserRepository
 * Implements IUserRepository using Drizzle ORM with PostgreSQL
 * Handles all database operations for users
 */
export class DrizzleUserRepository implements IUserRepository {
  constructor(
    private dbProvider: IDatabaseProvider,
    private roleRepository: IRoleRepository
  ) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);

    // Check if user already exists
    const existingUser = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.getId().toValue()));

    if (existingUser && existingUser.length > 0) {
      // Update existing user
      await this.db
        .update(usersTable)
        .set(data)
        .where(eq(usersTable.id, user.getId().toValue()));
    } else {
      // Insert new user
      await this.db.insert(usersTable).values(data);
    }

    // Sync roles: remove existing and add current roles
    await this.syncUserRoles(user);
  }

  /**
   * Synchronize user roles with the database
   * Removes all existing roles and adds current roles
   */
  private async syncUserRoles(user: User): Promise<void> {
    const userId = user.getId();

    // Delete existing role assignments
    await this.db
      .delete(userRolesTable)
      .where(eq(userRolesTable.userId, userId.toValue()));

    // Get role IDs and insert new assignments
    const roles = user.getRoles();
    for (const role of roles) {
      const roleEntity = await this.roleRepository.findByName(role.getValue());
      if (roleEntity) {
        await this.roleRepository.assignRoleToUser(userId, roleEntity.id);
      }
    }
  }

  async findById(id: UserId): Promise<User | null> {
    const result = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    // Load user roles
    const roles = await this.roleRepository.findByUserId(id);

    // Use getValueOrThrow as corrupted data in database is exceptional
    return UserMapper.toDomain(result[0]!, roles).getValueOrThrow();
  }

  async findByEmail(email: Email): Promise<User | null> {
    const result = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.getValue()));

    if (!result || result.length === 0) {
      return null;
    }

    // Load user roles
    const userId = UserId.createFromString(result[0]!.id);
    const roles = userId.isOk
      ? await this.roleRepository.findByUserId(userId.getValue())
      : [];

    // Use getValueOrThrow as corrupted data in database is exceptional
    return UserMapper.toDomain(result[0]!, roles).getValueOrThrow();
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const result = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.getValue()));

    return result && result.length > 0;
  }

  async delete(id: UserId): Promise<void> {
    await this.db
      .delete(usersTable)
      .where(eq(usersTable.id, id.toValue()));
  }

  async exists(id: UserId): Promise<boolean> {
    const result = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id.toValue()));

    return result && result.length > 0;
  }

  async findAllPaginated(
    page: number,
    limit: number,
    filters?: UserFilters
  ): Promise<PaginatedUsers> {
    const offset = (page - 1) * limit;
    const conditions = this.buildFilterConditions(filters);

    // Get users with pagination
    let query = this.db.select().from(usersTable);

    if (conditions) {
      query = query.where(conditions) as typeof query;
    }

    const result = await query.limit(limit).offset(offset);

    // Load roles for each user
    const users: User[] = [];
    for (const row of result) {
      const userId = UserId.createFromString(row.id);
      const roles = userId.isOk
        ? await this.roleRepository.findByUserId(userId.getValue())
        : [];

      // Apply role filter if specified
      if (filters?.role) {
        const hasRole = roles.some((r) => r.getValue() === filters.role);
        if (!hasRole) continue;
      }

      const userResult = UserMapper.toDomain(row, roles);
      if (userResult.isOk) {
        users.push(userResult.getValue());
      }
    }

    const total = await this.count(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async count(filters?: UserFilters): Promise<number> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select({ count: sql<number>`count(*)` }).from(usersTable);

    if (conditions) {
      query = query.where(conditions) as typeof query;
    }

    const result = await query;
    return Number(result[0]?.count ?? 0);
  }

  /**
   * Build SQL conditions from filters
   */
  private buildFilterConditions(filters?: UserFilters): SQL | undefined {
    if (!filters) return undefined;

    const conditions: SQL[] = [];

    if (filters.isActive !== undefined) {
      conditions.push(eq(usersTable.isActive, filters.isActive));
    }

    if (filters.search) {
      conditions.push(ilike(usersTable.email, `%${filters.search}%`));
    }

    // Note: role filter is applied in-memory after loading roles
    // This is because roles are stored in a separate junction table

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions);
  }
}
