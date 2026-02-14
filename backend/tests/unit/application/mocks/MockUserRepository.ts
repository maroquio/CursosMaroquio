import type {
  IUserRepository,
  UserFilters,
  PaginatedUsers,
} from '@auth/domain/repositories/IUserRepository.ts';
import type { User } from '@auth/domain/entities/User.ts';
import type { UserId } from '@auth/domain/value-objects/UserId.ts';
import type { Email } from '@auth/domain/value-objects/Email.ts';

/**
 * Mock UserRepository for testing handlers
 * Allows full control over return values and simulating errors
 */
export class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private _shouldThrowOnSave = false;
  private _shouldThrowOnFind = false;

  async save(user: User): Promise<void> {
    if (this._shouldThrowOnSave) {
      throw new Error('Database error');
    }
    this.users.set(user.getId().toValue(), user);
  }

  async findById(id: UserId): Promise<User | null> {
    if (this._shouldThrowOnFind) {
      throw new Error('Database error');
    }
    return this.users.get(id.toValue()) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.getEmail().getValue() === email.getValue()) {
        return user;
      }
    }
    return null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    for (const user of this.users.values()) {
      if (user.getEmail().getValue() === email.getValue()) {
        return true;
      }
    }
    return false;
  }

  async delete(id: UserId): Promise<void> {
    this.users.delete(id.toValue());
  }

  async exists(id: UserId): Promise<boolean> {
    return this.users.has(id.toValue());
  }

  async findAllPaginated(
    page: number,
    limit: number,
    filters?: UserFilters
  ): Promise<PaginatedUsers> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (filters?.isActive !== undefined) {
      users = users.filter((u) => u.isActive() === filters.isActive);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      users = users.filter((u) => u.getEmail().getValue().toLowerCase().includes(search));
    }
    if (filters?.role) {
      users = users.filter((u) => u.hasRole(filters.role!));
    }

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async count(filters?: UserFilters): Promise<number> {
    let users = Array.from(this.users.values());

    if (filters?.isActive !== undefined) {
      users = users.filter((u) => u.isActive() === filters.isActive);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      users = users.filter((u) => u.getEmail().getValue().toLowerCase().includes(search));
    }
    if (filters?.role) {
      users = users.filter((u) => u.hasRole(filters.role!));
    }

    return users.length;
  }

  // Test helpers
  clear(): void {
    this.users.clear();
  }

  addUser(user: User): void {
    this.users.set(user.getId().toValue(), user);
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }

  simulateSaveError(shouldThrow: boolean): void {
    this._shouldThrowOnSave = shouldThrow;
  }

  simulateFindError(shouldThrow: boolean): void {
    this._shouldThrowOnFind = shouldThrow;
  }
}
