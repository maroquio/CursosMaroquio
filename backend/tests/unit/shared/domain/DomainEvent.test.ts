import { describe, it, expect } from 'vitest';
import { DomainEvent } from '@shared/domain/DomainEvent.ts';

/**
 * Concrete implementation of DomainEvent for testing
 */
class TestEvent extends DomainEvent {
  constructor(public readonly testId: string) {
    super();
  }

  override getAggregateId(): string {
    return this.testId;
  }
}

/**
 * Concrete event that doesn't override getAggregateId
 * to test the base class behavior
 */
class UnimplementedEvent extends DomainEvent {
  // Intentionally doesn't override getAggregateId
}

describe('DomainEvent', () => {
  describe('constructor', () => {
    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = new TestEvent('test-id');
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getAggregateId', () => {
    it('should return aggregate ID from concrete implementation', () => {
      const event = new TestEvent('my-aggregate-123');

      expect(event.getAggregateId()).toBe('my-aggregate-123');
    });

    it('should throw error when not implemented', () => {
      const event = new UnimplementedEvent();

      expect(() => event.getAggregateId()).toThrow('getAggregateId method not implemented');
    });
  });

  describe('getEventType', () => {
    it('should return constructor name for TestEvent', () => {
      const event = new TestEvent('test-id');

      expect(event.getEventType()).toBe('TestEvent');
    });

    it('should return constructor name for UnimplementedEvent', () => {
      const event = new UnimplementedEvent();

      expect(event.getEventType()).toBe('UnimplementedEvent');
    });
  });

  describe('occurredAt', () => {
    it('should be readonly timestamp', () => {
      const event1 = new TestEvent('id-1');

      // Wait a tiny bit
      const event2 = new TestEvent('id-2');

      expect(event1.occurredAt).not.toBe(event2.occurredAt);
    });
  });
});
