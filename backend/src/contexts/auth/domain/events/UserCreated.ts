import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { UserId } from '../value-objects/UserId.ts';
import { Email } from '../value-objects/Email.ts';

/**
 * Domain event: UserCreated
 * Fired when a new user is successfully created
 */
export class UserCreated extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.userId.toValue();
  }
}
