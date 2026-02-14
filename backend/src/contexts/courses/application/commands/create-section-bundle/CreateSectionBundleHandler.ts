import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateSectionBundleCommand } from './CreateSectionBundleCommand.ts';
import { type ISectionBundleRepository } from '../../../domain/repositories/ISectionBundleRepository.ts';
import { type ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';
import { SectionBundle } from '../../../domain/entities/SectionBundle.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { type SectionBundleDto } from '../../dtos/SectionBundleDto.ts';

/**
 * CreateSectionBundleHandler
 * Handles uploading a new section bundle
 */
export class CreateSectionBundleHandler implements ICommandHandler<CreateSectionBundleCommand, SectionBundleDto> {
  constructor(
    private sectionBundleRepository: ISectionBundleRepository,
    private sectionRepository: ISectionRepository,
    private storageService: IStorageService
  ) {}

  async execute(command: CreateSectionBundleCommand): Promise<Result<SectionBundleDto>> {
    // 1. Validate section ID
    const sectionIdResult = SectionId.createFromString(command.sectionId);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }
    const sectionId = sectionIdResult.getValue();

    // 2. Verify section exists
    const section = await this.sectionRepository.findById(sectionId);
    if (!section) {
      return Result.fail(ErrorCode.SECTION_NOT_FOUND);
    }

    // 3. Get next version number
    const nextVersion = await this.sectionBundleRepository.getNextVersion(sectionId);

    // 4. Upload bundle
    let uploadResult;
    try {
      uploadResult = await this.storageService.uploadSectionBundle(
        sectionId.toValue(),
        nextVersion,
        command.file
      );
    } catch (error) {
      return Result.fail(ErrorCode.BUNDLE_UPLOAD_FAILED);
    }

    // 5. Extract manifest
    const manifest = await this.storageService.extractSectionManifest(uploadResult.storagePath);

    // 6. Determine entrypoint
    const entrypoint = manifest?.entrypoint ?? 'index.html';

    // 7. Verify entrypoint exists
    const entrypointExists = await this.storageService.sectionEntrypointExists(uploadResult.storagePath, entrypoint);
    if (!entrypointExists) {
      // Cleanup uploaded bundle
      await this.storageService.deleteSectionBundle(uploadResult.storagePath);
      return Result.fail(ErrorCode.BUNDLE_ENTRYPOINT_NOT_FOUND);
    }

    // 8. Create bundle entity
    const bundleResult = SectionBundle.create(
      sectionId,
      nextVersion,
      uploadResult.storagePath,
      manifest,
      entrypoint
    );

    if (bundleResult.isFailure) {
      // Cleanup uploaded bundle
      await this.storageService.deleteSectionBundle(uploadResult.storagePath);
      return Result.fail(bundleResult.getError() as string);
    }

    const bundle = bundleResult.getValue();

    // 9. Activate if requested
    if (command.activateImmediately) {
      await this.sectionBundleRepository.deactivateAllForSection(sectionId);
      bundle.activate();
    }

    // 10. Persist
    try {
      await this.sectionBundleRepository.save(bundle);
    } catch (error) {
      // Cleanup uploaded bundle
      await this.storageService.deleteSectionBundle(uploadResult.storagePath);
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // 11. Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(bundle);

    // 12. Return DTO
    const dto: SectionBundleDto = {
      id: bundle.getId().toValue(),
      sectionId: bundle.getSectionId().toValue(),
      version: bundle.getVersion(),
      entrypoint: bundle.getEntrypoint(),
      storagePath: bundle.getStoragePath(),
      bundleUrl: this.storageService.getSectionBundleUrl(bundle.getStoragePath()),
      manifestJson: bundle.getManifestJson(),
      isActive: bundle.getIsActive(),
      createdAt: bundle.getCreatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
