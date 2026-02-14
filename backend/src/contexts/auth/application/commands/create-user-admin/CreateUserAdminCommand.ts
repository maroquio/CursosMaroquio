import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * CreateUserAdminCommand
 * Command for admin to create a new user
 * Allows setting roles and active status directly
 */
export class CreateUserAdminCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly fullName: string,
    public readonly phone: string,
    public readonly createdByUserId: string,
    public readonly roles: string[] = [],
    public readonly isActive: boolean = true,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
