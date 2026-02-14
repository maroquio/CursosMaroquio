import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { ModuleId } from '../value-objects/ModuleId.ts';

/**
 * ModuleAdded Domain Event
 * Raised when a module is added to a course
 */
export class ModuleAdded extends DomainEvent {
  constructor(
    public readonly courseId: CourseId,
    public readonly moduleId: ModuleId,
    public readonly title: string
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.courseId.toValue();
  }
}
