/**
 * DeleteSectionBundleCommand
 * Represents the intent to delete a section bundle version
 */
export class DeleteSectionBundleCommand {
  constructor(public readonly bundleId: string) {}
}
