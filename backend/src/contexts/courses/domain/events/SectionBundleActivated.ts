import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { SectionBundleId } from '../value-objects/SectionBundleId.ts';
import { SectionId } from '../value-objects/SectionId.ts';

/**
 * SectionBundleActivated Domain Event
 * Raised when a section bundle is activated (set as the current version)
 */
export class SectionBundleActivated extends DomainEvent {
  constructor(
    public readonly bundleId: SectionBundleId,
    public readonly sectionId: SectionId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.bundleId.toValue();
  }
}
