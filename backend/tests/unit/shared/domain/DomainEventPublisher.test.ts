import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DomainEventPublisher,
  getDomainEventPublisher,
  type IDomainEventSubscriber,
} from '@shared/domain/events/DomainEventPublisher.ts';
import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { Entity } from '@shared/domain/Entity.ts';
import { Identifier } from '@shared/domain/Identifier.ts';

/**
 * Test Domain Event
 */
class TestEvent extends DomainEvent {
  constructor(public readonly data: string) {
    super();
  }

  override getAggregateId(): string {
    return 'test-aggregate-id';
  }

  override getEventType(): string {
    return 'TestEvent';
  }
}

/**
 * Another test event
 */
class AnotherEvent extends DomainEvent {
  constructor(public readonly value: number) {
    super();
  }

  override getAggregateId(): string {
    return 'another-aggregate-id';
  }

  override getEventType(): string {
    return 'AnotherEvent';
  }
}

/**
 * Test Identifier
 */
class TestId extends Identifier<string> {
  static create(value: string = 'test-id'): TestId {
    return new TestId(value);
  }
}

/**
 * Test Entity for aggregate events
 */
class TestAggregate extends Entity<TestId> {
  constructor(id: TestId) {
    super(id);
  }

  static create(): TestAggregate {
    return new TestAggregate(TestId.create());
  }

  addTestEvent(data: string): void {
    this.addDomainEvent(new TestEvent(data));
  }
}

/**
 * Test Subscriber implementing IDomainEventSubscriber
 */
class TestSubscriber implements IDomainEventSubscriber<TestEvent> {
  public handledEvents: TestEvent[] = [];

  subscribedTo(): string[] {
    return ['TestEvent'];
  }

  async handle(event: TestEvent): Promise<void> {
    this.handledEvents.push(event);
  }
}

/**
 * Multi-event subscriber
 */
class MultiEventSubscriber implements IDomainEventSubscriber<DomainEvent> {
  public handledEvents: DomainEvent[] = [];

  subscribedTo(): string[] {
    return ['TestEvent', 'AnotherEvent'];
  }

  async handle(event: DomainEvent): Promise<void> {
    this.handledEvents.push(event);
  }
}

