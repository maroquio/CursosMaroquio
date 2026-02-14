import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { CertificateId } from '../value-objects/CertificateId.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

interface CertificateProps {
  enrollmentId: EnrollmentId;
  courseId: CourseId;
  studentId: UserId;
  courseName: string;
  studentName: string;
  certificateNumber: string;
  sequentialNumber: number;
  issuedAt: Date;
}

export class Certificate extends Entity<CertificateId> {
  private props: CertificateProps;

  private constructor(id: CertificateId, props: CertificateProps) {
    super(id);
    this.props = props;
  }

  public static create(
    enrollmentId: EnrollmentId,
    courseId: CourseId,
    studentId: UserId,
    courseName: string,
    studentName: string,
    sequentialNumber: number
  ): Result<Certificate> {
    const id = CertificateId.create();
    const year = new Date().getFullYear();
    const certificateNumber = `CERT-${year}-${String(sequentialNumber).padStart(5, '0')}`;

    const certificate = new Certificate(id, {
      enrollmentId,
      courseId,
      studentId,
      courseName,
      studentName,
      certificateNumber,
      sequentialNumber,
      issuedAt: new Date(),
    });

    return Result.ok(certificate);
  }

  public static reconstruct(
    id: CertificateId,
    enrollmentId: EnrollmentId,
    courseId: CourseId,
    studentId: UserId,
    courseName: string,
    studentName: string,
    certificateNumber: string,
    sequentialNumber: number,
    issuedAt: Date
  ): Certificate {
    return new Certificate(id, {
      enrollmentId,
      courseId,
      studentId,
      courseName,
      studentName,
      certificateNumber,
      sequentialNumber,
      issuedAt,
    });
  }

  public getEnrollmentId(): EnrollmentId { return this.props.enrollmentId; }
  public getCourseId(): CourseId { return this.props.courseId; }
  public getStudentId(): UserId { return this.props.studentId; }
  public getCourseName(): string { return this.props.courseName; }
  public getStudentName(): string { return this.props.studentName; }
  public getCertificateNumber(): string { return this.props.certificateNumber; }
  public getSequentialNumber(): number { return this.props.sequentialNumber; }
  public getIssuedAt(): Date { return this.props.issuedAt; }
}
