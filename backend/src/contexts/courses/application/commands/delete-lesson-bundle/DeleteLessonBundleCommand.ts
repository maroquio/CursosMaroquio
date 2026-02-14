/**
 * DeleteLessonBundleCommand
 * Represents the intent to delete a bundle version
 */
export class DeleteLessonBundleCommand {
  constructor(public readonly bundleId: string) {}
}
