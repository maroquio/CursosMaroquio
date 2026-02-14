import { describe, it, expect, beforeEach } from 'vitest';
import { CreateSectionBundleHandler } from '@courses/application/commands/create-section-bundle/CreateSectionBundleHandler.ts';
import { CreateSectionBundleCommand } from '@courses/application/commands/create-section-bundle/CreateSectionBundleCommand.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import {
  MockSectionBundleRepository,
  MockSectionRepository,
  MockStorageService,
  createTestSection,
} from '../../mocks/index.ts';

describe('CreateSectionBundleHandler', () => {
  let handler: CreateSectionBundleHandler;
  let sectionBundleRepository: MockSectionBundleRepository;
  let sectionRepository: MockSectionRepository;
  let storageService: MockStorageService;

  beforeEach(() => {
    sectionBundleRepository = new MockSectionBundleRepository();
    sectionRepository = new MockSectionRepository();
    storageService = new MockStorageService();
    handler = new CreateSectionBundleHandler(
      sectionBundleRepository,
      sectionRepository,
      storageService
    );
  });

  describe('successful bundle creation', () => {
    it('should create a bundle when section exists', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);

      const command = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content'),
        false
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const dto = result.getValue();
      expect(dto.sectionId).toBe(section.getId().toValue());
      expect(dto.version).toBe(1);
      expect(dto.isActive).toBe(false);
      expect(dto.entrypoint).toBe('index.html');
    });

    it('should use entrypoint from manifest', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);
      storageService.setSectionManifest({ entrypoint: 'custom.html' });

      const command = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content'),
        false
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().entrypoint).toBe('custom.html');
    });

    it('should activate bundle immediately when requested', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);

      const command = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content'),
        true
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().isActive).toBe(true);
    });

    it('should increment version for subsequent bundles', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);

      // Create first bundle
      const command1 = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content 1'),
        false
      );
      await handler.execute(command1);

      // Create second bundle
      const command2 = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content 2'),
        false
      );
      const result = await handler.execute(command2);

      expect(result.isOk).toBe(true);
      expect(result.getValue().version).toBe(2);
    });

    it('should deactivate existing bundles when activating new one', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);

      // Create first bundle and activate
      const command1 = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content 1'),
        true
      );
      const result1 = await handler.execute(command1);
      expect(result1.getValue().isActive).toBe(true);

      // Create second bundle and activate
      const command2 = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content 2'),
        true
      );
      const result2 = await handler.execute(command2);

      expect(result2.isOk).toBe(true);
      expect(result2.getValue().isActive).toBe(true);

      // Check that only the new bundle is active
      const allBundles = sectionBundleRepository.getAll();
      const activeBundles = allBundles.filter(b => b.getIsActive());
      expect(activeBundles.length).toBe(1);
      expect(activeBundles[0]!.getVersion()).toBe(2);
    });
  });

  describe('validation failures', () => {
    it('should fail with invalid section ID', async () => {
      const command = new CreateSectionBundleCommand(
        'invalid-id',
        Buffer.from('test zip content'),
        false
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_SECTION_ID);
    });

    it('should fail when section does not exist', async () => {
      const command = new CreateSectionBundleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        Buffer.from('test zip content'),
        false
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.SECTION_NOT_FOUND);
    });

    it('should fail when entrypoint does not exist in bundle', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);
      storageService.setEntrypointExists(false);

      const command = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content'),
        false
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.BUNDLE_ENTRYPOINT_NOT_FOUND);
    });

    it('should cleanup uploaded bundle when entrypoint validation fails', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);
      storageService.setEntrypointExists(false);

      const command = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content'),
        false
      );

      await handler.execute(command);

      expect(storageService.getDeletedPaths().length).toBe(1);
    });
  });

  describe('upload failures', () => {
    it('should fail when upload fails', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);
      storageService.simulateUploadError(true);

      const command = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content'),
        false
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.BUNDLE_UPLOAD_FAILED);
    });
  });

  describe('database failures', () => {
    it('should fail when save fails and cleanup uploaded bundle', async () => {
      const section = createTestSection();
      sectionRepository.addSection(section);
      sectionBundleRepository.simulateSaveError(true);

      const command = new CreateSectionBundleCommand(
        section.getId().toValue(),
        Buffer.from('test zip content'),
        false
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INTERNAL_ERROR);
      expect(storageService.getDeletedPaths().length).toBe(1);
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new CreateSectionBundleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        Buffer.from('test content'),
        true
      );

      expect(command.sectionId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.file).toBeInstanceOf(Buffer);
      expect(command.activateImmediately).toBe(true);
    });

    it('should default activateImmediately to false', () => {
      const command = new CreateSectionBundleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        Buffer.from('test content')
      );

      expect(command.activateImmediately).toBe(false);
    });
  });
});
