import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetActiveSectionBundleQuery } from './GetActiveSectionBundleQuery.ts';
import { type ISectionBundleRepository } from '../../../domain/repositories/ISectionBundleRepository.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { type SectionBundleDto } from '../../dtos/SectionBundleDto.ts';

/**
 * GetActiveSectionBundleHandler
 * Handles getting the active bundle for a section
 */
export class GetActiveSectionBundleHandler implements IQueryHandler<GetActiveSectionBundleQuery, SectionBundleDto | null> {
  constructor(
    private sectionBundleRepository: ISectionBundleRepository,
    private storageService: IStorageService
  ) {}

  async execute(query: GetActiveSectionBundleQuery): Promise<Result<SectionBundleDto | null>> {
    // 1. Validate section ID
    const sectionIdResult = SectionId.createFromString(query.sectionId);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }
    const sectionId = sectionIdResult.getValue();

    // 2. Get active bundle for section
    const bundle = await this.sectionBundleRepository.findActiveBySectionId(sectionId);

    // 3. Return null if no active bundle
    if (!bundle) {
      return Result.ok(null);
    }

    // 4. Map to DTO
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
