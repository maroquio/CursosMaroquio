import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { DrizzleSectionBundleRepository } from '../../../src/contexts/courses/infrastructure/persistence/drizzle/DrizzleSectionBundleRepository.ts';
import { SectionBundle } from '../../../src/contexts/courses/domain/entities/SectionBundle.ts';
import { SectionBundleId } from '../../../src/contexts/courses/domain/value-objects/SectionBundleId.ts';
import { SectionId } from '../../../src/contexts/courses/domain/value-objects/SectionId.ts';
import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import {
  initTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  createTestUser,
  createTestCourse,
  createTestModule,
  createTestLesson,
  createTestSection,
  createTestSectionBundle,
  generateId,
} from './setup.ts';

/**
 * Integration Tests for DrizzleSectionBundleRepository
 * Tests actual database operations with PostgreSQL
 */
describe('DrizzleSectionBundleRepository Integration Tests', () => {
  let repository: DrizzleSectionBundleRepository;
  let dbProvider: IDatabaseProvider;

  // Test fixture IDs
  let instructorId: string;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let sectionId: string;

  beforeAll(async () => {
    const { provider } = await initTestDatabase();
    dbProvider = provider;
    repository = new DrizzleSectionBundleRepository(dbProvider);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();

    // Create required test fixtures
    instructorId = await createTestUser();
    courseId = await createTestCourse(generateId(), instructorId);
    moduleId = await createTestModule(generateId(), courseId);
    lessonId = await createTestLesson(generateId(), moduleId);
    sectionId = await createTestSection(generateId(), lessonId, 'exercise');
  });

  // ===========================================================================
  // Basic CRUD Operations
  // ===========================================================================
  describe('save and findById', () => {
    it('should save and retrieve a bundle by id', async () => {
      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const bundleResult = SectionBundle.create(
        sectionIdVo,
        1,
        `bundles/sections/${sectionId}/v1`,
        null,
        'index.html'
      );
      const bundle = bundleResult.getValue();

      await repository.save(bundle);
      const found = await repository.findById(bundle.getId());

      expect(found).not.toBeNull();
      expect(found!.getId().toValue()).toBe(bundle.getId().toValue());
      expect(found!.getSectionId().toValue()).toBe(sectionId);
      expect(found!.getVersion()).toBe(1);
      expect(found!.getEntrypoint()).toBe('index.html');
      expect(found!.getIsActive()).toBe(false);
    });

    it('should return null for non-existent bundle', async () => {
      const bundleId = SectionBundleId.create();
      const found = await repository.findById(bundleId);
      expect(found).toBeNull();
    });

    it('should update existing bundle', async () => {
      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const bundleResult = SectionBundle.create(
        sectionIdVo,
        1,
        `bundles/sections/${sectionId}/v1`,
        null,
        'index.html'
      );
      const bundle = bundleResult.getValue();

      await repository.save(bundle);

      // Activate the bundle
      bundle.activate();
      await repository.save(bundle);

      const found = await repository.findById(bundle.getId());
      expect(found).not.toBeNull();
      expect(found!.getIsActive()).toBe(true);
    });
  });

  describe('exists', () => {
    it('should return true for existing bundle', async () => {
      const bundleId = await createTestSectionBundle(generateId(), sectionId);
      const bundleIdVo = SectionBundleId.createFromString(bundleId).getValue();

      const exists = await repository.exists(bundleIdVo);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing bundle', async () => {
      const bundleId = SectionBundleId.create();
      const exists = await repository.exists(bundleId);
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a bundle', async () => {
      const bundleId = await createTestSectionBundle(generateId(), sectionId);
      const bundleIdVo = SectionBundleId.createFromString(bundleId).getValue();

      await repository.delete(bundleIdVo);

      const found = await repository.findById(bundleIdVo);
      expect(found).toBeNull();
    });
  });

  // ===========================================================================
  // Section-specific Operations
  // ===========================================================================
  describe('findBySectionId', () => {
    it('should find all bundles for a section sorted by version descending', async () => {
      await createTestSectionBundle(generateId(), sectionId, 1, false);
      await createTestSectionBundle(generateId(), sectionId, 2, false);
      await createTestSectionBundle(generateId(), sectionId, 3, true);

      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const bundles = await repository.findBySectionId(sectionIdVo);

      expect(bundles).toHaveLength(3);
      expect(bundles[0]!.getVersion()).toBe(3);
      expect(bundles[1]!.getVersion()).toBe(2);
      expect(bundles[2]!.getVersion()).toBe(1);
    });

    it('should return empty array for section with no bundles', async () => {
      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const bundles = await repository.findBySectionId(sectionIdVo);
      expect(bundles).toHaveLength(0);
    });
  });

  describe('findActiveBySectionId', () => {
    it('should find active bundle for a section', async () => {
      await createTestSectionBundle(generateId(), sectionId, 1, false);
      const activeBundleId = await createTestSectionBundle(generateId(), sectionId, 2, true);

      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const activeBundle = await repository.findActiveBySectionId(sectionIdVo);

      expect(activeBundle).not.toBeNull();
      expect(activeBundle!.getId().toValue()).toBe(activeBundleId);
      expect(activeBundle!.getIsActive()).toBe(true);
    });

    it('should return null when no bundle is active', async () => {
      await createTestSectionBundle(generateId(), sectionId, 1, false);
      await createTestSectionBundle(generateId(), sectionId, 2, false);

      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const activeBundle = await repository.findActiveBySectionId(sectionIdVo);

      expect(activeBundle).toBeNull();
    });

    it('should return null for section with no bundles', async () => {
      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const activeBundle = await repository.findActiveBySectionId(sectionIdVo);
      expect(activeBundle).toBeNull();
    });
  });

  describe('getNextVersion', () => {
    it('should return 1 for section with no bundles', async () => {
      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const nextVersion = await repository.getNextVersion(sectionIdVo);
      expect(nextVersion).toBe(1);
    });

    it('should return max version + 1', async () => {
      await createTestSectionBundle(generateId(), sectionId, 1);
      await createTestSectionBundle(generateId(), sectionId, 2);
      await createTestSectionBundle(generateId(), sectionId, 5);

      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const nextVersion = await repository.getNextVersion(sectionIdVo);

      expect(nextVersion).toBe(6);
    });
  });

  describe('deactivateAllForSection', () => {
    it('should deactivate all bundles for a section', async () => {
      await createTestSectionBundle(generateId(), sectionId, 1, true);
      await createTestSectionBundle(generateId(), sectionId, 2, true);

      const sectionIdVo = SectionId.createFromString(sectionId).getValue();

      // Verify at least one is active before
      const activeBefore = await repository.findActiveBySectionId(sectionIdVo);
      expect(activeBefore).not.toBeNull();

      await repository.deactivateAllForSection(sectionIdVo);

      // Verify none are active after
      const activeAfter = await repository.findActiveBySectionId(sectionIdVo);
      expect(activeAfter).toBeNull();
    });

    it('should not affect bundles from other sections', async () => {
      // Create another section
      const otherSectionId = await createTestSection(generateId(), lessonId, 'exercise', 2);

      await createTestSectionBundle(generateId(), sectionId, 1, true);
      await createTestSectionBundle(generateId(), otherSectionId, 1, true);

      const sectionIdVo = SectionId.createFromString(sectionId).getValue();
      const otherSectionIdVo = SectionId.createFromString(otherSectionId).getValue();

      await repository.deactivateAllForSection(sectionIdVo);

      // First section should have no active bundle
      const activeFirst = await repository.findActiveBySectionId(sectionIdVo);
      expect(activeFirst).toBeNull();

      // Other section should still have active bundle
      const activeOther = await repository.findActiveBySectionId(otherSectionIdVo);
      expect(activeOther).not.toBeNull();
    });
  });

  // ===========================================================================
  // Complex Scenarios
  // ===========================================================================
  describe('Complex Scenarios', () => {
    it('should handle bundle versioning workflow', async () => {
      const sectionIdVo = SectionId.createFromString(sectionId).getValue();

      // Create first bundle and activate
      const bundle1 = SectionBundle.create(sectionIdVo, 1, `bundles/sections/${sectionId}/v1`, null).getValue();
      bundle1.activate();
      await repository.save(bundle1);

      // Create second bundle
      const nextVersion = await repository.getNextVersion(sectionIdVo);
      expect(nextVersion).toBe(2);

      const bundle2 = SectionBundle.create(sectionIdVo, nextVersion, `bundles/sections/${sectionId}/v2`, null).getValue();
      await repository.save(bundle2);

      // Activate second bundle (should deactivate first)
      await repository.deactivateAllForSection(sectionIdVo);
      bundle2.activate();
      await repository.save(bundle2);

      // Verify only bundle2 is active
      const activeBundle = await repository.findActiveBySectionId(sectionIdVo);
      expect(activeBundle).not.toBeNull();
      expect(activeBundle!.getVersion()).toBe(2);

      // Verify bundle1 is not active
      const bundle1Found = await repository.findById(bundle1.getId());
      expect(bundle1Found).not.toBeNull();
      expect(bundle1Found!.getIsActive()).toBe(false);
    });

    it('should handle rollback scenario', async () => {
      const sectionIdVo = SectionId.createFromString(sectionId).getValue();

      // Create multiple bundles
      const bundle1 = SectionBundle.create(sectionIdVo, 1, `bundles/sections/${sectionId}/v1`, null).getValue();
      const bundle2 = SectionBundle.create(sectionIdVo, 2, `bundles/sections/${sectionId}/v2`, null).getValue();
      const bundle3 = SectionBundle.create(sectionIdVo, 3, `bundles/sections/${sectionId}/v3`, null).getValue();

      bundle3.activate();
      await repository.save(bundle1);
      await repository.save(bundle2);
      await repository.save(bundle3);

      // Rollback to version 1
      await repository.deactivateAllForSection(sectionIdVo);
      bundle1.activate();
      await repository.save(bundle1);

      // Verify rollback
      const activeBundle = await repository.findActiveBySectionId(sectionIdVo);
      expect(activeBundle).not.toBeNull();
      expect(activeBundle!.getVersion()).toBe(1);
    });
  });
});
