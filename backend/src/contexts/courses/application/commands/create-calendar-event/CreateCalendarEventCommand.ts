/**
 * CreateCalendarEventCommand
 * Command to create a new calendar event
 */
export class CreateCalendarEventCommand {
  constructor(
    public readonly title: string,
    public readonly date: string,
    public readonly type: string,
    public readonly createdBy: string,
    public readonly description?: string | null,
    public readonly time?: string | null,
    public readonly courseId?: string | null
  ) {}
}
