import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import type { RoleId } from '../value-objects/RoleId.ts';
import type { UserId } from '../value-objects/UserId.ts';

/**
 * Domain event: RoleCreated
 * Fired when a new role is created in the system
 */
export class RoleCreated extends DomainEvent {
  constructor(
    public readonly roleId: RoleId,
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdBy?: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.roleId.toValue();
  }
}
