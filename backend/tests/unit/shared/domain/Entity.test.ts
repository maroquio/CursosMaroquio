import { describe, it, expect, beforeEach } from 'vitest';
import { Entity } from '@shared/domain/Entity.ts';
import { Identifier } from '@shared/domain/Identifier.ts';
import { DomainEvent } from '@shared/domain/DomainEvent.ts';

/**
 * Test Identifier for Entity tests
 */
class TestId extends Identifier<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string = 'test-id'): TestId {
    return new TestId(value);
  }
}

/**
 * Test Domain Event
 */
class TestEvent extends DomainEvent {
  constructor(public readonly data: string) {
    super();
  }

  override getAggregateId(): string {
    return 'test-aggregate';
  }
}

/**
 * Concrete Entity for testing
 */
class TestEntity extends Entity<TestId> {
  constructor(id: TestId, public name: string) {
    super(id);
  }

  static create(name: string, id?: string): TestEntity {
    return new TestEntity(TestId.create(id ?? 'default-id'), name);
  }
}

/**
 * Different Entity class for type comparison tests
 */
class OtherEntity extends Entity<TestId> {
  constructor(id: TestId) {
    super(id);
  }
}

describe('Entity', () => {
  describe('constructor and getId', () => {
    it('should create entity with id', () => {
      const id = TestId.create('entity-1');
      const entity = new TestEntity(id, 'Test');

      expect(entity.getId()).toBe(id);
    });

    it('should preserve id value', () => {
      const entity = TestEntity.create('Test', 'my-id');

      expect(entity.getId().toValue()).toBe('my-id');
    });
  });

  describe('equals', () => {
    it('should return true for same entity', () => {
      const entity = TestEntity.create('Test', 'same-id');

      expect(entity.equals(entity)).toBe(true);
    });

    it('should return true for entities with same id', () => {
      const entity1 = TestEntity.create('Test 1', 'shared-id');
      const entity2 = TestEntity.create('Test 2', 'shared-id');

      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should return false for entities with different ids', () => {
      const entity1 = TestEntity.create('Test', 'id-1');
      const entity2 = TestEntity.create('Test', 'id-2');

      expect(entity1.equals(entity2)).toBe(false);
    });

    it('should return false when compared with null', () => {
      const entity = TestEntity.create('Test');

      expect(entity.equals(null as any)).toBe(false);
    });

    it('should return false when compared with undefined', () => {
      const entity = TestEntity.create('Test');

      expect(entity.equals(undefined)).toBe(false);
    });

    it('should return false when compared with different entity type', () => {
      const testEntity = new TestEntity(TestId.create('same-id'), 'Test');
      const otherEntity = new OtherEntity(TestId.create('same-id'));

      expect(testEntity.equals(otherEntity as any)).toBe(false);
    });
  });

  describe('domain events', () => {
    let entity: TestEntity;

    beforeEach(() => {
      entity = TestEntity.create('Test');
    });

    it('should start with no domain events', () => {
      expect(entity.getDomainEvents()).toEqual([]);
      expect(entity.getDomainEvents().length).toBe(0);
    });

    it('should add domain event', () => {
      const event = new TestEvent('data');

      entity.addDomainEvent(event);

      expect(entity.getDomainEvents().length).toBe(1);
      expect(entity.getDomainEvents()[0]).toBe(event);
    });

    it('should add multiple domain events', () => {
      const event1 = new TestEvent('data1');
      const event2 = new TestEvent('data2');

      entity.addDomainEvent(event1);
      entity.addDomainEvent(event2);

      expect(entity.getDomainEvents().length).toBe(2);
      expect(entity.getDomainEvents()[0]).toBe(event1);
      expect(entity.getDomainEvents()[1]).toBe(event2);
    });

    it('should clear domain events', () => {
      entity.addDomainEvent(new TestEvent('data'));
      expect(entity.getDomainEvents().length).toBe(1);

      entity.clearDomainEvents();

      expect(entity.getDomainEvents()).toEqual([]);
      expect(entity.getDomainEvents().length).toBe(0);
    });

    it('should clear all events when multiple exist', () => {
      entity.addDomainEvent(new TestEvent('data1'));
      entity.addDomainEvent(new TestEvent('data2'));
      entity.addDomainEvent(new TestEvent('data3'));

      entity.clearDomainEvents();

      expect(entity.getDomainEvents().length).toBe(0);
    });

    it('should allow adding events after clearing', () => {
      entity.addDomainEvent(new TestEvent('before'));
      entity.clearDomainEvents();

      const afterEvent = new TestEvent('after');
      entity.addDomainEvent(afterEvent);

      expect(entity.getDomainEvents().length).toBe(1);
      expect(entity.getDomainEvents()[0]).toBe(afterEvent);
    });
  });
});
