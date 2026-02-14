import { LessonType } from '../../../domain/value-objects/LessonType.ts';

/**
 * AddLessonCommand
 * Represents the intent to add a lesson to a module
 */
export class AddLessonCommand {
  constructor(
    public readonly moduleId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly description?: string | null,
    public readonly content?: string | null,
    public readonly videoUrl?: string | null,
    public readonly duration?: number,
    public readonly type?: LessonType,
    public readonly isFree?: boolean,
    public readonly isPublished?: boolean
  ) {}
}
