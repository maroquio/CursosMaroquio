/**
 * CreateLessonBundleCommand
 * Represents the intent to upload a new lesson bundle
 */
export class CreateLessonBundleCommand {
  constructor(
    public readonly lessonId: string,
    public readonly file: Buffer,
    public readonly activateImmediately: boolean = false
  ) {}
}
