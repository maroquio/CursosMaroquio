import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ListCalendarEventsQuery } from './ListCalendarEventsQuery.ts';
import { type ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { type CalendarEventDto } from '../../dtos/CalendarEventDto.ts';

/**
 * ListCalendarEventsHandler
 * Handles listing all calendar events (admin)
 */
export class ListCalendarEventsHandler implements IQueryHandler<ListCalendarEventsQuery, CalendarEventDto[]> {
  constructor(
    private calendarEventRepository: ICalendarEventRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute(_query: ListCalendarEventsQuery): Promise<Result<CalendarEventDto[]>> {
    // Get all events
    const events = await this.calendarEventRepository.findAll();

    // Get course names for events with courseId
    const courseIds = events
      .map((e) => e.getCourseId())
      .filter((id): id is NonNullable<typeof id> => id !== null);

    const courseNames = new Map<string, string>();
    for (const courseId of courseIds) {
      const course = await this.courseRepository.findById(courseId);
      if (course) {
        courseNames.set(courseId.toValue(), course.getTitle());
      }
    }

    // Map to DTOs
    const dtos: CalendarEventDto[] = events.map((event) => ({
      id: event.getId().toValue(),
      title: event.getTitle(),
      description: event.getDescription(),
      date: event.getDate().toISOString(),
      time: event.getTime(),
      type: event.getTypeValue(),
      courseId: event.getCourseId()?.toValue() ?? null,
      courseName: event.getCourseId() ? courseNames.get(event.getCourseId()!.toValue()) ?? null : null,
      createdBy: event.getCreatedBy().toValue(),
      createdAt: event.getCreatedAt().toISOString(),
      updatedAt: event.getUpdatedAt().toISOString(),
    }));

    return Result.ok(dtos);
  }
}
