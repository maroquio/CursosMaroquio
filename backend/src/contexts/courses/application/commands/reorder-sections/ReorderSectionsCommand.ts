/**
 * ReorderSectionsCommand
 * Represents the intent to reorder sections in a lesson
 */
export class ReorderSectionsCommand {
  constructor(
    public readonly lessonId: string,
    public readonly sections: Array<{ id: string; order: number }>
  ) {}
}
