import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import type { UserId } from '../value-objects/UserId.ts';
import type { Role } from '../value-objects/Role.ts';

/**
 * Domain event: RoleRemoved
 * Fired when a role is removed from a user
 */
export class RoleRemoved extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly role: Role,
    public readonly removedBy?: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.userId.toValue();
  }
}
