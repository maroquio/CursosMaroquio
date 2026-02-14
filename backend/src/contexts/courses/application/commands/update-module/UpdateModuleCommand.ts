/**
 * UpdateModuleCommand
 * Represents the intent to update a module
 */
export class UpdateModuleCommand {
  constructor(
    public readonly moduleId: string,
    public readonly title?: string,
    public readonly description?: string | null,
    public readonly exerciseCorrectionPrompt?: string | null
  ) {}
}
