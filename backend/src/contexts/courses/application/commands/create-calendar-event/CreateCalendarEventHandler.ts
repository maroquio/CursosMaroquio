import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateCalendarEventCommand } from './CreateCalendarEventCommand.ts';
import { type ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository.ts';
import { CalendarEvent } from '../../../domain/entities/CalendarEvent.ts';
import { CalendarEventType } from '../../../domain/value-objects/CalendarEventType.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type CalendarEventDto } from '../../dtos/CalendarEventDto.ts';

/**
 * CreateCalendarEventHandler
 * Handles creating a new calendar event
 */
export class CreateCalendarEventHandler implements ICommandHandler<CreateCalendarEventCommand, CalendarEventDto> {
  constructor(private calendarEventRepository: ICalendarEventRepository) {}

  async execute(command: CreateCalendarEventCommand): Promise<Result<CalendarEventDto>> {
    // Validate created by user ID
    const createdByResult = UserId.createFromString(command.createdBy);
    if (createdByResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
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

    // Create event
    const eventResult = CalendarEvent.create(
      command.title,
      date,
      typeResult.getValue(),
      createdByResult.getValue(),
      command.description,
      command.time,
      courseId
    );

    if (eventResult.isFailure) {
      return Result.fail(eventResult.getError() ?? ErrorCode.INTERNAL_ERROR);
    }

    const event = eventResult.getValue();

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
