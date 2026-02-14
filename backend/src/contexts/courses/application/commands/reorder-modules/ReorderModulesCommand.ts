/**
 * ReorderModulesCommand
 * Represents the intent to reorder modules in a course
 */
export class ReorderModulesCommand {
  constructor(
    public readonly courseId: string,
    public readonly modules: Array<{ id: string; order: number }>
  ) {}
}
