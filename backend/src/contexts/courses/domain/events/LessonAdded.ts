import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { LessonId } from '../value-objects/LessonId.ts';

/**
 * LessonAdded Domain Event
 * Raised when a lesson is added to a course
 */
export class LessonAdded extends DomainEvent {
  constructor(
    public readonly courseId: CourseId,
    public readonly lessonId: LessonId,
    public readonly lessonTitle: string
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.courseId.toValue();
  }
}
