import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

/**
 * CourseCreated Domain Event
 * Raised when a new course is created
 */
export class CourseCreated extends DomainEvent {
  constructor(
    public readonly courseId: CourseId,
    public readonly title: string,
    public readonly instructorId: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.courseId.toValue();
  }
}
