import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode, getErrorMessage, getLocalizedErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import type { IOAuthConnectionRepository } from '../../../domain/repositories/IOAuthConnectionRepository.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { GetUserOAuthConnectionsQuery } from './GetUserOAuthConnectionsQuery.ts';

/**
 * DTO for an individual OAuth connection
 */
export interface OAuthConnectionDto {
  /** The OAuth provider name */
  provider: string;

  /** Email associated with this OAuth account (if available) */
  email: string | null;

  /** Name from the OAuth profile (if available) */
  name: string | null;

  /** Avatar URL from the OAuth profile (if available) */
  avatarUrl: string | null;

  /** When this connection was created */
  linkedAt: string;
}

/**
 * Response DTO for user OAuth connections
 */
export interface UserOAuthConnectionsDto {
  /** List of linked OAuth providers */
  connections: OAuthConnectionDto[];

  /** Total count of connections */
  totalConnections: number;
}

/**
 * GetUserOAuthConnectionsHandler
 * Retrieves all OAuth connections for a user
 *
 * This allows users to see which social accounts are linked
 * and manage their authentication methods
 */
export class GetUserOAuthConnectionsHandler
  implements IQueryHandler<GetUserOAuthConnectionsQuery, UserOAuthConnectionsDto>
{
  constructor(
    private userRepository: IUserRepository,
    private oauthConnectionRepository: IOAuthConnectionRepository
  ) {}

  /**
   * Get localized error message with fallback
   */
  private getError(t: TranslationFunctions | undefined, code: ErrorCode): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(query: GetUserOAuthConnectionsQuery): Promise<Result<UserOAuthConnectionsDto>> {
    // 1. Validate user ID
    const userIdResult = UserId.createFromString(query.userId);
    if (userIdResult.isFailure) {
      return Result.fail(this.getError(query.t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdResult.getValue();

    // 2. Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(query.t, ErrorCode.USER_NOT_FOUND));
    }

    // 3. Get all OAuth connections for the user
    const connections = await this.oauthConnectionRepository.findAllByUserId(userId);

    // 4. Map to DTOs (never expose tokens!)
    const connectionDtos: OAuthConnectionDto[] = connections.map((connection) => ({
      provider: connection.getProvider().getValue(),
      email: connection.getEmail(),
      name: connection.getName(),
      avatarUrl: connection.getAvatarUrl(),
      linkedAt: connection.getCreatedAt().toISOString(),
    }));

    return Result.ok({
      connections: connectionDtos,
      totalConnections: connectionDtos.length,
    });
  }
}
