import type { IDomainEventSubscriber } from '@shared/domain/events/DomainEventPublisher.ts';
import { UserCreated } from '../../domain/events/UserCreated.ts';
import { createLogger, type ILogger } from '@shared/infrastructure/logging/Logger.ts';

/**
 * LogUserCreatedHandler
 * Logs when a new user is created
 * Example of a simple event handler for audit/logging purposes
 */
export class LogUserCreatedHandler implements IDomainEventSubscriber<UserCreated> {
  private logger: ILogger;

  constructor() {
    this.logger = createLogger('LogUserCreatedHandler');
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
    this.logger.info('New user registered', {
      userId: event.userId.toValue(),
      email: event.email.getValue(),
      occurredAt: event.occurredAt.toISOString(),
    });
  }
}
