import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { CourseId } from '../value-objects/CourseId.ts';

/**
 * CourseArchived Domain Event
 * Raised when a course is archived
 */
export class CourseArchived extends DomainEvent {
  constructor(
    public readonly courseId: CourseId,
    public readonly title: string
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.courseId.toValue();
  }
}
