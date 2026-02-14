import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { LessonId } from '../value-objects/LessonId.ts';
import { SectionId } from '../value-objects/SectionId.ts';

/**
 * SectionAdded Domain Event
 * Raised when a section is added to a lesson
 */
export class SectionAdded extends DomainEvent {
  constructor(
    public readonly lessonId: LessonId,
    public readonly sectionId: SectionId,
    public readonly title: string
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.lessonId.toValue();
  }
}
