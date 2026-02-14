import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ListPermissionsQuery } from './ListPermissionsQuery.ts';
import type {
  PaginatedPermissionsDto,
  PermissionReadDto,
} from '../../dtos/PermissionReadDto.ts';
import type { IPermissionRepository } from '../../../domain/repositories/IPermissionRepository.ts';

/**
 * ListPermissionsHandler
 * Handles permission listing queries
 * Returns paginated list of permissions
 */
export class ListPermissionsHandler
  implements IQueryHandler<ListPermissionsQuery, PaginatedPermissionsDto>
{
  constructor(private permissionRepository: IPermissionRepository) {}

  async execute(
    query: ListPermissionsQuery
  ): Promise<Result<PaginatedPermissionsDto>> {
    // Validate pagination parameters
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));

    // If filtering by resource, get all and filter
    if (query.resource) {
      const allByResource = await this.permissionRepository.findByResource(
        query.resource
      );

      // Manual pagination
      const total = allByResource.length;
      const offset = (page - 1) * limit;
      const paginatedResults = allByResource.slice(offset, offset + limit);

      const permissions: PermissionReadDto[] = paginatedResults.map((perm) => ({
        id: perm.id.toValue(),
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
        createdAt: perm.createdAt.toISOString(),
      }));

      return Result.ok({
        permissions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Fetch paginated permissions
    const result = await this.permissionRepository.findAllPaginated(page, limit);

    // Map to DTOs
    const permissions: PermissionReadDto[] = result.permissions.map((perm) => ({
      id: perm.id.toValue(),
      name: perm.name,
      resource: perm.resource,
      action: perm.action,
      description: perm.description,
      createdAt: perm.createdAt.toISOString(),
    }));

    const response: PaginatedPermissionsDto = {
      permissions,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };

    return Result.ok(response);
  }
}
