import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GenerateCertificateCommand } from './GenerateCertificateCommand.ts';
import { type ICertificateRepository } from '../../../domain/repositories/ICertificateRepository.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { type IUserRepository } from '@auth/domain/repositories/IUserRepository.ts';
import { Certificate } from '../../../domain/entities/Certificate.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type CertificateDto } from '../../dtos/CertificateDto.ts';

/**
 * GenerateCertificateHandler
 * Handles generating a certificate for a completed enrollment
 */
export class GenerateCertificateHandler implements ICommandHandler<GenerateCertificateCommand, CertificateDto> {
  constructor(
    private certificateRepository: ICertificateRepository,
    private enrollmentRepository: IEnrollmentRepository,
    private courseRepository: ICourseRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: GenerateCertificateCommand): Promise<Result<CertificateDto>> {
    // Validate enrollment ID
    const enrollmentIdResult = EnrollmentId.createFromString(command.enrollmentId);
    if (enrollmentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);
    }

    // Validate student ID
    const studentIdResult = UserId.createFromString(command.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    const enrollmentId = enrollmentIdResult.getValue();
    const studentId = studentIdResult.getValue();

    // Check if enrollment exists
    const enrollment = await this.enrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      return Result.fail(ErrorCode.ENROLLMENT_NOT_FOUND);
    }

    // Verify ownership
    if (enrollment.getStudentId().toValue() !== studentId.toValue()) {
      return Result.fail(ErrorCode.FORBIDDEN);
    }

    // Check if enrollment is completed
    if (enrollment.getStatus() !== 'completed') {
      return Result.fail(ErrorCode.ENROLLMENT_NOT_ACTIVE);
    }

    // Check if certificate already exists
    const existingCertificate = await this.certificateRepository.findByEnrollment(enrollmentId);
    if (existingCertificate) {
      // Return existing certificate
      const dto: CertificateDto = {
        id: existingCertificate.getId().toValue(),
        enrollmentId: existingCertificate.getEnrollmentId().toValue(),
        courseId: existingCertificate.getCourseId().toValue(),
        studentId: existingCertificate.getStudentId().toValue(),
        courseName: existingCertificate.getCourseName(),
        studentName: existingCertificate.getStudentName(),
        certificateNumber: existingCertificate.getCertificateNumber(),
        issuedAt: existingCertificate.getIssuedAt().toISOString(),
      };
      return Result.ok(dto);
    }

    // Get course details
    const course = await this.courseRepository.findById(enrollment.getCourseId());
    if (!course) {
      return Result.fail(ErrorCode.COURSE_NOT_FOUND);
    }

    // Get student details
    const student = await this.userRepository.findById(studentId);
    if (!student) {
      return Result.fail(ErrorCode.USER_NOT_FOUND);
    }

    // Get next sequential number
    const sequentialNumber = await this.certificateRepository.getNextSequentialNumber();

    // Create certificate
    const certificateResult = Certificate.create(
      enrollmentId,
      enrollment.getCourseId(),
      studentId,
      course.getTitle(),
      student.getFullName(),
      sequentialNumber
    );

    if (certificateResult.isFailure) {
      return Result.fail(certificateResult.getError() ?? ErrorCode.INTERNAL_ERROR);
    }

    const certificate = certificateResult.getValue();

    // Save certificate
    await this.certificateRepository.save(certificate);

    // Return DTO
    const dto: CertificateDto = {
      id: certificate.getId().toValue(),
      enrollmentId: certificate.getEnrollmentId().toValue(),
      courseId: certificate.getCourseId().toValue(),
      studentId: certificate.getStudentId().toValue(),
      courseName: certificate.getCourseName(),
      studentName: certificate.getStudentName(),
      certificateNumber: certificate.getCertificateNumber(),
      issuedAt: certificate.getIssuedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
