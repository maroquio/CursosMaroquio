import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { ModuleId } from '../value-objects/ModuleId.ts';
import { Slug } from '../value-objects/Slug.ts';
import { CourseStatus } from '../value-objects/CourseStatus.ts';
import { Module } from './Module.ts';
import { CourseCreated } from '../events/CourseCreated.ts';
import { CoursePublished } from '../events/CoursePublished.ts';
import { CourseArchived } from '../events/CourseArchived.ts';
import { ModuleAdded } from '../events/ModuleAdded.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

interface CourseProps {
  title: string;
  slug: Slug;
  description: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  shortDescription: string | null;
  price: number; // Price in cents
  currency: string;
  level: string | null; // 'beginner' | 'intermediate' | 'advanced'
  categoryId: string | null;
  tags: string[];
  status: CourseStatus;
  instructorId: UserId;
  modules: Module[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  exerciseCorrectionPrompt: string | null;
}

/**
 * Course Aggregate Root
 * Represents a course with its modules (which contain lessons and sections)
 * Contains business logic for course lifecycle management
 */
export class Course extends Entity<CourseId> {
  private props: CourseProps;

  private constructor(id: CourseId, props: CourseProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new course
   * Emits CourseCreated domain event
   */
  public static create(
    title: string,
    slug: Slug,
    instructorId: UserId,
    description?: string | null,
    thumbnailUrl?: string | null,
    bannerUrl?: string | null,
    shortDescription?: string | null,
    price?: number,
    currency?: string,
    level?: string | null,
    categoryId?: string | null,
    tags?: string[],
    exerciseCorrectionPrompt?: string | null
  ): Result<Course> {
    // Validate title
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.COURSE_TITLE_EMPTY);
    }

    if (title.trim().length < 3) {
      return Result.fail(ErrorCode.COURSE_TITLE_TOO_SHORT);
    }

    if (title.length > 200) {
      return Result.fail(ErrorCode.COURSE_TITLE_TOO_LONG);
    }

    if (description && description.length > 2000) {
      return Result.fail(ErrorCode.COURSE_DESCRIPTION_TOO_LONG);
    }

    const now = new Date();
    const courseId = CourseId.create();

    const course = new Course(courseId, {
      title: title.trim(),
      slug,
      description: description?.trim() ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      bannerUrl: bannerUrl ?? null,
      shortDescription: shortDescription?.trim() ?? null,
      price: price ?? 0,
      currency: currency ?? 'BRL',
      level: level ?? null,
      categoryId: categoryId ?? null,
      tags: tags ?? [],
      status: CourseStatus.DRAFT,
      instructorId,
      modules: [],
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      exerciseCorrectionPrompt: exerciseCorrectionPrompt ?? null,
    });

    // Emit domain event
    course.addDomainEvent(new CourseCreated(courseId, title, instructorId));

    return Result.ok(course);
  }

  /**
   * Reconstruct a course from persistence
   */
  public static reconstruct(
    id: CourseId,
    title: string,
    slug: Slug,
    description: string | null,
    thumbnailUrl: string | null,
    bannerUrl: string | null,
    shortDescription: string | null,
    price: number,
    currency: string,
    level: string | null,
    categoryId: string | null,
    tags: string[],
    status: CourseStatus,
    instructorId: UserId,
    modules: Module[],
    createdAt: Date,
    updatedAt: Date,
    publishedAt: Date | null,
    exerciseCorrectionPrompt: string | null
  ): Course {
    return new Course(id, {
      title,
      slug,
      description,
      thumbnailUrl,
      bannerUrl,
      shortDescription,
      price,
      currency,
      level,
      categoryId,
      tags,
      status,
      instructorId,
      modules,
      createdAt,
      updatedAt,
      publishedAt,
      exerciseCorrectionPrompt,
    });
  }

  // Getters
  public getTitle(): string {
    return this.props.title;
  }

  public getSlug(): Slug {
    return this.props.slug;
  }

  public getDescription(): string | null {
    return this.props.description;
  }

