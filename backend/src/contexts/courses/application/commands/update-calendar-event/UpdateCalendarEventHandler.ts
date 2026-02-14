import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateCalendarEventCommand } from './UpdateCalendarEventCommand.ts';
import { type ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository.ts';
import { CalendarEventId } from '../../../domain/value-objects/CalendarEventId.ts';
import { CalendarEventType } from '../../../domain/value-objects/CalendarEventType.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { type CalendarEventDto } from '../../dtos/CalendarEventDto.ts';

/**
 * UpdateCalendarEventHandler
 * Handles updating a calendar event
 */
export class UpdateCalendarEventHandler implements ICommandHandler<UpdateCalendarEventCommand, CalendarEventDto> {
  constructor(private calendarEventRepository: ICalendarEventRepository) {}

  async execute(command: UpdateCalendarEventCommand): Promise<Result<CalendarEventDto>> {
    // Validate event ID
    const eventIdResult = CalendarEventId.createFromString(command.eventId);
    if (eventIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_CALENDAR_EVENT_ID);
    }

    // Find event
    const event = await this.calendarEventRepository.findById(eventIdResult.getValue());
    if (!event) {
      return Result.fail(ErrorCode.CALENDAR_EVENT_NOT_FOUND);
    }

    // Validate type
    const typeResult = CalendarEventType.create(command.type);
    if (typeResult.isFailure) {
      return Result.fail(typeResult.getError() ?? ErrorCode.CALENDAR_EVENT_INVALID_TYPE);
    }

    // Validate course ID if provided
    let courseId: CourseId | null = null;
    if (command.courseId) {
      const courseIdResult = CourseId.createFromString(command.courseId);
      if (courseIdResult.isFailure) {
        return Result.fail(ErrorCode.INVALID_COURSE_ID);
      }
      courseId = courseIdResult.getValue();
    }

    // Parse date
    const date = new Date(command.date);
    if (isNaN(date.getTime())) {
      return Result.fail(ErrorCode.VALIDATION_ERROR);
    }

    // Update event
    const updateResult = event.update(
      command.title,
      date,
      typeResult.getValue(),
      command.description,
      command.time,
      courseId
    );

    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError() ?? ErrorCode.INTERNAL_ERROR);
    }

    // Save
    await this.calendarEventRepository.save(event);

    // Return DTO
    const dto: CalendarEventDto = {
      id: event.getId().toValue(),
      title: event.getTitle(),
      description: event.getDescription(),
      date: event.getDate().toISOString(),
      time: event.getTime(),
      type: event.getTypeValue(),
      courseId: event.getCourseId()?.toValue() ?? null,
      createdBy: event.getCreatedBy().toValue(),
      createdAt: event.getCreatedAt().toISOString(),
      updatedAt: event.getUpdatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
