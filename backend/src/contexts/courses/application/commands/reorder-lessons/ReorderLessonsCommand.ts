/**
 * ReorderLessonsCommand
 * Represents the intent to reorder lessons within a module
 */
export class ReorderLessonsCommand {
  constructor(
    public readonly moduleId: string,
    public readonly lessons: Array<{ id: string; order: number }>
  ) {}
}
