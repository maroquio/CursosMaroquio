import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ModuleId } from '../value-objects/ModuleId.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { Lesson } from './Lesson.ts';
import { LessonId } from '../value-objects/LessonId.ts';

interface ModuleProps {
  courseId: CourseId;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
  exerciseCorrectionPrompt: string | null;
}

/**
 * Module Entity
 * Represents a module within a course that contains lessons
 */
export class Module extends Entity<ModuleId> {
  private props: ModuleProps;

  private constructor(id: ModuleId, props: ModuleProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new module
   */
  public static create(
    courseId: CourseId,
    title: string,
    order: number,
    description?: string | null,
    exerciseCorrectionPrompt?: string | null
  ): Result<Module> {
    // Validate title
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.MODULE_TITLE_EMPTY);
    }

    if (title.length > 200) {
      return Result.fail(ErrorCode.MODULE_TITLE_TOO_LONG);
    }

    if (order < 1) {
      return Result.fail(ErrorCode.MODULE_ORDER_INVALID);
    }

    const now = new Date();
    const module = new Module(ModuleId.create(), {
      courseId,
      title: title.trim(),
      description: description?.trim() ?? null,
      order,
      lessons: [],
      createdAt: now,
      updatedAt: now,
      exerciseCorrectionPrompt: exerciseCorrectionPrompt ?? null,
    });

    return Result.ok(module);
  }

  /**
   * Reconstruct a module from persistence
   */
  public static reconstruct(
    id: ModuleId,
    courseId: CourseId,
    title: string,
    description: string | null,
    order: number,
    lessons: Lesson[],
    createdAt: Date,
    updatedAt: Date,
    exerciseCorrectionPrompt: string | null
  ): Module {
    return new Module(id, {
      courseId,
      title,
      description,
      order,
      lessons,
      createdAt,
      updatedAt,
      exerciseCorrectionPrompt,
    });
  }

  // Getters
  public getCourseId(): CourseId {
    return this.props.courseId;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getDescription(): string | null {
    return this.props.description;
  }

  public getOrder(): number {
    return this.props.order;
  }

  public getLessons(): Lesson[] {
    return [...this.props.lessons];
  }

  public getLessonCount(): number {
    return this.props.lessons.length;
  }

  public getTotalDuration(): number {
    return this.props.lessons.reduce((total, lesson) => total + lesson.getDuration(), 0);
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public getExerciseCorrectionPrompt(): string | null {
    return this.props.exerciseCorrectionPrompt;
  }

  public updateExerciseCorrectionPrompt(prompt: string | null): void {
    this.props.exerciseCorrectionPrompt = prompt?.trim() ?? null;
    this.props.updatedAt = new Date();
  }

  // Setters / Business Logic
  public updateTitle(title: string): Result<void> {
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.MODULE_TITLE_EMPTY);
    }

    if (title.length > 200) {
      return Result.fail(ErrorCode.MODULE_TITLE_TOO_LONG);
    }

    this.props.title = title.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public updateDescription(description: string | null): void {
    this.props.description = description?.trim() ?? null;
    this.props.updatedAt = new Date();
  }

  public updateOrder(order: number): Result<void> {
    if (order < 1) {
      return Result.fail(ErrorCode.MODULE_ORDER_INVALID);
    }

    this.props.order = order;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Add a lesson to this module
   */
  public addLesson(lesson: Lesson): Result<void> {
    const exists = this.props.lessons.some(l => l.getId().equals(lesson.getId()));
    if (exists) {
      return Result.fail(ErrorCode.LESSON_ALREADY_IN_MODULE);
    }

    this.props.lessons.push(lesson);
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Remove a lesson from this module
   */
  public removeLesson(lessonId: LessonId): Result<void> {
    const index = this.props.lessons.findIndex(l => l.getId().equals(lessonId));
    if (index === -1) {
      return Result.fail(ErrorCode.LESSON_NOT_FOUND);
    }

    this.props.lessons.splice(index, 1);
    this.props.updatedAt = new Date();

    // Reorder remaining lessons
    this.props.lessons.forEach((lesson, idx) => {
      lesson.updateOrder(idx + 1);
    });

    return Result.ok(undefined);
  }

  /**
   * Reorder lessons within this module
   */
  public reorderLessons(lessonIds: LessonId[]): Result<void> {
    // Validate all lesson IDs exist
    for (const lessonId of lessonIds) {
      const exists = this.props.lessons.some(l => l.getId().equals(lessonId));
      if (!exists) {
        return Result.fail(ErrorCode.LESSON_NOT_FOUND);
      }
    }

    // Reorder
    const reordered: Lesson[] = [];
    for (let i = 0; i < lessonIds.length; i++) {
      const lesson = this.props.lessons.find(l => l.getId().equals(lessonIds[i]));
      if (lesson) {
        lesson.updateOrder(i + 1);
        reordered.push(lesson);
      }
    }

    this.props.lessons = reordered;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Set lessons (used when reconstructing from persistence)
   */
  public setLessons(lessons: Lesson[]): void {
    this.props.lessons = lessons;
  }

  /**
   * Find a lesson by ID
   */
  public findLesson(lessonId: LessonId): Lesson | undefined {
    return this.props.lessons.find(l => l.getId().equals(lessonId));
  }
}
