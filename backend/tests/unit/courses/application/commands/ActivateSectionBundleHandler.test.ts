import { describe, it, expect, beforeEach } from 'vitest';
import { ActivateSectionBundleHandler } from '@courses/application/commands/activate-section-bundle/ActivateSectionBundleHandler.ts';
import { ActivateSectionBundleCommand } from '@courses/application/commands/activate-section-bundle/ActivateSectionBundleCommand.ts';
import { SectionId } from '@courses/domain/value-objects/SectionId.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import {
  MockSectionBundleRepository,
  MockStorageService,
  createTestSectionBundle,
} from '../../mocks/index.ts';

describe('ActivateSectionBundleHandler', () => {
  let handler: ActivateSectionBundleHandler;
  let sectionBundleRepository: MockSectionBundleRepository;
  let storageService: MockStorageService;

  beforeEach(() => {
    sectionBundleRepository = new MockSectionBundleRepository();
    storageService = new MockStorageService();
    handler = new ActivateSectionBundleHandler(sectionBundleRepository, storageService);
  });

  describe('successful activation', () => {
    it('should activate an inactive bundle', async () => {
      const sectionId = SectionId.create();
      const bundle = createTestSectionBundle(sectionId, 1, false);
      sectionBundleRepository.addBundle(bundle);

      const command = new ActivateSectionBundleCommand(bundle.getId().toValue());

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().isActive).toBe(true);
    });

    it('should deactivate other bundles for the same section', async () => {
      const sectionId = SectionId.create();
      const bundle1 = createTestSectionBundle(sectionId, 1, true);
      const bundle2 = createTestSectionBundle(sectionId, 2, false);
      sectionBundleRepository.addBundle(bundle1);
      sectionBundleRepository.addBundle(bundle2);

      const command = new ActivateSectionBundleCommand(bundle2.getId().toValue());

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().version).toBe(2);

      // Check that only bundle2 is active
      const allBundles = sectionBundleRepository.getAll();
      const activeBundles = allBundles.filter(b => b.getIsActive());
      expect(activeBundles.length).toBe(1);
      expect(activeBundles[0]!.getVersion()).toBe(2);
    });

    it('should return bundle DTO with correct properties', async () => {
      const sectionId = SectionId.create();
      const bundle = createTestSectionBundle(sectionId, 1, false);
      sectionBundleRepository.addBundle(bundle);

      const command = new ActivateSectionBundleCommand(bundle.getId().toValue());

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const dto = result.getValue();
      expect(dto.id).toBe(bundle.getId().toValue());
      expect(dto.sectionId).toBe(sectionId.toValue());
      expect(dto.version).toBe(1);
      expect(dto.entrypoint).toBe('index.html');
      expect(dto.isActive).toBe(true);
      expect(dto.bundleUrl).toContain('http://localhost:8702/static/');
    });
  });

  describe('validation failures', () => {
    it('should fail with invalid bundle ID', async () => {
      const command = new ActivateSectionBundleCommand('invalid-id');

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_SECTION_BUNDLE_ID);
    });

    it('should fail when bundle does not exist', async () => {
      const command = new ActivateSectionBundleCommand('019123ab-cdef-7890-abcd-ef1234567890');

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.SECTION_BUNDLE_NOT_FOUND);
    });

    it('should fail when bundle is already active', async () => {
      const sectionId = SectionId.create();
      const bundle = createTestSectionBundle(sectionId, 1, true);
      sectionBundleRepository.addBundle(bundle);

      const command = new ActivateSectionBundleCommand(bundle.getId().toValue());

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.SECTION_BUNDLE_ALREADY_ACTIVE);
    });
  });

  describe('database failures', () => {
    it('should fail when save fails', async () => {
      const sectionId = SectionId.create();
      const bundle = createTestSectionBundle(sectionId, 1, false);
      sectionBundleRepository.addBundle(bundle);
      sectionBundleRepository.simulateSaveError(true);

      const command = new ActivateSectionBundleCommand(bundle.getId().toValue());

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new ActivateSectionBundleCommand('019123ab-cdef-7890-abcd-ef1234567890');

      expect(command.bundleId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
    });
  });
});