  public getThumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }

  public getBannerUrl(): string | null {
    return this.props.bannerUrl;
  }

  public getShortDescription(): string | null {
    return this.props.shortDescription;
  }

  public getPrice(): number {
    return this.props.price;
  }

  public getCurrency(): string {
    return this.props.currency;
  }

  public getLevel(): string | null {
    return this.props.level;
  }

  public getCategoryId(): string | null {
    return this.props.categoryId;
  }

  public getTags(): string[] {
    return [...this.props.tags];
  }

  public getStatus(): CourseStatus {
    return this.props.status;
  }

  public getInstructorId(): UserId {
    return this.props.instructorId;
  }

  public getModules(): Module[] {
    return [...this.props.modules];
  }

  public getModuleCount(): number {
    return this.props.modules.length;
  }

  public getLessonCount(): number {
    return this.props.modules.reduce((total, module) => total + module.getLessonCount(), 0);
  }

  public getTotalDuration(): number {
    return this.props.modules.reduce((total, module) => total + module.getTotalDuration(), 0);
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public getPublishedAt(): Date | null {
    return this.props.publishedAt;
  }

  public getExerciseCorrectionPrompt(): string | null {
    return this.props.exerciseCorrectionPrompt;
  }

  public updateExerciseCorrectionPrompt(prompt: string | null): void {
    this.props.exerciseCorrectionPrompt = prompt?.trim() ?? null;
    this.props.updatedAt = new Date();
  }

  public isDraft(): boolean {
    return this.props.status === CourseStatus.DRAFT;
  }

  public isPublished(): boolean {
    return this.props.status === CourseStatus.PUBLISHED;
  }

  public isArchived(): boolean {
    return this.props.status === CourseStatus.ARCHIVED;
  }

  // Business Logic

  /**
   * Update course title
   */
  public updateTitle(title: string): Result<void> {
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.COURSE_TITLE_EMPTY);
    }

    if (title.trim().length < 3) {
      return Result.fail(ErrorCode.COURSE_TITLE_TOO_SHORT);
    }

    if (title.length > 200) {
      return Result.fail(ErrorCode.COURSE_TITLE_TOO_LONG);
    }

    this.props.title = title.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update course slug
   */
  public updateSlug(slug: Slug): void {
    this.props.slug = slug;
    this.props.updatedAt = new Date();
  }

  /**
   * Update course description
   */
  public updateDescription(description: string | null): Result<void> {
    if (description && description.length > 2000) {
      return Result.fail(ErrorCode.COURSE_DESCRIPTION_TOO_LONG);
    }

    this.props.description = description?.trim() ?? null;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update thumbnail URL
   */
  public updateThumbnailUrl(thumbnailUrl: string | null): void {
    this.props.thumbnailUrl = thumbnailUrl;
    this.props.updatedAt = new Date();
  }

  /**
   * Update banner URL
   */
  public updateBannerUrl(bannerUrl: string | null): void {
    this.props.bannerUrl = bannerUrl;
    this.props.updatedAt = new Date();
  }

  /**
   * Update short description
   */
  public updateShortDescription(shortDescription: string | null): void {
    this.props.shortDescription = shortDescription?.trim() ?? null;
    this.props.updatedAt = new Date();
  }

  /**
   * Update price (in cents)
   */
  public updatePrice(price: number): void {
    this.props.price = price;
    this.props.updatedAt = new Date();
  }

  /**
   * Update currency
   */
  public updateCurrency(currency: string): void {
    this.props.currency = currency;
    this.props.updatedAt = new Date();
  }

  /**
   * Update level
   */
  public updateLevel(level: string | null): void {
    this.props.level = level;
    this.props.updatedAt = new Date();
  }

  /**
   * Update category ID
   */
  public updateCategoryId(categoryId: string | null): void {
    this.props.categoryId = categoryId;
    this.props.updatedAt = new Date();
  }

  /**
   * Update tags
   */
  public updateTags(tags: string[]): void {
    this.props.tags = tags;
    this.props.updatedAt = new Date();
  }

  /**
   * Publish the course
   * Requires at least one module with at least one lesson with at least one section
   */
  public publish(): Result<void> {
    if (this.props.status === CourseStatus.PUBLISHED) {
      return Result.fail(ErrorCode.COURSE_ALREADY_PUBLISHED);
    }

    // Validate course has modules with lessons and sections
    if (this.props.modules.length === 0) {
      return Result.fail(ErrorCode.COURSE_CANNOT_PUBLISH_WITHOUT_MODULES);
    }

    // Check that at least one module has at least one lesson with at least one section
    const hasValidContent = this.props.modules.some(module => {
      const lessons = module.getLessons();
      return lessons.some(lesson => lesson.getSections().length > 0);
    });

    if (!hasValidContent) {
      return Result.fail(ErrorCode.COURSE_CANNOT_PUBLISH_WITHOUT_MODULES);
    }

    this.props.status = CourseStatus.PUBLISHED;
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new CoursePublished(this.id, this.props.title));

    return Result.ok(undefined);
  }

  /**
   * Unpublish the course (back to draft)
   */
  public unpublish(): Result<void> {
    if (this.props.status !== CourseStatus.PUBLISHED) {
      return Result.fail(ErrorCode.COURSE_NOT_PUBLISHED);
    }

    this.props.status = CourseStatus.DRAFT;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Archive the course
   * Only published courses can be archived
   */
  public archive(): Result<void> {
    if (this.props.status === CourseStatus.ARCHIVED) {
      return Result.fail(ErrorCode.COURSE_ALREADY_ARCHIVED);
    }

    if (this.props.status === CourseStatus.DRAFT) {
      return Result.fail(ErrorCode.COURSE_CANNOT_ARCHIVE_DRAFT);
    }

    this.props.status = CourseStatus.ARCHIVED;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new CourseArchived(this.id, this.props.title));

    return Result.ok(undefined);
  }

  /**
   * Add a module to the course
   */
  public addModule(module: Module): Result<void> {
    // Check if module already exists
    const exists = this.props.modules.some(m => m.getId().equals(module.getId()));
    if (exists) {
      return Result.fail(ErrorCode.MODULE_ALREADY_IN_COURSE);
    }

    this.props.modules.push(module);
    this.props.updatedAt = new Date();

    this.addDomainEvent(new ModuleAdded(this.id, module.getId(), module.getTitle()));

    return Result.ok(undefined);
  }

  /**
   * Remove a module from the course
   */
  public removeModule(moduleId: ModuleId): Result<void> {
    const index = this.props.modules.findIndex(m => m.getId().equals(moduleId));
    if (index === -1) {
      return Result.fail(ErrorCode.MODULE_NOT_FOUND);
    }

    this.props.modules.splice(index, 1);
    this.props.updatedAt = new Date();

    // Reorder remaining modules
    this.props.modules.forEach((module, idx) => {
      module.updateOrder(idx + 1);
    });

    return Result.ok(undefined);
  }

  /**
   * Reorder modules
   */
  public reorderModules(moduleIds: ModuleId[]): Result<void> {
    // Validate all module IDs exist
    for (const moduleId of moduleIds) {
      const exists = this.props.modules.some(m => m.getId().equals(moduleId));
      if (!exists) {
        return Result.fail(ErrorCode.MODULE_NOT_FOUND);
      }
    }

    // Reorder
    const reordered: Module[] = [];
    for (let i = 0; i < moduleIds.length; i++) {
      const module = this.props.modules.find(m => m.getId().equals(moduleIds[i]));
      if (module) {
        module.updateOrder(i + 1);
        reordered.push(module);
      }
    }

    this.props.modules = reordered;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Set modules (used when reconstructing from persistence)
   */
  public setModules(modules: Module[]): void {
    this.props.modules = modules;
  }

  /**
   * Find a module by ID
   */
  public findModule(moduleId: ModuleId): Module | undefined {
    return this.props.modules.find(m => m.getId().equals(moduleId));
  }
}
