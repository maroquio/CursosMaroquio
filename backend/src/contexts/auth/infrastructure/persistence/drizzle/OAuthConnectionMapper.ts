import { OAuthConnection } from '../../../domain/entities/OAuthConnection.ts';
import { OAuthConnectionId } from '../../../domain/value-objects/OAuthConnectionId.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { AuthProvider } from '../../../domain/value-objects/AuthProvider.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { type OAuthConnectionSchema } from './schema.ts';

/**
 * OAuthConnectionMapper
 * Converts between OAuthConnection entity and database schema
 * Acts as an adapter between domain and infrastructure layers
 */
export class OAuthConnectionMapper {
  /**
   * Convert OAuthConnection entity to database row
   */
  public static toPersistence(connection: OAuthConnection) {
    return {
      id: connection.getId().toValue(),
      userId: connection.getUserId().toValue(),
      provider: connection.getProvider().getValue(),
      providerUserId: connection.getProviderUserId(),
      email: connection.getEmail(),
      name: connection.getName(),
      avatarUrl: connection.getAvatarUrl(),
      accessToken: connection.getAccessToken(),
      refreshToken: connection.getRefreshToken(),
      tokenExpiresAt: connection.getTokenExpiresAt(),
      createdAt: connection.getCreatedAt(),
      updatedAt: connection.getUpdatedAt(),
    };
  }

  /**
   * Convert database row to OAuthConnection entity
   * Returns Result<OAuthConnection> for functional error handling
   */
  public static toDomain(raw: OAuthConnectionSchema): Result<OAuthConnection> {
    // Validate connection ID
    const connectionIdResult = OAuthConnectionId.createFromString(raw.id);
    if (connectionIdResult.isFailure) {
      return Result.fail(ErrorCode.MAPPER_INVALID_OAUTH_CONNECTION_ID);
    }

    // Validate user ID
    const userIdResult = UserId.createFromString(raw.userId);
    if (userIdResult.isFailure) {
      return Result.fail(ErrorCode.MAPPER_INVALID_USER_ID);
    }

    // Validate provider
    const providerResult = AuthProvider.create(raw.provider);
    if (providerResult.isFailure) {
      return Result.fail(ErrorCode.MAPPER_INVALID_PROVIDER);
    }

    // Reconstruct the entity
    const connection = OAuthConnection.reconstruct({
      id: connectionIdResult.getValue(),
      userId: userIdResult.getValue(),
      provider: providerResult.getValue(),
      providerUserId: raw.providerUserId,
      email: raw.email,
      name: raw.name,
      avatarUrl: raw.avatarUrl,
      accessToken: raw.accessToken,
      refreshToken: raw.refreshToken,
      tokenExpiresAt: raw.tokenExpiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });

    return Result.ok(connection);
  }
}
