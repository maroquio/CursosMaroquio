import { describe, it, expect } from 'vitest';
import { OAuthConnectionMapper } from '@auth/infrastructure/persistence/drizzle/OAuthConnectionMapper.ts';
import { OAuthConnection } from '@auth/domain/entities/OAuthConnection.ts';
import { OAuthConnectionId } from '@auth/domain/value-objects/OAuthConnectionId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { AuthProvider } from '@auth/domain/value-objects/AuthProvider.ts';
import { OAuthProfile } from '@auth/domain/value-objects/OAuthProfile.ts';
import type { OAuthConnectionSchema } from '@auth/infrastructure/persistence/drizzle/schema.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('OAuthConnectionMapper', () => {
  const validUserId = UserId.create();
  const validConnectionId = OAuthConnectionId.create();

  describe('toPersistence()', () => {
    it('should convert OAuthConnection entity to persistence format', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-123',
        email: 'test@gmail.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      }).getValue();

      const tokenExpiresAt = new Date(Date.now() + 3600000);
      const connection = OAuthConnection.create({
        userId: validUserId,
        profile,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        tokenExpiresAt,
      }).getValue();

      const persistence = OAuthConnectionMapper.toPersistence(connection);

      expect(persistence.id).toBe(connection.getId().toValue());
      expect(persistence.userId).toBe(validUserId.toValue());
      expect(persistence.provider).toBe('google');
      expect(persistence.providerUserId).toBe('google-123');
      expect(persistence.email).toBe('test@gmail.com');
      expect(persistence.name).toBe('Test User');
      expect(persistence.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(persistence.accessToken).toBe('access-token-123');
      expect(persistence.refreshToken).toBe('refresh-token-456');
      expect(persistence.tokenExpiresAt).toEqual(tokenExpiresAt);
      expect(persistence.createdAt).toBeInstanceOf(Date);
      expect(persistence.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null optional fields', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-456',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: validUserId,
        profile,
      }).getValue();

      const persistence = OAuthConnectionMapper.toPersistence(connection);

      expect(persistence.email).toBeNull();
      expect(persistence.name).toBeNull();
      expect(persistence.avatarUrl).toBeNull();
      expect(persistence.accessToken).toBeNull();
      expect(persistence.refreshToken).toBeNull();
      expect(persistence.tokenExpiresAt).toBeNull();
    });
  });

  describe('toDomain()', () => {
    it('should convert valid persistence data to OAuthConnection entity', () => {
      const now = new Date();
      const raw: OAuthConnectionSchema = {
        id: validConnectionId.toValue(),
        userId: validUserId.toValue(),
        provider: 'google',
        providerUserId: 'google-789',
        email: 'user@example.com',
        name: 'User Name',
        avatarUrl: 'https://example.com/pic.jpg',
        accessToken: 'token-abc',
        refreshToken: 'refresh-xyz',
        tokenExpiresAt: now,
        createdAt: now,
        updatedAt: now,
      };

      const result = OAuthConnectionMapper.toDomain(raw);

      expect(result.isOk).toBe(true);
      const connection = result.getValue();
      expect(connection.getId().toValue()).toBe(raw.id);
      expect(connection.getUserId().toValue()).toBe(raw.userId);
      expect(connection.getProvider().isGoogle()).toBe(true);
      expect(connection.getProviderUserId()).toBe('google-789');
      expect(connection.getEmail()).toBe('user@example.com');
    });

    it('should fail with invalid OAuth connection ID', () => {
      const raw: OAuthConnectionSchema = {
        id: 'invalid-id-format',
        userId: validUserId.toValue(),
        provider: 'google',
        providerUserId: 'google-123',
        email: null,
        name: null,
        avatarUrl: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = OAuthConnectionMapper.toDomain(raw);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.MAPPER_INVALID_OAUTH_CONNECTION_ID);
    });

    it('should fail with invalid user ID', () => {
      const raw: OAuthConnectionSchema = {
        id: validConnectionId.toValue(),
        userId: 'invalid-user-id',
        provider: 'google',
        providerUserId: 'google-123',
        email: null,
        name: null,
        avatarUrl: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = OAuthConnectionMapper.toDomain(raw);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.MAPPER_INVALID_USER_ID);
    });

    it('should fail with invalid provider', () => {
      const raw: OAuthConnectionSchema = {
        id: validConnectionId.toValue(),
        userId: validUserId.toValue(),
        provider: 'invalid-provider',
        providerUserId: 'provider-123',
        email: null,
        name: null,
        avatarUrl: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = OAuthConnectionMapper.toDomain(raw);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.MAPPER_INVALID_PROVIDER);
    });

    it('should handle all null optional fields', () => {
      const now = new Date();
      const raw: OAuthConnectionSchema = {
        id: validConnectionId.toValue(),
        userId: validUserId.toValue(),
        provider: 'apple',
        providerUserId: 'apple-456',
        email: null,
        name: null,
        avatarUrl: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const result = OAuthConnectionMapper.toDomain(raw);

      expect(result.isOk).toBe(true);
      const connection = result.getValue();
      expect(connection.getEmail()).toBeNull();
      expect(connection.getName()).toBeNull();
      expect(connection.getAvatarUrl()).toBeNull();
      expect(connection.getAccessToken()).toBeNull();
      expect(connection.getRefreshToken()).toBeNull();
      expect(connection.getTokenExpiresAt()).toBeNull();
    });
  });

  describe('roundtrip conversion', () => {
    it('should maintain data integrity through toPersistence and toDomain', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-roundtrip',
        email: 'roundtrip@example.com',
        name: 'Roundtrip User',
        avatarUrl: 'https://example.com/roundtrip.jpg',
      }).getValue();

      const tokenExpiresAt = new Date(Date.now() + 3600000);
      const original = OAuthConnection.create({
        userId: validUserId,
        profile,
        accessToken: 'roundtrip-access',
        refreshToken: 'roundtrip-refresh',
        tokenExpiresAt,
      }).getValue();

      // Convert to persistence and back
      const persistence = OAuthConnectionMapper.toPersistence(original);
      const result = OAuthConnectionMapper.toDomain(persistence);

      expect(result.isOk).toBe(true);
      const restored = result.getValue();

      expect(restored.getId().equals(original.getId())).toBe(true);
      expect(restored.getUserId().equals(original.getUserId())).toBe(true);
      expect(restored.getProvider().equals(original.getProvider())).toBe(true);
      expect(restored.getProviderUserId()).toBe(original.getProviderUserId());
      expect(restored.getEmail()).toBe(original.getEmail());
      expect(restored.getName()).toBe(original.getName());
      expect(restored.getAvatarUrl()).toBe(original.getAvatarUrl());
      expect(restored.getAccessToken()).toBe(original.getAccessToken());
      expect(restored.getRefreshToken()).toBe(original.getRefreshToken());
    });
  });
});
