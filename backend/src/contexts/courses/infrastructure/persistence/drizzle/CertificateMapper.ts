import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { Certificate } from '../../../domain/entities/Certificate.ts';
import { CertificateId } from '../../../domain/value-objects/CertificateId.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type CertificateSchema } from './schema.ts';

export class CertificateMapper {
  public static toPersistence(certificate: Certificate) {
    return {
      id: certificate.getId().toValue(),
      enrollmentId: certificate.getEnrollmentId().toValue(),
      courseId: certificate.getCourseId().toValue(),
      studentId: certificate.getStudentId().toValue(),
      courseName: certificate.getCourseName(),
      studentName: certificate.getStudentName(),
      certificateNumber: certificate.getCertificateNumber(),
      sequentialNumber: certificate.getSequentialNumber(),
      issuedAt: certificate.getIssuedAt(),
    };
  }

  public static toDomain(raw: CertificateSchema): Result<Certificate> {
    const idResult = CertificateId.createFromString(raw.id);
    if (idResult.isFailure) return Result.fail(ErrorCode.INVALID_CERTIFICATE_ID);

    const enrollmentIdResult = EnrollmentId.createFromString(raw.enrollmentId);
    if (enrollmentIdResult.isFailure) return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);

    const courseIdResult = CourseId.createFromString(raw.courseId);
    if (courseIdResult.isFailure) return Result.fail(ErrorCode.INVALID_COURSE_ID);

    const studentIdResult = UserId.createFromString(raw.studentId);
    if (studentIdResult.isFailure) return Result.fail(ErrorCode.INVALID_USER_ID);

    const certificate = Certificate.reconstruct(
      idResult.getValue(),
      enrollmentIdResult.getValue(),
      courseIdResult.getValue(),
      studentIdResult.getValue(),
      raw.courseName,
      raw.studentName,
      raw.certificateNumber,
      raw.sequentialNumber,
      raw.issuedAt
    );

    return Result.ok(certificate);
  }
}
