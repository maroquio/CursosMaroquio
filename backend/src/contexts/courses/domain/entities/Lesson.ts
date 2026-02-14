import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { LessonId } from '../value-objects/LessonId.ts';
import { ModuleId } from '../value-objects/ModuleId.ts';
import { SectionId } from '../value-objects/SectionId.ts';
import { LessonType } from '../value-objects/LessonType.ts';
import { Section } from './Section.ts';

interface LessonProps {
  moduleId: ModuleId;
  title: string;
  slug: string;
  description: string | null;
  content: string | null; // HTML/text content for text-based lessons
  videoUrl: string | null;
  duration: number; // Duration in seconds
  type: LessonType;
  isFree: boolean;
  isPublished: boolean;
  order: number;
  sections: Section[];
  createdAt: Date;
  updatedAt: Date;
  exerciseCorrectionPrompt: string | null;
}

/**
 * Lesson Entity
 * Represents a single lesson within a module, containing sections
 */
export class Lesson extends Entity<LessonId> {
  private props: LessonProps;

  private constructor(id: LessonId, props: LessonProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new lesson
   */
  public static create(
    moduleId: ModuleId,
    title: string,
    slug: string,
    order: number,
    description?: string | null,
    content?: string | null,
    videoUrl?: string | null,
    duration?: number,
    type?: LessonType,
    isFree?: boolean,
    isPublished?: boolean,
    exerciseCorrectionPrompt?: string | null
  ): Result<Lesson> {
    // Validate title
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.LESSON_TITLE_EMPTY);
    }

    if (title.length > 200) {
      return Result.fail(ErrorCode.LESSON_TITLE_TOO_LONG);
    }

    // Validate slug
    if (!slug || slug.trim().length === 0) {
      return Result.fail(ErrorCode.LESSON_SLUG_EMPTY);
    }

    if (order < 1) {
      return Result.fail(ErrorCode.LESSON_ORDER_INVALID);
    }

    const now = new Date();
    const lesson = new Lesson(LessonId.create(), {
      moduleId,
      title: title.trim(),
      slug: slug.trim(),
      description: description?.trim() ?? null,
      content: content ?? null,
      videoUrl: videoUrl ?? null,
      duration: duration ?? 0,
      type: type ?? LessonType.VIDEO,
      isFree: isFree ?? false,
      isPublished: isPublished ?? false,
      order,
      sections: [],
      createdAt: now,
      updatedAt: now,
      exerciseCorrectionPrompt: exerciseCorrectionPrompt ?? null,
    });

    return Result.ok(lesson);
  }

  /**
   * Reconstruct a lesson from persistence
   */
  public static reconstruct(
    id: LessonId,
    moduleId: ModuleId,
    title: string,
    slug: string,
    description: string | null,
    content: string | null,
    videoUrl: string | null,
    duration: number,
    type: LessonType,
    isFree: boolean,
    isPublished: boolean,
    order: number,
    sections: Section[],
    createdAt: Date,
    updatedAt: Date,
    exerciseCorrectionPrompt: string | null
  ): Lesson {
    return new Lesson(id, {
      moduleId,
      title,
      slug,
      description,
      content,
      videoUrl,
      duration,
      type,
      isFree,
      isPublished,
      order,
      sections,
      createdAt,
      updatedAt,
      exerciseCorrectionPrompt,
    });
  }

  // Getters
  public getModuleId(): ModuleId {
    return this.props.moduleId;
  }

  public getSections(): Section[] {
    return [...this.props.sections];
  }

  public getSectionCount(): number {
    return this.props.sections.length;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getSlug(): string {
    return this.props.slug;
  }

  public getDescription(): string | null {
    return this.props.description;
  }

  public getContent(): string | null {
    return this.props.content;
  }

  public getVideoUrl(): string | null {
    return this.props.videoUrl;
  }

  public getDuration(): number {
    return this.props.duration;
  }

  public getType(): LessonType {
    return this.props.type;
  }

  public getIsFree(): boolean {
    return this.props.isFree;
  }

  public getIsPublished(): boolean {
    return this.props.isPublished;
  }

  public getOrder(): number {
    return this.props.order;
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
      return Result.fail(ErrorCode.LESSON_TITLE_EMPTY);
    }

    if (title.length > 200) {
      return Result.fail(ErrorCode.LESSON_TITLE_TOO_LONG);
    }

    this.props.title = title.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public updateDescription(description: string | null): void {
    this.props.description = description?.trim() ?? null;
    this.props.updatedAt = new Date();
  }

  public updateVideoUrl(videoUrl: string | null): void {
    this.props.videoUrl = videoUrl;
    this.props.updatedAt = new Date();
  }

  public updateDuration(duration: number): void {
    this.props.duration = Math.max(0, duration);
    this.props.updatedAt = new Date();
  }

  public updateSlug(slug: string): Result<void> {
    if (!slug || slug.trim().length === 0) {
      return Result.fail(ErrorCode.LESSON_SLUG_EMPTY);
    }

    this.props.slug = slug.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public updateContent(content: string | null): void {
    this.props.content = content;
    this.props.updatedAt = new Date();
  }

  public updateType(type: LessonType): void {
    this.props.type = type;
    this.props.updatedAt = new Date();
  }

  public updateIsFree(isFree: boolean): void {
    this.props.isFree = isFree;
    this.props.updatedAt = new Date();
  }

  public updateIsPublished(isPublished: boolean): void {
    this.props.isPublished = isPublished;
    this.props.updatedAt = new Date();
  }

  public updateOrder(order: number): Result<void> {
    if (order < 1) {
      return Result.fail(ErrorCode.LESSON_ORDER_INVALID);
    }

    this.props.order = order;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Add a section to this lesson
   */
  public addSection(section: Section): Result<void> {
    const exists = this.props.sections.some(s => s.getId().equals(section.getId()));
    if (exists) {
      return Result.fail(ErrorCode.SECTION_ALREADY_IN_LESSON);
    }

    this.props.sections.push(section);
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Remove a section from this lesson
   */
  public removeSection(sectionId: SectionId): Result<void> {
    const index = this.props.sections.findIndex(s => s.getId().equals(sectionId));
    if (index === -1) {
      return Result.fail(ErrorCode.SECTION_NOT_FOUND);
    }

    this.props.sections.splice(index, 1);
    this.props.updatedAt = new Date();

    // Reorder remaining sections
    this.props.sections.forEach((section, idx) => {
      section.updateOrder(idx + 1);
    });

    return Result.ok(undefined);
  }

  /**
   * Reorder sections within this lesson
   */
  public reorderSections(sectionIds: SectionId[]): Result<void> {
    // Validate all section IDs exist
    for (const sectionId of sectionIds) {
      const exists = this.props.sections.some(s => s.getId().equals(sectionId));
      if (!exists) {
        return Result.fail(ErrorCode.SECTION_NOT_FOUND);
      }
    }

    // Reorder
    const reordered: Section[] = [];
    for (let i = 0; i < sectionIds.length; i++) {
      const section = this.props.sections.find(s => s.getId().equals(sectionIds[i]));
      if (section) {
        section.updateOrder(i + 1);
        reordered.push(section);
      }
    }

    this.props.sections = reordered;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Set sections (used when reconstructing from persistence)
   */
  public setSections(sections: Section[]): void {
    this.props.sections = sections;
  }

  /**
   * Find a section by ID
   */
  public findSection(sectionId: SectionId): Section | undefined {
    return this.props.sections.find(s => s.getId().equals(sectionId));
  }
}
