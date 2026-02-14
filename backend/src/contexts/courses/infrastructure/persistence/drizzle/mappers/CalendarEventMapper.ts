import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CalendarEvent } from '../../../../domain/entities/CalendarEvent.ts';
import { CalendarEventId } from '../../../../domain/value-objects/CalendarEventId.ts';
import { CalendarEventType } from '../../../../domain/value-objects/CalendarEventType.ts';
import { CourseId } from '../../../../domain/value-objects/CourseId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import type { CalendarEventSchema, CalendarEventInsert } from '../schema.ts';

/**
 * CalendarEventMapper
 * Maps between CalendarEvent domain entity and Drizzle database schema
 */
export class CalendarEventMapper {
  /**
   * Map database record to domain entity
   */
  public static toDomain(raw: CalendarEventSchema): Result<CalendarEvent> {
    // Create CalendarEventId
    const eventIdResult = CalendarEventId.createFromString(raw.id);
    if (eventIdResult.isFailure) {
      return Result.fail(eventIdResult.getError() ?? ErrorCode.INVALID_CALENDAR_EVENT_ID);
    }

    // Create CalendarEventType
    const typeResult = CalendarEventType.create(raw.type);
    if (typeResult.isFailure) {
      return Result.fail(typeResult.getError() ?? ErrorCode.CALENDAR_EVENT_INVALID_TYPE);
    }

    // Create CourseId if present
    let courseId: CourseId | null = null;
    if (raw.courseId) {
      const courseIdResult = CourseId.createFromString(raw.courseId);
      if (courseIdResult.isOk) {
        courseId = courseIdResult.getValue();
      }
    }

    // Create CreatedBy UserId
    const createdByResult = UserId.createFromString(raw.createdBy);
    if (createdByResult.isFailure) {
      return Result.fail(createdByResult.getError() ?? ErrorCode.INVALID_USER_ID);
    }

    const event = CalendarEvent.reconstruct(
      eventIdResult.getValue(),
      raw.title,
      raw.description,
      raw.date,
      raw.time,
      typeResult.getValue(),
      courseId,
      createdByResult.getValue(),
      raw.createdAt,
      raw.updatedAt
    );

    return Result.ok(event);
  }

  /**
   * Map domain entity to database insert format
   */
  public static toPersistence(event: CalendarEvent): CalendarEventInsert {
    return {
      id: event.getId().toValue(),
      title: event.getTitle(),
      description: event.getDescription(),
      date: event.getDate(),
      time: event.getTime(),
      type: event.getTypeValue(),
      courseId: event.getCourseId()?.toValue() ?? null,
      createdBy: event.getCreatedBy().toValue(),
      createdAt: event.getCreatedAt(),
      updatedAt: event.getUpdatedAt(),
    };
  }
}
