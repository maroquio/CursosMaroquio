import { DomainEvent } from '../DomainEvent.ts';
import { Entity } from '../Entity.ts';
import { Identifier } from '../Identifier.ts';
import { createLogger, type ILogger } from '@shared/infrastructure/logging/Logger.ts';

/**
 * Domain event handler type
 */
export type DomainEventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

/**
 * Domain event subscriber interface
 */
export interface IDomainEventSubscriber<T extends DomainEvent = DomainEvent> {
  /**
   * The event types this subscriber handles
   */
  subscribedTo(): string[];

  /**
   * Handle the event
   */
  handle(event: T): Promise<void>;
}

/**
 * Domain Event Publisher
 * Manages event subscription and publishing
 * Implements the Observer pattern for domain events
 */
export class DomainEventPublisher {
  private static instance: DomainEventPublisher | null = null;
  private handlers: Map<string, DomainEventHandler[]> = new Map();
  private logger: ILogger;

  private constructor() {
    this.logger = createLogger('DomainEventPublisher');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DomainEventPublisher {
    if (!this.instance) {
      this.instance = new DomainEventPublisher();
    }
    return this.instance;
  }

  /**
   * Reset instance (useful for testing)
   */
  public static reset(): void {
    this.instance = null;
  }

  /**
   * Subscribe to an event type
   */
  public subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType) ?? [];
    handlers.push(handler as DomainEventHandler);
    this.handlers.set(eventType, handlers);

    this.logger.debug('Event handler subscribed', { eventType });
  }

  /**
   * Subscribe using a subscriber object
   */
  public addSubscriber<T extends DomainEvent>(
    subscriber: IDomainEventSubscriber<T>
  ): void {
    const eventTypes = subscriber.subscribedTo();
    for (const eventType of eventTypes) {
      this.subscribe(eventType, (event) => subscriber.handle(event as T));
    }
  }

  /**
   * Publish a single event
   */
  public async publish(event: DomainEvent): Promise<void> {
    const eventType = event.getEventType();
    const handlers = this.handlers.get(eventType) ?? [];

    if (handlers.length === 0) {
      this.logger.debug('No handlers for event', { eventType });
      return;
    }

    this.logger.info('Publishing domain event', {
      eventType,
      aggregateId: event.getAggregateId(),
      handlerCount: handlers.length,
    });

    const results = await Promise.allSettled(
      handlers.map((handler) => handler(event))
    );

    // Log any failures
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error('Event handler failed', result.reason as Error, {
          eventType,
        });
      }
    }
  }

  /**
   * Publish all events from an entity and clear them
   */
  public async publishEventsForAggregate<T extends Identifier<unknown>>(
    aggregate: Entity<T>
  ): Promise<void> {
    const events = aggregate.getDomainEvents();

    for (const event of events) {
      await this.publish(event);
    }

    aggregate.clearDomainEvents();
  }

  /**
   * Check if there are any handlers for an event type
   */
  public hasHandlers(eventType: string): boolean {
    const handlers = this.handlers.get(eventType);
    return handlers !== undefined && handlers.length > 0;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  public clearHandlers(): void {
    this.handlers.clear();
  }
}

/**
 * Get the domain event publisher singleton
 */
export function getDomainEventPublisher(): DomainEventPublisher {
  return DomainEventPublisher.getInstance();
}
