import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthConnection } from '@auth/domain/entities/OAuthConnection.ts';
import { OAuthConnectionId } from '@auth/domain/value-objects/OAuthConnectionId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { AuthProvider } from '@auth/domain/value-objects/AuthProvider.ts';
import { OAuthProfile } from '@auth/domain/value-objects/OAuthProfile.ts';
import { OAuthAccountLinked } from '@auth/domain/events/OAuthAccountLinked.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('OAuthConnectionId Value Object', () => {
  describe('create()', () => {
    it('should create a new OAuthConnectionId with generated UUID v7', () => {
      const id = OAuthConnectionId.create();

      expect(id).toBeDefined();
      expect(id.toValue()).toBeDefined();
      expect(typeof id.toValue()).toBe('string');
    });

    it('should create OAuthConnectionId with provided UUID', () => {
      const uuid = '019b24a8-c19c-7566-bf27-103fb4029456';
      const id = OAuthConnectionId.create(uuid);

      expect(id.toValue()).toBe(uuid);
    });

    it('should create unique IDs on each call', () => {
      const id1 = OAuthConnectionId.create();
      const id2 = OAuthConnectionId.create();

      expect(id1.toValue()).not.toBe(id2.toValue());
    });
  });

  describe('createFromString()', () => {
    it('should create OAuthConnectionId from valid UUID v7', () => {
      const uuid = '019b24a8-c19c-7566-bf27-103fb4029456';
      const result = OAuthConnectionId.createFromString(uuid);

      expect(result.isOk).toBe(true);
      expect(result.getValue().toValue()).toBe(uuid);
    });

    it('should fail for invalid UUID format', () => {
      const result = OAuthConnectionId.createFromString('not-a-uuid');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_OAUTH_CONNECTION_ID);
    });

    it('should fail for UUID v4 (not v7)', () => {
      const uuidv4 = '550e8400-e29b-41d4-a716-446655440000';
      const result = OAuthConnectionId.createFromString(uuidv4);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_OAUTH_CONNECTION_ID);
    });

    it('should fail for empty string', () => {
      const result = OAuthConnectionId.createFromString('');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return true for same ID value', () => {
      const uuid = '019b24a8-c19c-7566-bf27-103fb4029456';
      const id1 = OAuthConnectionId.create(uuid);
      const id2 = OAuthConnectionId.create(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different ID values', () => {
      const id1 = OAuthConnectionId.create();
      const id2 = OAuthConnectionId.create();

      expect(id1.equals(id2)).toBe(false);
    });
  });
});

