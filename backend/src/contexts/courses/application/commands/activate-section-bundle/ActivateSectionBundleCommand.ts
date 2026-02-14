/**
 * ActivateSectionBundleCommand
 * Represents the intent to activate a specific section bundle version
 */
export class ActivateSectionBundleCommand {
  constructor(public readonly bundleId: string) {}
}
