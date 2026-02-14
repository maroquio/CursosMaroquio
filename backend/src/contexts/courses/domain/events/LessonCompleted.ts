import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { LessonId } from '../value-objects/LessonId.ts';

/**
 * LessonCompleted Domain Event
 * Raised when a student completes a lesson
 */
export class LessonCompleted extends DomainEvent {
  constructor(
    public readonly enrollmentId: EnrollmentId,
    public readonly lessonId: LessonId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.enrollmentId.toValue();
  }
}
