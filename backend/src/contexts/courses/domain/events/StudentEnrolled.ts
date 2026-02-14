import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

/**
 * StudentEnrolled Domain Event
 * Raised when a student enrolls in a course
 */
export class StudentEnrolled extends DomainEvent {
  constructor(
    public readonly enrollmentId: EnrollmentId,
    public readonly courseId: CourseId,
    public readonly studentId: UserId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.enrollmentId.toValue();
  }
}
