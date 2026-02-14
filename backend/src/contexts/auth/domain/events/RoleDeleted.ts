import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import type { RoleId } from '../value-objects/RoleId.ts';
import type { UserId } from '../value-objects/UserId.ts';

/**
 * Domain event: RoleDeleted
 * Fired when a role is deleted from the system
 */
export class RoleDeleted extends DomainEvent {
  constructor(
    public readonly roleId: RoleId,
    public readonly name: string,
    public readonly deletedBy?: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.roleId.toValue();
  }
}
