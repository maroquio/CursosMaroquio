import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetSectionBundlesQuery } from './GetSectionBundlesQuery.ts';
import { type ISectionBundleRepository } from '../../../domain/repositories/ISectionBundleRepository.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { type SectionBundlesListDto, type SectionBundleDto } from '../../dtos/SectionBundleDto.ts';

/**
 * GetSectionBundlesHandler
 * Handles listing all bundles for a section
 */
export class GetSectionBundlesHandler implements IQueryHandler<GetSectionBundlesQuery, SectionBundlesListDto> {
  constructor(
    private sectionBundleRepository: ISectionBundleRepository,
    private storageService: IStorageService
  ) {}

  async execute(query: GetSectionBundlesQuery): Promise<Result<SectionBundlesListDto>> {
    // 1. Validate section ID
    const sectionIdResult = SectionId.createFromString(query.sectionId);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }
    const sectionId = sectionIdResult.getValue();

    // 2. Get all bundles for section
    const bundles = await this.sectionBundleRepository.findBySectionId(sectionId);

    // 3. Map to DTOs
    const bundleDtos: SectionBundleDto[] = bundles.map(bundle => ({
      id: bundle.getId().toValue(),
      sectionId: bundle.getSectionId().toValue(),
      version: bundle.getVersion(),
      entrypoint: bundle.getEntrypoint(),
      storagePath: bundle.getStoragePath(),
      bundleUrl: this.storageService.getSectionBundleUrl(bundle.getStoragePath()),
      manifestJson: bundle.getManifestJson(),
      isActive: bundle.getIsActive(),
      createdAt: bundle.getCreatedAt().toISOString(),
    }));

    // 4. Find active version
    const activeBundle = bundles.find(b => b.getIsActive());
    const activeVersion = activeBundle ? activeBundle.getVersion() : null;

    // 5. Return list DTO
    const dto: SectionBundlesListDto = {
      sectionId: sectionId.toValue(),
      bundles: bundleDtos,
      activeVersion,
    };

    return Result.ok(dto);
  }
}
