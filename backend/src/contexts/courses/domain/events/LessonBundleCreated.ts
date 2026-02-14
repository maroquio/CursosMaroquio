import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { LessonBundleId } from '../value-objects/LessonBundleId.ts';
import { LessonId } from '../value-objects/LessonId.ts';

/**
 * LessonBundleCreated Domain Event
 * Raised when a new lesson bundle is uploaded
 */
export class LessonBundleCreated extends DomainEvent {
  constructor(
    public readonly bundleId: LessonBundleId,
    public readonly lessonId: LessonId,
    public readonly version: number
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.bundleId.toValue();
  }
}
