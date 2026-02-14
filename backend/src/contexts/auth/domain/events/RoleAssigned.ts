import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import type { UserId } from '../value-objects/UserId.ts';
import type { Role } from '../value-objects/Role.ts';

/**
 * Domain event: RoleAssigned
 * Fired when a role is assigned to a user
 */
export class RoleAssigned extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly role: Role,
    public readonly assignedBy?: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.userId.toValue();
  }
}
