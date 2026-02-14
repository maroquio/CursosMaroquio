import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { VerifyCertificateQuery } from './VerifyCertificateQuery.ts';
import { type ICertificateRepository } from '../../../domain/repositories/ICertificateRepository.ts';
import { type CertificateDto } from '../../dtos/CertificateDto.ts';

/**
 * VerifyCertificateHandler
 * Handles verifying a certificate by its number (public endpoint)
 */
export class VerifyCertificateHandler implements IQueryHandler<VerifyCertificateQuery, CertificateDto | null> {
  constructor(private certificateRepository: ICertificateRepository) {}

  async execute(query: VerifyCertificateQuery): Promise<Result<CertificateDto | null>> {
    // Find certificate by number
    const certificate = await this.certificateRepository.findByCertificateNumber(query.certificateNumber);

    if (!certificate) {
      return Result.ok(null);
    }

    // Map to DTO
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
