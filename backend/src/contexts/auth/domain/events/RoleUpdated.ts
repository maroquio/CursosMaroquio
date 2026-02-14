import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import type { RoleId } from '../value-objects/RoleId.ts';
import type { UserId } from '../value-objects/UserId.ts';

/**
 * Domain event: RoleUpdated
 * Fired when a role's details are updated
 */
export class RoleUpdated extends DomainEvent {
  constructor(
    public readonly roleId: RoleId,
    public readonly name?: string,
    public readonly description?: string | null,
    public readonly updatedBy?: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.roleId.toValue();
  }
}
