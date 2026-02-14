/**
 * Base class for domain events
 * Domain events represent important business events that occurred
 */
export abstract class DomainEvent {
  /**
   * Timestamp when the event occurred
   */
  public readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }

  /**
   * Get the event type name
   */
  public getAggregateId(): string {
    throw new Error('getAggregateId method not implemented');
  }

  /**
   * Get the event type
   */
  public getEventType(): string {
    return this.constructor.name;
  }
}
