export class VerifyExerciseCommand {
  constructor(
    public readonly sectionId: string,
    public readonly studentCode: string,
    public readonly userId: string
  ) {}
}
