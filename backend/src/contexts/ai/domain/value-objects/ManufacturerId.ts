import { Identifier } from '@shared/domain/Identifier.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UUID_V7_REGEX } from '@shared/constants/validation.ts';
import { v7 as uuidv7 } from 'uuid';

export class ManufacturerId extends Identifier<ManufacturerId> {
  private constructor(value: string) {
    super(value);
  }

  public static create(id?: string): ManufacturerId {
    return new ManufacturerId(id ?? uuidv7());
  }

  public static createFromString(id: string): Result<ManufacturerId> {
    if (!this.isValidUUIDv7(id)) return Result.fail(ErrorCode.INVALID_MANUFACTURER_ID);
    return Result.ok(new ManufacturerId(id));
  }

  private static isValidUUIDv7(id: string): boolean {
    return UUID_V7_REGEX.test(id);
  }
}
