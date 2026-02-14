/**
 * GenerateCertificateCommand
 * Command to generate a certificate for a completed enrollment
 */
export class GenerateCertificateCommand {
  constructor(
    public readonly enrollmentId: string,
    public readonly studentId: string
  ) {}
}
