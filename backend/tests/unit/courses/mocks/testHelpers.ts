import { Section } from '@courses/domain/entities/Section.ts';
import { SectionBundle } from '@courses/domain/entities/SectionBundle.ts';
import { SectionId } from '@courses/domain/value-objects/SectionId.ts';
import { SectionBundleId } from '@courses/domain/value-objects/SectionBundleId.ts';
import { LessonId } from '@courses/domain/value-objects/LessonId.ts';
import { SectionContentType } from '@courses/domain/value-objects/SectionContentType.ts';

/**
 * Create a test section for unit tests
 */
export function createTestSection(
  title = 'Test Section',
  contentType: SectionContentType = SectionContentType.TEXT,
  order = 1,
  lessonId?: LessonId
): Section {
  return Section.reconstruct(
    SectionId.create(),
    lessonId ?? LessonId.create(),
    title,
    'Test section description',
    contentType,
    null, // content
    order,
    new Date(),
    new Date()
  );
}

/**
 * Create a test section bundle for unit tests
 */
export function createTestSectionBundle(
  sectionId?: SectionId,
  version = 1,
  isActive = false
): SectionBundle {
  return SectionBundle.reconstruct(
    SectionBundleId.create(),
    sectionId ?? SectionId.create(),
    version,
    'index.html',
    `bundles/sections/${sectionId?.toValue() ?? 'test'}/v${version}`,
    null,
    isActive,
    new Date()
  );
}
