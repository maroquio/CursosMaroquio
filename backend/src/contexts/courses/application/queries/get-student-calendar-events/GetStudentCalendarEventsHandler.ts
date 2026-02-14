import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetStudentCalendarEventsQuery } from './GetStudentCalendarEventsQuery.ts';
import { type ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type CalendarEventDto } from '../../dtos/CalendarEventDto.ts';

/**
 * GetStudentCalendarEventsHandler
 * Handles getting calendar events for a student (enrolled courses + global events)
 */
export class GetStudentCalendarEventsHandler implements IQueryHandler<GetStudentCalendarEventsQuery, CalendarEventDto[]> {
  constructor(
    private calendarEventRepository: ICalendarEventRepository,
    private enrollmentRepository: IEnrollmentRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute(query: GetStudentCalendarEventsQuery): Promise<Result<CalendarEventDto[]>> {
    // Validate student ID
    const studentIdResult = UserId.createFromString(query.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    // Get student's enrollments
    const enrollments = await this.enrollmentRepository.findByStudent(studentIdResult.getValue());

    // Extract course IDs from active enrollments
    const courseIds = enrollments
      .filter((e) => e.isActive() || e.isCompleted())
      .map((e) => e.getCourseId());

    // Get events for student (enrolled courses + global events)
    const events = await this.calendarEventRepository.findForStudent(courseIds);

    // Get course names
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
