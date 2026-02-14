/**
 * UpdateCategoryCommand
 * Represents the intent to update an existing category
 */
export class UpdateCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description?: string | null
  ) {}
}
