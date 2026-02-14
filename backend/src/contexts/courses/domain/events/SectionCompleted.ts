import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { SectionId } from '../value-objects/SectionId.ts';

/**
 * SectionCompleted Domain Event
 * Raised when a student completes a section
 */
export class SectionCompleted extends DomainEvent {
  constructor(
    public readonly enrollmentId: EnrollmentId,
    public readonly sectionId: SectionId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.enrollmentId.toValue();
  }
}
