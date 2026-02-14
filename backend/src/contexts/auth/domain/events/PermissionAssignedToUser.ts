import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import type { UserId } from '../value-objects/UserId.ts';
import type { Permission } from '../value-objects/Permission.ts';

/**
 * Domain event: PermissionAssignedToUser
 * Fired when an individual permission is assigned directly to a user
 */
export class PermissionAssignedToUser extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly permission: Permission,
    public readonly assignedBy?: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.userId.toValue();
  }
}
