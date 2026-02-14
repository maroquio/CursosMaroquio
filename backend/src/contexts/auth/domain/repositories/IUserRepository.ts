import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { User } from '../entities/User.ts';
import { UserId } from '../value-objects/UserId.ts';
import { Email } from '../value-objects/Email.ts';

/**
 * User filter options for listing
 */
export interface UserFilters {
  isActive?: boolean;
  role?: string;
  search?: string; // Search by email
}

/**
 * Paginated result for users
 */
export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * User Repository Interface
 * Defines the contract for user persistence operations
 * Domain layer does not know about implementation details (SQL, ORM, etc.)
 */
export interface IUserRepository extends IRepository<User, UserId> {
  /**
   * Find a user by email address
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Check if a user with the given email already exists
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Find all users with pagination and optional filters
   */
  findAllPaginated(page: number, limit: number, filters?: UserFilters): Promise<PaginatedUsers>;

  /**
   * Count total users matching the filters
   */
  count(filters?: UserFilters): Promise<number>;
}
