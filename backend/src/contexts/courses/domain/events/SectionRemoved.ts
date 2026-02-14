import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { LessonId } from '../value-objects/LessonId.ts';
import { SectionId } from '../value-objects/SectionId.ts';

/**
 * SectionRemoved Domain Event
 * Raised when a section is removed from a lesson
 */
export class SectionRemoved extends DomainEvent {
  constructor(
    public readonly lessonId: LessonId,
    public readonly sectionId: SectionId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.lessonId.toValue();
  }
}
