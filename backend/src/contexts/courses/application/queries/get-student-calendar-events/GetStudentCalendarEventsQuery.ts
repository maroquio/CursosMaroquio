/**
 * GetStudentCalendarEventsQuery
 * Query to get calendar events for a student (enrolled courses + global)
 */
export class GetStudentCalendarEventsQuery {
  constructor(public readonly studentId: string) {}
}
