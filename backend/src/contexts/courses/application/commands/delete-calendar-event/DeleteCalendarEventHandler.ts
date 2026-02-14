import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteCalendarEventCommand } from './DeleteCalendarEventCommand.ts';
import { type ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository.ts';
import { CalendarEventId } from '../../../domain/value-objects/CalendarEventId.ts';

/**
 * DeleteCalendarEventHandler
 * Handles deleting a calendar event
 */
export class DeleteCalendarEventHandler implements ICommandHandler<DeleteCalendarEventCommand, void> {
  constructor(private calendarEventRepository: ICalendarEventRepository) {}

  async execute(command: DeleteCalendarEventCommand): Promise<Result<void>> {
    // Validate event ID
    const eventIdResult = CalendarEventId.createFromString(command.eventId);
    if (eventIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_CALENDAR_EVENT_ID);
    }

    // Check if event exists
    const event = await this.calendarEventRepository.findById(eventIdResult.getValue());
    if (!event) {
      return Result.fail(ErrorCode.CALENDAR_EVENT_NOT_FOUND);
    }

    // Delete
    await this.calendarEventRepository.delete(eventIdResult.getValue());

    return Result.ok(undefined);
  }
}
