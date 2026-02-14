import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { UserId } from '../value-objects/UserId.ts';
import { AuthProvider } from '../value-objects/AuthProvider.ts';

/**
 * Domain event: OAuthAccountLinked
 * Fired when an OAuth provider is linked to a user account
 * This happens during:
 * - First-time social login (creates user + links OAuth)
 * - Account linking (existing user links new OAuth provider)
 */
export class OAuthAccountLinked extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly provider: AuthProvider,
    public readonly providerUserId: string
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.userId.toValue();
  }
}
