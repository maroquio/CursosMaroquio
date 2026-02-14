import { Identifier } from '@shared/domain/Identifier.ts';
import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UserId } from '../value-objects/UserId.ts';

/**
 * Refresh Token ID Value Object
 * Uses a 64-character hex string (32 bytes) as a secure random token
 */
export class RefreshTokenId extends Identifier<RefreshTokenId> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new RefreshTokenId with a secure random value
   */
  public static create(): RefreshTokenId {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return new RefreshTokenId(token);
  }

  /**
   * Create from an existing string
   */
  public static createFromString(value: string): Result<RefreshTokenId> {
    if (!value || value.length < 32) {
      return Result.fail(ErrorCode.REFRESH_TOKEN_INVALID_FORMAT);
    }
    return Result.ok(new RefreshTokenId(value));
  }
}

/**
 * RefreshToken Entity
 *
 * Represents a refresh token for JWT authentication.
 * Supports token rotation (each refresh generates a new token).
 */
export class RefreshToken extends Entity<RefreshTokenId> {
  private constructor(
    id: RefreshTokenId,
    private _userId: UserId,
    private _expiresAt: Date,
    private _createdAt: Date,
    private _revokedAt: Date | null,
    private _replacedByToken: string | null,
    private _userAgent: string | null,
    private _ipAddress: string | null
  ) {
    super(id);
  }

  // Getters
  get userId(): UserId {
    return this._userId;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get replacedByToken(): string | null {
    return this._replacedByToken;
  }

  get userAgent(): string | null {
    return this._userAgent;
  }

  get ipAddress(): string | null {
    return this._ipAddress;
  }

  get token(): string {
    return this.getId().toValue();
  }

  /**
   * Check if token is expired
   */
  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  /**
   * Check if token is revoked
   */
  public isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  /**
   * Check if token is valid (not expired and not revoked)
   */
  public isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  /**
   * Revoke this token
   */
  public revoke(replacedByToken?: string): void {
    this._revokedAt = new Date();
    if (replacedByToken) {
      this._replacedByToken = replacedByToken;
    }
  }

  /**
   * Create a new refresh token
   */
  public static create(params: {
    userId: UserId;
    expiresInMs: number;
    userAgent?: string;
    ipAddress?: string;
  }): RefreshToken {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + params.expiresInMs);

    return new RefreshToken(
      RefreshTokenId.create(),
      params.userId,
      expiresAt,
      now,
      null,
      null,
      params.userAgent ?? null,
      params.ipAddress ?? null
    );
  }

  /**
   * Reconstruct from persistence
   */
  public static reconstruct(params: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt: Date | null;
    replacedByToken: string | null;
    userAgent: string | null;
    ipAddress: string | null;
  }): Result<RefreshToken> {
    const tokenIdResult = RefreshTokenId.createFromString(params.id);
    if (tokenIdResult.isFailure) {
      return Result.fail(tokenIdResult.getError()!);
    }

    const userIdResult = UserId.createFromString(params.userId);
    if (userIdResult.isFailure) {
      return Result.fail(userIdResult.getError()!);
    }

    return Result.ok(
      new RefreshToken(
        tokenIdResult.getValue(),
        userIdResult.getValue(),
        params.expiresAt,
        params.createdAt,
        params.revokedAt,
        params.replacedByToken,
        params.userAgent,
        params.ipAddress
      )
    );
  }
}
