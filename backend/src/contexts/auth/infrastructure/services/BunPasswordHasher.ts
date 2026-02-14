import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { type IPasswordHasher } from '../../domain/services/IPasswordHasher.ts';

/**
 * BunPasswordHasher
 * Implements IPasswordHasher using Bun's native password API
 *
 * Uses Argon2id by default for new hashes (more secure than bcrypt)
 * Bun.password.verify() auto-detects algorithm, so existing bcrypt hashes work seamlessly
 */
export class BunPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    if (!password || password.length < 6) {
      throw new Error(ErrorCode.PASSWORD_TOO_SHORT_FOR_HASH);
    }

    // Argon2id is the default and most secure option
    return Bun.password.hash(password);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    // Auto-detects algorithm from hash format
    // Works with both argon2 and bcrypt hashes
    return Bun.password.verify(password, hash);
  }
}
