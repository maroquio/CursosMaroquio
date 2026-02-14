import { describe, it, expect } from 'vitest';
import { OAuthProfile } from '@auth/domain/value-objects/OAuthProfile.ts';
import { AuthProvider } from '@auth/domain/value-objects/AuthProvider.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('OAuthProfile Value Object', () => {
  const validGoogleProfile = {
    provider: AuthProvider.GOOGLE,
    providerUserId: '123456789',
    email: 'user@gmail.com',
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  describe('create()', () => {
    it('should create a valid OAuthProfile with all fields', () => {
      const result = OAuthProfile.create(validGoogleProfile);

      expect(result.isOk).toBe(true);
      const profile = result.getValue();
      expect(profile.getProvider().equals(AuthProvider.GOOGLE)).toBe(true);
      expect(profile.getProviderUserId()).toBe('123456789');
      expect(profile.getEmail()).toBe('user@gmail.com');
      expect(profile.getName()).toBe('John Doe');
      expect(profile.getAvatarUrl()).toBe('https://example.com/avatar.jpg');
    });

    it('should create a valid OAuthProfile with only required fields', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
      });

      expect(result.isOk).toBe(true);
      const profile = result.getValue();
      expect(profile.getEmail()).toBeNull();
      expect(profile.getName()).toBeNull();
      expect(profile.getAvatarUrl()).toBeNull();
    });

    it('should trim whitespace from providerUserId and name', () => {
      // Note: email and avatarUrl are validated BEFORE trimming, so they cannot have surrounding whitespace
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '  123456789  ',
        email: 'user@gmail.com',
        name: '  John Doe  ',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(result.isOk).toBe(true);
      const profile = result.getValue();
      expect(profile.getProviderUserId()).toBe('123456789');
      expect(profile.getEmail()).toBe('user@gmail.com');
      expect(profile.getName()).toBe('John Doe');
      expect(profile.getAvatarUrl()).toBe('https://example.com/avatar.jpg');
    });

    it('should fail when provider is missing', () => {
      const result = OAuthProfile.create({
        provider: null as any,
        providerUserId: '123456789',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.OAUTH_PROVIDER_REQUIRED);
    });

    it('should fail when provider is local', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.LOCAL,
        providerUserId: '123456789',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.OAUTH_PROVIDER_LOCAL_NOT_ALLOWED);
    });

    it('should fail when providerUserId is empty', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.OAUTH_PROVIDER_USER_ID_REQUIRED);
    });

    it('should fail when providerUserId is whitespace only', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '   ',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.OAUTH_PROVIDER_USER_ID_REQUIRED);
    });

    it('should fail for invalid email format', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        email: 'invalid-email',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.OAUTH_INVALID_EMAIL_FORMAT);
    });

    it('should accept null email', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        email: null,
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().getEmail()).toBeNull();
    });

    it('should accept empty string email (converts to null)', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        email: '',
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().getEmail()).toBeNull();
    });

    it('should fail for invalid avatar URL format', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        avatarUrl: 'not-a-valid-url',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.OAUTH_INVALID_AVATAR_URL);
    });

    it('should accept null avatar URL', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        avatarUrl: null,
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().getAvatarUrl()).toBeNull();
    });

    it('should work with Facebook provider', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-123456',
        email: 'user@facebook.com',
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().getProvider().isFacebook()).toBe(true);
    });

    it('should work with Apple provider', () => {
      const result = OAuthProfile.create({
        provider: AuthProvider.APPLE,
        providerUserId: 'apple-123456',
        email: 'user@privaterelay.appleid.com',
      });

      expect(result.isOk).toBe(true);
      expect(result.getValue().getProvider().isApple()).toBe(true);
    });
  });

  describe('hasEmail()', () => {
    it('should return true when email is present', () => {
      const profile = OAuthProfile.create(validGoogleProfile).getValue();

      expect(profile.hasEmail()).toBe(true);
    });

    it('should return false when email is null', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        email: null,
      }).getValue();

      expect(profile.hasEmail()).toBe(false);
    });
  });

  describe('hasName()', () => {
    it('should return true when name is present', () => {
      const profile = OAuthProfile.create(validGoogleProfile).getValue();

      expect(profile.hasName()).toBe(true);
    });

    it('should return false when name is null', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        name: null,
      }).getValue();

      expect(profile.hasName()).toBe(false);
    });
  });

  describe('hasAvatar()', () => {
    it('should return true when avatar is present', () => {
      const profile = OAuthProfile.create(validGoogleProfile).getValue();

      expect(profile.hasAvatar()).toBe(true);
    });

    it('should return false when avatar is null', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        avatarUrl: null,
      }).getValue();

      expect(profile.hasAvatar()).toBe(false);
    });
  });

  describe('isAppleHiddenEmail()', () => {
    it('should return true for Apple private relay email', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.APPLE,
        providerUserId: 'apple-123',
        email: 'abc123@privaterelay.appleid.com',
      }).getValue();

      expect(profile.isAppleHiddenEmail()).toBe(true);
    });

    it('should return false for regular email', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-123',
        email: 'user@gmail.com',
      }).getValue();

      expect(profile.isAppleHiddenEmail()).toBe(false);
    });

    it('should return false when email is null', () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.APPLE,
        providerUserId: 'apple-123',
        email: null,
      }).getValue();

      expect(profile.isAppleHiddenEmail()).toBe(false);
    });
  });

  describe('equals()', () => {
    it('should return true for same provider and providerUserId', () => {
      const profile1 = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        email: 'user1@gmail.com',
        name: 'User One',
      }).getValue();

      const profile2 = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
        email: 'user2@gmail.com', // Different email
        name: 'User Two', // Different name
      }).getValue();

      expect(profile1.equals(profile2)).toBe(true);
    });

    it('should return false for different providerUserId', () => {
      const profile1 = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
      }).getValue();

      const profile2 = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '987654321',
      }).getValue();

      expect(profile1.equals(profile2)).toBe(false);
    });

    it('should return false for different provider', () => {
      const profile1 = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: '123456789',
      }).getValue();

      const profile2 = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: '123456789',
      }).getValue();

      expect(profile1.equals(profile2)).toBe(false);
    });
  });
});
