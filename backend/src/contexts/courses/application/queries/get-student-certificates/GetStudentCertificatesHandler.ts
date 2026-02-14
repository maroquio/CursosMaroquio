import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetStudentCertificatesQuery } from './GetStudentCertificatesQuery.ts';
import { type ICertificateRepository } from '../../../domain/repositories/ICertificateRepository.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type CertificateDto } from '../../dtos/CertificateDto.ts';

/**
 * GetStudentCertificatesHandler
 * Handles retrieving all certificates for a student
 */
export class GetStudentCertificatesHandler implements IQueryHandler<GetStudentCertificatesQuery, CertificateDto[]> {
  constructor(private certificateRepository: ICertificateRepository) {}

  async execute(query: GetStudentCertificatesQuery): Promise<Result<CertificateDto[]>> {
    // Validate student ID
    const studentIdResult = UserId.createFromString(query.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    // Get certificates
    const certificates = await this.certificateRepository.findByStudent(studentIdResult.getValue());

    // Map to DTOs
    const dtos: CertificateDto[] = certificates.map((cert) => ({
      id: cert.getId().toValue(),
      enrollmentId: cert.getEnrollmentId().toValue(),
      courseId: cert.getCourseId().toValue(),
      studentId: cert.getStudentId().toValue(),
      courseName: cert.getCourseName(),
      studentName: cert.getStudentName(),
      certificateNumber: cert.getCertificateNumber(),
      issuedAt: cert.getIssuedAt().toISOString(),
    }));

    return Result.ok(dtos);
  }
}
