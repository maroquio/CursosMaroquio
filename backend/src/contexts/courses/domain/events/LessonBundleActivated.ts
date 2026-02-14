import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { LessonBundleId } from '../value-objects/LessonBundleId.ts';
import { LessonId } from '../value-objects/LessonId.ts';

/**
 * LessonBundleActivated Domain Event
 * Raised when a lesson bundle is activated (set as the current version)
 */
export class LessonBundleActivated extends DomainEvent {
  constructor(
    public readonly bundleId: LessonBundleId,
    public readonly lessonId: LessonId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.bundleId.toValue();
  }
}