describe('OAuthConnection Entity', () => {
  let validUserId: UserId;
  let validProfile: OAuthProfile;

  beforeEach(() => {
    validUserId = UserId.create();
    validProfile = OAuthProfile.create({
      provider: AuthProvider.GOOGLE,
      providerUserId: 'google-123456',
      email: 'user@gmail.com',
      name: 'John Doe',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
    }).getValue();
  });

  describe('create()', () => {
    it('should create a valid OAuthConnection with required fields', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });

      expect(result.isOk).toBe(true);
      const connection = result.getValue();
      expect(connection.getUserId().equals(validUserId)).toBe(true);
      expect(connection.getProvider().equals(AuthProvider.GOOGLE)).toBe(true);
      expect(connection.getProviderUserId()).toBe('google-123456');
      expect(connection.getEmail()).toBe('user@gmail.com');
      expect(connection.getName()).toBe('John Doe');
      expect(connection.getAvatarUrl()).toBe('https://lh3.googleusercontent.com/avatar.jpg');
    });

    it('should create OAuthConnection with optional tokens', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        accessToken: 'ya29.access-token',
        refreshToken: '1//refresh-token',
        tokenExpiresAt: expiresAt,
      });

      expect(result.isOk).toBe(true);
      const connection = result.getValue();
      expect(connection.getAccessToken()).toBe('ya29.access-token');
      expect(connection.getRefreshToken()).toBe('1//refresh-token');
      expect(connection.getTokenExpiresAt()).toEqual(expiresAt);
    });

    it('should set tokens to null when not provided', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });

      expect(result.isOk).toBe(true);
      const connection = result.getValue();
      expect(connection.getAccessToken()).toBeNull();
      expect(connection.getRefreshToken()).toBeNull();
      expect(connection.getTokenExpiresAt()).toBeNull();
    });

    it('should fail when userId is null', () => {
      const result = OAuthConnection.create({
        userId: null as any,
        profile: validProfile,
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.OAUTH_USER_ID_REQUIRED);
    });

    it('should fail when profile is null', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: null as any,
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.OAUTH_PROFILE_REQUIRED);
    });

    it('should generate unique ID', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });

      expect(result.isOk).toBe(true);
      const connection = result.getValue();
      expect(connection.getId()).toBeDefined();
      expect(connection.getId().toValue()).toBeDefined();
    });

    it('should set timestamps', () => {
      const before = new Date();
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });
      const after = new Date();

      expect(result.isOk).toBe(true);
      const connection = result.getValue();
      expect(connection.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(connection.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
      expect(connection.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(connection.getUpdatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should emit OAuthAccountLinked domain event', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });

      expect(result.isOk).toBe(true);
      const connection = result.getValue();
      const events = connection.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OAuthAccountLinked);
      const event = events[0] as OAuthAccountLinked;
      expect(event.userId.equals(validUserId)).toBe(true);
      expect(event.provider.equals(AuthProvider.GOOGLE)).toBe(true);
      expect(event.providerUserId).toBe('google-123456');
    });
  });

  describe('reconstruct()', () => {
    it('should reconstruct OAuthConnection from persisted data', () => {
      const id = OAuthConnectionId.create();
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const tokenExpiresAt = new Date('2024-01-03');

      const connection = OAuthConnection.reconstruct({
        id,
        userId: validUserId,
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-789',
        email: 'user@facebook.com',
        name: 'Facebook User',
        avatarUrl: 'https://graph.facebook.com/avatar.jpg',
        accessToken: 'fb-access-token',
        refreshToken: 'fb-refresh-token',
        tokenExpiresAt,
        createdAt,
        updatedAt,
      });

      expect(connection.getId().equals(id)).toBe(true);
      expect(connection.getUserId().equals(validUserId)).toBe(true);
      expect(connection.getProvider().equals(AuthProvider.FACEBOOK)).toBe(true);
      expect(connection.getProviderUserId()).toBe('fb-789');
      expect(connection.getEmail()).toBe('user@facebook.com');
      expect(connection.getName()).toBe('Facebook User');
      expect(connection.getAvatarUrl()).toBe('https://graph.facebook.com/avatar.jpg');
      expect(connection.getAccessToken()).toBe('fb-access-token');
      expect(connection.getRefreshToken()).toBe('fb-refresh-token');
      expect(connection.getTokenExpiresAt()).toEqual(tokenExpiresAt);
      expect(connection.getCreatedAt()).toEqual(createdAt);
      expect(connection.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should not emit domain events on reconstruct', () => {
      const id = OAuthConnectionId.create();
      const connection = OAuthConnection.reconstruct({
        id,
        userId: validUserId,
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-123',
        email: null,
        name: null,
        avatarUrl: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const events = connection.getDomainEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('isTokenExpired()', () => {
    it('should return true when tokenExpiresAt is null', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        tokenExpiresAt: null,
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().isTokenExpired()).toBe(true);
    });

    it('should return true when token is expired', () => {
      const pastDate = new Date(Date.now() - 1000);
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        accessToken: 'token',
        tokenExpiresAt: pastDate,
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().isTokenExpired()).toBe(true);
    });

    it('should return false when token is still valid', () => {
      const futureDate = new Date(Date.now() + 3600000);
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        accessToken: 'token',
        tokenExpiresAt: futureDate,
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().isTokenExpired()).toBe(false);
    });
  });

  describe('hasValidToken()', () => {
    it('should return false when accessToken is null', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        accessToken: null,
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().hasValidToken()).toBe(false);
    });

    it('should return false when token is expired', () => {
      const pastDate = new Date(Date.now() - 1000);
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        accessToken: 'token',
        tokenExpiresAt: pastDate,
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().hasValidToken()).toBe(false);
    });

    it('should return true when token exists and not expired', () => {
      const futureDate = new Date(Date.now() + 3600000);
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        accessToken: 'valid-token',
        tokenExpiresAt: futureDate,
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().hasValidToken()).toBe(true);
    });
  });

  describe('updateTokens()', () => {
    it('should update all tokens', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });
      const connection = result.getValue();

      const originalUpdatedAt = connection.getUpdatedAt();
      const newExpiry = new Date(Date.now() + 7200000);

      // Small delay to ensure time difference
      connection.updateTokens('new-access', 'new-refresh', newExpiry);

      expect(connection.getAccessToken()).toBe('new-access');
      expect(connection.getRefreshToken()).toBe('new-refresh');
      expect(connection.getTokenExpiresAt()).toEqual(newExpiry);
      expect(connection.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should update only access token when other params are undefined', () => {
      const initialExpiry = new Date(Date.now() + 3600000);
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        accessToken: 'old-access',
        refreshToken: 'old-refresh',
        tokenExpiresAt: initialExpiry,
      });
      const connection = result.getValue();

      connection.updateTokens('new-access');

      expect(connection.getAccessToken()).toBe('new-access');
      expect(connection.getRefreshToken()).toBe('old-refresh');
      expect(connection.getTokenExpiresAt()).toEqual(initialExpiry);
    });

    it('should allow setting refreshToken to null', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
        refreshToken: 'old-refresh',
      });
      const connection = result.getValue();

      connection.updateTokens('new-access', null);

      expect(connection.getRefreshToken()).toBeNull();
    });
  });

  describe('updateProfile()', () => {
    it('should update profile information', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });
      const connection = result.getValue();

      const updatedProfile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-123456',
        email: 'new-email@gmail.com',
        name: 'Updated Name',
        avatarUrl: 'https://lh3.googleusercontent.com/new-avatar.jpg',
      }).getValue();

      const updateResult = connection.updateProfile(updatedProfile);

      expect(updateResult.isOk).toBe(true);
      expect(connection.getEmail()).toBe('new-email@gmail.com');
      expect(connection.getName()).toBe('Updated Name');
      expect(connection.getAvatarUrl()).toBe('https://lh3.googleusercontent.com/new-avatar.jpg');
    });

    it('should fail when provider is different', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });
      const connection = result.getValue();

      const facebookProfile = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-123',
        email: 'user@facebook.com',
      }).getValue();

      const updateResult = connection.updateProfile(facebookProfile);

      expect(updateResult.isFailure).toBe(true);
      expect(updateResult.getError()).toBe(ErrorCode.OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER);
    });

    it('should fail when providerUserId is different', () => {
      const result = OAuthConnection.create({
        userId: validUserId,
        profile: validProfile,
      });
      const connection = result.getValue();

      const differentUserProfile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'different-google-id',
        email: 'other@gmail.com',
      }).getValue();

      const updateResult = connection.updateProfile(differentUserProfile);

      expect(updateResult.isFailure).toBe(true);
      expect(updateResult.getError()).toBe(ErrorCode.OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER_ID);
    });
  });

  describe('provider checks', () => {
    it('should correctly identify Google connection', () => {
      const googleProfile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-123',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: validUserId,
        profile: googleProfile,
      }).getValue();

      expect(connection.isGoogle()).toBe(true);
      expect(connection.isFacebook()).toBe(false);
      expect(connection.isApple()).toBe(false);
    });

    it('should correctly identify Facebook connection', () => {
      const facebookProfile = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-123',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: validUserId,
        profile: facebookProfile,
      }).getValue();

      expect(connection.isGoogle()).toBe(false);
      expect(connection.isFacebook()).toBe(true);
      expect(connection.isApple()).toBe(false);
    });

    it('should correctly identify Apple connection', () => {
      const appleProfile = OAuthProfile.create({
        provider: AuthProvider.APPLE,
        providerUserId: 'apple-123',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: validUserId,
        profile: appleProfile,
      }).getValue();

      expect(connection.isGoogle()).toBe(false);
      expect(connection.isFacebook()).toBe(false);
      expect(connection.isApple()).toBe(true);
    });
  });
});
