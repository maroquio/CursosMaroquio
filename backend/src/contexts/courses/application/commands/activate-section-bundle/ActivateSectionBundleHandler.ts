import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ActivateSectionBundleCommand } from './ActivateSectionBundleCommand.ts';
import { type ISectionBundleRepository } from '../../../domain/repositories/ISectionBundleRepository.ts';
import { SectionBundleId } from '../../../domain/value-objects/SectionBundleId.ts';
import { type SectionBundleDto } from '../../dtos/SectionBundleDto.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';

/**
 * ActivateSectionBundleHandler
 * Handles activating a specific section bundle version
 */
export class ActivateSectionBundleHandler implements ICommandHandler<ActivateSectionBundleCommand, SectionBundleDto> {
  constructor(
    private sectionBundleRepository: ISectionBundleRepository,
    private storageService: IStorageService
  ) {}

  async execute(command: ActivateSectionBundleCommand): Promise<Result<SectionBundleDto>> {
    // 1. Validate bundle ID
    const bundleIdResult = SectionBundleId.createFromString(command.bundleId);
    if (bundleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_BUNDLE_ID);
    }
    const bundleId = bundleIdResult.getValue();

    // 2. Find bundle
    const bundle = await this.sectionBundleRepository.findById(bundleId);
    if (!bundle) {
      return Result.fail(ErrorCode.SECTION_BUNDLE_NOT_FOUND);
    }

    // 3. Check if already active
    if (bundle.getIsActive()) {
      return Result.fail(ErrorCode.SECTION_BUNDLE_ALREADY_ACTIVE);
    }

    // 4. Deactivate all bundles for this section
    await this.sectionBundleRepository.deactivateAllForSection(bundle.getSectionId());

    // 5. Activate this bundle
    bundle.activate();

    // 6. Persist
    try {
      await this.sectionBundleRepository.save(bundle);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // 7. Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(bundle);

    // 8. Return DTO
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
