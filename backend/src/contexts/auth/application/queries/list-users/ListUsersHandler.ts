import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ListUsersQuery } from './ListUsersQuery.ts';
import type { PaginatedUsersDto, UserAdminReadDto } from '../../dtos/index.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';

/**
 * ListUsersHandler
 * Handles user listing queries with pagination and filtering
 * Returns paginated list of users for admin operations
 */
export class ListUsersHandler implements IQueryHandler<ListUsersQuery, PaginatedUsersDto> {
  constructor(private userRepository: IUserRepository) {}

  async execute(query: ListUsersQuery): Promise<Result<PaginatedUsersDto>> {
    // Validate and normalize pagination parameters
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));

    // Fetch paginated users with filters
    const result = await this.userRepository.findAllPaginated(page, limit, query.filters);

    // Map domain entities to DTOs
    const users: UserAdminReadDto[] = result.users.map((user) => ({
      id: user.getId().toValue(),
      email: user.getEmail().getValue(),
      fullName: user.getFullName(),
      phone: user.getPhone(),
      photoUrl: user.getPhotoUrl(),
      isActive: user.isActive(),
      roles: user.getRoles().map((role) => role.getValue()),
      individualPermissions: user
        .getIndividualPermissions()
        .map((perm) => perm.getValue()),
      createdAt: user.getCreatedAt().toISOString(),
    }));

    const response: PaginatedUsersDto = {
      users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };

    return Result.ok(response);
  }
}
