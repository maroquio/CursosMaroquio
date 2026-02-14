import { Result } from '@shared/domain/Result.ts';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.ts';
import type { LogoutCommand } from './LogoutCommand.ts';

/**
 * Logout Handler
 * Revokes refresh tokens to end user sessions
 */
export class LogoutHandler {
  constructor(private refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(command: LogoutCommand): Promise<Result<void>> {
    // 1. Find the refresh token
    const token = await this.refreshTokenRepository.findByToken(command.refreshToken);

    if (!token) {
      // Token not found - could be already revoked or invalid
      // Return success anyway to not leak information
      return Result.ok(undefined);
    }

    if (command.logoutAll) {
      // Logout from all devices - revoke all tokens for this user
      await this.refreshTokenRepository.revokeAllForUser(token.userId);
    } else {
      // Logout from current device only
      if (!token.isRevoked()) {
        token.revoke();
        await this.refreshTokenRepository.update(token);
      }
    }

    return Result.ok(undefined);
  }
}
