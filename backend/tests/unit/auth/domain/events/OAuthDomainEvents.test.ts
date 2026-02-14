import { describe, it, expect } from 'vitest';
import { OAuthAccountLinked } from '@auth/domain/events/OAuthAccountLinked.ts';
import { OAuthAccountUnlinked } from '@auth/domain/events/OAuthAccountUnlinked.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { AuthProvider } from '@auth/domain/value-objects/AuthProvider.ts';

describe('OAuth Domain Events', () => {
  const userId = UserId.create();
  const adminUserId = UserId.create();

  describe('OAuthAccountLinked', () => {
    it('should create event with correct properties', () => {
      const event = new OAuthAccountLinked(
        userId,
        AuthProvider.GOOGLE,
        'google-provider-123'
      );

      expect(event.userId).toBe(userId);
      expect(event.provider.isGoogle()).toBe(true);
      expect(event.providerUserId).toBe('google-provider-123');
    });

    it('should return correct aggregate ID', () => {
      const event = new OAuthAccountLinked(
        userId,
        AuthProvider.FACEBOOK,
        'fb-456'
      );

      expect(event.getAggregateId()).toBe(userId.toValue());
    });

    it('should have occurred timestamp', () => {
      const before = new Date();
      const event = new OAuthAccountLinked(
        userId,
        AuthProvider.APPLE,
        'apple-789'
      );
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should work with all supported providers', () => {
      const googleEvent = new OAuthAccountLinked(userId, AuthProvider.GOOGLE, 'g-1');
      const facebookEvent = new OAuthAccountLinked(userId, AuthProvider.FACEBOOK, 'f-1');
      const appleEvent = new OAuthAccountLinked(userId, AuthProvider.APPLE, 'a-1');

      expect(googleEvent.provider.isGoogle()).toBe(true);
      expect(facebookEvent.provider.isFacebook()).toBe(true);
      expect(appleEvent.provider.isApple()).toBe(true);
    });

    it('should return correct event type', () => {
      const event = new OAuthAccountLinked(userId, AuthProvider.GOOGLE, 'g-1');

      expect(event.getEventType()).toBe('OAuthAccountLinked');
    });
  });

  describe('OAuthAccountUnlinked', () => {
    it('should create event with required properties', () => {
      const event = new OAuthAccountUnlinked(
        userId,
        AuthProvider.GOOGLE
      );

      expect(event.userId).toBe(userId);
      expect(event.provider.isGoogle()).toBe(true);
      expect(event.unlinkedBy).toBeUndefined();
    });

    it('should create event with unlinkedBy user', () => {
      const event = new OAuthAccountUnlinked(
        userId,
        AuthProvider.FACEBOOK,
        adminUserId
      );

      expect(event.userId).toBe(userId);
      expect(event.provider.isFacebook()).toBe(true);
      expect(event.unlinkedBy).toBe(adminUserId);
    });

    it('should return correct aggregate ID', () => {
      const event = new OAuthAccountUnlinked(
        userId,
        AuthProvider.APPLE
      );

      expect(event.getAggregateId()).toBe(userId.toValue());
    });

    it('should have occurred timestamp', () => {
      const before = new Date();
      const event = new OAuthAccountUnlinked(
        userId,
        AuthProvider.GOOGLE
      );
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should work with all supported providers', () => {
      const googleEvent = new OAuthAccountUnlinked(userId, AuthProvider.GOOGLE);
      const facebookEvent = new OAuthAccountUnlinked(userId, AuthProvider.FACEBOOK);
      const appleEvent = new OAuthAccountUnlinked(userId, AuthProvider.APPLE);

      expect(googleEvent.provider.isGoogle()).toBe(true);
      expect(facebookEvent.provider.isFacebook()).toBe(true);
      expect(appleEvent.provider.isApple()).toBe(true);
    });

    it('should return correct event type', () => {
      const event = new OAuthAccountUnlinked(userId, AuthProvider.GOOGLE);

      expect(event.getEventType()).toBe('OAuthAccountUnlinked');
    });

    it('should differentiate self-unlink from admin-unlink', () => {
      const selfUnlink = new OAuthAccountUnlinked(userId, AuthProvider.GOOGLE);
      const adminUnlink = new OAuthAccountUnlinked(userId, AuthProvider.GOOGLE, adminUserId);

      expect(selfUnlink.unlinkedBy).toBeUndefined();
      expect(adminUnlink.unlinkedBy).toBe(adminUserId);
      expect(adminUnlink.unlinkedBy?.equals(adminUserId)).toBe(true);
    });
  });

  describe('Event type identification', () => {
    it('should have correct constructor names for event type identification', () => {
      const linkedEvent = new OAuthAccountLinked(userId, AuthProvider.GOOGLE, 'g-1');
      const unlinkedEvent = new OAuthAccountUnlinked(userId, AuthProvider.GOOGLE);

      expect(linkedEvent.constructor.name).toBe('OAuthAccountLinked');
      expect(unlinkedEvent.constructor.name).toBe('OAuthAccountUnlinked');
    });
  });
});
