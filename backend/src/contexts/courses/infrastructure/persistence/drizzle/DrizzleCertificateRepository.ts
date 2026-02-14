import { eq, sql, desc } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import type { ICertificateRepository } from '../../../domain/repositories/ICertificateRepository.ts';
import { Certificate } from '../../../domain/entities/Certificate.ts';
import { CertificateId } from '../../../domain/value-objects/CertificateId.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { certificatesTable } from './schema.ts';
import { CertificateMapper } from './CertificateMapper.ts';

export class DrizzleCertificateRepository implements ICertificateRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(certificate: Certificate): Promise<void> {
    const data = CertificateMapper.toPersistence(certificate);

    const existing = await this.db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.id, certificate.getId().toValue()));

    if (existing && existing.length > 0) {
      await this.db
        .update(certificatesTable)
        .set(data)
        .where(eq(certificatesTable.id, certificate.getId().toValue()));
    } else {
      await this.db.insert(certificatesTable).values(data);
    }
  }

  async findById(id: CertificateId): Promise<Certificate | null> {
    const result = await this.db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.id, id.toValue()));

    if (!result || result.length === 0) return null;

    const mapped = CertificateMapper.toDomain(result[0]!);
    return mapped.isOk ? mapped.getValue() : null;
  }

  async exists(id: CertificateId): Promise<boolean> {
    const result = await this.db
      .select({ id: certificatesTable.id })
      .from(certificatesTable)
      .where(eq(certificatesTable.id, id.toValue()));
    return result && result.length > 0;
  }

  async delete(id: CertificateId): Promise<void> {
    await this.db
      .delete(certificatesTable)
      .where(eq(certificatesTable.id, id.toValue()));
  }

  async findByStudent(studentId: UserId): Promise<Certificate[]> {
    const result = await this.db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.studentId, studentId.toValue()))
      .orderBy(desc(certificatesTable.issuedAt));

    const certificates: Certificate[] = [];
    for (const row of result) {
      const mapped = CertificateMapper.toDomain(row);
      if (mapped.isOk) certificates.push(mapped.getValue());
    }
    return certificates;
  }

  async findByEnrollment(enrollmentId: EnrollmentId): Promise<Certificate | null> {
    const result = await this.db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.enrollmentId, enrollmentId.toValue()));

    if (!result || result.length === 0) return null;

    const mapped = CertificateMapper.toDomain(result[0]!);
    return mapped.isOk ? mapped.getValue() : null;
  }

  async getNextSequentialNumber(): Promise<number> {
    const result = await this.db
      .select({ max: sql<number>`COALESCE(MAX(sequential_number), 0)` })
      .from(certificatesTable);
    return Number(result[0]?.max ?? 0) + 1;
  }

  async findByCertificateNumber(certificateNumber: string): Promise<Certificate | null> {
    const result = await this.db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.certificateNumber, certificateNumber));

    if (!result || result.length === 0) return null;

    const mapped = CertificateMapper.toDomain(result[0]!);
    return mapped.isOk ? mapped.getValue() : null;
  }
}