describe('DomainEventPublisher', () => {
  let publisher: DomainEventPublisher;

  beforeEach(() => {
    DomainEventPublisher.reset();
    publisher = DomainEventPublisher.getInstance();
  });

  afterEach(() => {
    publisher.clearHandlers();
    DomainEventPublisher.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DomainEventPublisher.getInstance();
      const instance2 = DomainEventPublisher.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = DomainEventPublisher.getInstance();
      DomainEventPublisher.reset();
      const instance2 = DomainEventPublisher.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('getDomainEventPublisher', () => {
    it('should return the singleton instance', () => {
      const instance = getDomainEventPublisher();

      expect(instance).toBe(publisher);
    });
  });

  describe('subscribe', () => {
    it('should subscribe handler to event type', () => {
      const handler = async (_event: TestEvent) => {};

      publisher.subscribe('TestEvent', handler);

      expect(publisher.hasHandlers('TestEvent')).toBe(true);
    });

    it('should allow multiple handlers for same event type', () => {
      const handler1 = async (_event: TestEvent) => {};
      const handler2 = async (_event: TestEvent) => {};

      publisher.subscribe('TestEvent', handler1);
      publisher.subscribe('TestEvent', handler2);

      expect(publisher.hasHandlers('TestEvent')).toBe(true);
    });
  });

  describe('addSubscriber', () => {
    it('should add subscriber for single event type', () => {
      const subscriber = new TestSubscriber();

      publisher.addSubscriber(subscriber);

      expect(publisher.hasHandlers('TestEvent')).toBe(true);
    });

    it('should add subscriber for multiple event types', () => {
      const subscriber = new MultiEventSubscriber();

      publisher.addSubscriber(subscriber);

      expect(publisher.hasHandlers('TestEvent')).toBe(true);
      expect(publisher.hasHandlers('AnotherEvent')).toBe(true);
    });
  });

  describe('publish', () => {
    it('should publish event to subscribed handlers', async () => {
      const handledEvents: TestEvent[] = [];
      publisher.subscribe('TestEvent', async (event: TestEvent) => {
        handledEvents.push(event);
      });

      const event = new TestEvent('test-data');
      await publisher.publish(event);

      expect(handledEvents.length).toBe(1);
      expect(handledEvents[0]!.data).toBe('test-data');
    });

    it('should publish to multiple handlers', async () => {
      let handler1Called = false;
      let handler2Called = false;

      publisher.subscribe('TestEvent', async () => {
        handler1Called = true;
      });
      publisher.subscribe('TestEvent', async () => {
        handler2Called = true;
      });

      await publisher.publish(new TestEvent('data'));

      expect(handler1Called).toBe(true);
      expect(handler2Called).toBe(true);
    });

    it('should not throw when no handlers registered', async () => {
      const event = new TestEvent('no-handlers');

      await publisher.publish(event);
      // Should complete without error
    });

    it('should handle handler errors gracefully', async () => {
      publisher.subscribe('TestEvent', async () => {
        throw new Error('Handler error');
      });

      const event = new TestEvent('error-case');

      // Should not throw - errors are logged but not propagated
      await publisher.publish(event);
    });

    it('should continue executing other handlers when one fails', async () => {
      let handler2Called = false;

      publisher.subscribe('TestEvent', async () => {
        throw new Error('First handler fails');
      });
      publisher.subscribe('TestEvent', async () => {
        handler2Called = true;
      });

      await publisher.publish(new TestEvent('data'));

      expect(handler2Called).toBe(true);
    });

    it('should call subscriber handle method', async () => {
      const subscriber = new TestSubscriber();
      publisher.addSubscriber(subscriber);

      const event = new TestEvent('subscriber-test');
      await publisher.publish(event);

      expect(subscriber.handledEvents.length).toBe(1);
      expect(subscriber.handledEvents[0]!.data).toBe('subscriber-test');
    });
  });

  describe('publishEventsForAggregate', () => {
    it('should publish all events from aggregate', async () => {
      const handledEvents: TestEvent[] = [];
      publisher.subscribe('TestEvent', async (event: TestEvent) => {
        handledEvents.push(event);
      });

      const aggregate = TestAggregate.create();
      aggregate.addTestEvent('event-1');
      aggregate.addTestEvent('event-2');

      await publisher.publishEventsForAggregate(aggregate);

      expect(handledEvents.length).toBe(2);
      expect(handledEvents[0]!.data).toBe('event-1');
      expect(handledEvents[1]!.data).toBe('event-2');
    });

    it('should clear aggregate events after publishing', async () => {
      const aggregate = TestAggregate.create();
      aggregate.addTestEvent('event');

      expect(aggregate.getDomainEvents().length).toBe(1);

      await publisher.publishEventsForAggregate(aggregate);

      expect(aggregate.getDomainEvents().length).toBe(0);
    });

    it('should handle aggregate with no events', async () => {
      const aggregate = TestAggregate.create();

      await publisher.publishEventsForAggregate(aggregate);

      expect(aggregate.getDomainEvents().length).toBe(0);
    });
  });

  describe('hasHandlers', () => {
    it('should return false when no handlers', () => {
      expect(publisher.hasHandlers('NonExistentEvent')).toBe(false);
    });

    it('should return true when handlers exist', () => {
      publisher.subscribe('TestEvent', async () => {});

      expect(publisher.hasHandlers('TestEvent')).toBe(true);
    });

    it('should return false for different event type', () => {
      publisher.subscribe('TestEvent', async () => {});

      expect(publisher.hasHandlers('OtherEvent')).toBe(false);
    });
  });

  describe('clearHandlers', () => {
    it('should remove all handlers', () => {
      publisher.subscribe('TestEvent', async () => {});
      publisher.subscribe('AnotherEvent', async () => {});

      publisher.clearHandlers();

      expect(publisher.hasHandlers('TestEvent')).toBe(false);
      expect(publisher.hasHandlers('AnotherEvent')).toBe(false);
    });
  });
});
