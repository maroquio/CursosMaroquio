/**
 * UpdateCalendarEventCommand
 * Command to update a calendar event
 */
export class UpdateCalendarEventCommand {
  constructor(
    public readonly eventId: string,
    public readonly title: string,
    public readonly date: string,
    public readonly type: string,
    public readonly description?: string | null,
    public readonly time?: string | null,
    public readonly courseId?: string | null
  ) {}
}
