import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import type { UserId } from '../value-objects/UserId.ts';
import type { Permission } from '../value-objects/Permission.ts';

/**
 * Domain event: PermissionRemovedFromUser
 * Fired when an individual permission is removed from a user
 */
export class PermissionRemovedFromUser extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly permission: Permission,
    public readonly removedBy?: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.userId.toValue();
  }
}
