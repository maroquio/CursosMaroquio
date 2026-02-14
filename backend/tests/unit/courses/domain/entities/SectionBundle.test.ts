import { describe, it, expect } from 'vitest';
import { SectionBundle } from '@courses/domain/entities/SectionBundle.ts';
import { SectionBundleId } from '@courses/domain/value-objects/SectionBundleId.ts';
import { SectionId } from '@courses/domain/value-objects/SectionId.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('SectionBundle Entity', () => {
  const validSectionId = SectionId.create();
  const validStoragePath = 'bundles/section-123/v1';
  const validManifest = {
    entrypoint: 'index.html',
    version: '1.0',
    steps: [{ id: 'step1', title: 'Step 1', type: 'content' }],
  };

  describe('create', () => {
    it('should create a valid bundle', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, validManifest);

      expect(result.isOk).toBe(true);
      const bundle = result.getValue();
      expect(bundle.getSectionId().equals(validSectionId)).toBe(true);
      expect(bundle.getVersion()).toBe(1);
      expect(bundle.getStoragePath()).toBe(validStoragePath);
      expect(bundle.getEntrypoint()).toBe('index.html');
      expect(bundle.getIsActive()).toBe(false);
    });

    it('should create bundle with default entrypoint when manifest has no entrypoint', () => {
      const manifestWithoutEntrypoint = { version: '1.0' };
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, manifestWithoutEntrypoint);

      expect(result.isOk).toBe(true);
      const bundle = result.getValue();
      expect(bundle.getEntrypoint()).toBe('index.html');
    });

    it('should create bundle with custom entrypoint parameter', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, null, 'custom.html');

      expect(result.isOk).toBe(true);
      const bundle = result.getValue();
      expect(bundle.getEntrypoint()).toBe('custom.html');
    });

    it('should fail when version is less than 1', () => {
      const result = SectionBundle.create(validSectionId, 0, validStoragePath, validManifest);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.BUNDLE_VERSION_INVALID);
    });

    it('should fail when version is negative', () => {
      const result = SectionBundle.create(validSectionId, -1, validStoragePath, validManifest);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.BUNDLE_VERSION_INVALID);
    });

    it('should fail when storage path is empty', () => {
      const result = SectionBundle.create(validSectionId, 1, '', validManifest);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.BUNDLE_STORAGE_PATH_EMPTY);
    });

    it('should fail when storage path is only whitespace', () => {
      const result = SectionBundle.create(validSectionId, 1, '   ', validManifest);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.BUNDLE_STORAGE_PATH_EMPTY);
    });

    it('should trim storage path', () => {
      const result = SectionBundle.create(validSectionId, 1, '  path/with/spaces  ', validManifest);

      expect(result.isOk).toBe(true);
      const bundle = result.getValue();
      expect(bundle.getStoragePath()).toBe('path/with/spaces');
    });

    it('should emit SectionBundleCreated domain event', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, validManifest);
      const bundle = result.getValue();

      const events = bundle.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.constructor.name).toBe('SectionBundleCreated');
    });

    it('should create bundle with null manifest', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, null);

      expect(result.isOk).toBe(true);
      const bundle = result.getValue();
      expect(bundle.getManifestJson()).toBeNull();
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct bundle without emitting events', () => {
      const bundleId = SectionBundleId.create();
      const createdAt = new Date();

      const bundle = SectionBundle.reconstruct(
        bundleId,
        validSectionId,
        1,
        'index.html',
        validStoragePath,
        validManifest,
        false,
        createdAt
      );

      expect(bundle.getId().equals(bundleId)).toBe(true);
      expect(bundle.getSectionId().equals(validSectionId)).toBe(true);
      expect(bundle.getVersion()).toBe(1);
      expect(bundle.getEntrypoint()).toBe('index.html');
      expect(bundle.getStoragePath()).toBe(validStoragePath);
      expect(bundle.getIsActive()).toBe(false);
      expect(bundle.getCreatedAt()).toBe(createdAt);
      expect(bundle.getDomainEvents().length).toBe(0);
    });

    it('should reconstruct active bundle', () => {
      const bundleId = SectionBundleId.create();

      const bundle = SectionBundle.reconstruct(
        bundleId,
        validSectionId,
        1,
        'index.html',
        validStoragePath,
        null,
        true,
        new Date()
      );

      expect(bundle.getIsActive()).toBe(true);
    });
  });

  describe('activate', () => {
    it('should activate an inactive bundle', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, validManifest);
      const bundle = result.getValue();
      bundle.clearDomainEvents();

      expect(bundle.getIsActive()).toBe(false);

      bundle.activate();

      expect(bundle.getIsActive()).toBe(true);
    });

    it('should emit SectionBundleActivated event when activating', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, validManifest);
      const bundle = result.getValue();
      bundle.clearDomainEvents();

      bundle.activate();

      const events = bundle.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.constructor.name).toBe('SectionBundleActivated');
    });

    it('should not emit event if already active', () => {
      const bundleId = SectionBundleId.create();
      const bundle = SectionBundle.reconstruct(
        bundleId,
        validSectionId,
        1,
        'index.html',
        validStoragePath,
        null,
        true,
        new Date()
      );

      bundle.activate();

      expect(bundle.getDomainEvents().length).toBe(0);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active bundle', () => {
      const bundleId = SectionBundleId.create();
      const bundle = SectionBundle.reconstruct(
        bundleId,
        validSectionId,
        1,
        'index.html',
        validStoragePath,
        null,
        true,
        new Date()
      );

      expect(bundle.getIsActive()).toBe(true);

      bundle.deactivate();

      expect(bundle.getIsActive()).toBe(false);
    });

    it('should allow deactivating an already inactive bundle', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, validManifest);
      const bundle = result.getValue();

      bundle.deactivate();

      expect(bundle.getIsActive()).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should allow deleting an inactive bundle', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, validManifest);
      const bundle = result.getValue();

      const canDeleteResult = bundle.canDelete();

      expect(canDeleteResult.isOk).toBe(true);
    });

    it('should not allow deleting an active bundle', () => {
      const bundleId = SectionBundleId.create();
      const bundle = SectionBundle.reconstruct(
        bundleId,
        validSectionId,
        1,
        'index.html',
        validStoragePath,
        null,
        true,
        new Date()
      );

      const canDeleteResult = bundle.canDelete();

      expect(canDeleteResult.isFailure).toBe(true);
      expect(canDeleteResult.getError()).toBe(ErrorCode.CANNOT_DELETE_ACTIVE_SECTION_BUNDLE);
    });
  });

  describe('getters', () => {
    it('should return manifest json', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, validManifest);
      const bundle = result.getValue();

      expect(bundle.getManifestJson()).toEqual(validManifest);
    });

    it('should return created at date', () => {
      const result = SectionBundle.create(validSectionId, 1, validStoragePath, validManifest);
      const bundle = result.getValue();

      expect(bundle.getCreatedAt()).toBeInstanceOf(Date);
    });
  });
});
