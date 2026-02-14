/**
 * CalendarEventDto
 * Data Transfer Object for CalendarEvent
 */
export interface CalendarEventDto {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  type: 'live' | 'deadline' | 'mentoring' | 'other';
  courseId: string | null;
  courseName?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * CreateCalendarEventDto
 * Input for creating a calendar event
 */
export interface CreateCalendarEventDto {
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  type: 'live' | 'deadline' | 'mentoring' | 'other';
  courseId?: string | null;
}

/**
 * UpdateCalendarEventDto
 * Input for updating a calendar event
 */
export interface UpdateCalendarEventDto {
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  type: 'live' | 'deadline' | 'mentoring' | 'other';
  courseId?: string | null;
}
