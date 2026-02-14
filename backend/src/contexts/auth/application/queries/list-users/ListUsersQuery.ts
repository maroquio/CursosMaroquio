import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import type { UserFilters } from '../../../domain/repositories/IUserRepository.ts';

/**
 * ListUsersQuery
 * Query to list users with pagination and filters
 * Used by admin endpoints for user management
 */
export class ListUsersQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly filters?: UserFilters,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
