import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

/**
 * Calendar Event Type value object
 * Represents the type of calendar event
 */
export type CalendarEventTypeValue = 'live' | 'deadline' | 'mentoring' | 'other';

export class CalendarEventType {
  private constructor(private readonly value: CalendarEventTypeValue) {}

  public static readonly LIVE = new CalendarEventType('live');
  public static readonly DEADLINE = new CalendarEventType('deadline');
  public static readonly MENTORING = new CalendarEventType('mentoring');
  public static readonly OTHER = new CalendarEventType('other');

  public static create(value: string): Result<CalendarEventType> {
    const validTypes: CalendarEventTypeValue[] = ['live', 'deadline', 'mentoring', 'other'];
    if (!validTypes.includes(value as CalendarEventTypeValue)) {
      return Result.fail(ErrorCode.CALENDAR_EVENT_INVALID_TYPE);
    }
    return Result.ok(new CalendarEventType(value as CalendarEventTypeValue));
  }

  public toValue(): CalendarEventTypeValue {
    return this.value;
  }

  public equals(other: CalendarEventType): boolean {
    return this.value === other.value;
  }
}
