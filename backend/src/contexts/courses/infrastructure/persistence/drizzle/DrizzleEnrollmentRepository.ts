import { eq, and, sql, desc, type SQL } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import {
  type IEnrollmentRepository,
  type EnrollmentFilters,
  type PaginatedEnrollments,
} from '../../../domain/repositories/IEnrollmentRepository.ts';
import { Enrollment } from '../../../domain/entities/Enrollment.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { EnrollmentStatus } from '../../../domain/value-objects/EnrollmentStatus.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { enrollmentsTable } from './schema.ts';
import { EnrollmentMapper } from './EnrollmentMapper.ts';

/**
 * DrizzleEnrollmentRepository
 * Implements IEnrollmentRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleEnrollmentRepository implements IEnrollmentRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(enrollment: Enrollment): Promise<void> {
    const data = EnrollmentMapper.toPersistence(enrollment);

    // Check if enrollment already exists
    const existing = await this.db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, enrollment.getId().toValue()));

    if (existing && existing.length > 0) {
      // Update
      await this.db
        .update(enrollmentsTable)
        .set(data)
        .where(eq(enrollmentsTable.id, enrollment.getId().toValue()));
    } else {
      // Insert
      await this.db.insert(enrollmentsTable).values(data);
    }
  }

  async findById(id: EnrollmentId): Promise<Enrollment | null> {
    const result = await this.db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const enrollmentResult = EnrollmentMapper.toDomain(result[0]!);
    return enrollmentResult.isOk ? enrollmentResult.getValue() : null;
  }

  async findByStudentAndCourse(studentId: UserId, courseId: CourseId): Promise<Enrollment | null> {
    const result = await this.db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.studentId, studentId.toValue()),
          eq(enrollmentsTable.courseId, courseId.toValue())
        )
      );

    if (!result || result.length === 0) {
      return null;
    }

    const enrollmentResult = EnrollmentMapper.toDomain(result[0]!);
    return enrollmentResult.isOk ? enrollmentResult.getValue() : null;
  }

  async existsByStudentAndCourse(studentId: UserId, courseId: CourseId): Promise<boolean> {
    const result = await this.db
      .select({ id: enrollmentsTable.id })
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.studentId, studentId.toValue()),
          eq(enrollmentsTable.courseId, courseId.toValue())
        )
      );

    return result && result.length > 0;
  }

  async exists(id: EnrollmentId): Promise<boolean> {
    const result = await this.db
      .select({ id: enrollmentsTable.id })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, id.toValue()));

    return result && result.length > 0;
  }

  async delete(id: EnrollmentId): Promise<void> {
    await this.db
      .delete(enrollmentsTable)
      .where(eq(enrollmentsTable.id, id.toValue()));
  }

  async findByStudent(studentId: UserId, status?: EnrollmentStatus): Promise<Enrollment[]> {
    let conditions = eq(enrollmentsTable.studentId, studentId.toValue());

    if (status) {
      conditions = and(conditions, eq(enrollmentsTable.status, status)) as typeof conditions;
    }

    const result = await this.db
      .select()
      .from(enrollmentsTable)
      .where(conditions);

    const enrollments: Enrollment[] = [];
    for (const row of result) {
      const enrollmentResult = EnrollmentMapper.toDomain(row);
      if (enrollmentResult.isOk) {
        enrollments.push(enrollmentResult.getValue());
      }
    }

    return enrollments;
  }

  async findByCourse(courseId: CourseId, status?: EnrollmentStatus): Promise<Enrollment[]> {
    let conditions = eq(enrollmentsTable.courseId, courseId.toValue());

    if (status) {
      conditions = and(conditions, eq(enrollmentsTable.status, status)) as typeof conditions;
    }

    const result = await this.db
      .select()
      .from(enrollmentsTable)
      .where(conditions);

    const enrollments: Enrollment[] = [];
    for (const row of result) {
      const enrollmentResult = EnrollmentMapper.toDomain(row);
      if (enrollmentResult.isOk) {
        enrollments.push(enrollmentResult.getValue());
      }
    }

    return enrollments;
  }

  async findAllPaginated(
    page: number,
    limit: number,
    filters?: EnrollmentFilters
  ): Promise<PaginatedEnrollments> {
    const offset = (page - 1) * limit;
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select().from(enrollmentsTable);

    if (conditions) {
      query = query.where(conditions) as typeof query;
    }

    const result = await query.limit(limit).offset(offset);

    const enrollments: Enrollment[] = [];
    for (const row of result) {
      const enrollmentResult = EnrollmentMapper.toDomain(row);
      if (enrollmentResult.isOk) {
        enrollments.push(enrollmentResult.getValue());
      }
    }

    const total = await this.countWithFilters(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      enrollments,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async countByCourse(courseId: CourseId, status?: EnrollmentStatus): Promise<number> {
    let conditions = eq(enrollmentsTable.courseId, courseId.toValue());

    if (status) {
      conditions = and(conditions, eq(enrollmentsTable.status, status)) as typeof conditions;
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(enrollmentsTable)
      .where(conditions);

    return Number(result[0]?.count ?? 0);
  }

  async countByStudent(studentId: UserId, status?: EnrollmentStatus): Promise<number> {
    let conditions = eq(enrollmentsTable.studentId, studentId.toValue());

    if (status) {
      conditions = and(conditions, eq(enrollmentsTable.status, status)) as typeof conditions;
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(enrollmentsTable)
      .where(conditions);

    return Number(result[0]?.count ?? 0);
  }

  async countAll(status?: EnrollmentStatus): Promise<number> {
    let query = this.db.select({ count: sql<number>`count(*)` }).from(enrollmentsTable);

    if (status) {
      query = query.where(eq(enrollmentsTable.status, status)) as typeof query;
    }

    const result = await query;
    return Number(result[0]?.count ?? 0);
  }

  async findRecent(limit: number): Promise<Enrollment[]> {
    const result = await this.db
      .select()
      .from(enrollmentsTable)
      .orderBy(desc(enrollmentsTable.enrolledAt))
      .limit(limit);

    const enrollments: Enrollment[] = [];
    for (const row of result) {
      const enrollmentResult = EnrollmentMapper.toDomain(row);
      if (enrollmentResult.isOk) {
        enrollments.push(enrollmentResult.getValue());
      }
    }

    return enrollments;
  }

  private async countWithFilters(filters?: EnrollmentFilters): Promise<number> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select({ count: sql<number>`count(*)` }).from(enrollmentsTable);

    if (conditions) {
      query = query.where(conditions) as typeof query;
    }

    const result = await query;
    return Number(result[0]?.count ?? 0);
  }

  private buildFilterConditions(filters?: EnrollmentFilters): SQL | undefined {
    if (!filters) return undefined;

    const conditions: SQL[] = [];

    if (filters.status) {
      conditions.push(eq(enrollmentsTable.status, filters.status));
    }

    if (filters.courseId) {
      conditions.push(eq(enrollmentsTable.courseId, filters.courseId.toValue()));
    }

    if (filters.studentId) {
      conditions.push(eq(enrollmentsTable.studentId, filters.studentId.toValue()));
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions);
  }
}
