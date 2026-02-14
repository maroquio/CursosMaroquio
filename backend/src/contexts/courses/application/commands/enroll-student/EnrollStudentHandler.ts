import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { EnrollStudentCommand } from './EnrollStudentCommand.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { CourseStatus } from '../../../domain/value-objects/CourseStatus.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Enrollment } from '../../../domain/entities/Enrollment.ts';
import { type EnrollmentDto } from '../../dtos/EnrollmentDto.ts';

/**
 * EnrollStudentHandler
 * Handles student enrollment in a course
 */
export class EnrollStudentHandler implements ICommandHandler<EnrollStudentCommand, EnrollmentDto> {
  constructor(
    private courseRepository: ICourseRepository,
    private enrollmentRepository: IEnrollmentRepository
  ) {}

  async execute(command: EnrollStudentCommand): Promise<Result<EnrollmentDto>> {
    // Validate course ID
    const courseIdResult = CourseId.createFromString(command.courseId);
    if (courseIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_COURSE_ID);
    }

    // Validate student ID
    const studentIdResult = UserId.createFromString(command.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    // Find course
    const course = await this.courseRepository.findById(courseIdResult.getValue());
    if (!course) {
      return Result.fail(ErrorCode.COURSE_NOT_FOUND);
    }

    // Check if course is published
    if (course.getStatus() !== CourseStatus.PUBLISHED) {
      return Result.fail(ErrorCode.ENROLLMENT_COURSE_NOT_PUBLISHED);
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentRepository.existsByStudentAndCourse(
      studentIdResult.getValue(),
      courseIdResult.getValue()
    );
    if (existingEnrollment) {
      return Result.fail(ErrorCode.ENROLLMENT_ALREADY_EXISTS);
    }

    // Create enrollment
    const enrollmentResult = Enrollment.create(
      courseIdResult.getValue(),
      studentIdResult.getValue()
    );

    if (enrollmentResult.isFailure) {
      return Result.fail(enrollmentResult.getError() as string);
    }

    const enrollment = enrollmentResult.getValue();

    // Persist
    try {
      await this.enrollmentRepository.save(enrollment);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(enrollment);

    // Return DTO
    const dto: EnrollmentDto = {
      id: enrollment.getId().toValue(),
      courseId: enrollment.getCourseId().toValue(),
      studentId: enrollment.getStudentId().toValue(),
      status: enrollment.getStatus(),
      progress: enrollment.getProgress(),
      enrolledAt: enrollment.getEnrolledAt().toISOString(),
      completedAt: enrollment.getCompletedAt()?.toISOString() ?? null,
      cancelledAt: enrollment.getCancelledAt()?.toISOString() ?? null,
    };

    return Result.ok(dto);
  }
}
