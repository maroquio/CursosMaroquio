import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import { RefreshToken } from '../../../domain/entities/RefreshToken.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.ts';
import type { ITokenService } from '../../../domain/services/ITokenService.ts';
import type { RefreshTokenCommand } from './RefreshTokenCommand.ts';
import type { TokenResponse } from '../../dtos/TokenResponse.ts';

/**
 * RefreshTokenResponse is an alias for TokenResponse
 * Both operations return the same token structure
 */
export type RefreshTokenResponse = TokenResponse;

/**
 * Refresh Token Handler
 * Validates refresh token and issues new token pair
 *
 * Implements token rotation: each refresh invalidates the old
 * refresh token and issues a new one. This limits the damage
 * if a refresh token is stolen.
 */
export class RefreshTokenHandler {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository,
    private tokenService: ITokenService
  ) {}

  /**
   * Get error message with i18n support
   */
  private getError(command: RefreshTokenCommand, code: ErrorCode): string {
    return command.t ? getLocalizedErrorMessage(code, command.t) : getErrorMessage(code);
  }

  async execute(command: RefreshTokenCommand): Promise<Result<RefreshTokenResponse>> {
    // 1. Find the refresh token
    const existingToken = await this.refreshTokenRepository.findByToken(command.refreshToken);

    if (!existingToken) {
      return Result.fail(this.getError(command, ErrorCode.UNAUTHORIZED));
    }

    // 2. Check if token is valid
    if (!existingToken.isValid()) {
      // If token was already revoked, this might be a token reuse attack
      // Revoke all tokens for this user as a security measure
      if (existingToken.isRevoked()) {
        await this.refreshTokenRepository.revokeAllForUser(existingToken.userId);
      }

      return Result.fail(this.getError(command, ErrorCode.UNAUTHORIZED));
    }

    // 3. Find the user
    const user = await this.userRepository.findById(existingToken.userId);
    if (!user) {
      return Result.fail(this.getError(command, ErrorCode.USER_NOT_FOUND));
    }

    // 4. Create new refresh token (token rotation)
    const newRefreshToken = RefreshToken.create({
      userId: user.getId(),
      expiresInMs: this.tokenService.getRefreshTokenExpiryMs(),
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
    });

    // 5. Revoke old token and mark it as replaced
    existingToken.revoke(newRefreshToken.token);

    // 6. Save changes atomically
    await this.refreshTokenRepository.update(existingToken);
    await this.refreshTokenRepository.save(newRefreshToken);

    // 7. Generate new access token (with roles)
    const accessToken = this.tokenService.generateAccessToken(
      user.getId(),
      user.getEmail().getValue(),
      user.getRoleNames()
    );

    return Result.ok({
      accessToken,
      refreshToken: newRefreshToken.token,
      expiresIn: Math.floor(this.tokenService.getAccessTokenExpiryMs() / 1000),
    });
  }
}
