import type { IEmailService } from '../../application/event-handlers/SendWelcomeEmailHandler.ts';
import { createLogger, type ILogger } from '@shared/infrastructure/logging/Logger.ts';

/**
 * NoOpEmailService
 *
 * Null Object Pattern implementation of IEmailService.
 * Use this when email functionality is not configured/needed.
 *
 * Instead of making emailService optional and checking for null,
 * inject this service to maintain consistent behavior and follow DIP.
 *
 * @example
 * // In production with real email service
 * const handler = new SendWelcomeEmailHandler(new SendGridEmailService());
 *
 * // In development or when email is disabled
 * const handler = new SendWelcomeEmailHandler(new NoOpEmailService());
 */
export class NoOpEmailService implements IEmailService {
  private logger: ILogger;

  constructor() {
    this.logger = createLogger('NoOpEmailService');
  }

  async sendWelcomeEmail(email: string, userId: string): Promise<void> {
    this.logger.debug('Email would be sent (NoOp)', {
      type: 'welcome',
      email,
      userId,
    });
  }
}
