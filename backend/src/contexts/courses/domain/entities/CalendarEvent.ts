import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CalendarEventId } from '../value-objects/CalendarEventId.ts';
import { CalendarEventType, type CalendarEventTypeValue } from '../value-objects/CalendarEventType.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

interface CalendarEventProps {
  title: string;
  description: string | null;
  date: Date;
  time: string | null;
  type: CalendarEventType;
  courseId: CourseId | null;
  createdBy: UserId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CalendarEvent Entity
 * Represents a scheduled event for students
 */
export class CalendarEvent extends Entity<CalendarEventId> {
  private props: CalendarEventProps;

  private constructor(id: CalendarEventId, props: CalendarEventProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new calendar event
   */
  public static create(
    title: string,
    date: Date,
    type: CalendarEventType,
    createdBy: UserId,
    description?: string | null,
    time?: string | null,
    courseId?: CourseId | null
  ): Result<CalendarEvent> {
    // Validate title
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.CALENDAR_EVENT_TITLE_EMPTY);
    }
    if (title.length > 200) {
      return Result.fail(ErrorCode.CALENDAR_EVENT_TITLE_TOO_LONG);
    }

    const now = new Date();
    const event = new CalendarEvent(CalendarEventId.create(), {
      title: title.trim(),
      description: description?.trim() ?? null,
      date,
      time: time ?? null,
      type,
      courseId: courseId ?? null,
      createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(event);
  }

  /**
   * Reconstruct a calendar event from persistence
   */
  public static reconstruct(
    id: CalendarEventId,
    title: string,
    description: string | null,
    date: Date,
    time: string | null,
    type: CalendarEventType,
    courseId: CourseId | null,
    createdBy: UserId,
    createdAt: Date,
    updatedAt: Date
  ): CalendarEvent {
    return new CalendarEvent(id, {
      title,
      description,
      date,
      time,
      type,
      courseId,
      createdBy,
      createdAt,
      updatedAt,
    });
  }

  // Getters
  public getTitle(): string {
    return this.props.title;
  }

  public getDescription(): string | null {
    return this.props.description;
  }

  public getDate(): Date {
    return this.props.date;
  }

  public getTime(): string | null {
    return this.props.time;
  }

  public getType(): CalendarEventType {
    return this.props.type;
  }

  public getTypeValue(): CalendarEventTypeValue {
    return this.props.type.toValue();
  }

  public getCourseId(): CourseId | null {
    return this.props.courseId;
  }

  public getCreatedBy(): UserId {
    return this.props.createdBy;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic

  /**
   * Update the calendar event
   */
  public update(
    title: string,
    date: Date,
    type: CalendarEventType,
    description?: string | null,
    time?: string | null,
    courseId?: CourseId | null
  ): Result<void> {
    // Validate title
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.CALENDAR_EVENT_TITLE_EMPTY);
    }
    if (title.length > 200) {
      return Result.fail(ErrorCode.CALENDAR_EVENT_TITLE_TOO_LONG);
    }

    this.props.title = title.trim();
    this.props.description = description?.trim() ?? null;
    this.props.date = date;
    this.props.time = time ?? null;
    this.props.type = type;
    this.props.courseId = courseId ?? null;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
