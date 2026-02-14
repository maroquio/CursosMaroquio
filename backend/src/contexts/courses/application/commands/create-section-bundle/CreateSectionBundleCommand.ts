/**
 * CreateSectionBundleCommand
 * Represents the intent to upload a new section bundle
 */
export class CreateSectionBundleCommand {
  constructor(
    public readonly sectionId: string,
    public readonly file: Buffer,
    public readonly activateImmediately: boolean = false
  ) {}
}
