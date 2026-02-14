/**
 * EnrollStudentCommand
 * Represents the intent to enroll a student in a course
 */
export class EnrollStudentCommand {
  constructor(
    public readonly courseId: string,
    public readonly studentId: string
  ) {}
}
