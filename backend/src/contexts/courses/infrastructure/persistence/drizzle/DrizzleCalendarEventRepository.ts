import { eq, inArray, isNull, or } from 'drizzle-orm';
import type { IDatabaseProvider, DrizzleDatabase } from '@shared/infrastructure/database/types.ts';
import type { ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository.ts';
import { CalendarEvent } from '../../../domain/entities/CalendarEvent.ts';
import { CalendarEventId } from '../../../domain/value-objects/CalendarEventId.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { calendarEventsTable } from './schema.ts';
import { CalendarEventMapper } from './mappers/CalendarEventMapper.ts';

/**
 * DrizzleCalendarEventRepository
 * Implements ICalendarEventRepository using Drizzle ORM
 */
export class DrizzleCalendarEventRepository implements ICalendarEventRepository {
  private db: DrizzleDatabase;

  constructor(private databaseProvider: IDatabaseProvider) {
    this.db = databaseProvider.getDb();
  }

  async save(event: CalendarEvent): Promise<void> {
    const data = CalendarEventMapper.toPersistence(event);
    await this.db.insert(calendarEventsTable).values(data).onConflictDoUpdate({
      target: calendarEventsTable.id,
      set: {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        type: data.type,
        courseId: data.courseId,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: CalendarEventId): Promise<CalendarEvent | null> {
    const result = await this.db
      .select()
      .from(calendarEventsTable)
      .where(eq(calendarEventsTable.id, id.toValue()));

    if (!result || result.length === 0) return null;

    const mapped = CalendarEventMapper.toDomain(result[0]!);
    return mapped.isOk ? mapped.getValue() : null;
  }

  async exists(id: CalendarEventId): Promise<boolean> {
    const result = await this.db
      .select({ id: calendarEventsTable.id })
      .from(calendarEventsTable)
      .where(eq(calendarEventsTable.id, id.toValue()));

    return result.length > 0;
  }

  async delete(id: CalendarEventId): Promise<void> {
    await this.db
      .delete(calendarEventsTable)
      .where(eq(calendarEventsTable.id, id.toValue()));
  }

  async findAll(): Promise<CalendarEvent[]> {
    const results = await this.db.select().from(calendarEventsTable);

    return results
      .map((row) => CalendarEventMapper.toDomain(row))
      .filter((result) => result.isOk)
      .map((result) => result.getValue());
  }

  async findByCourseIds(courseIds: CourseId[]): Promise<CalendarEvent[]> {
    if (courseIds.length === 0) return [];

    const courseIdValues = courseIds.map((id) => id.toValue());
    const results = await this.db
      .select()
      .from(calendarEventsTable)
      .where(inArray(calendarEventsTable.courseId, courseIdValues));

    return results
      .map((row) => CalendarEventMapper.toDomain(row))
      .filter((result) => result.isOk)
      .map((result) => result.getValue());
  }

  async findGlobalEvents(): Promise<CalendarEvent[]> {
    const results = await this.db
      .select()
      .from(calendarEventsTable)
      .where(isNull(calendarEventsTable.courseId));

    return results
      .map((row) => CalendarEventMapper.toDomain(row))
      .filter((result) => result.isOk)
      .map((result) => result.getValue());
  }

  async findForStudent(courseIds: CourseId[]): Promise<CalendarEvent[]> {
    let query;

    if (courseIds.length === 0) {
      // Only global events
      query = this.db
        .select()
        .from(calendarEventsTable)
        .where(isNull(calendarEventsTable.courseId));
    } else {
      // Global events + events for enrolled courses
      const courseIdValues = courseIds.map((id) => id.toValue());
      query = this.db
        .select()
        .from(calendarEventsTable)
        .where(
          or(
            isNull(calendarEventsTable.courseId),
            inArray(calendarEventsTable.courseId, courseIdValues)
          )
        );
    }

    const results = await query;

    return results
      .map((row) => CalendarEventMapper.toDomain(row))
      .filter((result) => result.isOk)
      .map((result) => result.getValue());
  }
}
