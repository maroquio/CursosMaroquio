/**
 * ActivateLessonBundleCommand
 * Represents the intent to activate a specific bundle version
 */
export class ActivateLessonBundleCommand {
  constructor(public readonly bundleId: string) {}
}
