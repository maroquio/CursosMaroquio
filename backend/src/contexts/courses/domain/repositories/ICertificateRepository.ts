import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { Certificate } from '../entities/Certificate.ts';
import { CertificateId } from '../value-objects/CertificateId.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

export interface ICertificateRepository extends IRepository<Certificate, CertificateId> {
  findByStudent(studentId: UserId): Promise<Certificate[]>;
  findByEnrollment(enrollmentId: EnrollmentId): Promise<Certificate | null>;
  findByCertificateNumber(certificateNumber: string): Promise<Certificate | null>;
  getNextSequentialNumber(): Promise<number>;
}
