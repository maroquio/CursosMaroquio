import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ListRolesQuery } from './ListRolesQuery.ts';
import type { PaginatedRolesDto, RoleReadDto } from '../../dtos/RoleReadDto.ts';
import type { IRoleRepository } from '../../../domain/repositories/IRoleRepository.ts';

/**
 * ListRolesHandler
 * Handles role listing queries
 * Returns paginated list of roles with optional permissions
 */
export class ListRolesHandler implements IQueryHandler<ListRolesQuery, PaginatedRolesDto> {
  constructor(private roleRepository: IRoleRepository) {}

  async execute(query: ListRolesQuery): Promise<Result<PaginatedRolesDto>> {
    // Validate pagination parameters
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));

    // Fetch paginated roles
    const result = await this.roleRepository.findAllPaginated(page, limit);

    // Map to DTOs
    const roles: RoleReadDto[] = await Promise.all(
      result.roles.map(async (role) => {
        const dto: RoleReadDto = {
          id: role.id.toValue(),
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt?.toISOString() ?? null,
        };

        // Include permissions if requested
        if (query.includePermissions) {
          const permissions = await this.roleRepository.findPermissionsByRoleId(role.id);
          dto.permissions = permissions.map((p) => p.getValue());
        }

        return dto;
      })
    );

    const response: PaginatedRolesDto = {
      roles,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };

    return Result.ok(response);
  }
}
