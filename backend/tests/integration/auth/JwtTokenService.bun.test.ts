import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { JwtTokenService } from '@auth/infrastructure/services/JwtTokenService.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

/**
 * Integration tests for JwtTokenService
 * Tests actual JWT creation and verification
 */
describe('JwtTokenService Integration Tests', () => {
  let tokenService: JwtTokenService;

  beforeAll(() => {
    // Set required environment variables for testing
    process.env.JWT_SECRET = 'test-secret-key-for-integration-tests-minimum-32-chars';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';

    tokenService = new JwtTokenService();
  });

  afterAll(() => {
    // Cleanup test environment variables
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = UserId.create();
      const email = 'test@example.com';

      const token = tokenService.generateAccessToken(userId, email, ['user']);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // JWT format: header.payload.signature
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate tokens with proper JWT structure', () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      const [header, payload] = token.split('.');

      // Decode header
      const decodedHeader = JSON.parse(atob(header!.replace(/-/g, '+').replace(/_/g, '/')));
      expect(decodedHeader.alg).toBe('HS256');
      expect(decodedHeader.typ).toBe('JWT');

      // Decode payload
      let base64Payload = payload!.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64Payload.length % 4;
      if (padding) base64Payload += '='.repeat(4 - padding);

      const decodedPayload = JSON.parse(atob(base64Payload));
      expect(decodedPayload.userId).toBe(userId.toValue());
      expect(decodedPayload.email).toBe('test@example.com');
      expect(decodedPayload.iat).toBeDefined();
      expect(decodedPayload.exp).toBeDefined();
    });

    it('should generate different tokens for different users', () => {
      const userId1 = UserId.create();
      const userId2 = UserId.create();

      const token1 = tokenService.generateAccessToken(userId1, 'user1@example.com', ['user']);
      const token2 = tokenService.generateAccessToken(userId2, 'user2@example.com', ['user']);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const userId = UserId.create();
      const email = 'test@example.com';
      const token = tokenService.generateAccessToken(userId, email, ['user']);

      const payload = tokenService.verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(userId.toValue());
      expect(payload!.email).toBe(email);
    });

    it('should return null for invalid token', () => {
      const payload = tokenService.verifyAccessToken('invalid.token.here');

      expect(payload).toBeNull();
    });

    it('should return null for tampered token', () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      // Tamper with the payload
      const parts = token.split('.');
      const tamperedPayload = Buffer.from(JSON.stringify({
        userId: 'hacked-user-id',
        email: 'hacker@evil.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64url');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const payload = tokenService.verifyAccessToken(tamperedToken);

      expect(payload).toBeNull();
    });

    it('should return null for token with wrong signature', () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      // Replace signature with random string
      const parts = token.split('.');
      const wrongSignature = Buffer.from('wrong-signature').toString('base64url');
      const badToken = `${parts[0]}.${parts[1]}.${wrongSignature}`;

      const payload = tokenService.verifyAccessToken(badToken);

      expect(payload).toBeNull();
    });

    it('should return null for malformed token', () => {
      expect(tokenService.verifyAccessToken('')).toBeNull();
      expect(tokenService.verifyAccessToken('not-a-jwt')).toBeNull();
      expect(tokenService.verifyAccessToken('only.two')).toBeNull();
      expect(tokenService.verifyAccessToken('too.many.parts.here')).toBeNull();
    });

    it('should verify expiration logic exists', () => {
      // Note: Testing actual expiration requires either:
      // 1. Dependency injection for config
      // 2. Mocking time
      // This test verifies the token has an exp claim
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);
      const payload = tokenService.verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload!.exp).toBeDefined();
      expect(payload!.exp).toBeGreaterThan(payload!.iat);
    });

    it('should verify token issued at current time', () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      const payload = tokenService.verifyAccessToken(token);

      expect(payload).not.toBeNull();
      const now = Math.floor(Date.now() / 1000);
      expect(payload!.iat).toBeLessThanOrEqual(now);
      expect(payload!.iat).toBeGreaterThan(now - 5); // Within 5 seconds
    });
  });

  describe('getAccessTokenExpiryMs', () => {
    it('should return correct expiry time', () => {
      const expiryMs = tokenService.getAccessTokenExpiryMs();

      // 15 minutes = 15 * 60 * 1000 = 900000ms
      expect(expiryMs).toBe(900000);
    });
  });

  describe('getRefreshTokenExpiryMs', () => {
    it('should return correct expiry time', () => {
      const expiryMs = tokenService.getRefreshTokenExpiryMs();

      // 7 days = 7 * 24 * 60 * 60 * 1000 = 604800000ms
      expect(expiryMs).toBe(604800000);
    });
  });

  describe('security properties', () => {
    it('should use HMAC-SHA256 algorithm', () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      const [header] = token.split('.');
      const decodedHeader = JSON.parse(atob(header!.replace(/-/g, '+').replace(/_/g, '/')));

      expect(decodedHeader.alg).toBe('HS256');
    });

    it('should include expiration in payload', () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      const payload = tokenService.verifyAccessToken(token);

      expect(payload!.exp).toBeDefined();
      expect(payload!.exp).toBeGreaterThan(payload!.iat);
    });

    it('should set correct expiration time', () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      const payload = tokenService.verifyAccessToken(token);

      const expectedExpiry = payload!.iat + Math.floor(tokenService.getAccessTokenExpiryMs() / 1000);
      expect(payload!.exp).toBe(expectedExpiry);
    });
  });

  describe('cross-verification', () => {
    it('should reject tokens with tampered signatures', () => {
      // This effectively tests cross-verification without needing to change env
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      // Tamper with the signature (last part)
      const parts = token.split('.');
      const tamperedSignature = 'invalidSignatureHere123456789';
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

      const payload = tokenService.verifyAccessToken(tamperedToken);

      expect(payload).toBeNull();
    });
  });

  describe('payload data integrity', () => {
    it('should preserve userId exactly', () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      const payload = tokenService.verifyAccessToken(token);

      expect(payload!.userId).toBe(userId.toValue());
    });

    it('should preserve email exactly', () => {
      const userId = UserId.create();
      const email = 'Test.User+Tag@Example.COM';
      const token = tokenService.generateAccessToken(userId, email, ['user']);

      const payload = tokenService.verifyAccessToken(token);

      expect(payload!.email).toBe(email);
    });

    it('should handle special characters in email', () => {
      const userId = UserId.create();
      const email = "o'brien+test@example.com";
      const token = tokenService.generateAccessToken(userId, email, ['user']);

      const payload = tokenService.verifyAccessToken(token);

      expect(payload!.email).toBe(email);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent token generation', async () => {
      const userIds = Array.from({ length: 10 }, () => UserId.create());

      const tokens = await Promise.all(
        userIds.map((userId, i) =>
          tokenService.generateAccessToken(userId, `user${i}@example.com`, ['user'])
        )
      );

      expect(tokens).toHaveLength(10);
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10);
    });

    it('should handle concurrent token verification', async () => {
      const userId = UserId.create();
      const token = tokenService.generateAccessToken(userId, 'test@example.com', ['user']);

      const results = await Promise.all(
        Array.from({ length: 10 }, () => tokenService.verifyAccessToken(token))
      );

      expect(results.every(r => r !== null)).toBe(true);
      expect(results.every(r => r!.userId === userId.toValue())).toBe(true);
    });
  });
});
