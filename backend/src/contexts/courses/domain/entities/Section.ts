import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { SectionId } from '../value-objects/SectionId.ts';
import { LessonId } from '../value-objects/LessonId.ts';
import { SectionContentType, isValidSectionContentType } from '../value-objects/SectionContentType.ts';

/**
 * Content types for different section types
 */
export interface TextSectionContent {
  body: string; // Markdown content
  estimatedMinutes?: number;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizSectionContent {
  passingScore: number; // Percentage (0-100)
  questions: QuizQuestion[];
}

export interface TestCase {
  description: string;
  type?: 'manual' | 'automated';
  input?: string;
  expectedOutput?: string;
}

export interface ExerciseSectionContent {
  problem: string;
  starterCode?: string;
  testCases?: TestCase[];
  hints?: string[];
  solution?: string;
}

export interface VideoSectionContent {
  videoUrl: string;
  duration?: number; // in seconds
}

export type SectionContent =
  | TextSectionContent
  | QuizSectionContent
  | ExerciseSectionContent
  | VideoSectionContent
  | Record<string, unknown>
  | null;

interface SectionProps {
  lessonId: LessonId;
  title: string;
  description: string | null;
  contentType: SectionContentType;
  content: SectionContent;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Section Entity
 * Represents a section within a lesson
 */
export class Section extends Entity<SectionId> {
  private props: SectionProps;

  private constructor(id: SectionId, props: SectionProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new section
   */
  public static create(
    lessonId: LessonId,
    title: string,
    order: number,
    contentType: string = 'text',
    description?: string | null,
    content?: SectionContent
  ): Result<Section> {
    // Validate title
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.SECTION_TITLE_EMPTY);
    }

    if (title.length > 200) {
      return Result.fail(ErrorCode.SECTION_TITLE_TOO_LONG);
    }

    if (order < 1) {
      return Result.fail(ErrorCode.SECTION_ORDER_INVALID);
    }

    if (!isValidSectionContentType(contentType)) {
      return Result.fail(ErrorCode.SECTION_INVALID_CONTENT_TYPE);
    }

    const now = new Date();
    const section = new Section(SectionId.create(), {
      lessonId,
      title: title.trim(),
      description: description?.trim() ?? null,
      contentType: contentType as SectionContentType,
      content: content ?? null,
      order,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(section);
  }

  /**
   * Reconstruct a section from persistence
   */
  public static reconstruct(
    id: SectionId,
    lessonId: LessonId,
    title: string,
    description: string | null,
    contentType: SectionContentType,
    content: SectionContent,
    order: number,
    createdAt: Date,
    updatedAt: Date
  ): Section {
    return new Section(id, {
      lessonId,
      title,
      description,
      contentType,
      content,
      order,
      createdAt,
      updatedAt,
    });
  }

  // Getters
  public getLessonId(): LessonId {
    return this.props.lessonId;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getDescription(): string | null {
    return this.props.description;
  }

  public getContentType(): SectionContentType {
    return this.props.contentType;
  }

  public getContent(): SectionContent {
    return this.props.content;
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

  // Setters / Business Logic
  public updateTitle(title: string): Result<void> {
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.SECTION_TITLE_EMPTY);
    }

    if (title.length > 200) {
      return Result.fail(ErrorCode.SECTION_TITLE_TOO_LONG);
    }

    this.props.title = title.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public updateDescription(description: string | null): void {
    this.props.description = description?.trim() ?? null;
    this.props.updatedAt = new Date();
  }

  public updateContentType(contentType: string): Result<void> {
    if (!isValidSectionContentType(contentType)) {
      return Result.fail(ErrorCode.SECTION_INVALID_CONTENT_TYPE);
    }

    this.props.contentType = contentType as SectionContentType;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public updateOrder(order: number): Result<void> {
    if (order < 1) {
      return Result.fail(ErrorCode.SECTION_ORDER_INVALID);
    }

    this.props.order = order;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public updateContent(content: SectionContent): void {
    this.props.content = content;
    this.props.updatedAt = new Date();
  }
}
