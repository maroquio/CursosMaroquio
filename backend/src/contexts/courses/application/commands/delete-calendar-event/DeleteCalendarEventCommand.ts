/**
 * DeleteCalendarEventCommand
 * Command to delete a calendar event
 */
export class DeleteCalendarEventCommand {
  constructor(public readonly eventId: string) {}
}
