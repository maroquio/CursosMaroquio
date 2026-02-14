import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import { Email } from '../../../domain/value-objects/Email.ts';
import { RefreshToken } from '../../../domain/entities/RefreshToken.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.ts';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.ts';
import type { ITokenService } from '../../../domain/services/ITokenService.ts';
import type { LoginCommand } from './LoginCommand.ts';
import type { LoginResponse } from '../../dtos/LoginResponse.ts';

/**
 * Login Handler
 * Authenticates a user and returns JWT tokens
 * Supports i18n when command includes translator (command.t)
 */
export class LoginHandler {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService
  ) {}

  /**
   * Get error message with i18n support
   */
  private getError(command: LoginCommand, code: ErrorCode): string {
    return command.t ? getLocalizedErrorMessage(code, command.t) : getErrorMessage(code);
  }

  async execute(command: LoginCommand): Promise<Result<LoginResponse>> {
    // 1. Validate email format
    const emailResult = Email.create(command.email, { t: command.t });
    if (emailResult.isFailure) {
      return Result.fail(this.getError(command, ErrorCode.INVALID_EMAIL_FORMAT));
    }
    const email = emailResult.getValue();

    // 2. Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Use generic message to prevent user enumeration
      return Result.fail(this.getError(command, ErrorCode.INVALID_PASSWORD));
    }

    // 2.1 Check if user account is active (soft delete check)
    if (!user.isActive()) {
      // Use the same generic error message to prevent user enumeration
      // This prevents attackers from knowing if an account exists but is deactivated
      return Result.fail(this.getError(command, ErrorCode.INVALID_PASSWORD));
    }

    // 3. Verify password
    const passwordValid = await this.passwordHasher.compare(
      command.password,
      user.getPassword().getHash()
    );

    if (!passwordValid) {
      return Result.fail(this.getError(command, ErrorCode.INVALID_PASSWORD));
    }

    // 4. Generate access token (with roles)
    const accessToken = this.tokenService.generateAccessToken(
      user.getId(),
      user.getEmail().getValue(),
      user.getRoleNames()
    );

    // 5. Create and save refresh token
    const refreshToken = RefreshToken.create({
      userId: user.getId(),
      expiresInMs: this.tokenService.getRefreshTokenExpiryMs(),
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);

    // 6. Return token pair (with roles in user object)
    return Result.ok({
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: Math.floor(this.tokenService.getAccessTokenExpiryMs() / 1000),
      user: {
        id: user.getId().toValue(),
        email: user.getEmail().getValue(),
        fullName: user.getFullName(),
        phone: user.getPhone(),
        photoUrl: user.getPhotoUrl(),
        roles: user.getRoleNames(),
      },
    });
  }
}
