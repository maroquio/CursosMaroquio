import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { SectionBundleId } from '../value-objects/SectionBundleId.ts';
import { SectionId } from '../value-objects/SectionId.ts';

/**
 * SectionBundleCreated Domain Event
 * Raised when a new section bundle is uploaded
 */
export class SectionBundleCreated extends DomainEvent {
  constructor(
    public readonly bundleId: SectionBundleId,
    public readonly sectionId: SectionId,
    public readonly version: number
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.bundleId.toValue();
  }
}
