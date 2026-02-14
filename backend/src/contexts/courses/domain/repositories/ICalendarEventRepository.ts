import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { CalendarEvent } from '../entities/CalendarEvent.ts';
import { CalendarEventId } from '../value-objects/CalendarEventId.ts';
import { CourseId } from '../value-objects/CourseId.ts';

export interface ICalendarEventRepository extends IRepository<CalendarEvent, CalendarEventId> {
  /**
   * Find all calendar events
   */
  findAll(): Promise<CalendarEvent[]>;

  /**
   * Find all calendar events for specific courses
   */
  findByCourseIds(courseIds: CourseId[]): Promise<CalendarEvent[]>;

  /**
   * Find all calendar events without a course (global events)
   */
  findGlobalEvents(): Promise<CalendarEvent[]>;

  /**
   * Find all calendar events for a student (enrolled courses + global events)
   */
  findForStudent(courseIds: CourseId[]): Promise<CalendarEvent[]>;
}
