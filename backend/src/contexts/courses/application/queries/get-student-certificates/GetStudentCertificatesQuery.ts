/**
 * GetStudentCertificatesQuery
 * Query to get all certificates for a student
 */
export class GetStudentCertificatesQuery {
  constructor(public readonly studentId: string) {}
}
