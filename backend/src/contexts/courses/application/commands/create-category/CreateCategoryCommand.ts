/**
 * CreateCategoryCommand
 * Represents the intent to create a new category
 */
export class CreateCategoryCommand {
  constructor(
    public readonly name: string,
    public readonly description?: string | null
  ) {}
}
