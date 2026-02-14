import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoOpEmailService } from '@auth/infrastructure/services/NoOpEmailService.ts';

describe('NoOpEmailService', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console.log to suppress debug output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create instance successfully', () => {
      const service = new NoOpEmailService();
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(NoOpEmailService);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should complete successfully without sending email', async () => {
      const service = new NoOpEmailService();

      // Should not throw
      await expect(service.sendWelcomeEmail('user@example.com', 'user-123')).resolves.toBeUndefined();
    });

    it('should accept any valid email and userId', async () => {
      const service = new NoOpEmailService();

      // Various email formats
      await expect(service.sendWelcomeEmail('simple@test.com', 'id-1')).resolves.toBeUndefined();
      await expect(
        service.sendWelcomeEmail('complex+tag@subdomain.example.org', 'uuid-formatted-id')
      ).resolves.toBeUndefined();
    });

    it('should be callable multiple times', async () => {
      const service = new NoOpEmailService();

      for (let i = 0; i < 5; i++) {
        await expect(
          service.sendWelcomeEmail(`user${i}@example.com`, `user-${i}`)
        ).resolves.toBeUndefined();
      }
    });

    it('should implement IEmailService interface', async () => {
      const service = new NoOpEmailService();

      // Verify it has the required method
      expect(typeof service.sendWelcomeEmail).toBe('function');
    });
  });

  describe('Null Object Pattern', () => {
    it('should provide safe default behavior', async () => {
      const service = new NoOpEmailService();

      // The service should never throw, even with edge-case inputs
      await expect(service.sendWelcomeEmail('', '')).resolves.toBeUndefined();
    });

    it('should be substitutable for real email service', async () => {
      // This test demonstrates the Null Object Pattern
      // NoOpEmailService can be used in place of any IEmailService implementation

      const processUser = async (
        email: string,
        userId: string,
        emailService: { sendWelcomeEmail: (email: string, userId: string) => Promise<void> }
      ) => {
        await emailService.sendWelcomeEmail(email, userId);
        return 'processed';
      };

      const service = new NoOpEmailService();
      const result = await processUser('test@example.com', 'user-1', service);

      expect(result).toBe('processed');
    });
  });
});
