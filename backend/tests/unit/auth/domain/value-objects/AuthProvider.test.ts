import { describe, it, expect } from 'vitest';
import { AuthProvider, OAuthProviders } from '@auth/domain/value-objects/AuthProvider.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('AuthProvider Value Object', () => {
  describe('create()', () => {
    it('should create a valid AuthProvider for google', () => {
      const result = AuthProvider.create('google');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('google');
    });

    it('should create a valid AuthProvider for facebook', () => {
      const result = AuthProvider.create('facebook');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('facebook');
    });

    it('should create a valid AuthProvider for apple', () => {
      const result = AuthProvider.create('apple');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('apple');
    });

    it('should create a valid AuthProvider for local', () => {
      const result = AuthProvider.create('local');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('local');
    });

    it('should normalize provider name to lowercase', () => {
      const result = AuthProvider.create('GOOGLE');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('google');
    });

    it('should trim whitespace from provider name', () => {
      const result = AuthProvider.create('  google  ');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('google');
    });

    it('should fail for empty provider name', () => {
      const result = AuthProvider.create('');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.AUTH_PROVIDER_EMPTY);
    });

    it('should fail for whitespace-only provider name', () => {
      const result = AuthProvider.create('   ');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.AUTH_PROVIDER_EMPTY);
    });

    it('should fail for invalid provider name', () => {
      const result = AuthProvider.create('twitter');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.AUTH_PROVIDER_INVALID);
    });
  });

  describe('fromString()', () => {
    it('should create AuthProvider from valid string', () => {
      const provider = AuthProvider.fromString('google');

      expect(provider.getValue()).toBe('google');
    });

    it('should throw for invalid provider string', () => {
      expect(() => AuthProvider.fromString('invalid')).toThrow();
    });
  });

  describe('static instances', () => {
    it('should have LOCAL static instance', () => {
      expect(AuthProvider.LOCAL.getValue()).toBe('local');
    });

    it('should have GOOGLE static instance', () => {
      expect(AuthProvider.GOOGLE.getValue()).toBe('google');
    });

    it('should have FACEBOOK static instance', () => {
      expect(AuthProvider.FACEBOOK.getValue()).toBe('facebook');
    });

    it('should have APPLE static instance', () => {
      expect(AuthProvider.APPLE.getValue()).toBe('apple');
    });
  });

  describe('isLocal()', () => {
    it('should return true for local provider', () => {
      expect(AuthProvider.LOCAL.isLocal()).toBe(true);
    });

    it('should return false for OAuth providers', () => {
      expect(AuthProvider.GOOGLE.isLocal()).toBe(false);
      expect(AuthProvider.FACEBOOK.isLocal()).toBe(false);
      expect(AuthProvider.APPLE.isLocal()).toBe(false);
    });
  });

  describe('isOAuth()', () => {
    it('should return true for OAuth providers', () => {
      expect(AuthProvider.GOOGLE.isOAuth()).toBe(true);
      expect(AuthProvider.FACEBOOK.isOAuth()).toBe(true);
      expect(AuthProvider.APPLE.isOAuth()).toBe(true);
    });

    it('should return false for local provider', () => {
      expect(AuthProvider.LOCAL.isOAuth()).toBe(false);
    });
  });

  describe('provider-specific checks', () => {
    it('should correctly identify Google provider', () => {
      expect(AuthProvider.GOOGLE.isGoogle()).toBe(true);
      expect(AuthProvider.FACEBOOK.isGoogle()).toBe(false);
    });

    it('should correctly identify Facebook provider', () => {
      expect(AuthProvider.FACEBOOK.isFacebook()).toBe(true);
      expect(AuthProvider.GOOGLE.isFacebook()).toBe(false);
    });

    it('should correctly identify Apple provider', () => {
      expect(AuthProvider.APPLE.isApple()).toBe(true);
      expect(AuthProvider.GOOGLE.isApple()).toBe(false);
    });
  });

  describe('isValidProvider()', () => {
    it('should return true for valid providers', () => {
      expect(AuthProvider.isValidProvider('google')).toBe(true);
      expect(AuthProvider.isValidProvider('facebook')).toBe(true);
      expect(AuthProvider.isValidProvider('apple')).toBe(true);
      expect(AuthProvider.isValidProvider('local')).toBe(true);
    });

    it('should return false for invalid providers', () => {
      expect(AuthProvider.isValidProvider('twitter')).toBe(false);
      expect(AuthProvider.isValidProvider('github')).toBe(false);
      expect(AuthProvider.isValidProvider('')).toBe(false);
    });
  });

  describe('getOAuthProviders()', () => {
    it('should return all OAuth providers excluding local', () => {
      const providers = AuthProvider.getOAuthProviders();

      expect(providers).toContain('google');
      expect(providers).toContain('facebook');
      expect(providers).toContain('apple');
      expect(providers).not.toContain('local');
    });
  });

  describe('getAllProviders()', () => {
    it('should return all providers including local', () => {
      const providers = AuthProvider.getAllProviders();

      expect(providers).toContain('google');
      expect(providers).toContain('facebook');
      expect(providers).toContain('apple');
      expect(providers).toContain('local');
    });
  });

  describe('equals()', () => {
    it('should return true for same provider', () => {
      const provider1 = AuthProvider.create('google').getValue();
      const provider2 = AuthProvider.create('google').getValue();

      expect(provider1.equals(provider2)).toBe(true);
    });

    it('should return false for different providers', () => {
      const google = AuthProvider.create('google').getValue();
      const facebook = AuthProvider.create('facebook').getValue();

      expect(google.equals(facebook)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return provider value as string', () => {
      expect(AuthProvider.GOOGLE.toString()).toBe('google');
      expect(AuthProvider.LOCAL.toString()).toBe('local');
    });
  });

  describe('OAuthProviders constant', () => {
    it('should have all expected providers', () => {
      expect(OAuthProviders.LOCAL).toBe('local');
      expect(OAuthProviders.GOOGLE).toBe('google');
      expect(OAuthProviders.FACEBOOK).toBe('facebook');
      expect(OAuthProviders.APPLE).toBe('apple');
    });
  });
});
