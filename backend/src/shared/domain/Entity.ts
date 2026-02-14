import { DomainEvent } from './DomainEvent.ts';
import { Identifier } from './Identifier.ts';

/**
 * Base class for Entities
 * Entities have identity and can change over time
 * Entities are responsible for maintaining business logic and invariants
 */
export abstract class Entity<TId extends Identifier<any>> {
  protected id: TId;
  protected domainEvents: DomainEvent[] = [];

  constructor(id: TId) {
    this.id = id;
  }

  /**
   * Get the entity's unique identifier
   */
  public getId(): TId {
    return this.id;
  }

  /**
   * Check equality with another entity (based on identity)
   */
  public equals(entity?: Entity<TId>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (!(entity instanceof this.constructor)) {
      return false;
    }

    return this.id.equals(entity.id);
  }

  /**
   * Add a domain event to be published
   */
  public addDomainEvent(domainEvent: DomainEvent): void {
    this.domainEvents.push(domainEvent);
  }

  /**
   * Get all domain events
   */
  public getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  /**
   * Clear all domain events after they've been published
   */
  public clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
