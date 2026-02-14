import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { CourseId } from '../value-objects/CourseId.ts';

/**
 * CoursePublished Domain Event
 * Raised when a course is published and made available to students
 */
export class CoursePublished extends DomainEvent {
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
