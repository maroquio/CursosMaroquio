import type { IDomainEventSubscriber } from '@shared/domain/events/DomainEventPublisher.ts';
import { UserCreated } from '../../domain/events/UserCreated.ts';
import { createLogger, type ILogger } from '@shared/infrastructure/logging/Logger.ts';

/**
 * Email Service Interface
 * Implement this interface for your email provider (SendGrid, AWS SES, etc.)
 */
export interface IEmailService {
  sendWelcomeEmail(email: string, userId: string): Promise<void>;
}

/**
 * SendWelcomeEmailHandler
 * Sends a welcome email when a new user is created
 *
 * Uses Dependency Injection - requires an IEmailService implementation.
 * For development/testing, use NoOpEmailService from infrastructure layer.
 *
 * @example
 * // Production with real email service
 * const handler = new SendWelcomeEmailHandler(new SendGridEmailService());
 *
 * // Development without email
 * const handler = new SendWelcomeEmailHandler(new NoOpEmailService());
 */
export class SendWelcomeEmailHandler implements IDomainEventSubscriber<UserCreated> {
  private logger: ILogger;

  constructor(private readonly emailService: IEmailService) {
    this.logger = createLogger('SendWelcomeEmailHandler');
  }

  /**
   * Event types this handler subscribes to
   */
  subscribedTo(): string[] {
    return ['UserCreated'];
  }

  /**
   * Handle the UserCreated event
   */
  async handle(event: UserCreated): Promise<void> {
    const email = event.email.getValue();
    const userId = event.userId.toValue();

    try {
      await this.emailService.sendWelcomeEmail(email, userId);
      this.logger.info('Welcome email sent', { email, userId });
    } catch (error) {
      // Don't throw - email failure shouldn't break registration
      this.logger.error('Failed to send welcome email', error as Error, {
        email,
        userId,
      });
    }
  }
}
