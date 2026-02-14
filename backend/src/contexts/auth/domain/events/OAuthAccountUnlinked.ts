import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { UserId } from '../value-objects/UserId.ts';
import { AuthProvider } from '../value-objects/AuthProvider.ts';

/**
 * Domain event: OAuthAccountUnlinked
 * Fired when an OAuth provider is unlinked from a user account
 * Users can unlink OAuth providers as long as they have:
 * - A password set, OR
 * - Another OAuth provider linked
 */
export class OAuthAccountUnlinked extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly provider: AuthProvider,
    public readonly unlinkedBy?: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.userId.toValue();
  }
}
