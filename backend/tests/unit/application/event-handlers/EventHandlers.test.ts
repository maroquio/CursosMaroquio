import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogUserCreatedHandler } from '@auth/application/event-handlers/LogUserCreatedHandler.ts';
import {
  SendWelcomeEmailHandler,
  type IEmailService,
} from '@auth/application/event-handlers/SendWelcomeEmailHandler.ts';
import { UserCreated } from '@auth/domain/events/UserCreated.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';

/**
 * Mock email service for testing
 */
class MockEmailService implements IEmailService {
  public sentEmails: Array<{ email: string; userId: string }> = [];
  public shouldFail = false;
  public failureError = new Error('Email service unavailable');

  async sendWelcomeEmail(email: string, userId: string): Promise<void> {
    if (this.shouldFail) {
      throw this.failureError;
    }
    this.sentEmails.push({ email, userId });
  }

  clear(): void {
    this.sentEmails = [];
    this.shouldFail = false;
  }
}

describe('Event Handlers', () => {
  describe('LogUserCreatedHandler', () => {
    let handler: LogUserCreatedHandler;
    let testUserId: UserId;
    let testEmail: Email;
    let testEvent: UserCreated;

    beforeEach(() => {
      handler = new LogUserCreatedHandler();
      testUserId = UserId.create();
      testEmail = Email.create('test@example.com').getValue();
      testEvent = new UserCreated(testUserId, testEmail);
    });

    describe('subscribedTo', () => {
      it('should subscribe to UserCreated events', () => {
        const events = handler.subscribedTo();

        expect(events).toContain('UserCreated');
        expect(events.length).toBe(1);
      });
    });

    describe('handle', () => {
      it('should handle UserCreated event without throwing', async () => {
        // Should not throw
        await handler.handle(testEvent);
      });

      it('should complete successfully with valid event', async () => {
        const result = handler.handle(testEvent);

        await expect(result).resolves.toBeUndefined();
      });

      it('should process event with all required fields', async () => {
        const userId = UserId.create();
        const email = Email.create('another@example.com').getValue();
        const event = new UserCreated(userId, email);

        // Should handle without errors
        await handler.handle(event);
      });
    });
  });

  describe('SendWelcomeEmailHandler', () => {
    let handler: SendWelcomeEmailHandler;
    let emailService: MockEmailService;
    let testUserId: UserId;
    let testEmail: Email;
    let testEvent: UserCreated;

    beforeEach(() => {
      emailService = new MockEmailService();
      handler = new SendWelcomeEmailHandler(emailService);
      testUserId = UserId.create();
      testEmail = Email.create('welcome@example.com').getValue();
      testEvent = new UserCreated(testUserId, testEmail);
    });

    describe('subscribedTo', () => {
      it('should subscribe to UserCreated events', () => {
        const events = handler.subscribedTo();

        expect(events).toContain('UserCreated');
        expect(events.length).toBe(1);
      });
    });

    describe('handle - success cases', () => {
      it('should send welcome email when handling UserCreated event', async () => {
        await handler.handle(testEvent);

        expect(emailService.sentEmails.length).toBe(1);
        expect(emailService.sentEmails[0]!.email).toBe('welcome@example.com');
        expect(emailService.sentEmails[0]!.userId).toBe(testUserId.toValue());
      });

      it('should send email with correct user data', async () => {
        const userId = UserId.create();
        const email = Email.create('specific@example.com').getValue();
        const event = new UserCreated(userId, email);

        await handler.handle(event);

        expect(emailService.sentEmails[0]!.email).toBe('specific@example.com');
        expect(emailService.sentEmails[0]!.userId).toBe(userId.toValue());
      });

      it('should complete successfully', async () => {
        const result = handler.handle(testEvent);

        await expect(result).resolves.toBeUndefined();
      });
    });

    describe('handle - error cases', () => {
      it('should not throw when email service fails', async () => {
        emailService.shouldFail = true;

        // Should not throw - graceful degradation
        await handler.handle(testEvent);
      });

      it('should handle email service errors gracefully', async () => {
        emailService.shouldFail = true;
        emailService.failureError = new Error('SMTP connection timeout');

        const result = handler.handle(testEvent);

        // Should resolve without error even when email fails
        await expect(result).resolves.toBeUndefined();
      });

      it('should not send email when service fails', async () => {
        emailService.shouldFail = true;

        await handler.handle(testEvent);

        expect(emailService.sentEmails.length).toBe(0);
      });

      it('should handle network errors without propagating', async () => {
        emailService.shouldFail = true;
        emailService.failureError = new Error('Network unreachable');

        // Should not throw
        await handler.handle(testEvent);
      });
    });

    describe('multiple events', () => {
      it('should handle multiple UserCreated events independently', async () => {
        const user1 = new UserCreated(
          UserId.create(),
          Email.create('user1@example.com').getValue()
        );
        const user2 = new UserCreated(
          UserId.create(),
          Email.create('user2@example.com').getValue()
        );

        await handler.handle(user1);
        await handler.handle(user2);

        expect(emailService.sentEmails.length).toBe(2);
        expect(emailService.sentEmails[0]!.email).toBe('user1@example.com');
        expect(emailService.sentEmails[1]!.email).toBe('user2@example.com');
      });

      it('should continue handling events after one fails', async () => {
        const user1 = new UserCreated(
          UserId.create(),
          Email.create('user1@example.com').getValue()
        );
        const user2 = new UserCreated(
          UserId.create(),
          Email.create('user2@example.com').getValue()
        );

        // First event fails
        emailService.shouldFail = true;
        await handler.handle(user1);

        // Second event succeeds
        emailService.shouldFail = false;
        await handler.handle(user2);

        expect(emailService.sentEmails.length).toBe(1);
        expect(emailService.sentEmails[0]!.email).toBe('user2@example.com');
      });
    });
  });
});
