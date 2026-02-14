import { DomainEvent } from '@shared/domain/DomainEvent.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { ModuleId } from '../value-objects/ModuleId.ts';

/**
 * ModuleRemoved Domain Event
 * Raised when a module is removed from a course
 */
export class ModuleRemoved extends DomainEvent {
  constructor(
    public readonly courseId: CourseId,
    public readonly moduleId: ModuleId
  ) {
    super();
  }

  public override getAggregateId(): string {
    return this.courseId.toValue();
  }
}
